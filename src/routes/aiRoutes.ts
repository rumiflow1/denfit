import express from 'express';
import { handleAIStylist } from '../controllers/aiController.ts';

const router = express.Router();

// The Master AI Stylist Endpoint
router.post('/stylist', handleAIStylist);

export default router;
