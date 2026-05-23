import express from 'express';
import { sendMassPromo } from '../controllers/marketingController.js';
import { isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/send-campaign', isAdmin, sendMassPromo);

export default router;