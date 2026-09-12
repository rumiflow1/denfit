import { Request, Response } from 'express';
import User from '../models/User.js';
import Product from '../models/Product.js';
import sendEmail from '../utils/email.js';
import { getSignupEmail, getLoginEmail } from '../utils/AtelierEmails.js';

export const syncUser = async (req: Request, res: Response) => {
  try {
    const { uid, email, displayName, photoURL, isNewUser } = req.body;
    if (!email || !uid) return res.status(400).json({ success:false, message:'Identification missing.' });
    const normalizedEmail = email.toLowerCase();
    const existingUserWithEmail = await User.findOne({ email: normalizedEmail });
    if (existingUserWithEmail && existingUserWithEmail.uid !== uid) return res.status(400).json({ success:false, message:'This email is already registered with another account method.' });
    const role = (['admin@rumi.com', 'admin@roomy.com'].includes(normalizedEmail)) ? 'admin' : 'user';
    const user = await User.findOneAndUpdate({ uid }, { email:normalizedEmail, displayName, photoURL, role, lastLogin:new Date() }, { upsert:true, returnDocument:'after' });
    console.log(`User synced: ${normalizedEmail} as ${role}`);

    try {
      // Use real live catalogue data in welcome/security emails; never hard-code demo products.
      const trending = await Product.find({ stock:{ $gt:0 }, $or:[{ isFeatured:true }, { isNewArrival:true }] }).sort({ createdAt:-1 }).limit(4).lean();
      if (isNewUser === true || String(isNewUser) === 'true') {
        const html = getSignupEmail(displayName || 'Customer', trending, 'PKR');
        await sendEmail({ to:normalizedEmail, subject:`Welcome to ${process.env.BRAND_NAME || 'DENFIT'}`, html });
      } else {
        const html = getLoginEmail(displayName || 'Customer', trending, 'PKR');
        await sendEmail({ to:normalizedEmail, subject:`New sign-in to ${process.env.BRAND_NAME || 'DENFIT'}`, html });
      }
    } catch (emailError) {
      console.error('Email dispatch failed; account sync preserved:', emailError);
    }
    return res.status(200).json({ success:true, user });
  } catch (error:any) {
    if (error.code === 11000) return res.status(400).json({ success:false, message:'Email already in use.' });
    console.error('Auth Bridge Error:', error.message);
    return res.status(500).json({ success:false, message:'System failure.' });
  }
};
