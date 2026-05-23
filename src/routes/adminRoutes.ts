import express from 'express';
import { getDashboardStats } from '../controllers/adminController.js';
import { updateSiteConfig, getSiteConfig } from '../controllers/configController.js';
import { isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/stats', isAdmin, getDashboardStats);
router.get('/config', getSiteConfig);
router.post('/config/update', isAdmin, updateSiteConfig);

export default router;