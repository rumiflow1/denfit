import { Request, Response } from 'express';
import User from '../models/User.js';
import { sendTransactionalMail } from '../utils/mail.js';
import { getPromotionalEmail } from '../utils/AtelierPromotional.js';

export const dispatchCampaign = async (req: Request, res: Response) => {
  try {
    const { subject, offerCode = '', products = [], currency = 'PKR', recipients } = req.body || {};
    const users = Array.isArray(recipients) && recipients.length
      ? await User.find({ email: { $in: recipients.map((v: any) => String(v).trim().toLowerCase()) } }).lean()
      : await User.find({ email: { $exists: true, $ne: '' } }).lean();
    let sent = 0;
    for (const user of users) {
      const html = getPromotionalEmail(user.displayName || 'Customer', offerCode, products, currency);
      const key = 'campaign:' + String(req.body?.campaignId || offerCode || subject || 'manual') + ':' + String(user._id);
      const result = await sendTransactionalMail(String(user.email), String(subject || 'A private invitation'), html, key);
      if (result.sent) sent++;
    }
    return res.json({ success: true, sent, total: users.length });
  } catch (error: any) {
    console.error('Campaign dispatch failed:', error);
    return res.status(500).json({ success: false, error: 'Campaign could not be sent.' });
  }
};
