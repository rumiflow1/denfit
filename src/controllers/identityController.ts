import { Request, Response } from 'express';
import Config from '../models/Config.js';

export const getBrandIdentity = async (req: Request, res: Response) => {
  try {
    const config = await Config.findOne({ key: 'global' });
    res.json({ success: true, config: config || {} });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateBrandIdentity = async (req: Request, res: Response) => {
  try {
    const { brandName, logoUrl } = req.body;
    
    if (!brandName) {
      return res.status(400).json({ success: false, message: "Brand name is required." });
    }

    const config = await Config.findOneAndUpdate(
      { key: 'global' },
      { 
        $set: {
          'branding.brandName': brandName,
          'branding.logoUrl': logoUrl || '',
          'header.logoText': brandName,
          'footer.brandName': brandName
        }
      },
      { upsert: true, new: true }
    );
    
    res.json({ success: true, message: "Brand identity updated globally across all systems.", config });
  } catch (error: any) {
    console.error("Brand identity update error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
