import { Request, Response } from 'express';
import Order from '../models/Order.js';
import User from '../models/User.js';
import sendEmail from '../utils/email.js';
import { getStatusEmail } from '../utils/AtelierEmails.js';
import Config from '../models/Config.js';

// Admin order-status emails now use the same premium reference-matched email system
// as signup, password reset, shipping, delivery and cancellation emails.
export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { status, trackingNumber } = req.body;
    const order = await Order.findById(orderId).populate('userId', 'email name');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const oldStatus = String(order.status || 'pending');
    const statusChanged = oldStatus.toLowerCase() !== String(status || '').toLowerCase();
    order.status = status;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    await order.save();

    if (statusChanged && (order as any).userId?.email) {
      try {
        const config = await Config.findOne({ key: 'global' });
        const brandName = config?.branding?.brandName || 'DENFIT';
        const currency = String((order as any).currency || config?.currency || 'USD').toUpperCase();
        const recipient = (order as any).userId.email;
        const customerName = (order as any).fullName || (order as any).userId?.name || 'Customer';
        const orderNumber = String((order as any).orderNumber || order._id);
        const html = getStatusEmail(
          customerName,
          orderNumber,
          String(status || 'Updated'),
          String((order as any).trackingNumber || ''),
          Number((order as any).total || (order as any).totalAmount || 0),
          currency,
          [],
          new Date()
        );
        await sendEmail({ to: recipient, subject: `Order ${String(status || 'Updated')} | ${brandName}`, html });
        console.log(`Premium order status email sent to ${recipient} for ${orderId}`);
      } catch (emailError) {
        console.error('Failed to send order status email:', emailError);
      }
    }

    return res.json({ success: true, message: 'Order status updated successfully', order });
  } catch (error: any) {
    console.error('Update order status error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const orders = await Order.find().populate('userId', 'name email').sort({ createdAt: -1 });
    return res.json({ success: true, orders });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserOrders = async (req: Request, res: Response) => {
  try {
    const orders = await Order.find({ userId: (req as any).userId }).sort({ createdAt: -1 });
    return res.json({ success: true, orders });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const order = await Order.findById(req.params.orderId).populate('userId', 'name email');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    return res.json({ success: true, order });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
