import mongoose from "mongoose";
import { connectDB } from "./_shared.js";

const getModel = (name: string) => mongoose.models[name] as any;
export async function handleCustomerRoutes(req: any, res: any): Promise<boolean> {
  const url = String(req.url || "").split("?")[0];
  if (req.method !== "GET" || url !== "/api/admin/customers") return false;
  try { await connectDB(); } catch (error) { console.error("[customers] database unavailable", error); return res.status(503).json({ users: [], logs: [], error: "Database unavailable" }); }
  try {
    const User = getModel("User"); const Order = getModel("Order"); const Activity = getModel("Activity");
    if (!User) return res.status(503).json({ users: [], logs: [], error: "Customer service unavailable" });
    const users = await User.find({ role: "user" }).sort({ createdAt: -1 }).lean();
    const orders = Order ? await Order.find({}, { userId: 1, email: 1, totalAmount: 1, createdAt: 1 }).lean() : [];
    const stats = new Map<string, { orders: number; spent: number; last: Date | null }>();
    for (const order of orders as any[]) {
      const key = String(order.userId || order.email || "").toLowerCase(); if (!key) continue;
      const current = stats.get(key) || { orders: 0, spent: 0, last: null }; current.orders += 1; current.spent += Number(order.totalAmount || 0); const d = order.createdAt ? new Date(order.createdAt) : null; if (d && (!current.last || d > current.last)) current.last = d; stats.set(key, current);
    }
    const enriched = (users as any[]).map(user => { const s = stats.get(String(user.uid || user.email || "").toLowerCase()) || stats.get(String(user.email || "").toLowerCase()) || { orders: 0, spent: 0, last: null }; return { ...user, totalOrders: s.orders, totalSpent: s.spent, lastActive: user.lastLogin || s.last || user.createdAt }; });
    const logs = Activity ? await Activity.find().sort({ timestamp: -1 }).limit(250).lean() : [];
    return res.status(200).json({ users: enriched, logs });
  } catch (error) { console.error("[customers]", error); return res.status(500).json({ users: [], logs: [], error: "Unable to load customers" }); }
}
