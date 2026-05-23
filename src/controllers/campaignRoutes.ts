import express from 'express';
import { dispatchCampaign } from '../controllers/campaignController.js';
import { isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/dispatch', isAdmin, dispatchCampaign);

export default router;