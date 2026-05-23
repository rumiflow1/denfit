import express from 'express';
import { createOrder } from '../controllers/orderController.js';
import { isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/create', createOrder);
// Mazeed order routes yahan aayenge

export default router;