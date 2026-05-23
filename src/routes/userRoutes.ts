import express from 'express';
import { trackActivity, getAllCustomers } from '../controllers/userController.js';
import { isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/track', trackActivity);
router.get('/all', isAdmin, getAllCustomers);

export default router;