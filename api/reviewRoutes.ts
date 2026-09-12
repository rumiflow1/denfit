import mongoose from "mongoose";
import { connectDB } from "./_shared.js";

const getModel = (name: string) => mongoose.models[name] as any;

export async function handleReviewRoutes(req: any, res: any): Promise<boolean> {
  const url = String(req.url || "").split("?")[0];
  const method = String(req.method || "").toUpperCase();

  const productMatch = url.match(/^\/api\/products\/([^/]+)\/reviews$/);
  const adminList = url === "/api/admin/reviews";
  const adminProductAdd = url.match(/^\/api\/admin\/products\/([^/]+)\/reviews$/);
  const adminReviewMatch = url.match(/^\/api\/admin\/reviews\/([^/]+)(?:\/([^/]+))?$/);

  if (!productMatch && !adminList && !adminProductAdd && !adminReviewMatch) return false;

  try { await connectDB(); }
  catch (error) {
    console.error("[reviews] database unavailable", error);
    return res.status(503).json({ success: false, error: "Database unavailable" });
  }

  try {
    const Review = getModel("Review") || mongoose.model("Review", new mongoose.Schema({
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
      customerName: { type: String, required: true },
      customerEmail: String,
      rating: { type: Number, required: true, min: 1, max: 5 },
      comment: { type: String, required: true },
      isManual: { type: Boolean, default: false },
      status: { type: String, enum: ["pending", "approved", "hidden", "disapproved"], default: "pending" },
      isVisible: { type: Boolean, default: true }
    }, { timestamps: true }));

    if (productMatch) {
      const productId = decodeURIComponent(productMatch[1]);
      if (method === "GET") {
        const reviews = await Review.find({ productId, status: "approved", isVisible: true }).sort({ createdAt: -1 }).lean();
        return res.status(200).json({ success: true, reviews });
      }
      if (method === "POST") {
        const body = req.body || {};
        const rating = Number(body.rating);
        if (!productId || !mongoose.isValidObjectId(productId) || !body.customerName || !body.comment || !Number.isFinite(rating) || rating < 1 || rating > 5) {
          return res.status(400).json({ success: false, error: "Product, customer name, rating and review comment are required" });
        }
        const review = await Review.create({ productId, customerName: String(body.customerName).trim(), customerEmail: String(body.customerEmail || body.email || "").trim().toLowerCase(), rating, comment: String(body.comment).trim(), isManual: false, status: "pending", isVisible: true });
        return res.status(201).json({ success: true, review, message: "Review submitted for moderation" });
      }
    }

    if (adminList && method === "GET") {
      const reviews = await Review.find().sort({ createdAt: -1 }).populate("productId", "title name").lean();
      return res.status(200).json({ success: true, reviews });
    }

    if (adminProductAdd && method === "POST") {
      const productId = decodeURIComponent(adminProductAdd[1]);
      const body = req.body || {};
      const rating = Number(body.rating || 5);
      if (!mongoose.isValidObjectId(productId) || !body.customerName || !body.comment || rating < 1 || rating > 5) return res.status(400).json({ success: false, error: "Valid product, customer name, rating and comment are required" });
      const review = await Review.create({ productId, customerName: String(body.customerName).trim(), customerEmail: String(body.customerEmail || body.email || "").trim().toLowerCase(), rating, comment: String(body.comment).trim(), isManual: true, status: "approved", isVisible: true });
      return res.status(201).json({ success: true, review });
    }

    if (adminReviewMatch) {
      const first = decodeURIComponent(adminReviewMatch[1]);
      const second = adminReviewMatch[2] ? decodeURIComponent(adminReviewMatch[2]) : "";
      const reviewId = second || first;
      if (!mongoose.isValidObjectId(reviewId)) return res.status(400).json({ success: false, error: "Invalid review id" });

      if (method === "PATCH") {
        const body = req.body || {};
        const allowed = ["pending", "approved", "hidden", "disapproved"];
        const update: any = {};
        if (body.status && allowed.includes(String(body.status))) { update.status = String(body.status); update.isVisible = body.status === "approved"; }
        if (body.isVisible !== undefined) update.isVisible = Boolean(body.isVisible);
        if (!Object.keys(update).length) return res.status(400).json({ success: false, error: "No valid review update supplied" });
        const review = await Review.findByIdAndUpdate(reviewId, update, { new: true }).lean();
        if (!review) return res.status(404).json({ success: false, error: "Review not found" });
        return res.status(200).json({ success: true, review });
      }

      if (method === "PUT") {
        const body = req.body || {};
        const update: any = {};
        if (body.customerName !== undefined) update.customerName = String(body.customerName).trim();
        if (body.customerEmail !== undefined || body.email !== undefined) update.customerEmail = String(body.customerEmail || body.email || "").trim().toLowerCase();
        if (body.comment !== undefined) update.comment = String(body.comment).trim();
        if (body.rating !== undefined) update.rating = Number(body.rating);
        if (body.status !== undefined) update.status = body.status;
        if (body.isVisible !== undefined) update.isVisible = Boolean(body.isVisible);
        if (!Object.keys(update).length) return res.status(400).json({ success: false, error: "No review changes supplied" });
        const review = await Review.findByIdAndUpdate(reviewId, update, { new: true, runValidators: true }).lean();
        if (!review) return res.status(404).json({ success: false, error: "Review not found" });
        return res.status(200).json({ success: true, review });
      }

      if (method === "DELETE") {
        const deleted = await Review.findByIdAndDelete(reviewId).lean();
        if (!deleted) return res.status(404).json({ success: false, error: "Review not found" });
        return res.status(200).json({ success: true, message: "Review deleted" });
      }
    }

    return res.status(405).json({ success: false, error: "Method not allowed" });
  } catch (error: any) {
    console.error("[reviews]", error);
    return res.status(500).json({ success: false, error: error?.message || "Review operation failed" });
  }
}
