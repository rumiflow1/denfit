import cron from 'node-cron';
import User from '../models/User.js';
import sendEmail from '../utils/email.js';
import { getAtelierLayout } from '../utils/AtelierCorrespondence.js';
import { renderLuxuryVoucher } from '../utils/premiumComponents.js';

export const initCartRecoveryJob = () => {
  // Har 30 minute baad check karega
  cron.schedule('*/30 * * * *', async () => {
    console.log("🔍 Intelligence Alert: Scanning for Abandoned Vaults...");
    
    const halfHourAgo = new Date(Date.now() - 30 * 60 * 1000);
    
    const users = await User.find({
      'cart.0': { $exists: true }, // Cart khali nahi hai
      cartEmailSent: false,
      lastActive: { $lt: halfHourAgo }
    });

    for (const user of users) {
      const voucherHtml = renderLuxuryVoucher("SOVEREIGN10", 10);
      const htmlBody = getAtelierLayout(
        "An Unfinished Vision",
        `<p>Dear ${user.displayName || 'Patron'},<br><br>In the world of high couture, the finest silhouettes are often the most elusive. We have momentarily reserved your selections.</p>
         ${voucherHtml}
         <a href="#" class="primary-cta">RESTORE SELECTION</a>`
      );

      await sendEmail({
        to: user.email,
        subject: "A Piece of Art Awaits Your Return | Ethereal Couture",
        html: htmlBody
      });

      user.cartEmailSent = true;
      await user.save();
      console.log(`📧 Recovery Email dispatched to: ${user.email}`);
    }
  });
};