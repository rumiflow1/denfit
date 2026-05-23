import express from 'express';
import { syncUser } from '../controllers/authController.js';
import { isAdmin } from '../middleware/authMiddleware.js';


const router = express.Router();

// Public Routes
router.post('/auth/sync', syncUser);

// Admin Only Routes (Protected)
router.get('/admin/stats', isAdmin, (req, res) => {
  res.json({ message: "Welcome, Sovereign Admin." });
});

export default router;