import { Request, Response } from 'express';
import User from '../models/User.js';
import { generateOTP } from '../utils/otpService.js';
import sendEmail from '../utils/email.js';
import { atelierBase } from '../utils/AtelierBase.js';
import Config from '../models/Config.js';
import bcrypt from 'bcryptjs';

export const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    // Security: Always return success message to prevent email enumeration attacks
    if (!user) {
      return res.json({ success: true, message: "If an account exists, a reset code has been sent." });
    }

    // DUPLICATE PREVENTION: Check if OTP was sent in the last 2 minutes
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    if (user.otp && user.otpExpires && user.otpExpires > twoMinutesAgo) {
      return res.json({ success: true, message: "A reset code was already sent recently. Please check your email." });
    }

    const otp = generateOTP();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes valid

    await User.findByIdAndUpdate(user._id, { otp, otpExpires: expiry });

    const config = await Config.findOne({ key: 'global' });
    const brandName = config?.branding?.brandName || 'Denfit';
    const logoUrl = config?.branding?.logoUrl || '';

    const emailContent = `
      <h1 style="font-family: Georgia, serif; font-size: 24px; font-weight: 400; margin-bottom: 20px; color: #0B1220;">Password Reset Request</h1>
      <p style="margin-bottom: 16px;">Hello ${user.name || 'Valued Customer'},</p>
      <p style="margin-bottom: 24px;">We received a request to reset your password. Use the 6-digit code below. It is valid for 10 minutes.</p>
      <div style="text-align: center; margin: 30px 0; padding: 24px; background-color: #F4F2EE; border: 1px solid #E1E5EA; border-radius: 4px;">
        <h2 style="margin: 0; font-size: 32px; letter-spacing: 8px; color: #0B1220; font-family: monospace;">${otp}</h2>
      </div>
      <p style="color: #666666; font-size: 14px;">If you did not request this, please ignore this email. Your password will remain unchanged.</p>
    `;

    const html = atelierBase(emailContent, 'Secure your account', '#0B1220');

    await sendEmail({ to: email, subject: `Password Reset - ${brandName}`, html });
    
    res.json({ success: true, message: "Reset code sent to your email." });
  } catch (error: any) {
    console.error("Password reset request error:", error);
    res.status(500).json({ success: false, message: "Server error. Please try again later." });
  }
};

export const verifyCode = async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({ email });

    if (!user || !user.otp || !user.otpExpires) {
      return res.status(400).json({ success: false, message: "No reset request found." });
    }
    if (new Date() > user.otpExpires) {
      return res.status(400).json({ success: false, message: "Reset code has expired. Please request a new one." });
    }
    if (user.otp !== code) {
      return res.status(400).json({ success: false, message: "Invalid reset code." });
    }

    res.json({ success: true, message: "Code verified. You may now reset your password." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Server error." });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, code, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match." });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters long." });
    }

    const user = await User.findOne({ email });
    if (!user || user.otp !== code || new Date() > user.otpExpires!) {
      return res.status(400).json({ success: false, message: "Invalid or expired reset code." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // CRITICAL: Clear OTP after successful reset to prevent reuse
    await User.findByIdAndUpdate(user._id, { 
      password: hashedPassword, 
      otp: undefined, 
      otpExpires: undefined 
    });

    res.json({ success: true, message: "Password successfully updated. You may now log in." });
  } catch (error: any) {
    console.error("Password reset error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};
