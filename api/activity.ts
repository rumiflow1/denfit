import mongoose from "mongoose";

export async function logAuthActivity(req: any, res: any): Promise<boolean> {
  const url = (req.url || "").split("?")[0];
  if (req.method !== "POST" || url !== "/api/auth/sync") return false;
  try {
    const { uid, email, displayName, photoURL, isNewUser } = req.body || {};
    if (!uid || !email) return false;
    const User = mongoose.models.User as any;
    const action = isNewUser ? "signup" : "login";
    const details = isNewUser ? `Customer signed up: ${displayName || email}` : `Customer logged in: ${displayName || email}`;
    await User.findOneAndUpdate({ uid }, { $set: { email: String(email).toLowerCase(), displayName, photoURL }, $push: { activity: { action, details, timestamp: new Date() } } }, { upsert: true, new: true, setDefaultsOnInsert: true });
    return false;
  } catch (error) {
    console.error("auth activity log error", error);
    return false;
  }
}
