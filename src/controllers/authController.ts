import { Request, Response } from 'express';
import User from '../models/User.js';
import sendEmail from '../utils/email.js';
import { getSignupEmail, getLoginEmail } from '../utils/AtelierEmails.js';

export const syncUser = async (req: Request, res: Response) => {
  try {
    const { uid, email, displayName, photoURL, isNewUser } = req.body;

    if (!email || !uid) {
      return res.status(400).json({ success: false, message: "Identification missing." });
    }

    const normalizedEmail = email.toLowerCase();

    // 1. CRITICAL FIX: Check if the email is already taken by a DIFFERENT UID
    // This prevents the E11000 duplicate key error
    const existingUserWithEmail = await User.findOne({ email: normalizedEmail });
    
    if (existingUserWithEmail && existingUserWithEmail.uid !== uid) {
      console.error(`❌ Conflict: Email ${normalizedEmail} is already linked to another UID.`);
      return res.status(400).json({ 
        success: false, 
        message: "This email is already registered with another account method." 
      });
    }

    // 2. Identify Admin or User
    const role = (normalizedEmail === "admin@com" || normalizedEmail === "admin@rumi.com") ? "admin" : "user";

    // 3. Database Sync
    // FIXED: Removed 'new: true' and kept only 'returnDocument: after'
    const user = await User.findOneAndUpdate(
      { uid: uid },
      { 
        email: normalizedEmail, 
        displayName, 
        photoURL, 
        role, 
        lastLogin: new Date() 
      },
      { upsert: true, returnDocument: 'after' }
    );

    console.log(`✅ Sovereign Sync: ${normalizedEmail} recognized as ${role}`);

    // 4. AUTOMATIC EMAIL LOGIC
    // We wrap this in a try-catch so if email fails, the login still succeeds
    try {
      if (isNewUser === true || String(isNewUser) === 'true') {
        console.log("📨 Orchestrating Welcome Correspondence...");
        const signupHtml = getSignupEmail(displayName || "Patron");
        
        await sendEmail({
          to: normalizedEmail,
          subject: "The Sanctuary Awaits | Welcome to Ethereal Couture",
          html: signupHtml
        });
        console.log("✨ Welcome Email Dispatched.");
      } else {
        console.log("📨 Sending Security Access Alert...");
        const loginHtml = getLoginEmail(displayName || "Patron");
        
        await sendEmail({
          to: normalizedEmail,
          subject: "Security Protocol | New Login Detected",
          html: loginHtml
        });
        console.log("✨ Login Notification Dispatched.");
      }
    } catch (emailError) {
      console.error("⚠️ Email Dispatch Failed (User still synced):", emailError);
    }

    return res.status(200).json({ success: true, user });

  } catch (error: any) {
    // Handle the specific MongoDB duplicate key error if it somehow slips through
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "Email already in use." });
    }
    
    console.error("❌ Auth Bridge Error:", error.message);
    res.status(500).json({ success: false, message: "System failure." });
  }
};