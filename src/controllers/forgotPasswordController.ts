// backend/src/controllers/forgotPasswordController.ts
import { Request, Response } from 'express';
import User from '../models/User.js';
import { generateOTP } from '../utils/otpService.js';
import { sendLuxeEmail } from '../utils/emailService.js'; // Ya aapka mail.ts function
import { editorialBase } from '../utils/editorialBase.js';
import bcrypt from 'bcryptjs';

export const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Patron not found." });

    const otp = generateOTP();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await User.findOneAndUpdate({ email }, { otp, otpExpires: expiry });

    const html = editorialBase(`
      <h1>Vault Security Access</h1>
      <p>Use the following 6-digit code to reset your sovereign password. Valid for 10 minutes.</p>
      <h2 style="letter-spacing: 0.5em; font-size: 32px; color: #0A0A0A;">${otp}</h2>
    `, "Password Reset Request");

    await sendLuxeEmail(email, "Security Protocol: Password Reset", html);
    res.json({ success: true, message: "Security code dispatched to your email." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

export const verifyCode = async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "Patron not found." });
    if (!user.otp || !user.otpExpires) return res.status(400).json({ message: "No reset request found." });
    if (new Date() > user.otpExpires) return res.status(400).json({ message: "Security code has expired." });
    if (user.otp !== code) return res.status(400).json({ message: "Invalid security code." });

    res.json({ success: true, message: "Code verified. You may now reset your password." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, code, newPassword } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "Patron not found." });
    if (user.otp !== code || new Date() > user.otpExpires!) {
      return res.status(400).json({ message: "Invalid or expired security code." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.findOneAndUpdate(
      { email },
      { password: hashedPassword, otp: undefined, otpExpires: undefined }
    );

    res.json({ success: true, message: "Password successfully updated. You may now log in." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};
