import app from './app.js';
import { initCartRecoveryJob } from './jobs/cartRecovery.js';
import { initWishlistJob } from './jobs/wishlistJob.js';

// Background Jobs Start
initCartRecoveryJob();
initWishlistJob();

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`
  👑 LUXE ATTIRE BACKEND IS LIVE
  🚀 PORT: ${PORT}
  💎 STATUS: EXCELLENT
  `);
});