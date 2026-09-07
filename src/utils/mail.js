import nodemailer from "nodemailer";
import mongoose from "mongoose";
import crypto from "crypto";

const MailDelivery = (mongoose.models.MailDelivery as any) || mongoose.model(
  "MailDelivery",
  new mongoose.Schema(
    {
      key: { type: String, required: true, unique: true, index: true },
      createdAt: { type: Date, default: Date.now, expires: 24 * 60 * 60 },
    },
    { collection: "mail_deliveries" }
  )
);

const normalizeKey = (to:any, subject:any, html:any, dedupeKey:any) => {
  const raw = String(dedupeKey || "").trim() || `${String(to).trim().toLowerCase()}|${String(subject).trim()}|${String(html).slice(0, 400)}`;
  return crypto.createHash("sha256").update(raw).digest("hex");
};

export async function sendTransactionalMail(to:any, subject:any, html:any, dedupeKey="") {
  const recipient = String(to || "").trim().toLowerCase();
  if (!recipient) throw new Error("Recipient email is required");
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) throw new Error("Email transport is not configured");

  const key = normalizeKey(recipient, subject, html, dedupeKey);
  try {
    await MailDelivery.create({ key });
  } catch (error:any) {
    if (error?.code === 11000) return { sent: false, duplicate: true };
    throw error;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    await transporter.sendMail({
      from: `"${process.env.BRAND_NAME || "DENFIT"}" <${process.env.EMAIL_USER}>`,
      to: recipient,
      subject: String(subject || ""),
      html: String(html || ""),
    });

    return { sent: true, duplicate: false };
  } catch (error) {
    await MailDelivery.deleteOne({ key }).catch(() => undefined);
    throw error;
  }
}
