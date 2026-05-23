import cron from 'node-cron';
import User from '../models/User.js';
import { sendLuxeEmail } from '../utils/emailService.js';
import { editorialBase } from '../utils/editorialBase.js';

export const initWishlistJob = () => {
  cron.schedule('0 10 * * *', async () => { // Rozana subah 10 baje
    console.log("💎 Processing Wishlist Opportunities...");
    const users = await User.find({ 'activity.action': 'VIEWED_WISHLIST' });

    for (const user of users) {
      const content = `<h1>Your Desires, Refined</h1><p>Dear Patron, the pieces in your wishlist are currently in high demand. We invite you to make them yours.</p>`;
      await sendLuxeEmail(user.email, "A Silent Desire Awaits", editorialBase(content));
    }
  });
};