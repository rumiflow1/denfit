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
  const timer = setTimeout(() => controller.abort(), 5500);
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

const normalizeProducts = (items: any[]) => items.filter(Boolean).map((p: any) => ({ id: String(p?.id || p?._id || ""), name: String(p?.name || p?.title || ""), price: Number(p?.price || 0), currency: String(p?.currency || "PKR"), image: String(p?.image || p?.images?.[0] || ""), images: Array.isArray(p?.images) ? p.images.slice(0, 4) : [], category: String(p?.category || ""), description: String(p?.description || "").slice(0, 500), colors: Array.isArray(p?.colors) ? p.colors.slice(0, 12) : [], sizes: Array.isArray(p?.sizes) ? p.sizes.slice(0, 12) : [], stock: Number(p?.stock ?? 0), isNewArrival: Boolean(p?.isNewArrival), isFeatured: Boolean(p?.isFeatured) }));

const getLiveStoreSnapshot = async () => {
  const Product = getModel("Product");
  const SiteConfig = getModel("SiteConfig");
  const [productRows, config] = await Promise.all([
    Product ? Product.find({}).sort({ isFeatured: -1, isNewArrival: -1, createdAt: -1 }).limit(80).lean() : [],
    SiteConfig ? SiteConfig.findOne({ key: "global" }).lean() : null
  ]);
  const socials = [
    ...(Array.isArray((config as any)?.footer?.socials) ? (config as any).footer.socials : []),
    ...(Array.isArray((config as any)?.footer?.socialIcons) ? (config as any).footer.socialIcons : []),
    ...(Array.isArray((config as any)?.announcementBar?.socials) ? (config as any).announcementBar.socials : []),
    ...(Array.isArray((config as any)?.announcementBar?.socialIcons) ? (config as any).announcementBar.socialIcons : [])
  ].filter((s: any) => s?.url || s?.link).map((s: any) => ({ platform: String(s.platform || s.icon || ""), url: String(s.url || s.link || "") }));
  return { products: normalizeProducts(Array.isArray(productRows) ? productRows : []), navLinks: (config as any)?.header?.navLinks || (config as any)?.header?.menuItems || [], socials, pages: (config as any)?.pages || {}, settings: (config as any)?.settings || {}, footer: { phone: (config as any)?.footer?.phone || "", email: (config as any)?.footer?.email || "", description: (config as any)?.footer?.description || "" } };
};

export async function handleRepair(req: any, res: any): Promise<boolean> {
  const url = (req.url || "").split("?")[0];

  if (req.method === "POST" && url === "/api/ai/stylist") {
    const apiKey = process.env.GEMINI_API_KEY;
    const message = String(req.body?.message || "").trim();
    if (!apiKey) return reply(res, 503, { success: false, error: "AI service is not configured" });
    if (!message) return reply(res, 400, { success: false, error: "Message is required" });
    try {
      const live = await getLiveStoreSnapshot();
      const history = Array.isArray(req.body?.history) ? req.body.history.slice(-4) : [];
      const system = `You are the customer-facing AI shopping assistant for ${BRAND.name}. Use the LIVE STORE DATA below as your source of truth. You may naturally compose, explain, compare and recommend using the supplied data; you do NOT need an exact sentence from the website. Never invent a product, price, stock, color, size, policy, social account, phone number, URL, discount or store feature. If the website data does not establish an answer, say that you cannot confirm it and offer the most useful confirmed alternative. For styling questions, make a practical recommendation only from the live products and their attributes. For store-policy questions, explain the supplied policy in clear customer language. If the user asks to see/open a live product, output exactly one token [NAV:PRODUCT:<id>] for that product. For internal destinations use [NAV:HOME], [NAV:PRODUCTS], [NAV:CART], [NAV:LOGIN], [NAV:PROFILE], [NAV:CONTACT], or [NAV:FAQ]. For a social account use [EXT:WHATSAPP:<url>], [EXT:TIKTOK:<url>], [EXT:INSTAGRAM:<url>] or [EXT:<PLATFORM>:<url>] using only a live URL in the data. Keep responses concise, direct and helpful. LIVE STORE DATA: ${JSON.stringify(live)}`;
      const contents = [...history.map((m: any) => ({ role: m.role === "model" ? "model" : "user", parts: [{ text: String(m.text || m.content || "") }] })), { role: "user", parts: [{ text: message }] }];
      const base = { systemInstruction: { parts: [{ text: system }] }, contents, generationConfig: { maxOutputTokens: 280 } };
      let last: any = null;
      for (const model of ["gemini-3.8-flash", "gemini-2.5-flash"]) {
        try { const text = await generateAI(apiKey, model, base); if (text) { await Activity.create({ email: "ai-assistant", action: "ai_query", details: { message: message.slice(0, 500), productCount: live.products.length, model } }); return reply(res, 200, { success: true, text, model }); } }
        catch (error) { last = error; console.warn(`[ai] ${model} unavailable`, error); }
      }
      console.error("[ai] all models failed", last);
      return reply(res, 503, { success: false, error: "AI service is temporarily unavailable. Please try again." });
    } catch (error) { console.error("[ai] live store snapshot failed", error); return reply(res, 503, { success: false, error: "Live store data is temporarily unavailable." }); }
  }

  if (req.method === "POST" && url === "/api/auth/sync") {
    try {
      const { uid, email, displayName, photoURL, isNewUser } = req.body || {};
      if (!uid || !email) return reply(res, 400, { success: false, error: "User identity required" });
      const User = getModel("User");
      if (!User) return reply(res, 503, { success: false, error: "User service unavailable" });
      const normalizedEmail = String(email).trim().toLowerCase();
      const role = normalizedEmail === "admin@rumi.com" || normalizedEmail === String(process.env.ADMIN_EMAIL || "").trim().toLowerCase() ? "admin" : "user";
      const user = await User.findOneAndUpdate({ uid }, { email: normalizedEmail, displayName, photoURL, role, lastLogin: new Date() }, { upsert: true, new: true });
      try {
        const live = await getLiveStoreSnapshot();
        const { getSignupEmail, getLoginEmail } = await import("../src/utils/AtelierEmails.js");
        const html = isNewUser ? getSignupEmail(displayName || "Customer", live.products.slice(0, 4)) : getLoginEmail(displayName || "Customer", live.products.slice(0, 4));
        await sendMail(normalizedEmail, `${BRAND.name} | ${isNewUser ? "Welcome" : "Sign-in notification"}`, html);
      } catch (emailError) { console.warn("[auth-sync-email] failed after account sync", emailError); }
      return reply(res, 200, { success: true, user });
    } catch (error) { console.error("[auth-sync]", error); return reply(res, 500, { success: false, error: "Account sync failed" }); }
  }

  if (req.method === "GET" && /^\/api\/products\/[^/]+$/.test(url)) {
    try { const id = url.split("/").pop() || ""; if (!mongoose.isValidObjectId(id)) return reply(res, 400, { success: false, error: "Invalid product id" }); const Product = getModel("Product"); if (!Product) return reply(res, 503, { success: false, error: "Product service unavailable" }); const product = await Product.findById(id).lean(); return product ? reply(res, 200, product) : reply(res, 404, { success: false, error: "Product not found" }); }
    catch (error) { console.error("[product-detail]", error); return reply(res, 500, { success: false, error: "Unable to load product" }); }
  }

  if (req.method === "POST" && url === "/api/discounts/verify") {
    try {
      const codeValue = String(req.body?.code || req.body?.name || req.query?.code || "").trim().toUpperCase();
      const orderAmount = Number(req.body?.orderAmount ?? req.body?.subtotal ?? req.body?.total ?? 0);
      if (!codeValue) return reply(res, 400, { success: false, valid: false, error: "Discount code is required" });
      const DiscountCode = getModel("DiscountCode");
      if (!DiscountCode) return reply(res, 503, { success: false, valid: false, error: "Discount service unavailable" });
      const code: any = await DiscountCode.findOne({ name: codeValue }).lean();
      if (!code) return reply(res, 200, { success: false, valid: false, error: "Invalid discount code" });
      const now = Date.now(); const start = new Date(code.startDate).getTime(); const end = new Date(code.endDate).getTime();
      if (code.isActive === false || !Number.isFinite(start) || !Number.isFinite(end) || now < start || now > end) return reply(res, 200, { success: false, valid: false, error: "This discount is not currently active" });
      const minimum = Number(code.minOrderAmount || 0);
      if (minimum > 0 && (!Number.isFinite(orderAmount) || orderAmount < minimum)) return reply(res, 200, { success: false, valid: false, error: `Minimum order amount is ${minimum}` });
      const percent = Math.max(0, Math.min(100, Number(code.percent ?? code.discount ?? 0)));
      if (!Number.isFinite(percent) || percent <= 0) return reply(res, 200, { success: false, valid: false, error: "This discount has no valid percentage" });
      return reply(res, 200, { success: true, valid: true, code: code.name, percent, discount: percent, minOrderAmount: minimum, startDate: code.startDate, endDate: code.endDate });
    } catch (error) { console.error("[discount-verify]", error); return reply(res, 500, { success: false, valid: false, error: "Unable to verify discount" }); }
  }

  if (req.method === "POST" && url === "/api/orders/create") {
    try {
      const { items, totalAmount, shippingDetails, userId } = req.body || {};
      if (!Array.isArray(items) || items.length === 0) return reply(res, 400, { success: false, error: "Missing or invalid items" });
      const Order = getModel("Order"); if (!Order) return reply(res, 503, { success: false, error: "Order service unavailable" });
      const order = await Order.create({ userId: userId || "GUEST", items, totalAmount: Number(totalAmount || 0), shippingDetails });
      try { const live = await getLiveStoreSnapshot(); const { getOrderEmail } = await import("../src/utils/AtelierEmails.js"); const email = String(shippingDetails?.email || "").trim(); if (email) await sendMail(email, `${BRAND.name} | Order Confirmed`, getOrderEmail(shippingDetails?.firstName || "Customer", order._id.toString(), String(totalAmount || 0), live.products.slice(0, 4))); }
      catch (emailError) { console.warn("[order-email] failed after order was saved", emailError); }
      return reply(res, 200, { success: true, orderId: order._id });
    } catch (error) { console.error("[order-create]", error); return reply(res, 500, { success: false, error: "Unable to place order" }); }
  }

  if (req.method === "POST" && url === "/api/orchestrate/dispatch-email") {
    try {
      const { email, displayName, actionType, orderId } = req.body || {}; if (!email) return reply(res, 400, { success: false, error: "Email is required" });
      const live = await getLiveStoreSnapshot(); const { getAbandonedCartEmail, getShippedEmail, getDeliveredEmail, getWishlistEmail } = await import("../src/utils/AtelierEmails.js");
      let html = ""; if (actionType === "ABANDONED_CART") html = getAbandonedCartEmail(displayName || "Customer", live.products.slice(0, 4)); else if (actionType === "SHIPPED") html = getShippedEmail(displayName || "Customer", orderId || "N/A", live.products.slice(0, 4)); else if (actionType === "DELIVERED") html = getDeliveredEmail(displayName || "Customer", orderId || "N/A", live.products.slice(0, 4)); else if (actionType === "WISHLIST") html = getWishlistEmail(displayName || "Customer", live.products.slice(0, 4)); else return reply(res, 400, { success: false, error: "Unknown email action" });
      await sendMail(String(email).trim().toLowerCase(), `${BRAND.name} | ${actionType === "SHIPPED" ? "Order In Transit" : actionType === "DELIVERED" ? "Order Delivered" : actionType === "WISHLIST" ? "Wishlist Reminder" : "Your Selection Awaits"}`, html);
      return reply(res, 200, { success: true });
    } catch (error) { console.error("[dispatch-email]", error); return reply(res, 500, { success: false, error: "Dispatch failed" }); }
  }

  if (req.method === "GET" && url === "/api/cron/abandoned-cart") {
    try {
      const User = getModel("User"); if (!User) return reply(res, 503, { success: false, error: "User service unavailable" });
      const abandonedUsers = await User.find({ "cart.0": { $exists: true }, cartEmailSent: false }).limit(50).lean(); const live = await getLiveStoreSnapshot(); let sent = 0;
      for (const user of abandonedUsers as any[]) { if (!user.email) continue; try { const { getAbandonedCartEmail } = await import("../src/utils/AtelierEmails.js"); const productsByCart = live.products.filter((p: any) => (user.cart || []).some((item: any) => String(item.productId) === String(p.id))).slice(0, 4); await sendMail(String(user.email).toLowerCase(), `${BRAND.name} | Your Selection Awaits`, getAbandonedCartEmail(user.displayName || "Customer", productsByCart.length ? productsByCart : live.products.slice(0, 4))); await User.updateOne({ _id: user._id }, { $set: { cartEmailSent: true } }); sent++; } catch (emailError) { console.warn("[cron-abandoned] email failed", emailError); } }
      return reply(res, 200, { success: true, processed: abandonedUsers.length, sent });
    } catch (error) { console.error("[cron-abandoned]", error); return reply(res, 500, { success: false, error: "Cron failed" }); }
  }

  if (req.method === "POST" && url === "/api/admin/customers/log") {
    try { const { userId, email, action, details, timestamp } = req.body || {}; const normalizedEmail = String(email || "").trim().toLowerCase(); if (!normalizedEmail && !userId) return reply(res, 400, { success: false, error: "User identity required" }); const entry = { action: String(action || "activity"), details: typeof details === "string" ? details : JSON.stringify(details ?? {}), timestamp: timestamp ? new Date(timestamp) : new Date() }; const User = getModel("User"); if (User) await User.findOneAndUpdate(userId ? { uid: userId } : { email: normalizedEmail }, { $push: { activity: entry } }); await Activity.create({ email: normalizedEmail, ...entry }); return reply(res, 200, { success: true }); }
    catch (error) { console.error("[activity-log]", error); return reply(res, 500, { success: false, error: "Activity logging failed" }); }
  }

  if (req.method === "GET" && url === "/api/admin/customers") {
    try { const User = getModel("User"); const users = User ? await User.find({ role: "user" }).sort({ createdAt: -1 }).lean() : []; const logs = await Activity.find().sort({ timestamp: -1 }).limit(250).lean(); return reply(res, 200, { users, logs }); }
    catch (error) { console.error("[activity-fetch]", error); return reply(res, 500, { users: [], logs: [] }); }
  }

  if (req.method === "POST" && url === "/api/auth/forgot-password") {
    try { const email = String(req.body?.email || "").trim().toLowerCase(); if (!email) return reply(res, 400, { success: false, error: "Email is required" }); const code = String(Math.floor(100000 + Math.random() * 900000)); await PasswordReset.deleteMany({ email }); await PasswordReset.create({ email, codeHash: await hash(code), verified: false, expiresAt: new Date(Date.now() + 600000) }); const { getOTPEmail } = await import("../src/utils/AtelierEmails.js"); await sendMail(email, `${BRAND.name} | Secure Access Key`, getOTPEmail(code)); return reply(res, 200, { success: true }); }
    catch (error) { console.error("[forgot-password]", error); return reply(res, 500, { success: false, error: "Unable to send recovery code" }); }
  }

  if (req.method === "POST" && url === "/api/auth/verify-code") {
    try { const email = String(req.body?.email || "").trim().toLowerCase(); const code = String(req.body?.code || "").trim(); const record = await PasswordReset.findOne({ email }).sort({ createdAt: -1 }); if (!record || record.expiresAt.getTime() < Date.now() || await hash(code) !== record.codeHash) return reply(res, 400, { success: false, error: "Invalid or expired code" }); record.verified = true; await record.save(); return reply(res, 200, { success: true, verified: true }); }
    catch (error) { console.error("[verify-code]", error); return reply(res, 400, { success: false, error: "Invalid or expired code" }); }
  }

  if (req.method === "POST" && url === "/api/auth/reset-password") {
    const email = String(req.body?.email || "").trim().toLowerCase(); const code = String(req.body?.code || "").trim(); const newPassword = String(req.body?.newPassword || "");
    try {
      if (newPassword.length < 6) return reply(res, 400, { success: false, error: "Password must contain at least 6 characters" }); const record = await PasswordReset.findOne({ email, verified: true }).sort({ createdAt: -1 }); if (!record || record.expiresAt.getTime() < Date.now() || await hash(code) !== record.codeHash) return reply(res, 400, { success: false, error: "Recovery session expired. Request a new code." }); const admin = await getFirebaseAdmin(); const account = await admin.auth().getUserByEmail(email); await admin.auth().updateUser(account.uid, { password: newPassword }); await PasswordReset.deleteMany({ email }); await Activity.create({ email, action: "password_reset", details: "Password updated" }); return reply(res, 200, { success: true });
    } catch (error: any) { console.error("[reset-password]", error); const message = String(error?.message || ""); if (message.includes("Password recovery service is not configured")) return reply(res, 503, { success: false, error: "Password recovery service is not configured" }); if (message.includes("auth/user-not-found")) return reply(res, 404, { success: false, error: "No account exists for this email." }); return reply(res, 500, { success: false, error: "Password could not be updated. Please try again." }); }
  }

  if (req.method === "POST" && url === "/api/cart/abandoned") {
    try { const { email, displayName, total, cartItems } = req.body || {}; if (email) { const { getAbandonedCartEmail } = await import("../src/utils/AtelierEmails.js"); const normalizedEmail = String(email).trim().toLowerCase(); const live = await getLiveStoreSnapshot(); const cartProductIds = Array.isArray(cartItems) ? cartItems.map((item: any) => String(item?.productId || item?.id || "")) : []; const liveProducts = live.products.filter((p: any) => cartProductIds.includes(String(p.id))).slice(0, 4); await sendMail(normalizedEmail, `${BRAND.name} | Your Selection Awaits`, getAbandonedCartEmail(displayName || "Customer", liveProducts.length ? liveProducts : live.products.slice(0, 4))); await Activity.create({ email: normalizedEmail, action: "abandoned_cart", details: JSON.stringify({ total, itemCount: Array.isArray(cartItems) ? cartItems.length : 0 }) }); } return reply(res, 200, { success: true }); }
    catch (error) { console.error("[abandoned-cart]", error); return reply(res, 200, { success: true }); }
  }

  return false;
}
