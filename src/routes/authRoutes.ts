import express from 'express';
import { syncUser } from '../controllers/authController.js';
// Niche wali line mein verifyCode aur resetPassword ko add kiya hai
import { requestPasswordReset, verifyCode, resetPassword } from '../controllers/forgotPasswordController.js';

const router = express.Router();

// Sync user from Firebase (Google/Email)
router.post('/sync', syncUser);

// Forgot Password
router.post('/forgot-password', requestPasswordReset);
router.post('/verify-code', verifyCode);       // YEH LINE ADD KI HAI
router.post('/reset-password', resetPassword); // YEH LINE ADD KI HAI

export default router;