import { Request, Response } from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';

export const createOrder = async (req: Request, res: Response) => {
  try {
    const { userId, items, totalAmount, shippingDetails } = req.body;

    const order = new Order({ userId, items, totalAmount, shippingDetails });
    await order.save();

    // Inventory Update Logic (Stock kam karna)
    for (const item of items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity }
      });
    }

    res.status(201).json({ success: true, orderId: order._id });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};