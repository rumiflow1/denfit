import express, { Request, Response, NextFunction } from "express";
import mongoose, { Schema, Document, Model } from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import crypto from "crypto";
import admin from "firebase-admin";
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
  getStatusEmail,
} from "../src/utils/AtelierEmails.js";
import { sendTransactionalMail } from "../src/utils/mail.js";

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

interface IBranding { brandName?: string; name?: string; logoUrl?: string; supportEmail?: string; }

interface IReview {
  customerName?: string;
  email?: string;
  userId?: string;
  comment?: string;
  rating?: number;
  isManual?: boolean;
  source?: 'customer' | 'editorial';
  status?: 'pending' | 'approved' | 'rejected' | 'hidden';
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
  lastLoginEmailSentAt?: Date;
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
  branding?: IBranding;
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
    rating: { type: Number, min: 1, max: 5 },
    email: { type: String },
    userId: { type: String },
    isManual: { type: Boolean, default: false },
    source: { type: String, enum: ['customer', 'editorial'], default: 'customer' },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'hidden'], default: 'pending' },
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
    branding: { brandName: { type: String, default: process.env.BRAND_NAME || "DENFIT" }, name: { type: String, default: process.env.BRAND_NAME || "DENFIT" }, logoUrl: { type: String, default: process.env.BRAND_LOGO_URL || "" }, supportEmail: { type: String, default: process.env.SUPPORT_EMAIL || "" } },
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
  lastLoginEmailSentAt: Date,
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
const LocalOrderSchema = new Schema<any>({ userId:String, items:{type:[OrderItemSchema],default:()=>[]}, totalAmount:{type:Number,default:0}, status:{type:String,default:"Pending"}, shippingDetails:{ firstName:String,lastName:String,email:String,phone:String,address:{line1:String,line2:String,city:String,state:String,postalCode:String,country:String} }, currency:{type:String,default:"PKR"}, trackingNumber:String, statusHistory:{type:[{status:String,at:{type:Date,default:Date.now}}],default:()=>[]} },{timestamps:true});
const Order: Model<IOrder> = (mongoose.models.Order as Model<IOrder>) || mongoose.model<IOrder>("Order", LocalOrderSchema);
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

    const model = process.env.GEMINI_TEXT_MODEL || "gemini-2.5-flash";
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`;
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    const response = await globalThis.fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
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
    clearTimeout(timeout);
    const data: any = await response.json();
    if (!response.ok) throw new Error(data?.error?.message || "Stylist service unavailable");
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "I’m unable to respond right now. Please try again in a moment.";
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

    const existingUser = await User.findOne({ uid });
    const isActuallyNew = !existingUser;
    const user = await User.findOneAndUpdate(
      { uid },
      { email: email.toLowerCase(), displayName, photoURL, role, lastLogin: new Date() },
      { upsert: true, new: true }
    );

    const cooldownMs = 5 * 60 * 1000;
    const canSendLoginNotice = !user.lastLoginEmailSentAt || Date.now() - new Date(user.lastLoginEmailSentAt).getTime() > cooldownMs;
    if (isActuallyNew || (isNewUser && !existingUser)) {
      await sendTransactionalMail(email, `${process.env.BRAND_NAME || "DENFIT"} | Welcome`, getSignupEmail(displayName || "Customer"), `signup:${uid}`);
    } else if (canSendLoginNotice) {
      await sendTransactionalMail(email, `${process.env.BRAND_NAME || "DENFIT"} | Account sign-in`, getLoginEmail(displayName || "Customer"), `login:${uid}:${Math.floor(Date.now()/cooldownMs)}`);
      user.lastLoginEmailSentAt = new Date();
      await user.save();
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

app.get("/api/products/:id", async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (error) {
    res.status(400).json({ error: "Invalid product id" });
  }
});

app.put("/api/admin/products/:id", async (req: Request, res: Response) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, error: "Product could not be updated" });
  }
});

// =========================================================
// --- REVIEW MODERATION: CUSTOMER SUBMISSION + ADMIN QUEUE ---
// =========================================================

app.get("/api/products/:id/reviews", async (req: Request, res: Response) => {
  try {
    const product:any = await Product.findById(req.params.id).lean();
    if (!product) return res.status(404).json({ error: "Product not found" });
    const reviews = (product.reviews || []).filter((review:any) => review.status === "approved");
    res.json({ success: true, reviews });
  } catch (error) {
    res.status(500).json({ success: false, error: "Reviews unavailable" });
  }
});

app.post("/api/products/:id/reviews", async (req: Request, res: Response) => {
  try {
    const { customerName, email, userId, comment, rating } = req.body || {};
    const cleanName = String(customerName || "").trim();
    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanComment = String(comment || "").trim();
    const score = Number(rating);
    if (!cleanName || !cleanEmail || !cleanComment || !Number.isFinite(score) || score < 1 || score > 5) {
      return res.status(400).json({ success: false, error: "Name, email, rating and review text are required" });
    }
    const product:any = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, error: "Product not found" });
    const review = { _id: new mongoose.Types.ObjectId(), customerName: cleanName, email: cleanEmail, userId: String(userId || ""), comment: cleanComment, rating: score, isManual: false, source: "customer", status: "pending", createdAt: new Date() };
    product.reviews.push(review);
    await product.save();
    res.status(201).json({ success: true, review, message: "Review added" });
  } catch (error) {
    console.error("[reviews] submission failed", error);
    res.status(500).json({ success: false, error: "Review could not be submitted" });
  }
});

app.get("/api/admin/reviews", async (_req: Request, res: Response) => {
  try {
    const products:any[] = await Product.find({}, { title: 1, name: 1, reviews: 1 }).lean();
    const reviews = products.flatMap((product:any) => (product.reviews || []).map((review:any) => ({
      ...review,
      reviewId: String(review._id || ""),
      productId: String(product._id),
      productName: product.title || product.name || "Product"
    }))).sort((a:any,b:any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    res.json({ success: true, reviews });
  } catch (error) {
    res.status(500).json({ success: false, error: "Review queue unavailable" });
  }
});

app.post("/api/admin/products/:id/reviews", async (req: Request, res: Response) => {
  try {
    const { customerName, comment, rating } = req.body || {};
    const product:any = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, error: "Product not found" });
    const cleanName = String(customerName || "").trim();
    const cleanComment = String(comment || "").trim();
    const score = Number(rating);
    if (!cleanName || !cleanComment || !Number.isFinite(score) || score < 1 || score > 5) return res.status(400).json({ success:false, error:"Valid review details are required" });
    product.reviews.push({ customerName: cleanName, comment: cleanComment, rating: score, isManual: true, source: "editorial", status: "approved", createdAt: new Date() });
    await product.save();
    res.status(201).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success:false, error:"Editorial review could not be saved" });
  }
});

app.patch("/api/admin/reviews/:productId/:reviewId", async (req: Request, res: Response) => {
  try {
    const { status } = req.body || {};
    if (!["pending","approved","rejected","hidden"].includes(String(status))) return res.status(400).json({ success:false, error:"Invalid review status" });
    const product:any = await Product.findById(req.params.productId);
    if (!product) return res.status(404).json({ success:false, error:"Product not found" });
    const review:any = product.reviews.id(req.params.reviewId);
    if (!review) return res.status(404).json({ success:false, error:"Review not found" });
    review.status = status;
    await product.save();
    res.json({ success:true, review });
  } catch (error) {
    res.status(500).json({ success:false, error:"Review status could not be updated" });
  }
});

app.put("/api/admin/reviews/:productId/:reviewId", async (req: Request, res: Response) => {
  try {
    const product:any = await Product.findById(req.params.productId);
    if (!product) return res.status(404).json({ success:false, error:"Product not found" });
    const review:any = product.reviews.id(req.params.reviewId);
    if (!review) return res.status(404).json({ success:false, error:"Review not found" });
    const { customerName, comment, rating, status } = req.body || {};
    if (customerName !== undefined) review.customerName = String(customerName).trim();
    if (comment !== undefined) review.comment = String(comment).trim();
    if (rating !== undefined) { const score=Number(rating); if (!Number.isFinite(score)||score<1||score>5) return res.status(400).json({success:false,error:"Rating must be 1 to 5"}); review.rating=score; }
    if (status !== undefined && ["pending","approved","rejected","hidden"].includes(String(status))) review.status = status;
    await product.save();
    res.json({ success:true, review });
  } catch (error) { res.status(500).json({ success:false, error:"Review could not be updated" }); }
});

app.delete("/api/admin/reviews/:productId/:reviewId", async (req: Request, res: Response) => {
  try {
    const product:any = await Product.findById(req.params.productId);
    if (!product) return res.status(404).json({ success:false, error:"Product not found" });
    const review:any = product.reviews.id(req.params.reviewId);
    if (!review) return res.status(404).json({ success:false, error:"Review not found" });
    review.deleteOne();
    await product.save();
    res.json({ success:true });
  } catch (error) {
    res.status(500).json({ success:false, error:"Review could not be deleted" });
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

    const validStatuses = ["Pending", "Confirmed", "Packed", "On the Way", "Shipped", "Delivered", "Cancelled"];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: "Invalid status" });
    const existing:any = await Order.findById(id);
    if (!existing) return res.status(404).json({ error: "Order not found" });
    const changed = existing.status !== status;
    existing.status = status;
    if (!existing.trackingNumber && ["Packed","On the Way","Shipped"].includes(status)) existing.trackingNumber = `DNF-${crypto.randomInt(100000,999999)}`;
    existing.statusHistory = [...(existing.statusHistory || []), ...(changed ? [{ status, at:new Date() }] : [])];
    await existing.save();
    if (changed && existing.shippingDetails?.email) {
      try {
        const customer = existing.shippingDetails?.firstName || "Customer";
        const subject = `${process.env.BRAND_NAME || "DENFIT"} | Order ${status}`;
        await sendTransactionalMail(existing.shippingDetails.email, subject, getStatusEmail(customer, String(existing._id), status, existing.trackingNumber || "", existing.totalAmount, (existing as any).currency || "PKR"), `order-status:${existing._id}:${status}`);
      } catch (mailError) { console.warn("[order-status] email failed", mailError); }
    }
    res.json({ success: true, order: existing });
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
    res.json(config || { branding: { brandName: process.env.BRAND_NAME || "DENFIT", name: process.env.BRAND_NAME || "DENFIT", logoUrl: process.env.BRAND_LOGO_URL || "" }, header: { logoText: { text: process.env.BRAND_NAME || "DENFIT", isVisible: true } } });
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

app.post("/api/discounts/verify", async (req: Request, res: Response) => {
  try {
    const code = String(req.body?.code || "").trim().toUpperCase();
    const orderAmount = Number(req.body?.orderAmount || 0);
    if (!code) return res.status(400).json({ valid:false, error:"Discount code is required" });
    const now = new Date();
    const discount:any = await DiscountCode.findOne({ name: code, isActive: true, startDate: { $lte: now }, endDate: { $gte: now } });
    if (!discount) return res.status(404).json({ valid:false, error:"This discount is not currently valid" });
    if (orderAmount < Number(discount.minOrderAmount || 0)) return res.status(400).json({ valid:false, error:`Minimum order amount is ${discount.minOrderAmount}` });
    res.json({ valid:true, code:discount.name, percent:discount.percent, discount:discount.percent, minOrderAmount:discount.minOrderAmount, endDate:discount.endDate });
  } catch (error) {
    res.status(500).json({ valid:false, error:"Discount verification failed" });
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

const PasswordReset = (mongoose.models.PasswordReset as Model<any>) || mongoose.model("PasswordReset", new Schema({
  email: { type: String, required: true, lowercase: true, index: true },
  codeHash: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  verifiedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
}, { collection: "password_resets" }));

const normalizeEmail = (value:any) => String(value || "").trim().toLowerCase();
const hashResetCode = (email:string, code:string) => crypto.createHash("sha256").update(`${email}:${code}`).digest("hex");

function getFirebaseAdmin() {
  if (admin.apps.length) return admin.app();
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (raw) {
    const serviceAccount = JSON.parse(raw);
    return admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  }
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (projectId && clientEmail && privateKey) {
    return admin.initializeApp({ credential: admin.credential.cert({ projectId, clientEmail, privateKey }) });
  }
  throw new Error("Firebase Admin credentials are not configured");
}

app.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
  try {
    const email = normalizeEmail(req.body?.email);
    if (!email) return res.status(400).json({ success:false, error:"Email is required" });
    const code = crypto.randomInt(100000, 1000000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await PasswordReset.deleteMany({ email });
    await PasswordReset.create({ email, codeHash: hashResetCode(email, code), expiresAt });
    const emailHtml = getOTPEmail(code);
    await sendTransactionalMail(email, `${process.env.BRAND_NAME || "DENFIT"} | Password reset code`, emailHtml, `password-reset:${email}:${code}`);
    res.json({ success: true, expiresInMinutes: 10 });
  } catch (err) {
    console.error("[password-reset] request failed", err);
    res.status(500).json({ success:false, error:"Reset code could not be sent" });
  }
});

app.post("/api/auth/verify-code", async (req: Request, res: Response) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const code = String(req.body?.code || "").trim();
    if (!email || !/^[0-9]{6}$/.test(code)) return res.status(400).json({ success:false, error:"Invalid verification code" });
    const record:any = await PasswordReset.findOne({ email, expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 });
    if (!record || record.codeHash !== hashResetCode(email, code)) return res.status(400).json({ success:false, error:"Invalid or expired verification code" });
    record.verifiedAt = new Date();
    await record.save();
    res.json({ success:true });
  } catch (error) {
    console.error("[password-reset] verification failed", error);
    res.status(500).json({ success:false, error:"Verification could not be completed" });
  }
});

app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const code = String(req.body?.code || "").trim();
    const newPassword = String(req.body?.newPassword || "");
    if (!email || !/^[0-9]{6}$/.test(code) || newPassword.length < 8) return res.status(400).json({ success:false, error:"Use a valid code and a password of at least 8 characters" });
    const record:any = await PasswordReset.findOne({ email, expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 });
    if (!record || record.codeHash !== hashResetCode(email, code) || !record.verifiedAt) return res.status(400).json({ success:false, error:"Code verification is required before resetting the password" });
    try {
      getFirebaseAdmin();
    } catch (firebaseError:any) {
      return res.status(503).json({ success:false, error:"Firebase Admin is not configured in production", code:"FIREBASE_ADMIN_CONFIG_REQUIRED", detail: firebaseError?.message });
    }
    const firebaseUser = await admin.auth().getUserByEmail(email);
    await admin.auth().updateUser(firebaseUser.uid, { password: newPassword });
    await PasswordReset.deleteMany({ email });
    res.json({ success:true, message:"Password updated successfully" });
  } catch (error:any) {
    console.error("[password-reset] update failed", error);
    if (error?.code === "auth/user-not-found") return res.status(404).json({ success:false, error:"No Firebase account was found for this email" });
    res.status(500).json({ success:false, error:"Password could not be updated" });
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
// --- REAL VIRTUAL TRY-ON (FASHN TRY-ON MAX) ---
// =========================================================
app.post("/api/ai/try-on", async (req: Request, res: Response) => {
  try {
    const personImage = String(req.body?.personImage || "");
    const garmentImage = String(req.body?.garmentImage || "");
    const productName = String(req.body?.productName || "selected product");
    if (!personImage.startsWith("data:image/") || !garmentImage.startsWith("data:image/")) return res.status(400).json({ error:"A valid person photo and product image are required" });
    const apiKey = process.env.FASHN_API_KEY;
    if (!apiKey) return res.status(503).json({ error:"Virtual fitting service is not configured", code:"FASHN_API_KEY_REQUIRED" });
    const run = await globalThis.fetch("https://api.fashn.ai/v1/run", {
      method:"POST",
      headers:{ "Content-Type":"application/json", Authorization:`Bearer ${apiKey}` },
      body:JSON.stringify({ model_name: process.env.FASHN_TRYON_MODEL || "tryon-max", inputs:{ product_image:garmentImage, model_image:personImage, generation_mode:"balanced", resolution:"1k", num_images:1, output_format:"jpeg", return_base64:true, prompt:`Create a realistic virtual fitting of the customer wearing ${productName}. Preserve the person's identity, face, pose and proportions. Integrate the selected product naturally.` } })
    });
    const runData:any = await run.json();
    if (!run.ok || !runData?.id) return res.status(run.status || 502).json({ error:runData?.message || runData?.error || "Virtual fitting request was rejected" });
    const deadline = Date.now() + 55000;
    let latest:any;
    while (Date.now() < deadline) {
      await new Promise(resolve=>setTimeout(resolve, 1500));
      const statusResponse = await globalThis.fetch(`https://api.fashn.ai/v1/status/${encodeURIComponent(runData.id)}`, { headers:{ Authorization:`Bearer ${apiKey}` } });
      latest = await statusResponse.json();
      if (latest?.status === "completed") {
        const image = Array.isArray(latest.output) ? latest.output[0] : latest.output;
        if (image) return res.json({ success:true, image, provider:"fashn", requestId:runData.id });
        return res.status(502).json({ error:"Virtual fitting completed without an image" });
      }
      if (latest?.status === "failed") return res.status(502).json({ error:latest?.error?.message || latest?.error || "Virtual fitting generation failed" });
    }
    return res.status(504).json({ error:"Virtual fitting is still processing. Please try again." });
  } catch (error:any) {
    console.error("[try-on] failed", error);
    res.status(500).json({ error:"Virtual fitting could not be completed" });
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
