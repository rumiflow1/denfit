import { Request, Response } from 'express';
import Promo from '../models/Promo.js';

export const createPromo = async (req: Request, res: Response) => {
  try {
    const promo = new Promo(req.body);
    await promo.save();
    res.status(201).json({ success: true, message: "Privilege Code Created.", promo });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const validatePromo = async (req: Request, res: Response) => {
  const { code } = req.params;
  const promo = await Promo.findOne({ code, isActive: true });

  if (!promo || (promo.expiryDate && new Date() > promo.expiryDate)) {
    return res.status(404).json({ success: false, message: "Code Expired or Invalid." });
  }
  res.json({ success: true, discount: promo.discountPercentage });
};