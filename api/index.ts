import express, { Request, Response, NextFunction } from "express";
import mongoose, { Schema, Document, Model } from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import path from "path";
import fs from "fs";
import multer from "multer";

// --- MASTER UTILS & EMAIL TEMPLATES ---
import {
  getSignupEmail,
  getLoginEmail,
  getOrderEmail,
  getAbandonedCartEmail,
  getOTPEmail,
  getWishlistEmail,
  getShippedEmail,
  getDeliveredEmail,
} from "../src/utils/AtelierEmails.js";
import { OrderSchema } from "../src/models/MasterModels.js";

dotenv.config();

const app = express();

/**
 * MIDDLEWARE CONFIGURATION
 */
app.use(
  cors({
    origin: [
      "https://www.denfit.shop",
      "https://denfit.shop",
      "https://denfit.vercel.app",
      "http://localhost:3000",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// =========================================================
// --- 1. TYPES & INTERFACES ---
// =========================================================

interface IElement {
  text: string;
  color: string;
  fontSize: string;
  fontFamily: string;
  link?: string;
  bgColor?: string;
  isVisible: boolean;
}

interface IReview {
  customerName?: string;
  comment?: string;
  rating?: number;
  isManual?: boolean;
  createdAt?: Date;
}

export interface IProduct extends Document {
  title: string;
  price: number;
  discountPrice?: number;
  description?: string;
  category?: string;
  images: string[];
  sizes: string[];
  colors: string[];
  stock: number;
  lowStockAlert: number;
  isNewArrival: boolean;
  isFeatured: boolean;
  reviews: IReview[];
}

interface ICartItem {
  productId: string;
  quantity: number;
  size?: string;
  color?: string;
  price: number;
}

interface IUserActivity {
  action?: string;
  details?: string;
  timestamp?: Date;
}

export interface IUser extends Document {
  uid: string;
  email: string;
  displayName?: string;
  role: "user" | "admin";
  phone?: string;
  photoURL?: string;
  lastLogin?: Date;
  activity: IUserActivity[];
  cart: ICartItem[];
  cartEmailSent: boolean;
}

interface IOrderItem {
  productId: string;
  quantity: number;
  size?: string;
  color?: string;
  price: number;
  subtotal: number;
}

export interface IOrder extends Document {
  userId?: string;
  items: IOrderItem[];
  totalAmount: number;
  status: string;
  shippingDetails?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    address?: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
  };
}

export interface ISiteConfig extends Document {
  key: string;
  announcementBar?: {
    mainText?: IElement;
    socialIcons?: { icon: string; link: string }[];
    isVisible?: boolean;
    bgColor?: string;
    textColor?: string;
  };
  header?: {
    logoText?: IElement;
    menuItems?: {
      label: IElement;
      collectionId: string;
      link?: string;
    }[];
  };
  hero?: {
    slides?: {
      image: string;
      title?: IElement;
      subtitle?: IElement;
      button?: IElement;
    }[];
  };
  footer?: {
    description?: IElement;
    copyright?: IElement;
    socialIcons?: { icon: string; link: string }[];
  };
}

export interface IMedia extends Document {
  filename: string;
  contentType: string;
  data: string;
}

export interface IDiscountCode extends Document {
  name: string;
  percent: number;
  startDate: Date;
  endDate: Date;
  minOrderAmount: number;
  isActive: boolean;
}

export interface IContactMessage extends Document {
  fullName: string;
  email: string;
  subject: string;
  message: string;
  reply?: string;
  status: 'pending' | 'replied';
}

export interface INewsletterSubscription extends Document {
  email: string;
  subscribedAt: Date;
}

// =========================================================
// --- 2. DATABASE MODELS ---
// =========================================================

const ElementSchema = new Schema<IElement>(
  {
    text: { type: String, default: "" },
    color: { type: String, default: "#0F0F0F" },
    fontSize: { type: String, default: "14px" },
    fontFamily: { type: String, default: "Inter" },
    link: { type: String, default: "" },
    bgColor: { type: String, default: "" },
    isVisible: { type: Boolean, default: true },
  },
  { _id: false }
);

const ReviewSchema = new Schema<IReview>(
  {
    customerName: { type: String },
    comment: { type: String },
    rating: { type: Number },
    isManual: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const UserActivitySchema = new Schema<IUserActivity>(
  {
    action: { type: String },
    details: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const CartItemSchema = new Schema<ICartItem>(
  {
    productId: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1 },
    size: { type: String },
    color: { type: String },
    price: { type: Number, required: true },
  },
  { _id: false }
);

const OrderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1 },
    size: { type: String },
    color: { type: String },
    price: { type: Number, required: true },
    subtotal: { type: Number, required: true },
  },
  { _id: false }
);

const SiteConfigSchema = new Schema<ISiteConfig>(
  {
    key: { type: String, default: "global", unique: true },
    announcementBar: {
      mainText: ElementSchema,
      socialIcons: [{ icon: String, link: String }],
      isVisible: { type: Boolean, default: true },
      bgColor: { type: String, default: "#000000" },
      textColor: { type: String, default: "#FFFFFF" },
    },
    header: {
      logoText: ElementSchema,
      menuItems: [
        {
          label: ElementSchema,
          collectionId: { type: String, default: "" },
          link: { type: String, default: "" },
        },
      ],
    },
    hero: {
      slides: [
        {
          image: String,
          title: ElementSchema,
          subtitle: ElementSchema,
          button: ElementSchema,
        },
      ],
    },
    footer: {
      description: ElementSchema,
      copyright: ElementSchema,
      socialIcons: [{ icon: String, link: String }],
    },
  },
  { timestamps: true }
);

const ProductSchema = new Schema<IProduct>(
  {
    title: { type: String, required: true },
    price: { type: Number, required: true },
    discountPrice: { type: Number },
    description: { type: String },
    category: { type: String },
    images: [{ type: String, default: "" }],
    sizes: [{ type: String, default: "" }],
    colors: [{ type: String, default: "" }],
    stock: { type: Number, default: 0 },
    lowStockAlert: { type: Number, default: 5 },
    isNewArrival: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    reviews: { type: [ReviewSchema], default: () => [] },
  },
  { timestamps: true }
);

const UserSchema = new Schema<IUser>({
  uid: { type: String, required: true, unique: true },
  email: { type: String, required: true, lowercase: true },
  displayName: String,
  role: { type: String, enum: ["user", "admin"], default: "user" },
  phone: String,
  photoURL: String,
  lastLogin: Date,
  activity: { type: [UserActivitySchema], default: () => [] },
  cart: [CartItemSchema],
  cartEmailSent: { type: Boolean, default: false },
}, { timestamps: true });

const MediaSchema = new Schema<IMedia>({
  filename: { type: String, required: true },
  contentType: { type: String, required: true },
  data: { type: String, required: true }
}, { timestamps: true });

const DiscountCodeSchema = new Schema<IDiscountCode>({
  name: { type: String, required: true, unique: true, uppercase: true },
  percent: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  minOrderAmount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const ContactMessageSchema = new Schema<IContactMessage>({
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  reply: { type: String },
  status: { type: String, enum: ['pending', 'replied'], default: 'pending' }
}, { timestamps: true });

const NewsletterSubscriptionSchema = new Schema<INewsletterSubscription>({
  email: { type: String, required: true, unique: true, lowercase: true },
  subscribedAt: { type: Date, default: Date.now }
});

// ✅ Strongly typed models
const User: Model<IUser> = (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>("User", UserSchema);
const Product: Model<IProduct> = (mongoose.models.Product as Model<IProduct>) || mongoose.model<IProduct>("Product", ProductSchema);
const SiteConfig: Model<ISiteConfig> = (mongoose.models.SiteConfig as Model<ISiteConfig>) || mongoose.model<ISiteConfig>("SiteConfig", SiteConfigSchema);
const Order: Model<IOrder> = (mongoose.models.Order as Model<IOrder>) || mongoose.model<IOrder>("Order", OrderSchema);
const Media: Model<IMedia> = (mongoose.models.Media as Model<IMedia>) || mongoose.model<IMedia>("Media", MediaSchema);
const DiscountCode: Model<IDiscountCode> = (mongoose.models.DiscountCode as Model<IDiscountCode>) || mongoose.model<IDiscountCode>("DiscountCode", DiscountCodeSchema);
const ContactMessage: Model<IContactMessage> = (mongoose.models.ContactMessage as Model<IContactMessage>) || mongoose.model<IContactMessage>("ContactMessage", ContactMessageSchema);
const NewsletterSubscription: Model<INewsletterSubscription> = (mongoose.models.NewsletterSubscription as Model<INewsletterSubscription>) || mongoose.model<INewsletterSubscription>("NewsletterSubscription", NewsletterSubscriptionSchema);

// =========================================================
// --- 3. MEMORY STORAGE ENGINE FOR VERCEL ---
// =========================================================

const storage = multer.memoryStorage();
const upload = multer({ storage });

// =========================================================
// --- 4. AI STYLIST ENGINE ---
// =========================================================

app.post("/api/ai/stylist", async (req: Request, res: Response) => {
  try {
    const { message, history } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "AI Key Missing" });

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const response = await globalThis.fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: "You are a luxury stylist ambassador for DENFIT. Respond with authority and elegance." }],
          },
          ...(history || []).map((m: any) => ({
            role: m.role === "user" ? "user" : "model",
            parts: [{ text: m.text }],
          })),
          { role: "user", parts: [{ text: message }] },
        ],
        generationConfig: { temperature: 0.7, topP: 0.95, topK: 40, maxOutputTokens: 1024 }
      }),
    });
    const data: any = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Processing...";
    res.json({ text });
  } catch (error) {
    console.error("/api/ai/stylist error:", error);
    res.status(500).json({ error: "AI System Offline" });
  }
});

// =========================================================
// --- 5. AUTHENTICATION & IDENTITY ---
// =========================================================

app.post("/api/auth/sync", async (req: Request, res: Response) => {
  try {
    const { uid, email, displayName, photoURL, isNewUser } = req.body;
    if (!uid || !email) return res.status(400).json({ success: false });

    const role =
      email === "admin@roomy.com" || 
      email === "admin@rumi.com" || 
      email === "admin@luxeattire.com" || 
      email === process.env.ADMIN_EMAIL
        ? "admin"
        : "user";

    const user = await User.findOneAndUpdate(
      { uid },
      { email: email.toLowerCase(), displayName, photoURL, role, lastLogin: new Date() },
      { upsert: true, new: true }
    );

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    if (isNewUser) {
      const emailHtml = getSignupEmail(displayName || "Patron");
      await transporter.sendMail({
        from: `"DENFIT" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Welcome to the Inner Circle",
        html: emailHtml,
      });
    } else {
      const emailHtml = getLoginEmail(displayName || "Patron");
      await transporter.sendMail({
        from: `"DENFIT Security" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Sovereign Access Detected",
        html: emailHtml,
      });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error("/api/auth/sync error:", error);
    res.status(500).json({ success: false });
  }
});

// =========================================================
// --- 6. PRODUCT MANAGEMENT ---
// =========================================================

app.get("/api/products", async (req: Request, res: Response) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
});

app.post("/api/admin/products", async (req: Request, res: Response) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.json({ success: true, product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

app.delete("/api/admin/products/:id", async (req: Request, res: Response) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// =========================================================
// --- 7. ORDER SYSTEM (WITH RESILIENT EMAIL BLOCKS) ---
// =========================================================

app.post("/api/orders/create", async (req: Request, res: Response) => {
  try {
    const { items, totalAmount, shippingDetails, userId } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Missing or invalid items" });
    }

    // Secure the order in the database first
    const order = new Order({ userId, items, totalAmount, shippingDetails });
    await order.save();

    // Resilient Email execution: If Gmail SMTP fails, the order placement STILL succeeds!
    try {
      const emailHtml = getOrderEmail(
        shippingDetails?.firstName || "Patron",
        order._id.toString(),
        totalAmount.toString()
      );

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      });
      await transporter.sendMail({
        from: `"DENFIT" <${process.env.EMAIL_USER}>`,
        to: shippingDetails?.email,
        subject: "Acquisition Secured",
        html: emailHtml,
      });
    } catch (emailErr) {
      console.warn("⚠️ SMTP Relay Alert: Confirmation email failed to send, but order was secured safely in database.", emailErr);
    }

    res.json({ success: true, orderId: order._id });
  } catch (err) {
    console.error("Order creation fatal database failure:", err);
    res.status(500).json({ success: false });
  }
});

app.get("/api/admin/orders", async (req: Request, res: Response) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
});

app.put("/api/admin/orders/:id/status", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const order = await Order.findByIdAndUpdate(id, { status }, { new: true });
    if (!order) return res.status(404).json({ error: "Order not found" });

    res.json({ success: true, order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Update failed" });
  }
});

// =========================================================
// --- 8. ADMIN USER PROFILE ---
// =========================================================

app.get("/api/user/profile/:uid", async (req: Request, res: Response) => {
  try {
    const user = await User.findOne({ uid: req.params.uid });
    if (!user) return res.status(404).json({ error: "User profile not found." });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Profile retrieval failure." });
  }
});

app.post("/api/user/update-profile", async (req: Request, res: Response) => {
  try {
    const { uid, displayName, phone, photoURL } = req.body;
    const user = await User.findOneAndUpdate({ uid }, { displayName, phone, photoURL }, { new: true });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: "Profile update failure." });
  }
});

// =========================================================
// --- 9. ADMIN DASHBOARD, STATS & SYSTEM RESET ---
// =========================================================

app.get("/api/admin/customers", async (req: Request, res: Response) => {
  try {
    const customers = await User.find({ role: "user" }).sort({ createdAt: -1 });
    res.json(customers);
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
});

app.post("/api/admin/customers/log", async (req: Request, res: Response) => {
  try {
    const { email, action, details } = req.body;
    await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { $push: { activity: { action, details, timestamp: new Date() } } }
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// SYSTEM RESET API
app.delete("/api/admin/clear/:category", async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    if (category === 'dashboard' || category === 'stats') {
      await User.updateMany({}, { $set: { activity: [] } });
      await Order.deleteMany({});
    } else if (category === 'orders') {
      await Order.deleteMany({});
    } else if (category === 'customers') {
      await User.deleteMany({ role: { $ne: 'admin' } });
    } else if (category === 'inquiries') {
      await ContactMessage.deleteMany({});
    }
    res.json({ status: "success", message: `${category} cleared.` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Cleanup failure" });
  }
});

// REAL-TIME DASHBOARD STATS
app.get("/api/admin/stats", async (req: Request, res: Response) => {
  try {
    const revenueData = await Order.aggregate([{ $group: { _id: null, total: { $sum: "$totalAmount" } } }]);
    const totalOrders = await Order.countDocuments();
    const totalProducts = await Product.countDocuments();
    const activeOrders = await Order.countDocuments({ status: { $nin: ['Delivered', 'Cancelled'] } });
    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(10);
    const lowStock = await Product.find({ stock: { $lte: 10 } }).limit(20);

    res.json({
      revenue: revenueData[0]?.total || 0,
      orders: totalOrders,
      products: totalProducts,
      activeOrders,
      recentOrders,
      lowStock
    });
  } catch (error) {
    res.status(500).json({ error: "Stats failure." });
  }
});

// =========================================================
// --- 10. PERSISTENT UPLOADS & MEDIA ---
// =========================================================

app.post("/api/admin/upload", upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ success: false });
    
    const file = req.file;
    const media = new Media({
      filename: file.originalname,
      contentType: file.mimetype,
      data: file.buffer.toString("base64")
    });
    await media.save();

    res.json({ success: true, url: `/api/media/${media._id}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

app.get("/api/media/:id", async (req: Request, res: Response) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) return res.status(404).send("Not found");
    
    const imgBuffer = Buffer.from(media.data, 'base64');
    res.set('Content-Type', media.contentType);
    res.send(imgBuffer);
  } catch (error) {
    res.status(500).send("Error retrieving media");
  }
});

// =========================================================
// --- 11. SITE CONFIGURATION ---
// =========================================================

app.get("/api/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "OK", db: mongoose.connection.readyState });
});

app.get("/api/config", async (req: Request, res: Response) => {
  try {
    const config = await SiteConfig.findOne({ key: "global" });
    res.json(config || { header: { logoText: { text: "DENFIT", isVisible: true } } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Config Error" });
  }
});

app.post("/api/admin/config", async (req: Request, res: Response) => {
  try {
    const config = await SiteConfig.findOneAndUpdate(
      { key: "global" },
      req.body,
      { upsert: true, new: true }
    );
    res.json({ success: true, config });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// =========================================================
// --- 12. INQUIRIES & CONTACTS ---
// =========================================================

app.get("/api/admin/contacts", async (req: Request, res: Response) => {
  try {
    const contacts = await ContactMessage.find().sort({ createdAt: -1 });
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch contact messages" });
  }
});

app.post("/api/admin/contacts/reply", async (req: Request, res: Response) => {
  try {
    const { contactId, reply } = req.body;
    const contact = await ContactMessage.findById(contactId);
    if (!contact) return res.status(404).json({ error: "Message not found" });

    contact.reply = reply;
    contact.status = 'replied';
    await contact.save();

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to send reply" });
  }
});

// =========================================================
// --- 13. DISCOUNT MANAGEMENT ---
// =========================================================

app.get("/api/admin/discounts", async (req: Request, res: Response) => {
  try {
    const codes = await DiscountCode.find().sort({ createdAt: -1 });
    res.json(codes);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch discounts" });
  }
});

app.post("/api/admin/discounts", async (req: Request, res: Response) => {
  try {
    const { name, percent, discount: discountVal, startDate, endDate, minOrderAmount } = req.body;
    const finalPercent = percent !== undefined ? percent : discountVal;
    const codeName = name.trim().toUpperCase();

    const existing = await DiscountCode.findOne({ name: codeName });
    if (existing) return res.status(400).json({ error: "Code already exists" });

    const discount = new DiscountCode({
      name: codeName,
      percent: Number(finalPercent),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      minOrderAmount: Number(minOrderAmount || 0)
    });
    await discount.save();
    res.json({ success: true, code: discount });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/admin/discounts/:id", async (req: Request, res: Response) => {
  try {
    await DiscountCode.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete" });
  }
});

app.get("/api/discounts", async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const codes = await DiscountCode.find({ isActive: true, endDate: { $gte: now } });
    res.json(codes);
  } catch (error) {
    res.status(500).json({ error: "Failed" });
  }
});

// =========================================================
// --- 14. NEWSLETTER ---
// =========================================================

app.post("/api/newsletter/subscribe", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const existing = await NewsletterSubscription.findOne({ email });
    if (existing) return res.status(200).json({ success: true });

    const sub = new NewsletterSubscription({ email });
    await sub.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed" });
  }
});

app.get("/api/admin/newsletter", async (req: Request, res: Response) => {
  try {
    const subs = await NewsletterSubscription.find().sort({ subscribedAt: -1 });
    res.json(subs);
  } catch (error) {
    res.status(500).json({ error: "Failed" });
  }
});

// =========================================================
// --- 15. IDENTITY RECOVERY & DISPATCH ---
// =========================================================

const otpStore = new Map<string, string>();

app.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(email, code);

    const emailHtml = getOTPEmail(code);
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
    await transporter.sendMail({
      from: `"DENFIT" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Security Access Key",
      html: emailHtml,
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Mail Gateway Error" });
  }
});

app.post("/api/auth/verify-code", (req: Request, res: Response) => {
  const { email, code } = req.body;
  if (otpStore.get(email) === code) {
    otpStore.delete(email);
    res.json({ success: true });
  } else {
    res.status(400).json({ error: "Invalid Code" });
  }
});

app.post("/api/orchestrate/dispatch-email", async (req: Request, res: Response) => {
  try {
    const { email, displayName, actionType, orderId } = req.body;
    let html = "";

    if (actionType === "ABANDONED_CART") {
      html = getAbandonedCartEmail(displayName || "Patron");
    } else if (actionType === "SHIPPED") {
      html = getShippedEmail(displayName || "Patron", orderId || "N/A");
    } else if (actionType === "DELIVERED") {
      html = getDeliveredEmail(displayName || "Patron", orderId || "N/A");
    } else if (actionType === "WISHLIST") {
      html = getWishlistEmail(displayName || "Patron");
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
    await transporter.sendMail({
      from: `"DENFIT" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Editorial Update",
      html,
    });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Dispatch failed" });
  }
});

// --- VERCEL CRON JOBS FOR AUTOMATIC EMAILS ---
app.get("/api/cron/abandoned-cart", async (req: Request, res: Response) => {
  try {
    console.log("🧺 [CRON]: Processing scheduled cart checks...");
    const abandonedUsers = await User.find({ "cart.0": { $exists: true }, cartEmailSent: false });

    if (abandonedUsers.length > 0) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      });

      for (const user of abandonedUsers) {
        const html = getAbandonedCartEmail(user.displayName || "Patron");
        await transporter.sendMail({
          from: `"DENFIT" <${process.env.EMAIL_USER}>`,
          to: user.email,
          subject: "You Left Something Behind",
          html,
        });

        user.cartEmailSent = true;
        await user.save();
      }
    }
    res.json({ success: true, processed: abandonedUsers.length });
  } catch (error: any) {
    console.error("Cron Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// =========================================================
// --- 16. GLOBAL HANDLERS ---
// =========================================================

app.get("/", (req: Request, res: Response) => {
  res.status(200).send("DENFIT API ACTIVE");
});

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: `Path ${req.originalUrl} not found.` });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});

// --- DB CONNECTION ---
const MONGODB_URI = process.env.MONGODB_URI;
if (MONGODB_URI) {
  mongoose
    .connect(MONGODB_URI)
    .then(() => console.log("✅ DB Connected"))
    .catch((err) => console.error("❌ DB Failed", err));
}

// VERCEL EXPORT
export default app;
