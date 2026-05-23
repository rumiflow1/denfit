import { Request, Response } from 'express';
import User from '../models/User.js';

export const trackActivity = async (req: Request, res: Response) => {
  try {
    const { uid, action } = req.body; // action: 'ADDED_TO_CART', 'VIEWED_WISHLIST', etc.
    
    const user = await User.findOneAndUpdate(
      { uid },
      { 
        $push: { activity: { action, timestamp: new Date() } },
        lastActive: new Date()
      },
      { new: true }
    );

    res.json({ success: true, message: "Behavior Tracked." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllCustomers = async (req: Request, res: Response) => {
  try {
    const customers = await User.find().sort({ lastActive: -1 });
    res.json({ success: true, customers });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};