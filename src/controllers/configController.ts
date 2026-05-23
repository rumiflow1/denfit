import { Request, Response } from 'express';
import Config from '../models/Config.js';

export const updateSiteConfig = async (req: Request, res: Response) => {
  try {
    const config = await Config.findOneAndUpdate(
      { key: "global" },
      req.body,
      // Fixed: Deprecation warning resolved here
      { upsert: true, returnDocument: 'after' }
    );
    res.json({ success: true, message: "Site Aesthetics Updated.", config });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSiteConfig = async (req: Request, res: Response) => {
  try {
    const config = await Config.findOne({ key: "global" });
    res.json(config || {});
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};