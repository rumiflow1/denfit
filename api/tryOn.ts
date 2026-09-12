const isHttp=(value:any)=>/^https?:\/\//i.test(String(value||''));
const parseDataUrl=(value:any)=>{const raw=String(value||'');const match=raw.match(/^data:([^;]+);base64,(.+)$/);if(!match)return null;return {mimeType:match[1],data:match[2],raw};};
const sleep=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));

async function remoteToData(value:string){
  if(!isHttp(value)) return parseDataUrl(value);
  const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),15000);
  try{
    const response=await fetch(value,{signal:controller.signal});
    if(!response.ok) return null;
    const mimeType=response.headers.get('content-type')?.split(';')[0]||'image/jpeg';
    const buffer=Buffer.from(await response.arrayBuffer());
    if(!buffer.length||buffer.length>12*1024*1024) return null;
    return {mimeType,data:buffer.toString('base64'),raw:`data:${mimeType};base64,${buffer.toString('base64')}`};
  }catch{return null;}finally{clearTimeout(timer);}
}

async function runFashn(modelImage:string,garmentImage:string,productName:string){
  const apiKey=String(process.env.FASHN_API_KEY||'').trim();if(!apiKey)return null;
  const modelName=String(process.env.FASHN_TRYON_MODEL||'tryon-max').trim();
  const inputs=modelName==='tryon-v1.6'
    ?{model_image:modelImage,garment_image:garmentImage,category:'auto',mode:'balanced',num_samples:1}
    :{model_image:modelImage,product_image:garmentImage,prompt:`Preserve the person's identity, pose and background. Dress them naturally in ${productName}. The item must look physically worn, with realistic fit, folds, shadows and occlusion.`};
  const submit=await fetch('https://api.fashn.ai/v1/run',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${apiKey}`},body:JSON.stringify({model_name:modelName,inputs})});
  const created:any=await submit.json().catch(()=>({}));
  if(!submit.ok||!created?.id)throw new Error(String(created?.error?.message||created?.error||`FASHN request failed (${submit.status})`));
  const deadline=Date.now()+55000;
  while(Date.now()<deadline){
    await sleep(1800);
    const statusResponse=await fetch(`https://api.fashn.ai/v1/status/${encodeURIComponent(created.id)}`,{headers:{Authorization:`Bearer ${apiKey}`}});
    const status:any=await statusResponse.json().catch(()=>({}));
    const state=String(status?.status||'').toLowerCase();
    if(['completed','succeeded','success'].includes(state)){
      const output=Array.isArray(status?.output)?status.output[0]:(Array.isArray(status?.outputs)?status.outputs[0]:status?.output);
      if(typeof output==='string'&&output)return {image:output,model:modelName,provider:'fashn'};
      throw new Error('FASHN completed without an image output');
    }
    if(['failed','error','cancelled'].includes(state))throw new Error(String(status?.error?.message||status?.error||'FASHN could not generate the try-on'));
  }
  throw new Error('FASHN generation timed out');
}

async function runGemini(person:any,garment:any,productName:string){
  const apiKey=String(process.env.GEMINI_API_KEY||'').trim();if(!apiKey||!person||!garment)return null;
  const model=String(process.env.GEMINI_IMAGE_MODEL||'gemini-2.5-flash-image').trim();
  const prompt=['Create one realistic virtual try-on image.','Use the first image as the person identity, pose, body and background reference.','Use the second image only as the selected fashion item reference.',`Dress the person in ${productName} naturally.`,'Do not paste the garment on top of the image.','Preserve the face and visible hands with realistic anatomy, fabric folds, shadows and occlusion.','Do not add text, watermarks, extra people or a collage.'].join(' ');
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),45000);
  try{
    const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,{method:'POST',headers:{'Content-Type':'application/json'},signal:controller.signal,body:JSON.stringify({contents:[{role:'user',parts:[{text:prompt},{inlineData:{mimeType:person.mimeType,data:person.data}},{inlineData:{mimeType:garment.mimeType,data:garment.data}}]}],generationConfig:{responseModalities:['TEXT','IMAGE']}})});
    const data:any=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(data?.error?.message||`Gemini request failed (${response.status})`);
    const imagePart=(data?.candidates?.[0]?.content?.parts||[]).find((part:any)=>part?.inlineData?.data);
    if(!imagePart)throw new Error('Gemini returned no image');
    const mimeType=imagePart.inlineData.mimeType||'image/png';
    return {image:`data:${mimeType};base64,${imagePart.inlineData.data}`,model,provider:'gemini'};
  }finally{clearTimeout(timer);}
}

const localPreview=(person:any,garment:any)=>{
  if(!person||!garment)return null;
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200"><rect width="900" height="1200" fill="#f5f5f2"/><image href="${person.raw}" x="0" y="0" width="900" height="1200" preserveAspectRatio="xMidYMid slice"/><image href="${garment.raw}" x="180" y="300" width="540" height="620" preserveAspectRatio="xMidYMid meet" opacity="0.82"/><rect x="28" y="28" width="844" height="1144" fill="none" stroke="#ffffff" stroke-opacity=".35"/></svg>`;
  return {image:`data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`,provider:'local-preview',model:'fallback-preview',previewOnly:true};
};

export async function handleTryOn(req:any,res:any):Promise<boolean>{
  const url=String(req.url||'').split('?')[0];
  if(req.method!=='POST'||url!=='/api/ai/try-on')return false;
  try{
    const personRaw=String(req.body?.personImage||'').trim();
    const garmentRaw=String(req.body?.garmentImage||req.body?.productImage||'').trim();
    const productName=String(req.body?.productName||'the selected fashion item').slice(0,160);
    if(!personRaw||!garmentRaw)return res.status(400).json({success:false,error:'A clear person photo and product image are required'});
    const personData=await remoteToData(personRaw);
    const garmentData=await remoteToData(garmentRaw);
    const personSource=isHttp(personRaw)?personRaw:personData?.raw;
    const garmentSource=isHttp(garmentRaw)?garmentRaw:garmentData?.raw;
    if(!personData||!garmentData)return res.status(400).json({success:false,error:'The selected images could not be prepared. Please use a clear JPG or PNG photo.'});

    if(process.env.FASHN_API_KEY){
      try{const result=await runFashn(personSource||personData.raw,garmentSource||garmentData.raw,productName);if(result)return res.status(200).json({success:true,...result});}
      catch(error:any){console.error('[try-on] FASHN failed',error?.message||error);}
    }
    if(process.env.GEMINI_API_KEY){
      try{const geminiResult=await runGemini(personData,garmentData,productName);if(geminiResult)return res.status(200).json({success:true,...geminiResult});}
      catch(error:any){console.error('[try-on] Gemini image failed',error?.message||error);}
    }

    // A configured AI provider produces a real generation. Without credentials, keep the feature usable
    // with a clearly-labelled local visual preview rather than returning a dead-end 5xx error.
    const preview=localPreview(personData,garmentData);
    if(preview)return res.status(200).json({success:true,...preview,message:'Visual preview generated. AI fitting activates automatically when a provider key is configured.'});
    return res.status(503).json({success:false,error:'Virtual try-on is temporarily unavailable'});
  }catch(error:any){
    console.error('[try-on] failed',error);
    if(error?.name==='AbortError')return res.status(504).json({success:false,error:'The fitting service took too long. Please try again.'});
    return res.status(500).json({success:false,error:'Virtual try-on is temporarily unavailable'});
  }
}

// Prevent Vercel from treating this internal route helper as an invalid function.
export default function internalHelper(req:any,res:any){ return res.status(404).json({ error: 'Not found' }); }
