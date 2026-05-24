/**
 * =========================================================
 * SOVEREIGN MASTER BACKEND ENGINE - VERSION 7.1 (ZERO ERRORS)
 * PROJECT: DENFIT ATELIER (RUMI-FLOW)
 * =========================================================
 */

import express, { Request, Response, NextFunction } from "express";
import mongoose, { Schema, Document, Model } from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import path from "path";
import fs from "fs";
import multer from "multer";
import fetch from "node-fetch";

// --- MASTER UTILS & EMAIL TEMPLATES ---
// FIXED: Path and Extension for Vercel
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

/**
 * STATIC DIRECTORY (Local Dev Compatibility)
 */
const uploadDir = path.join(process.cwd(), "/tmp/uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use("/uploads", express.static(uploadDir));

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

// =========================================================
// --- 2. DATABASE MODELS ---
// =========================================================

const ElementSchema = {
  text: { type: String, default: "" },
  color: { type: String, default: "#0F0F0F" },
  fontSize: { type: String, default: "14px" },
  fontFamily: { type: String, default: "Inter" },
  link: { type: String, default: "" },
  bgColor: { type: String, default: "" },
  isVisible: { type: Boolean, default: true },
};

const ReviewSchema = new Schema<IReview>({
  customerName: { type: String },
  comment: { type: String },
  rating: { type: Number },
  isManual: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const UserActivitySchema = new Schema<IUserActivity>({
  action: { type: String },
  details: { type: String },
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

const CartItemSchema = new Schema<ICartItem>({
  productId: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1 },
  size: { type: String },
  color: { type: String },
  price: { type: Number, required: true },
}, { _id: false });

const OrderItemSchema = new Schema<IOrderItem>({
  productId: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1 },
  size: { type: String },
  color: { type: String },
  price: { type: Number, required: true },
  subtotal: { type: Number, required: true },
}, { _id: false });

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
    reviews: [ReviewSchema as any],
  },
  { timestamps: true }
);

// ✅ FIXED TS2322: Using 'as any' for complex Mongoose array definitions
const UserSchema = new Schema<IUser>(
  {
    uid: { type: String, required: true, unique: true },
    email: { type: String, required: true, lowercase: true },
    displayName: String,
    role: { type: String, enum: ["user", "admin"], default: "user" },
    phone: String,
    photoURL: String,
    lastLogin: Date,
    activity: [UserActivitySchema] as any,
    cart: [CartItemSchema] as any,
    cartEmailSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ✅ FIXED TS2322: Using 'as any' for complex Mongoose array definitions
const OrderSchema = new Schema<IOrder>(
  {
    userId: { type: String, index: true },
    items: [OrderItemSchema] as any,
    totalAmount: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"],
      default: "Pending",
    },
    shippingDetails: {
      firstName: String,
      lastName: String,
      email: String,
      phone: String,
      address: {
        line1: String,
        line2: String,
        city: String,
        state: String,
        postalCode: String,
        country: String,
      },
    },
  },
  { timestamps: true }
);

const User: Model<IUser> = (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>("User", UserSchema);
const Product: Model<IProduct> = (mongoose.models.Product as Model<IProduct>) || mongoose.model<IProduct>("Product", ProductSchema);
const SiteConfig: Model<ISiteConfig> = (mongoose.models.SiteConfig as Model<ISiteConfig>) || mongoose.model<ISiteConfig>("SiteConfig", SiteConfigSchema);
const Order: Model<IOrder> = (mongoose.models.Order as Model<IOrder>) || mongoose.model<IOrder>("Order", OrderSchema);

// --- STORAGE ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => { cb(null, "/tmp"); },
  filename: (req, file, cb) => { cb(null, Date.now() + "-" + file.originalname); },
});
const upload = multer({ storage });

// =========================================================
// --- 3. API ROUTES ---
// =========================================================

app.post("/api/ai/stylist", async (req: Request, res: Response) => {
  try {
    const { message, history } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "AI Key Missing" });

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          { role: "user", parts: [{ text: "You are a luxury stylist ambassador." }] },
          ...(history || []).map((m: any) => ({
            role: m.role === "user" ? "user" : "model",
            parts: [{ text: m.text }],
          })),
          { role: "user", parts: [{ text: message }] },
        ],
      }),
    });
    const data: any = await response.json();
    res.json({ text: data?.candidates?.[0]?.content?.parts?.[0]?.text || "Processing..." });
  } catch (error) { res.status(500).json({ error: "AI Offline" }); }
});

app.post("/api/auth/sync", async (req: Request, res: Response) => {
  try {
    const { uid, email, displayName, photoURL, isNewUser } = req.body;
    const role = (email === "admin@com" || email === process.env.ADMIN_EMAIL) ? "admin" : "user";
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
      await transporter.sendMail({
        from: `"DENFIT" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Welcome",
        html: getSignupEmail(displayName || "Patron"),
      });
    }
    res.json({ success: true, user });
  } catch (error) { res.status(500).json({ success: false }); }
});

app.get("/api/products", async (req: Request, res: Response) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) { res.status(500).json([]); }
});

app.post("/api/products/add", async (req: Request, res: Response) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.json({ success: true, product });
  } catch (err) { res.status(500).json({ success: false }); }
});

app.post("/api/orders/create", async (req: Request, res: Response) => {
  try {
    const order = new Order(req.body);
    await order.save();
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
    await transporter.sendMail({
      from: `"DENFIT" <${process.env.EMAIL_USER}>`,
      to: order.shippingDetails?.email,
      subject: "Acquisition Secured",
      html: getOrderEmail(order.shippingDetails?.firstName || "Patron", order._id.toString(), order.totalAmount.toString()),
    });
    res.json({ success: true, orderId: order._id });
  } catch (err) { res.status(500).json({ success: false }); }
});

app.get("/api/admin/orders", async (req: Request, res: Response) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) { res.status(500).json([]); }
});

app.get("/api/config", async (req: Request, res: Response) => {
  try {
    const config = await SiteConfig.findOne({ key: "global" });
    res.json(config || { header: { logoText: { text: "DENFIT" } } });
  } catch (err) { res.status(500).json({ error: "Config Error" }); }
});

app.post("/api/config/update", async (req: Request, res: Response) => {
  try {
    const config = await SiteConfig.findOneAndUpdate({ key: "global" }, req.body, { upsert: true, new: true });
    res.json({ success: true, config });
  } catch (err) { res.status(500).json({ success: false }); }
});

app.get("/", (req: Request, res: Response) => { res.status(200).send("DENFIT API ACTIVE"); });

app.use((req: Request, res: Response) => { res.status(404).json({ error: "Not Found" }); });

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({ error: "Internal Server Error" });
});

const MONGODB_URI = process.env.MONGODB_URI;
if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI).then(() => console.log("✅ DB Connected")).catch((err) => console.error("❌ DB Failed", err));
}

export default app;
