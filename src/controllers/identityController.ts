import { Request, Response } from 'express';
import Config from '../models/Config.js';

export const updateBrandIdentity = async (req: Request, res: Response) => {
  try {
    const { primaryColor, secondaryColor, headingFont } = req.body;
    const config = await Config.findOneAndUpdate(
      { key: "global" },
      { theme: { primaryColor, secondaryColor, headingFont } },
      { upsert: true, new: true }
    );
    res.json({ success: true, message: "Brand Identity Evolved.", config });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};