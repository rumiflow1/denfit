import express, { Request, Response, NextFunction } from "express";
import mongoose, { Schema, Document, Model } from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import path from "path";
import fs from "fs";
import multer from "multer";
import fetch from "node-fetch";

dotenv.config();

const app = express();

// =========================================================
// --- INLINE EMAIL TEMPLATES (replaces broken import) ---
// FIX #1: Removed import from ../src/utils/AtelierEmails.js
// That path does not exist in Vercel's serverless bundle.
// All email helpers are now defined inline below.
// =========================================================

function getSignupEmail(name: string): string {
  return `<div style="font-family:sans-serif;padding:32px;background:#0f0f0f;color:#fff">
    <h1 style="letter-spacing:4px">DENFIT</h1>
    <p>Welcome, ${name}. You have joined the inner circle.</p>
    <p style="color:#aaa;font-size:12px">This is an automated message from DENFIT.</p>
  </div>`;
}

function getLoginEmail(name: string): string {
  return `<div style="font-family:sans-serif;padding:32px;background:#0f0f0f;color:#fff">
    <h1 style="letter-spacing:4px">DENFIT</h1>
    <p>Sovereign access detected, ${name}. A new session has been initiated.</p>
    <p style="color:#aaa;font-size:12px">If this was not you, secure your account immediately.</p>
  </div>`;
}

function getOrderEmail(name: string, orderId: string, total: string): string {
  return `<div style="font-family:sans-serif;padding:32px;background:#0f0f0f;color:#fff">
    <h1 style="letter-spacing:4px">DENFIT</h1>
    <p>Acquisition secured, ${name}.</p>
    <p>Order ID: <strong>${orderId}</strong></p>
    <p>Total: <strong>PKR ${total}</strong></p>
    <p style="color:#aaa;font-size:12px">You will receive a shipping update soon.</p>
  </div>`;
}

function getAbandonedCartEmail(name: string): string {
  return `<div style="font-family:sans-serif;padding:32px;background:#0f0f0f;color:#fff">
    <h1 style="letter-spacing:4px">DENFIT</h1>
    <p>${name}, your selections await. Complete your acquisition before they are claimed.</p>
  </div>`;
}

function getOTPEmail(code: string): string {
  return `<div style="font-family:sans-serif;padding:32px;background:#0f0f0f;color:#fff">
    <h1 style="letter-spacing:4px">DENFIT</h1>
    <p>Your Security Access Key: <strong style="font-size:28px;letter-spacing:8px">${code}</strong></p>
    <p style="color:#aaa;font-size:12px">This code expires in 10 minutes.</p>
  </div>`;
}

function getWishlistEmail(name: string): string {
  return `<div style="font-family:sans-serif;padding:32px;background:#0f0f0f;color:#fff">
    <h1 style="letter-spacing:4px">DENFIT</h1>
    <p>${name}, items on your wishlist are moving fast. Secure them now.</p>
  </div>`;
}

function getShippedEmail(name: string, orderId: string): string {
  return `<div style="font-family:sans-serif;padding:32px;background:#0f0f0f;color:#fff">
    <h1 style="letter-spacing:4px">DENFIT</h1>
    <p>${name}, your order <strong>${orderId}</strong> has been dispatched.</p>
    <p style="color:#aaa;font-size:12px">Expect delivery within 3–5 business days.</p>
  </div>`;
}

function getDeliveredEmail(name: string, orderId: string): string {
  return `<div style="font-family:sans-serif;padding:32px;background:#0f0f0f;color:#fff">
    <h1 style="letter-spacing:4px">DENFIT</h1>
    <p>${name}, your order <strong>${orderId}</strong> has been delivered. Welcome to the collection.</p>
  </div>`;
}

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
 * FIX #2: Use /tmp/uploads — only /tmp is writable on Vercel
 */
const uploadDir = "/tmp/uploads";
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
    reviews: [ReviewSchema],
  },
  { timestamps: true }
);

const UserSchema = new Schema<IUser>(
  {
    uid: { type: String, required: true, unique: true },
    email: { type: String, required: true, lowercase: true },
    displayName: String,
    role: { type: String, enum: ["user", "admin"], default: "user" },
    phone: String,
    photoURL: String,
    lastLogin: Date,
    activity: [UserActivitySchema],
    cart: [CartItemSchema],
    cartEmailSent: { type: Boolean, default: false },
  } as any,
  { timestamps: true }
);

const OrderSchema = new Schema<IOrder>(
  {
    userId: { type: String, index: true },
    items: [OrderItemSchema],
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
  } as any,
  { timestamps: true }
);

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
// --- 3. DB CONNECTION (CACHED FOR SERVERLESS)
// FIX #3: Cached connection prevents new connections on every
// cold start, which caused hangs and timeouts on Vercel.
// =========================================================

let isConnected = false;

async function connectDB(): Promise<void> {
  if (isConnected && mongoose.connection.readyState === 1) return;
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ MONGODB_URI not set");
    return;
  }
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 10000,
    });
    isConnected = true;
    console.log("✅ DB Connected");
  } catch (err) {
    isConnected = false;
    console.error("❌ DB Failed", err);
    throw err;
  }
}

// DB middleware — runs before every request
app.use(async (req: Request, res: Response, next: NextFunction) => {
  try {
    await connectDB();
    next();
  } catch {
    res.status(503).json({ error: "Database unavailable" });
  }
});

// =========================================================
// --- 4. STORAGE ENGINE ---
// FIX #4: Destination changed to /tmp/uploads (writable on Vercel)
// =========================================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "/tmp/uploads");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// =========================================================
// --- 5. AI STYLIST ENGINE ---
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
            parts: [{ text: "You are a luxury stylist ambassador for DENFIT. Respond with authority and elegance." }],
          },
          ...(history || []).map((m: any) => ({
            role: m.role === "user" ? "user" : "model",
            parts: [{ text: m.text }],
          })),
          { role: "user", parts: [{ text: message }] },
        ],
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 1024,
        },
      }),
    });
    const data: any = await response.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "Processing...";

    res.json({ text });
  } catch (error) {
    console.error("/api/ai/stylist error:", error);
    res.status(500).json({ error: "AI System Offline" });
  }
});

// =========================================================
// --- 6. AUTHENTICATION & IDENTITY ---
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
      await transporter.sendMail({
        from: `"DENFIT" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Welcome to the Inner Circle",
        html: getSignupEmail(displayName || "Patron"),
      });
    } else {
      await transporter.sendMail({
        from: `"DENFIT Security" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Sovereign Access Detected",
        html: getLoginEmail(displayName || "Patron"),
      });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error("/api/auth/sync error:", error);
    res.status(500).json({ success: false });
  }
});

// =========================================================
// --- 7. PRODUCT MANAGEMENT ---
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

app.post("/api/products/add", async (req: Request, res: Response) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.json({ success: true, product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

app.delete("/api/products/:id", async (req: Request, res: Response) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// =========================================================
// --- 8. ORDER SYSTEM ---
// =========================================================

app.post("/api/orders/create", async (req: Request, res: Response) => {
  try {
    const { items, totalAmount, shippingDetails, userId } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Missing or invalid items" });
    }

    const order = new Order({ userId, items, totalAmount, shippingDetails });
    await order.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
    await transporter.sendMail({
      from: `"DENFIT" <${process.env.EMAIL_USER}>`,
      to: shippingDetails?.email,
      subject: "Acquisition Secured",
      html: getOrderEmail(
        shippingDetails?.firstName || "Patron",
        order._id.toString(),
        totalAmount.toString()
      ),
    });

    res.json({ success: true, orderId: order._id });
  } catch (err) {
    console.error(err);
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

app.patch("/api/orders/:id/status", async (req: Request, res: Response) => {
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
// --- 9. ADMIN & LOGS ---
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

app.post(
  "/api/admin/upload",
  upload.single("file"),
  (req: Request, res: Response) => {
    try {
      if (!req.file) return res.status(400).json({ success: false });
      res.json({ success: true, url: `/uploads/${req.file.filename}` });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false });
    }
  }
);

// =========================================================
// --- 10. SITE CONFIGURATION ---
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

app.post("/api/config/update", async (req: Request, res: Response) => {
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
// --- 11. IDENTITY RECOVERY ---
// =========================================================

const otpStore = new Map<string, string>();

app.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(email, code);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
    await transporter.sendMail({
      from: `"DENFIT" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Security Access Key",
      html: getOTPEmail(code),
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

// =========================================================
// --- 12. GLOBAL HANDLERS ---
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

// =========================================================
// --- 13. SERVER START
// FIX #5: process.env.VERCEL is the correct Vercel flag.
// The old guard (VERCEL_ENV !== "production") still ran
// app.listen() on preview deployments, crashing them.
// =========================================================

if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

// ✅ Default export for Vercel serverless
export default app;
