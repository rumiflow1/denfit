import { Request, Response } from 'express';
import Config from '../models/Config.js';

export const updateSEOMeta = async (req: Request, res: Response) => {
  try {
    const { keywords, description, titleTag } = req.body;
    const config = await Config.findOneAndUpdate(
      { key: "global" },
      { seo: { keywords, description, titleTag } },
      { upsert: true, new: true }
    );
    res.json({ success: true, message: "SEO Optimized.", config });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};