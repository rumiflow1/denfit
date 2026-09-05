import mongoose from "mongoose";
import { BRAND } from "../config/brand.js";

const MailDelivery = (mongoose.models.MailDelivery as any) || mongoose.model("MailDelivery", new mongoose.Schema({
  key: { type: String, unique: true, index: true },
  createdAt: { type: Date, default: Date.now, expires: 86400 },
}, { collection: "mail_deliveries" }));

export const emailImageUrl = (value: any) => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^\/\//.test(raw)) return `https:${raw}`;
  if (/^\//.test(raw)) return `${BRAND.siteUrl.replace(/\/$/, "")}${raw}`;
  return `${BRAND.siteUrl.replace(/\/$/, ")"}/${raw.replace(/^\.\//, "")}`;
};

export const claimEmail = async (key: string) => {
  const normalized = String(key || "").trim();
  if (!normalized) return true;
  try {
    await MailDelivery.create({ key: normalized });
    return true;
  } catch (error: any) {
    if (error?.code === 11000) return false;
    throw error;
  }
};

export const releaseEmailClaim = async (key: string) => {
  if (!key) return;
  try { await MailDelivery.deleteOne({ key }); } catch (error) { console.warn("[email-guard] release failed", error); }
};

export const sendTransactionalMail = async (to: string, subject: string, html: string, dedupeKey = "") => {
  if (!to || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) throw new Error("Email service is not configured");
  const claimed = await claimEmail(dedupeKey);
  if (!claimed) return { sent: false, duplicate: true };
  try {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.default.createTransport({ service: "gmail", auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS } });
    await transporter.sendMail({ from: `"${BRAND.name}" <${process.env.EMAIL_USER}>`, to, subject, html });
    return { sent: true, duplicate: false };
  } catch (error) {
    await releaseEmailClaim(dedupeKey);
    throw error;
  }
};
