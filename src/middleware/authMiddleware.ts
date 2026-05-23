import { Request, Response, NextFunction } from 'express';
import User from '../models/User.js';

export const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { uid } = req.headers;

    if (!uid) {
      return res.status(401).json({ message: "Authentication required. No UID provided." });
    }

    const user = await User.findOne({ uid });

    if (user && user.role === 'admin') {
      next();
    } else {
      // 403 for Forbidden access
      res.status(403).json({ 
        success: false, 
        message: "Access Denied: Sovereign Rights Required." 
      });
    }
  } catch (error) {
    console.error("Security Check Error:", error);
    res.status(500).json({ success: false, message: "Security Check Failed." });
  }
};