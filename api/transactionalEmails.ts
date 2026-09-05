import mongoose from "mongoose";
import { connectDB } from "./_shared.js";
import { BRAND } from "../src/config/brand.js";
import { sendTransactionalMail } from "../src/utils/mail.js";

const getModel = (name: string) => mongoose.models[name] as any;
const getLiveProducts = async () => {
  const Product = getModel("Product");
  if (!Product) return [];
  const rows = await Product.find({}).sort({ isFeatured:-1, isNewArrival:-1, createdAt:-1 }).limit(4).lean();
  return rows.map((p:any)=>({...p,id:String(p.id||p._id),name:p.name||p.title,image:p.image||p.images?.[0]||"",images:p.images||[],price:Number(p.price||0),currency:p.currency||"USD"}));
};
const orderCurrency = (order:any, requested:any) => String(requested || order?.currency || "USD").toUpperCase();
const customerName = (order:any) => order?.fullName || order?.shippingDetails?.firstName || "Customer";

export async function handleTransactionalEmailRoutes(req:any,res:any):Promise<boolean>{
  const url=String(req.url||"").split("?")[0];
  const supported = (req.method === "POST" && url === "/api/cart/abandoned") || (req.method === "POST" && url === "/api/orchestrate/dispatch-email");
  if(!supported) return false;
  try {
    await connectDB();
    const body=req.body||{}; const email=String(body.email||"").trim().toLowerCase();
    if(!email) return res.status(400).json({success:false,error:"Email is required"});
    const currency=String(body.currency||"USD").toUpperCase(); const products=await getLiveProducts();
    const { getAbandonedCartEmail, getWishlistEmail, getPackedEmail, getShippedEmail, getDeliveredEmail } = await import("../src/utils/AtelierEmails.js");
    let html=""; let subject=""; let key="";
    if(url === "/api/cart/abandoned") {
      const fingerprint=JSON.stringify((body.cartItems||[]).map((x:any)=>[x?.productId,x?.quantity,x?.price])).slice(0,800);
      key=`abandoned:${email}:${currency}:${Buffer.from(fingerprint).toString("base64url")}`;
      html=getAbandonedCartEmail(body.displayName||"Customer",products,currency); subject=`${BRAND.name} | Your selection awaits`;
    } else {
      const action=String(body.actionType||"").toUpperCase(); const orderId=String(body.orderId||"N/A"); key=`dispatch:${email}:${action}:${orderId}`;
      if(action === "ABANDONED_CART"){html=getAbandonedCartEmail(body.displayName||"Customer",products,currency);subject=`${BRAND.name} | Your selection awaits`;}
      else if(action === "WISHLIST"){html=getWishlistEmail(body.displayName||"Customer",products,currency);subject=`${BRAND.name} | Wishlist`;}
      else if(action === "PACKED"){html=getPackedEmail(body.displayName||"Customer",orderId,products,currency);subject=`${BRAND.name} | Order Packed`;}
      else if(action === "SHIPPED"||action === "ON_THE_WAY"){html=getShippedEmail(body.displayName||"Customer",orderId,products,currency);subject=`${BRAND.name} | Order Shipped`;}
      else if(action === "DELIVERED"){html=getDeliveredEmail(body.displayName||"Customer",orderId,products,currency);subject=`${BRAND.name} | Order Delivered`;}
      else return res.status(400).json({success:false,error:"Unknown email action"});
    }
    const result=await sendTransactionalMail(email,subject,html,key);
    return res.status(200).json({success:true,...result});
  } catch(error){ console.error("[transactional-email]",error); return res.status(500).json({success:false,error:"Transactional email could not be sent"}); }
}
