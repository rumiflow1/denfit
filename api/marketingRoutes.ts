import { connectDB } from "./_shared.js";
import { BRAND } from "../src/config/brand.js";
import { sendTransactionalMail } from "../src/utils/mail.js";

const sendMail = async (to:string,subject:string,html:string,dedupeKey="") => sendTransactionalMail(to,subject,html,dedupeKey);
const getLiveProducts = async () => {
  const mongoose = await import("mongoose");
  const Product = (mongoose.default.models.Product as any) || (mongoose.default.models.ProductionProduct as any);
  if (!Product) return [];
  const rows = await Product.find({}).sort({ isFeatured:-1, isNewArrival:-1, createdAt:-1 }).limit(4).lean();
  return rows.map((p:any)=>({...p,id:String(p.id||p._id),name:p.name||p.title,image:p.image||p.images?.[0]||"",images:p.images||[],price:Number(p.price||0),currency:p.currency||"USD"}));
};

export async function handleMarketingRoutes(req:any,res:any):Promise<boolean>{
  const url=String(req.url||'').split('?')[0];
  if(req.method!=='POST'||url!=='/api/marketing/promotional')return false;
  try{
    await connectDB();
    const email=String(req.body?.email||'').trim().toLowerCase(); if(!email)return res.status(400).json({success:false,error:'Email is required'});
    const name=String(req.body?.displayName||'Customer'); const offerCode=String(req.body?.offerCode||'').trim().toUpperCase(); const currency=String(req.body?.currency||'USD').toUpperCase();
    const {getPromotionalEmail}=await import('../src/utils/AtelierPromotional.js'); const products=await getLiveProducts();
    await sendMail(email,`${BRAND.name} | Exclusive Collection`,getPromotionalEmail(name,offerCode,products,currency),`promo:${email}:${offerCode||'collection'}`);
    return res.status(200).json({success:true});
  }catch(error){console.error('[promotional]',error);return res.status(500).json({success:false,error:'Promotional email could not be sent'});}
}
