import nodemailer from "nodemailer";
const recent=new Map();
export async function sendTransactionalMail(to,subject,html,dedupeKey){
 if(!to) throw new Error("Recipient email is required");
 const now=Date.now(); const key=dedupeKey||`${to}:${subject}`;
 const last=recent.get(key); if(last&&now-last<10*60*1000) return {skipped:true};
 if(!process.env.EMAIL_USER||!process.env.EMAIL_PASS) throw new Error("Email transport is not configured");
 const transporter=nodemailer.createTransport({service:"gmail",auth:{user:process.env.EMAIL_USER,pass:process.env.EMAIL_PASS}});
 const fromName=process.env.BRAND_NAME||"DENFIT";
 const result=await transporter.sendMail({from:`"${fromName}" <${process.env.EMAIL_USER}>`,to,subject,html});
 recent.set(key,now); return result;
}
