import mongoose from "mongoose";
import { connectDB } from "./_shared.js";
import { BRAND } from "../src/config/brand.js";
import { sendTransactionalMail } from "../src/utils/mail.js";

const getModel = (name: string) => mongoose.models[name] as any;
const Activity = (mongoose.models.Activity as any) || mongoose.model("Activity", new mongoose.Schema({ email: String, action: String, details: mongoose.Schema.Types.Mixed, timestamp: { type: Date, default: Date.now } }));

const getLiveProducts = async () => {
  const Product = getModel("Product");
  if (!Product) return [];
  const rows = await Product.find({}).sort({ isFeatured: -1, isNewArrival: -1, createdAt: -1 }).limit(4).lean();
  return rows.map((p: any) => ({ ...p, id: String(p.id || p._id), name: p.name || p.title, image: p.image || p.images?.[0] || "", images: p.images || [], price: Number(p.price || 0), currency: p.currency || "USD" }));
};

export async function handleAuthSync(req: any, res: any): Promise<boolean> {
  const url = String(req.url || "").split("?")[0];
  if (req.method !== "POST" || url !== "/api/auth/sync") return false;
  try {
    await connectDB();
    const { uid, email, displayName, photoURL, isNewUser, authMethod, eventId, currency } = req.body || {};
    if (!uid || !email) return res.status(400).json({ success: false, error: "User identity required" });
    const normalizedEmail = String(email).trim().toLowerCase();
    const User = getModel("User");
    if (!User) return res.status(503).json({ success: false, error: "User service unavailable" });
    const role = normalizedEmail === "admin@rumi.com" || normalizedEmail === String(process.env.ADMIN_EMAIL || "").trim().toLowerCase() ? "admin" : "user";
    const user = await User.findOneAndUpdate({ uid }, { $set: { email: normalizedEmail, displayName, photoURL, role, lastLogin: new Date() } }, { upsert: true, new: true, setDefaultsOnInsert: true });
    const safeEvent = String(eventId || `${uid}:${isNewUser ? "signup" : "login"}:${new Date().toISOString().slice(0,16)}`).replace(/[^a-zA-Z0-9:_-]/g, "").slice(0,180);
    const mailKey = `auth:${safeEvent}`;
    try {
      const live = await getLiveProducts();
      const { getSignupEmail, getLoginEmail } = await import("../src/utils/AtelierEmails.js");
      const selectedCurrency = String(currency || "USD").toUpperCase();
      const html = isNewUser ? getSignupEmail(displayName || "Customer", live, selectedCurrency) : getLoginEmail(displayName || "Customer", live, selectedCurrency);
      await sendTransactionalMail(normalizedEmail, `${BRAND.name} | ${isNewUser ? "Welcome" : "Sign-in notification"}`, html, mailKey);
    } catch (emailError) { console.warn("[auth-sync-email] delivery skipped/failed after account sync", emailError); }
    try { await Activity.create({ email: normalizedEmail, action: isNewUser ? "signup" : "login", details: { method: authMethod || "unknown", currency: currency || "USD", dedupeKey: mailKey }, timestamp: new Date() }); } catch (activityError) { console.warn("[auth-sync-activity] failed", activityError); }
    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("[auth-sync]", error);
    return res.status(500).json({ success: false, error: "Account sync failed" });
  }
}
