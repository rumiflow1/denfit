import { Request, Response } from 'express';
import User from '../models/User.js';
import { generateOTP } from '../utils/otpService.js';
import { sendLuxeEmail } from '../utils/emailService.js';
import { editorialBase } from '../utils/editorialBase.js';

export const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "Patron not found." });

    const otp = generateOTP();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes valid

    // Update user with OTP
    await User.findOneAndUpdate({ email }, { otp, otpExpires: expiry });

    const html = editorialBase(`
      <h1>Vault Security Access</h1>
      <p>Use the following 6-digit code to reset your sovereign password. This code is valid for 10 minutes.</p>
      <h2 style="letter-spacing: 0.5em; font-size: 32px;">${otp}</h2>
    `, "Password Reset Request");

    await sendLuxeEmail(email, "Security Protocol: Password Reset", html);
    res.json({ success: true, message: "Security code dispatched to your email." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};