import mongoose, { Schema, Model } from "mongoose";

const ActivitySchema = new Schema({
  email: String,
  action: String,
  details: Schema.Types.Mixed,
  timestamp: { type: Date, default: Date.now },
}, { timestamps: true });

const PasswordResetSchema = new Schema({
  email: { type: String, required: true, lowercase: true, index: true },
  codeHash: { type: String, required: true },
  verified: { type: Boolean, default: false },
  expiresAt: { type: Date, required: true, index: true },
}, { timestamps: true });

const User = mongoose.models.User as Model<any>;
const Product = mongoose.models.Product as Model<any>;
const Activity = (mongoose.models.Activity as Model<any>) || mongoose.model("Activity", ActivitySchema);
const PasswordReset = (mongoose.models.PasswordReset as Model<any>) || mongoose.model("PasswordReset", PasswordResetSchema);

const hash = async (value: string) => {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Buffer.from(digest).toString("hex");
};

const json = (res: any, status: number, body: any) => res.status(status).json(body);

export async function handleFixRoute(req: any, res: any): Promise<boolean> {
  const url = (req.url || "").split("?")[0];

  const productMatch = url.match(/^\/api\/products\/([^/]+)$/);
  if (req.method === "GET" && productMatch) {
    try {
      const product = await Product.findById(productMatch[1]);
      if (!product) return !!json(res, 404, { success: false, error: "Product not found" });
      return !!json(res, 200, product);
    } catch {
      return !!json(res, 404, { success: false, error: "Product not found" });
    }
  }

  if (req.method === "POST" && url === "/api/admin/customers/log") {
    try {
      const { userId, email, action, details, timestamp } = req.body || {};
      if (!email && !userId) return !!json(res, 400, { success: false, error: "User identity required" });
      const normalizedEmail = String(email || "").trim().toLowerCase();
      const entry = { action: String(action || "activity"), details: typeof details === "string" ? details : JSON.stringify(details ?? {}), timestamp: timestamp ? new Date(timestamp) : new Date() };
      if (User) {
        await User.findOneAndUpdate(userId ? { uid: userId } : { email: normalizedEmail }, { $push: { activity: entry } }, { new: true });
      }
      await Activity.create({ email: normalizedEmail, ...entry });
      return !!json(res, 200, { success: true });
    } catch (error) {
      console.error("activity log error", error);
      return !!json(res, 500, { success: false, error: "Activity logging failed" });
    }
  }

  if (req.method === "GET" && url === "/api/admin/customers") {
    try {
      const users = User ? await User.find({ role: "user" }).sort({ createdAt: -1 }).lean() : [];
      const logs = await Activity.find().sort({ timestamp: -1 }).limit(250).lean();
      return !!json(res, 200, { users, logs });
    } catch (error) {
      console.error("activity fetch error", error);
      return !!json(res, 500, { users: [], logs: [] });
    }
  }

  if (req.method === "POST" && url === "/api/auth/forgot-password") {
    try {
      const email = String(req.body?.email || "").trim().toLowerCase();
      if (!email) return !!json(res, 400, { success: false, error: "Email is required" });
      const code = String(Math.floor(100000 + Math.random() * 900000));
      await PasswordReset.deleteMany({ email });
      await PasswordReset.create({ email, codeHash: await hash(code), expiresAt: new Date(Date.now() + 10 * 60 * 1000) });
      const nodemailer = await import("nodemailer");
      const { getOTPEmail } = await import("../src/utils/AtelierEmails.js");
      const transporter = nodemailer.default.createTransport({ service: "gmail", auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS } });
      await transporter.sendMail({ from: `\"${process.env.BRAND_NAME || "DENFIT"}\" <${process.env.EMAIL_USER}>`, to: email, subject: "Secure Access Key", html: getOTPEmail(code) });
      return !!json(res, 200, { success: true });
    } catch (error) {
      console.error("forgot-password error", error);
      return !!json(res, 500, { success: false, error: "Unable to send recovery code" });
    }
  }

  if (req.method === "POST" && url === "/api/auth/verify-code") {
    try {
      const email = String(req.body?.email || "").trim().toLowerCase();
      const code = String(req.body?.code || "");
      const record = await PasswordReset.findOne({ email }).sort({ createdAt: -1 });
      if (!record || record.expiresAt.getTime() < Date.now() || (await hash(code)) !== record.codeHash) return !!json(res, 400, { success: false, error: "Invalid or expired code" });
      record.verified = true;
      await record.save();
      return !!json(res, 200, { success: true });
    } catch (error) {
      console.error("verify-code error", error);
      return !!json(res, 400, { success: false, error: "Invalid or expired code" });
    }
  }

  if (req.method === "POST" && url === "/api/auth/reset-password") {
    try {
      const email = String(req.body?.email || "").trim().toLowerCase();
      const code = String(req.body?.code || "");
      const newPassword = String(req.body?.newPassword || "");
      if (newPassword.length < 6) return !!json(res, 400, { success: false, error: "Password must contain at least 6 characters" });
      const record = await PasswordReset.findOne({ email, verified: true }).sort({ createdAt: -1 });
      if (!record || record.expiresAt.getTime() < Date.now() || (await hash(code)) !== record.codeHash) return !!json(res, 400, { success: false, error: "Recovery session expired. Request a new code." });
      const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
      if (!serviceAccountRaw) return !!json(res, 503, { success: false, error: "Password recovery service is not configured" });
      const admin = await import("firebase-admin");
      if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(JSON.parse(serviceAccountRaw)) });
      const userRecord = await admin.auth().getUserByEmail(email);
      await admin.auth().updateUser(userRecord.uid, { password: newPassword });
      await PasswordReset.deleteMany({ email });
      return !!json(res, 200, { success: true });
    } catch (error) {
      console.error("reset-password error", error);
      return !!json(res, 400, { success: false, error: "Password could not be updated. Please request a new code." });
    }
  }

  if (req.method === "POST" && url === "/api/cart/abandoned") {
    try {
      const { email, displayName, total, cartItems } = req.body || {};
      if (email) {
        const { getAbandonedCartEmail } = await import("../src/utils/AtelierEmails.js");
        const nodemailer = await import("nodemailer");
        const transporter = nodemailer.default.createTransport({ service: "gmail", auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS } });
        await transporter.sendMail({ from: `\"${process.env.BRAND_NAME || "DENFIT"}\" <${process.env.EMAIL_USER}>`, to: email, subject: "Your Selection Awaits", html: getAbandonedCartEmail(displayName || "Patron") });
        await Activity.create({ email: String(email).toLowerCase(), action: "abandoned_cart", details: JSON.stringify({ total, itemCount: Array.isArray(cartItems) ? cartItems.length : 0 }), timestamp: new Date() });
      }
      return !!json(res, 200, { success: true });
    } catch (error) {
      console.error("abandoned cart error", error);
      return !!json(res, 200, { success: true });
    }
  }

  if (req.method === "POST" && url === "/api/ai/stylist") {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return !!json(res, 503, { error: "AI service is not configured" });
      const message = String(req.body?.message || "").trim();
      const history = Array.isArray(req.body?.history) ? req.body.history.slice(-8) : [];
      if (!message) return !!json(res, 400, { error: "Message is required" });
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: `You are the transparent AI shopping assistant for ${process.env.BRAND_NAME || "DENFIT"}. Be concise, helpful, elegant and practical. Never claim to be human.` }] },
            contents: [...history.map((m: any) => ({ role: m.role === "model" ? "model" : "user", parts: [{ text: String(m.text || "") }] })), { role: "user", parts: [{ text: message }] }],
            generationConfig: { temperature: 0.6, topP: 0.9, maxOutputTokens: 500 },
          }),
        });
        const data: any = await response.json();
        if (!response.ok) return !!json(res, 502, { error: "AI provider unavailable" });
        const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || "").join("").trim();
        return !!json(res, 200, { text: text || "I’m ready to help you find the right piece." });
      } finally {
        clearTimeout(timer);
      }
    } catch (error) {
      console.error("AI route error", error);
      return !!json(res, 504, { error: "AI request timed out. Please try again." });
    }
  }

  return false;
}
