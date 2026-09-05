import type { Request, Response } from "express";
import mongoose from "mongoose";
import app from "./index.js";
import { connectDB } from "./_shared.js";
import { handleRepair } from "./repair.js";
import { handleOrderRoutes } from "./orderRoutes.js";
import { handleCustomerRoutes } from "./customerRoutes.js";
import { handleMarketingRoutes } from "./marketingRoutes.js";
import { handleAI } from "./ai.js";
import { logAuthActivity } from "./activity.js";

export default async function handler(req: Request, res: Response) {
  if (req.url === "/api/health" || req.url === "/health") {
    try { await connectDB(); return res.status(200).json({ ok: true, database: mongoose.connection.readyState === 1 ? "connected" : "not-connected" }); }
    catch (error: any) { console.error("[health] database unavailable", error); return res.status(503).json({ ok: false, database: "unavailable", error: process.env.NODE_ENV === "production" ? "Database unavailable" : error?.message }); }
  }
  if (await handleAI(req, res)) return;
  if (await handleOrderRoutes(req, res)) return;
  if (await handleCustomerRoutes(req, res)) return;
  if (await handleMarketingRoutes(req, res)) return;
  if (await handleRepair(req, res)) return;
  try { await connectDB(); }
  catch (error: any) { console.error("[api] database initialization failed", error); return res.status(503).json({ success: false, error: "Database unavailable" }); }
  await logAuthActivity(req, res);
  return app(req, res);
}
