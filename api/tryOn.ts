import { Buffer } from "buffer";

const parseDataUrl = (value:any) => {
  const raw = String(value || "");
  const match = raw.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return { mimeType: match[1], data: match[2] };
};

export async function handleTryOn(req:any,res:any):Promise<boolean> {
  const url=String(req.url||"").split("?")[0];
  if (req.method!=="POST" || url!=="/api/ai/try-on") return false;
  try {
    const apiKey=process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(503).json({ success:false, error:"AI image service is not configured", code:"GEMINI_API_KEY_REQUIRED" });
    const person=parseDataUrl(req.body?.personImage);
    const garment=parseDataUrl(req.body?.garmentImage);
    const productName=String(req.body?.productName||"the selected garment").slice(0,160);
    if (!person || !garment) return res.status(400).json({ success:false, error:"A person photo and garment image are required" });
    const model=process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
    const prompt=[
      "Create a realistic virtual try-on image.",
      "Use the first image as the person's identity, pose, face, body and background reference.",
      "Use the second image only as the garment reference.",
      `Dress the person in ${productName} naturally, preserving the person's identity and pose.`,
      "The garment must look worn on the body, not pasted as an overlay.",
      "Keep anatomy realistic, preserve hands and face where visible, and maintain plausible fabric folds, shadows and occlusion.",
      "Do not add text, watermarks, logos not present on the garment, extra people, or collage effects.",
      "Return one polished photorealistic image."
    ].join(" ");
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(), 45000);
    try {
      const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        signal:controller.signal,
        body:JSON.stringify({
          contents:[{role:"user",parts:[
            {text:prompt},
            {inlineData:{mimeType:person.mimeType,data:person.data}},
            {inlineData:{mimeType:garment.mimeType,data:garment.data}}
          ]}],
          generationConfig:{responseModalities:["TEXT","IMAGE"]}
        })
      });
      const data:any=await response.json().catch(()=>({}));
      if (!response.ok) {
        console.error("[try-on] Gemini rejected request", response.status, data?.error?.message || data);
        return res.status(response.status===400||response.status===403?422:502).json({ success:false, error:data?.error?.message || "The AI try-on service could not generate this fitting" });
      }
      const parts=data?.candidates?.[0]?.content?.parts||[];
      const imagePart=parts.find((part:any)=>part?.inlineData?.data);
      if (!imagePart) return res.status(502).json({ success:false, error:"The AI service returned no image. Please try another clear photo." });
      const mimeType=imagePart.inlineData.mimeType || "image/png";
      return res.status(200).json({ success:true, image:`data:${mimeType};base64,${imagePart.inlineData.data}`, model });
    } finally { clearTimeout(timer); }
  } catch(error:any) {
    console.error("[try-on] failed",error);
    if (error?.name==="AbortError") return res.status(504).json({ success:false,error:"The fitting service took too long. Please try again." });
    return res.status(500).json({ success:false,error:"Virtual try-on is temporarily unavailable" });
  }
}