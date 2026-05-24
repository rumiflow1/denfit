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
 * STATIC DIRECTORY CONFIGURATION
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
  cart: any[];
  cartEmailSent: boolean;
}

interface IOrderItem {
  [key: string]: any;
}

export interface IOrder extends Document {
  userId?: string;
  items: IOrderItem[];
  totalAmount: number;
  status: string;
  shippingDetails?: {
    firstName?: string;
    email?: string;
    [key: string]: any;
  };
}

export interface ISiteConfig extends Document {
  key: string;
  announcementBar?: any;
  header?: any;
  hero?: any;
  footer?: any;
}

// =========================================================
// --- 2. DATABASE MODELS ---
// =========================================================

const ElementSchema = {
  text: { type: String, default: "" },
  color: { type: String, default: "#0F0F0F" },
  fontSize: { type: String, default: "14px" },
  fontFamily: { type: String, default: "Inter" },
  link: String,
  bgColor: String,
  isVisible: { type: Boolean, default: true },
};

const SiteConfigSchema = new Schema<ISiteConfig>(
  {
    key: { type: String, default: "global", unique: true },
    announcementBar: {
      mainText: ElementSchema,
      socialIcons: [{ icon: String, link: String }],
    },
    header: {
      logoText: ElementSchema,
      menuItems: [{ label: ElementSchema, collectionId: String }],
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
    },
  },
  { timestamps: true }
);

const ProductSchema = new Schema<IProduct>(
  {
    title: { type: String, required: true },
    price: { type: Number, required: true },
    discountPrice: Number,
    description: String,
    category: String,
    images: [String],
    sizes: [String],
    colors: [String],
    stock: { type: Number, default: 0 },
    lowStockAlert: { type: Number, default: 5 },
    isNewArrival: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    reviews: [
      {
        customerName: String,
        comment: String,
        rating: Number,
        isManual: { type: Boolean, default: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// ✅ Fix TS2322: Use Schema.Types.Mixed instead of type: Array
const UserSchema = new Schema<IUser>(
  {
    uid: { type: String, required: true, unique: true },
    email: { type: String, required: true, lowercase: true },
    displayName: String,
    role: { type: String, enum: ["user", "admin"], default: "user" },
    phone: String,
    photoURL: String,
    lastLogin: Date,
    activity: [
      {
        action: String,
        details: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
    cart: { type: [Schema.Types.Mixed], default: [] },
    cartEmailSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ✅ Fix TS2322: Use Schema.Types.Mixed instead of type: Array
const OrderSchema = new Schema<IOrder>(
  {
    userId: String,
    items: { type: [Schema.Types.Mixed], default: [] },
    totalAmount: { type: Number, required: true },
    status: { type: String, default: "Pending" },
    shippingDetails: Object,
  },
  { timestamps: true }
);

// Explicitly type models to avoid any remaining Mongoose+TS type issues
const User: Model<IUser> =
  (mongoose.models.User as Model<IUser>) ||
  mongoose.model<IUser>("User", UserSchema);

const Product: Model<IProduct> =
  (mongoose.models.Product as Model<IProduct>) ||
  mongoose.model<IProduct>("Product", ProductSchema);

const SiteConfig: Model<ISiteConfig> =
  (mongoose.models.SiteConfig as Model<ISiteConfig>) ||
  mongoose.model<ISiteConfig>("SiteConfig", SiteConfigSchema);

const Order: Model<IOrder> =
  (mongoose.models.Order as Model<IOrder>) ||
  mongoose.model<IOrder>("Order", OrderSchema);

// =========================================================
// --- 3. STORAGE ENGINE ---
// =========================================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "/tmp");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
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
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: "You are a luxury stylist ambassador." }],
          },
          ...(history || []).map((m: any) => ({
            role: m.role === "user" ? "user" : "model",
            parts: [{ text: m.text }],
          })),
          { role: "user", parts: [{ text: message }] },
        ],
      }),
    });
    const data: any = await response.json();
    res.json({
      text:
        data?.candidates?.[0]?.content?.parts?.[0]?.text || "Processing...",
    });
  } catch (error) {
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
      email === "admin@com" || email === process.env.ADMIN_EMAIL
        ? "admin"
        : "user";

    const user = await User.findOneAndUpdate(
      { uid },
      {
        email: email.toLowerCase(),
        displayName,
        photoURL,
        role,
        lastLogin: new Date(),
      },
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
    res.status(500).json([]);
  }
});

app.post("/api/products/add", async (req: Request, res: Response) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

app.delete("/api/products/:id", async (req: Request, res: Response) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// =========================================================
// --- 7. ORDER SYSTEM ---
// =========================================================

app.post("/api/orders/create", async (req: Request, res: Response) => {
  try {
    const order = new Order(req.body);
    await order.save();

    const emailHtml = getOrderEmail(
      order.shippingDetails?.firstName || "Patron",
      order._id.toString(),
      order.totalAmount.toString()
    );

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
    await transporter.sendMail({
      from: `"DENFIT" <${process.env.EMAIL_USER}>`,
      to: order.shippingDetails?.email,
      subject: "Acquisition Secured",
      html: emailHtml,
    });

    res.json({ success: true, orderId: order._id });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

app.get("/api/admin/orders", async (req: Request, res: Response) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json([]);
  }
});

// =========================================================
// --- 8. ADMIN & LOGS ---
// =========================================================

app.get("/api/admin/customers", async (req: Request, res: Response) => {
  try {
    const customers = await User.find({ role: "user" }).sort({
      createdAt: -1,
    });
    res.json(customers);
  } catch (err) {
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
    res.status(500).json({ success: false });
  }
});

app.post(
  "/api/admin/upload",
  upload.single("file"),
  (req: Request, res: Response) => {
    try {
      if (!req.file) return res.status(400).json({ success: false });
      res.json({ success: true, url: `/uploads/${req.file.filename}` });
    } catch (err) {
      res.status(500).json({ success: false });
    }
  }
);

// =========================================================
// --- 9. SITE CONFIGURATION ---
// =========================================================

app.get("/api/config", async (req: Request, res: Response) => {
  try {
    const config = await SiteConfig.findOne({ key: "global" });
    res.json(config || { header: { logoText: { text: "DENFIT" } } });
  } catch (err) {
    res.status(500).json({ error: "Config Error" });
  }
});

app.post("/api/config/update", async (req: Request, res: Response) => {
  try {
    const config = await SiteConfig.findOneAndUpdate(
      { key: "global" },
      req.body,
      { upsert: true, new: true }
    );
    res.json({ success: true, config });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// =========================================================
// --- 10. IDENTITY RECOVERY ---
// =========================================================

const otpStore = new Map<string, string>();

app.post(
  "/api/auth/forgot-password",
  async (req: Request, res: Response) => {
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
      res.status(500).json({ error: "Mail Gateway Error" });
    }
  }
);

app.post("/api/auth/verify-code", (req: Request, res: Response) => {
  const { email, code } = req.body;
  if (otpStore.get(email) === code) {
    otpStore.delete(email);
    res.json({ success: true });
  } else {
    res.status(400).json({ error: "Invalid Code" });
  }
});

// --- DISPATCH OTHER EMAILS ---
app.post(
  "/api/orchestrate/dispatch-email",
  async (req: Request, res: Response) => {
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
      res.status(500).json({ error: "Dispatch failed" });
    }
  }
);

// =========================================================
// --- 11. GLOBAL HANDLERS ---
// =========================================================

app.get("/", (req: Request, res: Response) => {
  res.status(200).send("DENFIT API ACTIVE");
});

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: `Path ${req.originalUrl} not found.` });
});

app.use(
  (err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
);

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
