import express from 'express';
import { handleAIStylist } from '../controllers/aiController.js';

const router = express.Router();
router.post('/stylist', handleAIStylist);
export default router;
