import { Request, Response } from 'express';
import Product from '../models/Product.js';

export const searchProducts = async (req: Request, res: Response) => {
  try {
    const { query } = req.query;
    const results = await Product.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    }).limit(10);

    res.json({ success: true, results });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};