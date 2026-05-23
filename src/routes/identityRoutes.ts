import express from 'express';
import { updateBrandIdentity } from '../controllers/identityController.js';
import { isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/update-aura', isAdmin, updateBrandIdentity);

export default router;