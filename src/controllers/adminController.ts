import { Request, Response } from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const totalSales = await Order.aggregate([
      { $match: { status: 'Delivered' } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);

    const orderCount = await Order.countDocuments();
    const lowStockItems = await Product.find({ $expr: { $lte: ["$stock", "$lowStockAlert"] } });

    res.json({
      success: true,
      stats: {
        revenue: totalSales[0]?.total || 0,
        totalOrders: orderCount,
        stockAlerts: lowStockItems.length
      },
      lowStockItems
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};