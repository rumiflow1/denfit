import { Request, Response } from 'express';
import User from '../models/User.js';
import { generateOTP } from '../utils/otpService.js';
import { sendTransactionalMail } from '../utils/mail.js';
import { getOTPEmail } from '../utils/AtelierEmails.js';
import bcrypt from 'bcryptjs';

export const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ success:false, error:'Email is required.' });
    const user = await User.findOne({ email });
    if (!user) return res.json({ success:true, message:'If an account exists, a reset code has been sent.' });
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    if (user.otp && user.otpExpires && user.otpExpires > twoMinutesAgo) return res.json({ success:true, message:'A reset code was already sent recently. Please check your email.' });
    const otp = generateOTP(); const expiry = new Date(Date.now() + 10 * 60 * 1000);
    await User.findByIdAndUpdate(user._id,{otp,otpExpires:expiry});
    await sendTransactionalMail(email,'DENFIT | Password reset',getOTPEmail(otp),`password-reset:${String(user._id)}:${otp}`);
    return res.json({ success:true, message:'Reset code sent to your email.' });
  } catch (error:any) {
    console.error('Password reset request error:',error);
    return res.status(500).json({ success:false, error:error?.message||'Password reset email could not be sent.' });
  }
};

export const verifyCode = async (req: Request, res: Response) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase(); const code = String(req.body?.code || '').trim();
    const user = await User.findOne({ email });
    if (!user || !user.otp || !user.otpExpires) return res.status(400).json({ success:false,error:'No reset request found.' });
    if (new Date() > user.otpExpires) return res.status(400).json({ success:false,error:'Reset code has expired. Please request a new one.' });
    if (String(user.otp) !== code) return res.status(400).json({ success:false,error:'Invalid reset code.' });
    return res.json({ success:true,message:'Code verified. You may now reset your password.' });
  } catch (error) { console.error('Password code verification error:',error); return res.status(500).json({ success:false,error:'Server error.' }); }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const email=String(req.body?.email||'').trim().toLowerCase(); const code=String(req.body?.code||'').trim(); const normalizedPassword=typeof req.body?.newPassword==='string'?req.body.newPassword:''; const normalizedConfirmation=typeof req.body?.confirmPassword==='string'?req.body.confirmPassword:normalizedPassword;
    if(normalizedPassword!==normalizedConfirmation)return res.status(400).json({success:false,error:'Passwords do not match.'});
    if(normalizedPassword.length<8)return res.status(400).json({success:false,error:'Password must be at least 8 characters long.'});
    const user=await User.findOne({email});
    if(!user||!user.otp||!user.otpExpires||String(user.otp)!==code||new Date()>user.otpExpires)return res.status(400).json({success:false,error:'Invalid or expired reset code.'});
    const hashedPassword=await bcrypt.hash(normalizedPassword,10); await User.findByIdAndUpdate(user._id,{password:hashedPassword,$unset:{otp:1,otpExpires:1}});
    return res.json({success:true,message:'Password successfully updated. You may now log in.'});
  } catch(error){console.error('Password reset error:',error);return res.status(500).json({success:false,error:'Server error.'});}
};
