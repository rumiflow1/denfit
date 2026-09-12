import { Request, Response } from 'express';
import Order from '../models/Order.js';
import User from '../models/User.js';
import sendEmail from '../utils/email.js';
import { atelierBase } from '../utils/AtelierBase.js';
import Config from '../models/Config.js';
import { resolveImageUrl } from '../utils/imageUtils.js';

// Helper: Generate professional email content for order status
const generateOrderStatusEmail = (order: any, status: string, brandName: string) => {
  const statusMessages: { [key: string]: { title: string; message: string } } = {
    'pending': {
      title: 'Order Received',
      message: 'We have received your order and it is being processed.'
    },
    'packed': {
      title: 'Order Packed',
      message: 'Your order has been carefully packed and is ready for shipment.'
    },
    'shipped': {
      title: 'Order Shipped',
      message: 'Your order is on its way! You can track your package using the tracking number below.'
    },
    'on the way': {
      title: 'Out for Delivery',
      message: 'Your order is out for delivery and will arrive soon.'
    },
    'delivered': {
      title: 'Order Delivered',
      message: 'Your order has been successfully delivered. We hope you enjoy your purchase!'
    },
    'cancelled': {
      title: 'Order Cancelled',
      message: 'Your order has been cancelled. If you have any questions, please contact our support team.'
    }
  };

  const statusInfo = statusMessages[status.toLowerCase()] || statusMessages['pending'];

  const productsHtml = order.items.map((item: any) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #E1E5EA;">
        <img src="${resolveImageUrl(item.image || item.images?.[0] || '')}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;" />
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #E1E5EA;">
        <div style="font-weight: 600; margin-bottom: 4px;">${item.name}</div>
        <div style="font-size: 12px; color: #666;">Qty: ${item.quantity}</div>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #E1E5EA; text-align: right;">
        ${order.currency === 'PKR' ? 'Rs' : '$'}${item.price}
      </td>
    </tr>
  `).join('');

  return `
    <h1 style="font-family: Georgia, serif; font-size: 24px; font-weight: 400; margin-bottom: 20px; color: #0B1220;">${statusInfo.title}</h1>
    <p style="margin-bottom: 24px;">${statusInfo.message}</p>
    
    <div style="background-color: #F4F2EE; padding: 20px; border-radius: 4px; margin-bottom: 24px;">
      <div style="font-size: 12px; color: #666; margin-bottom: 8px;">Order Number</div>
      <div style="font-size: 16px; font-weight: 600; font-family: monospace;">${order.orderNumber || order._id}</div>
    </div>

    ${order.trackingNumber && status.toLowerCase().includes('ship') ? `
      <div style="background-color: #F4F2EE; padding: 20px; border-radius: 4px; margin-bottom: 24px;">
        <div style="font-size: 12px; color: #666; margin-bottom: 8px;">Tracking Number</div>
        <div style="font-size: 16px; font-weight: 600; font-family: monospace;">${order.trackingNumber}</div>
      </div>
    ` : ''}

    <h2 style="font-family: Georgia, serif; font-size: 18px; font-weight: 400; margin-bottom: 16px; color: #0B1220;">Order Summary</h2>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
      <thead>
        <tr style="background-color: #0B1220; color: white;">
          <th style="padding: 12px; text-align: left;">Product</th>
          <th style="padding: 12px; text-align: left;">Details</th>
          <th style="padding: 12px; text-align: right;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${productsHtml}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="2" style="padding: 12px; text-align: right; font-weight: 600;">Subtotal:</td>
          <td style="padding: 12px; text-align: right;">${order.currency === 'PKR' ? 'Rs' : '$'}${order.subtotal}</td>
        </tr>
        ${order.discount ? `
          <tr>
            <td colspan="2" style="padding: 12px; text-align: right; font-weight: 600;">Discount:</td>
            <td style="padding: 12px; text-align: right; color: green;">-${order.currency === 'PKR' ? 'Rs' : '$'}${order.discount}</td>
          </tr>
        ` : ''}
        <tr>
          <td colspan="2" style="padding: 12px; text-align: right; font-weight: 600;">Shipping:</td>
          <td style="padding: 12px; text-align: right;">${order.currency === 'PKR' ? 'Rs' : '$'}${order.shippingCost || 0}</td>
        </tr>
        <tr style="background-color: #F4F2EE;">
          <td colspan="2" style="padding: 16px 12px; text-align: right; font-weight: 700; font-size: 18px;">Total:</td>
          <td style="padding: 16px 12px; text-align: right; font-weight: 700; font-size: 18px;">${order.currency === 'PKR' ? 'Rs' : '$'}${order.total}</td>
        </tr>
      </tfoot>
    </table>

    <div style="background-color: #F4F2EE; padding: 20px; border-radius: 4px; margin-bottom: 24px;">
      <h3 style="font-size: 14px; font-weight: 600; margin-bottom: 12px;">Shipping Address</h3>
      <p style="margin: 0; line-height: 1.6;">
        ${order.shippingAddress?.name || ''}<br/>
        ${order.shippingAddress?.phone || ''}<br/>
        ${order.shippingAddress?.address || ''}<br/>
        ${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} ${order.shippingAddress?.zipCode || ''}<br/>
        ${order.shippingAddress?.country || ''}
      </p>
    </div>

    <p style="color: #666; font-size: 14px;">Thank you for shopping with ${brandName}.</p>
  `;
};

// Update order status (Admin)
export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { status, trackingNumber } = req.body;

    const order = await Order.findById(orderId).populate('userId', 'email name');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Check if status actually changed to prevent duplicate emails
    const oldStatus = order.status;
    const statusChanged = oldStatus !== status;

    // Update order
    order.status = status;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    await order.save();

    // DUPLICATE PREVENTION: Only send email if status actually changed
    if (statusChanged && (order as any).userId?.email) {
      try {
        const config = await Config.findOne({ key: 'global' });
        const brandName = config?.branding?.brandName || 'Denfit';

        const emailContent = generateOrderStatusEmail(order, status, brandName);
        const html = atelierBase(emailContent, `Order ${status}`, '#0B1220');

        await sendEmail({
          to: (order as any).userId.email,
          subject: `Order Update - ${brandName}`,
          html
        });

        console.log(`Order status email sent to ${(order as any).userId.email} for order ${orderId}`);
      } catch (emailError) {
        console.error('Failed to send order status email:', emailError);
        // Don't fail the request if email fails
      }
    }

    res.json({ success: true, message: 'Order status updated successfully', order });
  } catch (error: any) {
    console.error('Update order status error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all orders (Admin)
export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const orders = await Order.find().populate('userId', 'name email').sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get user orders (Customer)
export const getUserOrders = async (req: Request, res: Response) => {
  try {
    const orders = await Order.find({ userId: (req as any).userId }).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single order
export const getOrderById = async (req: Request, res: Response) => {
  try {
    const order = await Order.findById(req.params.orderId).populate('userId', 'name email');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, order });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
