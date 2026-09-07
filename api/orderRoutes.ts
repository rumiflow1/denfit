import mongoose from "mongoose";
import { connectDB } from "./_shared.js";
import { BRAND } from "../src/config/brand.js";
import { sendTransactionalMail } from "../src/utils/mail.js";

const getModel=(name:string)=>mongoose.models[name] as any;
const shortTrackingNumber=()=>`DNF-${Math.floor(100000+Math.random()*900000)}`;
const customerName=(order:any)=>String(order?.fullName||order?.shippingDetails?.firstName||"Customer").trim()||"Customer";
const orderCurrency=(order:any)=>String(order?.currency||"USD").toUpperCase();

const canonicalStatus=(value:any)=>{
  const raw=String(value||"").trim().toLowerCase().replace(/[_-]/g," ");
  const map:any={pending:"Pending",confirmed:"Confirmed",packed:"Packed","on the way":"On the Way",ontheway:"On the Way",shipped:"Shipped",delivered:"Delivered",cancelled:"Cancelled",canceled:"Cancelled"};
  return map[raw] || "";
};

const normalizeTracking=(order:any)=>{
  const tracking={...(order?.tracking||{})};
  const history=Array.isArray(order?.statusHistory)?order.statusHistory:[];
  for(const item of history){
    const s=canonicalStatus(item?.status);
    const at=item?.at||item?.timestamp;
    if(s==="Confirmed"&&!tracking.confirmed)tracking.confirmed=at;
    if(s==="Packed"&&!tracking.packed)tracking.packed=at;
    if((s==="On the Way"||s==="Shipped")&&!tracking.shipped)tracking.shipped=at;
    if(s==="Delivered"&&!tracking.delivered)tracking.delivered=at;
  }
  return {...order,tracking};
};

const getLiveProducts=async()=>{
  const Product=getModel("Product");
  if(!Product)return[];
  const rows=await Product.find({}).sort({isFeatured:-1,isNewArrival:-1,createdAt:-1}).limit(4).lean();
  return rows.map((p:any)=>({...p,id:String(p.id||p._id),name:p.name||p.title,image:p.image||p.images?.[0]||"",images:p.images||[],price:Number(p.price||0)}));
};

export async function handleOrderRoutes(req:any,res:any):Promise<boolean>{
  const url=String(req.url||"").split("?")[0];
  const isAdminList=req.method==="GET"&&url==="/api/admin/orders";
  const isCreate=req.method==="POST"&&url==="/api/orders/create";
  const isStatus=req.method==="PUT"&&/^\/api\/admin\/orders\/[^/]+\/status$/.test(url);
  if(!isAdminList&&!isCreate&&!isStatus)return false;

  try{await connectDB();}catch(error){console.error("[orders] database unavailable",error);return res.status(503).json({success:false,error:"Database unavailable"});}
  const Order=getModel("Order");
  if(!Order)return res.status(503).json({success:false,error:"Order service unavailable"});

  try{
    if(isAdminList){
      const userId=String(req.query?.userId||"").trim();
      const email=String(req.query?.email||"").trim().toLowerCase();
      const filter:any=userId?{userId}:email?{$or:[{email},{ "shippingDetails.email":email }]}:{};
      const orders=await Order.find(filter).sort({createdAt:-1}).lean();
      return res.status(200).json(orders.map(normalizeTracking));
    }

    if(isCreate){
      const body=req.body||{};
      const items=Array.isArray(body.items)?body.items:[];
      const shippingDetails={
        ...(body.shippingDetails||{}),
        firstName: body.shippingDetails?.firstName || body.fullName || body.shippingAddress?.fullName || "",
        lastName: body.shippingDetails?.lastName || "",
        email: body.shippingDetails?.email || body.email || "",
        phone: body.shippingDetails?.phone || body.phone || "",
        address: body.shippingDetails?.address || body.shippingAddress || {}
      };
      const fullName=String(body.fullName||[shippingDetails.firstName,shippingDetails.lastName].filter(Boolean).join(" ")||"").trim();
      const email=String(shippingDetails.email||body.email||"").trim().toLowerCase();

      if(!items.length||!fullName||!email)return res.status(400).json({success:false,error:"Missing customer name, email or order items"});

      const currency=String(body.currency||"USD").toUpperCase();
      const now=new Date();
      const order=await Order.create({
        userId:body.userId||"GUEST",
        email,
        fullName,
        phone:body.phone||shippingDetails.phone||"",
        items,
        subtotal:Number(body.subtotal??body.totalAmount??0),
        discountAmount:Number(body.discountAmount||0),
        discountCode:String(body.discountCode||""),
        shippingCost:Number(body.shippingCost||0),
        totalAmount:Number(body.totalAmount||0),
        currency,
        paymentMethod:body.paymentMethod||"cod",
        status:"Pending",
        trackingNumber:body.trackingNumber||shortTrackingNumber(),
        shippingAddress:body.shippingAddress||shippingDetails.address,
        shippingDetails,
        tracking:{},
        statusHistory:[{status:"Pending",at:now}]
      });

      try{
        const products=await getLiveProducts();
        const {getOrderEmail}=await import("../src/utils/AtelierEmails.js");
        await sendTransactionalMail(email,`${BRAND.name} | Order Confirmed`,getOrderEmail(customerName(order),String(order._id),String(order.totalAmount),products,order),`order:${order._id}:confirmed`);
      }catch(emailError){console.warn("[orders] confirmation email failed after order save",emailError);}

      return res.status(201).json({success:true,orderId:order._id,order:normalizeTracking(order.toObject?order.toObject():order)});
    }

    const id=url.split("/")[4];
    if(!mongoose.isValidObjectId(id))return res.status(400).json({success:false,error:"Invalid order id"});
    const status=canonicalStatus(req.body?.status);
    if(!status)return res.status(400).json({success:false,error:"Invalid status"});

    const existing:any=await Order.findById(id);
    if(!existing)return res.status(404).json({success:false,error:"Order not found"});

    const changed=canonicalStatus(existing.status)!==status;
    existing.status=status;
    if(!existing.trackingNumber&&["Packed","On the Way","Shipped"].includes(status))existing.trackingNumber=shortTrackingNumber();
    if(changed){
      const now=new Date();
      existing.statusHistory=[...(existing.statusHistory||[]),{status,at:now}];
      existing.tracking={...(existing.tracking||{})};
      if(status==="Confirmed")existing.tracking.confirmed=now;
      if(status==="Packed")existing.tracking.packed=now;
      if(status==="On the Way"||status==="Shipped")existing.tracking.shipped=now;
      if(status==="Delivered")existing.tracking.delivered=now;
    }
    await existing.save();
    const order=normalizeTracking(existing.toObject?existing.toObject():existing);

    if(changed&&order.email){
      try{
        const products=await getLiveProducts();
        const {getPackedEmail,getShippedEmail,getDeliveredEmail,getCancelledEmail,getStatusEmail}=await import("../src/utils/AtelierEmails.js");
        const currency=orderCurrency(order);
        let html="";
        let subject="";
        let key=`order:${order._id}:${status.toLowerCase().replace(/\s+/g,"-")}`;
        if(status==="Packed"){html=getPackedEmail(customerName(order),String(order._id),products,currency);subject=`${BRAND.name} | Order Packed`;}
        else if(status==="On the Way"||status==="Shipped"){html=getShippedEmail(customerName(order),String(order._id),products,currency);subject=`${BRAND.name} | Order ${status}`;}
        else if(status==="Delivered"){html=getDeliveredEmail(customerName(order),String(order._id),products,currency);subject=`${BRAND.name} | Order Delivered`;}
        else if(status==="Cancelled"){html=getCancelledEmail(customerName(order),String(order._id),products,currency);subject=`${BRAND.name} | Order Cancelled`;}
        else {html=getStatusEmail(customerName(order),String(order._id),status,order.trackingNumber||"",Number(order.totalAmount||0),currency,products);subject=`${BRAND.name} | Order ${status}`;}
        await sendTransactionalMail(order.email,subject,html,key);
      }catch(emailError){console.warn("[orders] status email failed after status update",emailError);}
    }

    return res.status(200).json({success:true,order});
  }catch(error){
    console.error("[orders] route failed",error);
    return res.status(500).json({success:false,error:"Order operation failed"});
  }
}
