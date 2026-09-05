import mongoose, { Schema, Model } from "mongoose";
import { BRAND } from "../src/config/brand.js";

const Activity = (mongoose.models.Activity as Model<any>) || mongoose.model("Activity", new Schema({ email: String, action: String, details: Schema.Types.Mixed, timestamp: { type: Date, default: Date.now } }, { timestamps: true }));
const PasswordReset = (mongoose.models.PasswordReset as Model<any>) || mongoose.model("PasswordReset", new Schema({ email: { type: String, required: true, lowercase: true, index: true }, codeHash: { type: String, required: true }, verified: { type: Boolean, default: false }, expiresAt: { type: Date, required: true, index: true } }, { timestamps: true }));

const getModel = <T = any>(name: string) => mongoose.models[name] as Model<T> | undefined;
const reply = (res: any, status: number, body: any) => { res.status(status).json(body); return true; };
const hash = async (value: string) => Buffer.from(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))).toString("hex");

async function sendMail(to: string, subject: string, html: string) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) throw new Error("Email service is not configured");
  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.default.createTransport({ service: "gmail", auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS } });
  await transporter.sendMail({ from: `"${BRAND.name}" <${process.env.EMAIL_USER}>`, to, subject, html });
}

async function generateAI(apiKey: string, model: string, body: any) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 9000);
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`, { method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal, body: JSON.stringify(body) });
    const data: any = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(`Gemini ${model}: ${r.status}`);
    return data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || "").join("").trim() || "";
  } finally { clearTimeout(timer); }
}

async function getFirebaseAdmin() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (raw) {
    const admin = await import("firebase-admin");
    if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(JSON.parse(raw)) });
    return admin;
  }
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (projectId && clientEmail && privateKey) {
    const admin = await import("firebase-admin");
    if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert({ projectId, clientEmail, privateKey }) });
    return admin;
  }
  throw new Error("Password recovery service is not configured");
}

export async function handleRepair(req: any, res: any): Promise<boolean> {
  const url = (req.url || "").split("?")[0];

  if (req.method === "POST" && url === "/api/ai/stylist") {
    const apiKey = process.env.GEMINI_API_KEY;
    const message = String(req.body?.message || "").trim();
    if (!apiKey) return reply(res, 503, { success: false, error: "AI service is not configured" });
    if (!message) return reply(res, 400, { success: false, error: "Message is required" });

    // The browser sends the current live catalog/config snapshot. This keeps the assistant
    // synchronized with admin product/config changes without retraining or hardcoded catalog data.
    const rawProducts = Array.isArray(req.body?.products) ? req.body.products : [];
    const products = rawProducts.slice(0, 80).map((p: any) => ({
      id: String(p?.id || p?._id || ""),
      name: String(p?.name || p?.title || ""),
      price: Number(p?.price || 0),
      image: String(p?.image || p?.images?.[0] || ""),
      category: String(p?.category || ""),
      collectionName: String(p?.collectionName || ""),
      description: String(p?.description || "").slice(0, 500),
      colors: Array.isArray(p?.colors) ? p.colors.slice(0, 12) : [],
      sizes: Array.isArray(p?.sizes) ? p.sizes.slice(0, 12) : [],
      stock: Number(p?.stock ?? 0),
      isNewArrival: Boolean(p?.isNewArrival),
      isFeatured: Boolean(p?.isFeatured)
    }));
    const site = req.body?.siteConfig || {};
    const socials = Array.isArray(site?.footer?.socials) ? site.footer.socials : [];
    const navLinks = Array.isArray(site?.header?.navLinks) ? site.header.navLinks : [];
    const history = Array.isArray(req.body?.history) ? req.body.history.slice(-6) : [];
    const catalogText = JSON.stringify({ products, navLinks, socials, pages: site?.pages || {}, footer: { phone: site?.footer?.phone || "", email: site?.footer?.email || "" } });
    const system = `You are the transparent AI shopping assistant for ${BRAND.name}. Answer ONLY from the LIVE CATALOG and LIVE SITE DATA supplied below. Never invent a product, price, color, stock level, policy, social account, phone number, or feature. If the requested item is not present, clearly say it is not currently available and suggest the closest LIVE match only when one exists. Keep answers concise and useful for a customer. Prices must use the live product price and say PKR when the catalog has no other currency field. If the user asks for a specific live product, include exactly one navigation token [NAV:PRODUCT:<product id>] using its id. For internal pages use [NAV:HOME], [NAV:PRODUCTS], [NAV:CART], [NAV:LOGIN], [NAV:PROFILE], [NAV:CONTACT], or [NAV:FAQ]. For an external social link use [EXT:WHATSAPP:<url>], [EXT:TIKTOK:<url>], [EXT:INSTAGRAM:<url>] or [EXT:<PLATFORM>:<url>] using ONLY a URL supplied in the live site data. Do not output any other fake URLs or navigation tokens. LIVE SITE DATA: ${catalogText}`;
    const contents = [...history.map((m: any) => ({ role: m.role === "model" ? "model" : "user", parts: [{ text: String(m.text || m.content || "") }] })), { role: "user", parts: [{ text: message }] }];
    const base = { systemInstruction: { parts: [{ text: system }] }, contents, generationConfig: { maxOutputTokens: 320 } };
    let last: any = null;
    for (const model of ["gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.6-flash", "gemini-3.5-flash", "gemini-2.5-flash"]) {
      try { const text = await generateAI(apiKey, model, base); if (text) { await Activity.create({ email: "ai-assistant", action: "ai_query", details: { message: message.slice(0, 500), productCount: products.length, model } }); return reply(res, 200, { success: true, text, model }); } }
      catch (error) { last = error; console.warn(`[ai] ${model} unavailable`, error); }
    }
    console.error("[ai] all models failed", last);
    return reply(res, 503, { success: false, error: "AI service is temporarily unavailable. Please try again." });
  }

  if (req.method === "GET" && /^\/api\/products\/[^/]+$/.test(url)) {
    try {
      const id = url.split("/").pop() || "";
      if (!mongoose.isValidObjectId(id)) return reply(res, 400, { success: false, error: "Invalid product id" });
      const Product = getModel("Product");
      if (!Product) return reply(res, 503, { success: false, error: "Product service unavailable" });
      const product = await Product.findById(id).lean();
      return product ? reply(res, 200, product) : reply(res, 404, { success: false, error: "Product not found" });
    } catch (error) { console.error("[product-detail]", error); return reply(res, 500, { success: false, error: "Unable to load product" }); }
  }

  if (req.method === "POST" && url === "/api/discounts/verify") {
    try {
      const codeValue = String(req.body?.code || req.body?.name || req.query?.code || "").trim().toUpperCase();
      const orderAmount = Number(req.body?.orderAmount ?? req.body?.subtotal ?? req.body?.total ?? 0);
      if (!codeValue) return reply(res, 400, { success: false, valid: false, error: "Discount code is required" });
      const DiscountCode = getModel("DiscountCode");
      if (!DiscountCode) return reply(res, 503, { success: false, valid: false, error: "Discount service unavailable" });
      const code = await DiscountCode.findOne({ name: codeValue }).lean();
      if (!code) return reply(res, 200, { success: false, valid: false, error: "Invalid discount code" });
      const now = Date.now();
      const start = new Date(code.startDate).getTime();
      const end = new Date(code.endDate).getTime();
      if (code.isActive === false || !Number.isFinite(start) || !Number.isFinite(end) || now < start || now > end) return reply(res, 200, { success: false, valid: false, error: "This discount is not currently active" });
      const minimum = Number(code.minOrderAmount || 0);
      if (minimum > 0 && orderAmount < minimum) return reply(res, 200, { success: false, valid: false, error: `Minimum order amount is ${minimum}` });
      const percent = Math.max(0, Math.min(100, Number(code.percent || 0)));
      if (!percent) return reply(res, 200, { success: false, valid: false, error: "This discount has no valid percentage" });
      return reply(res, 200, { success: true, valid: true, code: code.name, percent, discount: percent, minOrderAmount: minimum, startDate: code.startDate, endDate: code.endDate });
    } catch (error) { console.error("[discount-verify]", error); return reply(res, 500, { success: false, valid: false, error: "Unable to verify discount" }); }
  }

  if (req.method === "POST" && url === "/api/admin/customers/log") {
    try {
      const { userId, email, action, details, timestamp } = req.body || {};
      const normalizedEmail = String(email || "").trim().toLowerCase();
      if (!normalizedEmail && !userId) return reply(res, 400, { success: false, error: "User identity required" });
      const entry = { action: String(action || "activity"), details: typeof details === "string" ? details : JSON.stringify(details ?? {}), timestamp: timestamp ? new Date(timestamp) : new Date() };
      const User = getModel("User");
      if (User) await User.findOneAndUpdate(userId ? { uid: userId } : { email: normalizedEmail }, { $push: { activity: entry } });
      await Activity.create({ email: normalizedEmail, ...entry });
      return reply(res, 200, { success: true });
    } catch (error) { console.error("[activity-log]", error); return reply(res, 500, { success: false, error: "Activity logging failed" }); }
  }

  if (req.method === "GET" && url === "/api/admin/customers") {
    try {
      const User = getModel("User");
      const users = User ? await User.find({ role: "user" }).sort({ createdAt: -1 }).lean() : [];
      const logs = await Activity.find().sort({ timestamp: -1 }).limit(250).lean();
      return reply(res, 200, { users, logs });
    } catch (error) { console.error("[activity-fetch]", error); return reply(res, 500, { users: [], logs: [] }); }
  }

  if (req.method === "POST" && url === "/api/auth/forgot-password") {
    try {
      const email = String(req.body?.email || "").trim().toLowerCase();
      if (!email) return reply(res, 400, { success: false, error: "Email is required" });
      const code = String(Math.floor(100000 + Math.random() * 900000));
      await PasswordReset.deleteMany({ email });
      await PasswordReset.create({ email, codeHash: await hash(code), verified: false, expiresAt: new Date(Date.now() + 600000) });
      const { getOTPEmail } = await import("../src/utils/AtelierEmails.js");
      await sendMail(email, `${BRAND.name} | Secure Access Key`, getOTPEmail(code));
      return reply(res, 200, { success: true });
    } catch (error) { console.error("[forgot-password]", error); return reply(res, 500, { success: false, error: "Unable to send recovery code" }); }
  }

  if (req.method === "POST" && url === "/api/auth/verify-code") {
    try {
      const email = String(req.body?.email || "").trim().toLowerCase();
      const code = String(req.body?.code || "").trim();
      const record = await PasswordReset.findOne({ email }).sort({ createdAt: -1 });
      if (!record || record.expiresAt.getTime() < Date.now() || await hash(code) !== record.codeHash) return reply(res, 400, { success: false, error: "Invalid or expired code" });
      record.verified = true;
      await record.save();
      return reply(res, 200, { success: true, verified: true });
    } catch (error) { console.error("[verify-code]", error); return reply(res, 400, { success: false, error: "Invalid or expired code" }); }
  }

  if (req.method === "POST" && url === "/api/auth/reset-password") {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const code = String(req.body?.code || "").trim();
    const newPassword = String(req.body?.newPassword || "");
    try {
      if (newPassword.length < 6) return reply(res, 400, { success: false, error: "Password must contain at least 6 characters" });
      const record = await PasswordReset.findOne({ email, verified: true }).sort({ createdAt: -1 });
      if (!record || record.expiresAt.getTime() < Date.now() || await hash(code) !== record.codeHash) return reply(res, 400, { success: false, error: "Recovery session expired. Request a new code." });
      const admin = await getFirebaseAdmin();
      const account = await admin.auth().getUserByEmail(email);
      await admin.auth().updateUser(account.uid, { password: newPassword });
      await PasswordReset.deleteMany({ email });
      await Activity.create({ email, action: "password_reset", details: "Password updated" });
      return reply(res, 200, { success: true });
    } catch (error: any) {
      console.error("[reset-password]", error);
      const message = String(error?.message || "");
      if (message.includes("Password recovery service is not configured")) return reply(res, 503, { success: false, error: "Password recovery service is not configured" });
      if (message.includes("auth/user-not-found")) return reply(res, 404, { success: false, error: "No account exists for this email." });
      return reply(res, 500, { success: false, error: "Password could not be updated. Please try again." });
    }
  }

  if (req.method === "POST" && url === "/api/cart/abandoned") {
    try {
      const { email, displayName, total, cartItems } = req.body || {};
      if (email) {
        const { getAbandonedCartEmail } = await import("../src/utils/AtelierEmails.js");
        const normalizedEmail = String(email).trim().toLowerCase();
        const liveProducts = Array.isArray(cartItems) ? cartItems.filter((item: any) => item?.productId || item?.id).slice(0, 4) : [];
        await sendMail(normalizedEmail, `${BRAND.name} | Your Selection Awaits`, getAbandonedCartEmail(displayName || "Patron", liveProducts));
        await Activity.create({ email: normalizedEmail, action: "abandoned_cart", details: JSON.stringify({ total, itemCount: Array.isArray(cartItems) ? cartItems.length : 0 }) });
      }
      return reply(res, 200, { success: true });
    } catch (error) { console.error("[abandoned-cart]", error); return reply(res, 200, { success: true }); }
  }

  return false;
}
