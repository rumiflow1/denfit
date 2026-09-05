import mongoose, { Schema, Model } from "mongoose";

const ActivitySchema = new Schema({ email: String, action: String, details: Schema.Types.Mixed, timestamp: { type: Date, default: Date.now } }, { timestamps: true });
const PasswordResetSchema = new Schema({ email: { type: String, required: true, lowercase: true, index: true }, codeHash: { type: String, required: true }, verified: { type: Boolean, default: false }, expiresAt: { type: Date, required: true, index: true } }, { timestamps: true });
const User = mongoose.models.User as Model<any>;
const Product = mongoose.models.Product as Model<any>;
const Activity = (mongoose.models.Activity as Model<any>) || mongoose.model("Activity", ActivitySchema);
const PasswordReset = (mongoose.models.PasswordReset as Model<any>) || mongoose.model("PasswordReset", PasswordResetSchema);
const send = (res: any, status: number, body: any) => { res.status(status).json(body); return true; };
const hash = async (value: string) => Buffer.from(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))).toString("hex");
const brand = () => process.env.BRAND_NAME || "DENFIT";

async function mail(to: string, subject: string, html: string) {
  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.default.createTransport({ service: "gmail", auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS } });
  await transporter.sendMail({ from: `"${brand()}" <${process.env.EMAIL_USER}>`, to, subject, html });
}

async function gemini(apiKey: string, model: string, body: any, signal: AbortSignal) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`, { method: "POST", headers: { "Content-Type": "application/json" }, signal, body: JSON.stringify(body) });
  const data: any = await response.json();
  if (!response.ok) throw new Error(`Gemini ${model} failed: ${response.status}`);
  return data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || "").join("").trim() || "";
}

export async function handleFixRoute(req: any, res: any): Promise<boolean> {
  const url = (req.url || "").split("?")[0];
  if (req.method === "GET" && /^\/api\/products\/[^/]+$/.test(url)) {
    try {
      const id = url.split("/").pop() || "";
      if (!mongoose.isValidObjectId(id)) return send(res, 400, { success: false, error: "Invalid product id" });
      if (!Product) return send(res, 503, { success: false, error: "Product service unavailable" });
      const product = await Product.findById(id).lean();
      return product ? send(res, 200, product) : send(res, 404, { success: false, error: "Product not found" });
    } catch (e) { console.error("product detail error", e); return send(res, 500, { success: false, error: "Unable to load product" }); }
  }
  if (req.method === "POST" && url === "/api/admin/customers/log") {
    try {
      const { userId, email, action, details, timestamp } = req.body || {};
      const normalizedEmail = String(email || "").trim().toLowerCase();
      if (!normalizedEmail && !userId) return send(res, 400, { success: false, error: "User identity required" });
      const entry = { action: String(action || "activity"), details: typeof details === "string" ? details : JSON.stringify(details ?? {}), timestamp: timestamp ? new Date(timestamp) : new Date() };
      if (User) await User.findOneAndUpdate(userId ? { uid: userId } : { email: normalizedEmail }, { $push: { activity: entry } });
      await Activity.create({ email: normalizedEmail, ...entry });
      return send(res, 200, { success: true });
    } catch (e) { console.error(e); return send(res, 500, { success: false, error: "Activity logging failed" }); }
  }
  if (req.method === "GET" && url === "/api/admin/customers") {
    try {
      const users = User ? await User.find({ role: "user" }).sort({ createdAt: -1 }).lean() : [];
      const logs = await Activity.find().sort({ timestamp: -1 }).limit(250).lean();
      return send(res, 200, { users, logs });
    } catch (e) { console.error(e); return send(res, 500, { users: [], logs: [] }); }
  }
  if (req.method === "POST" && url === "/api/auth/forgot-password") {
    try {
      const email = String(req.body?.email || "").trim().toLowerCase();
      if (!email) return send(res, 400, { success: false, error: "Email is required" });
      const code = String(Math.floor(100000 + Math.random() * 900000));
      await PasswordReset.deleteMany({ email });
      await PasswordReset.create({ email, codeHash: await hash(code), verified: false, expiresAt: new Date(Date.now() + 600000) });
      const { getOTPEmail } = await import("../src/utils/AtelierEmails.js");
      await mail(email, `${brand()} | Secure Access Key`, getOTPEmail(code));
      return send(res, 200, { success: true });
    } catch (e) { console.error(e); return send(res, 500, { success: false, error: "Unable to send recovery code" }); }
  }
  if (req.method === "POST" && url === "/api/auth/verify-code") {
    try {
      const email = String(req.body?.email || "").trim().toLowerCase(); const code = String(req.body?.code || "").trim();
      const record = await PasswordReset.findOne({ email }).sort({ createdAt: -1 });
      if (!record || record.expiresAt.getTime() < Date.now() || await hash(code) !== record.codeHash) return send(res, 400, { success: false, error: "Invalid or expired code" });
      record.verified = true; await record.save(); return send(res, 200, { success: true, verified: true });
    } catch (e) { return send(res, 400, { success: false, error: "Invalid or expired code" }); }
  }
  if (req.method === "POST" && url === "/api/auth/reset-password") {
    try {
      const email = String(req.body?.email || "").trim().toLowerCase(); const code = String(req.body?.code || "").trim(); const newPassword = String(req.body?.newPassword || "");
      if (newPassword.length < 6) return send(res, 400, { success: false, error: "Password must contain at least 6 characters" });
      const record = await PasswordReset.findOne({ email, verified: true }).sort({ createdAt: -1 });
      if (!record || record.expiresAt.getTime() < Date.now() || await hash(code) !== record.codeHash) return send(res, 400, { success: false, error: "Recovery session expired. Request a new code." });
      const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
      if (!raw) return send(res, 503, { success: false, error: "Password recovery service is not configured" });
      const admin = await import("firebase-admin");
      if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(JSON.parse(raw)) });
      const account = await admin.auth().getUserByEmail(email); await admin.auth().updateUser(account.uid, { password: newPassword });
      await PasswordReset.deleteMany({ email }); await Activity.create({ email, action: "password_reset", details: "Password updated" });
      return send(res, 200, { success: true });
    } catch (e) { console.error(e); return send(res, 400, { success: false, error: "Password could not be updated. Please request a new code." }); }
  }
  if (req.method === "POST" && url === "/api/cart/abandoned") {
    try {
      const { email, displayName, total, cartItems } = req.body || {};
      if (email) { const { getAbandonedCartEmail } = await import("../src/utils/AtelierEmails.js"); await mail(String(email).trim().toLowerCase(), `${brand()} | Your Selection Awaits`, getAbandonedCartEmail(displayName || "Patron")); await Activity.create({ email: String(email).trim().toLowerCase(), action: "abandoned_cart", details: JSON.stringify({ total, itemCount: Array.isArray(cartItems) ? cartItems.length : 0 }) }); }
      return send(res, 200, { success: true });
    } catch (e) { console.error(e); return send(res, 200, { success: true }); }
  }
  if (req.method === "POST" && url === "/api/ai/stylist") {
    try {
      const apiKey = process.env.GEMINI_API_KEY; if (!apiKey) return send(res, 503, { error: "AI service is not configured" });
      const message = String(req.body?.message || "").trim(); if (!message) return send(res, 400, { error: "Message is required" });
      const history = Array.isArray(req.body?.history) ? req.body.history.slice(-8) : [];
      const body = { systemInstruction: { parts: [{ text: `You are the transparent AI shopping assistant for ${brand()}. Be concise, helpful, elegant and practical. Never claim to be human.` }] }, contents: [...history.map((m: any) => ({ role: m.role === "model" ? "model" : "user", parts: [{ text: String(m.text || m.content || "") }] })), { role: "user", parts: [{ text: message }] }], generationConfig: { temperature: 0.6, topP: 0.9, maxOutputTokens: 500 } };
      const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 12000);
      try {
        let text = ""; let last: any;
        for (const model of ["gemini-3.5-flash", "gemini-2.5-flash"]) { try { text = await gemini(apiKey, model, body, controller.signal); if (text) break; } catch (e) { last = e; if (controller.signal.aborted) break; } }
        if (!text) throw last || new Error("No AI response"); return send(res, 200, { text });
      } finally { clearTimeout(timer); }
    } catch (e) { console.error(e); return send(res, 504, { error: "AI request timed out or the AI provider is unavailable. Please try again." }); }
  }
  return false;
}
