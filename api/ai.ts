import { BRAND } from "../src/config/brand.js";

const reply = (res: any, status: number, body: any) => res.status(status).json(body);
const generate = async (apiKey: string, model: string, body: any) => {
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 7000);
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal, body: JSON.stringify(body)
    });
    const data: any = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(`${model}:${response.status}`);
    return data?.candidates?.[0]?.content?.parts?.map((part: any) => String(part?.text || "")).join("").trim() || "";
  } finally { clearTimeout(timer); }
};

export async function handleAI(req: any, res: any): Promise<boolean> {
  const url = String(req.url || "").split("?")[0];
  if (req.method !== "POST" || url !== "/api/ai/stylist") return false;
  const apiKey = process.env.GEMINI_API_KEY; const message = String(req.body?.message || "").trim();
  if (!apiKey) return reply(res, 503, { success: false, error: "AI service is not configured", text: "The AI stylist is temporarily unavailable." });
  if (!message) return reply(res, 400, { success: false, error: "Message is required", text: "Tell me what you are looking for." });
  const products = Array.isArray(req.body?.products) ? req.body.products.slice(0, 30) : [];
  const siteConfig = req.body?.siteConfig || {};
  const history = Array.isArray(req.body?.history) ? req.body.history.slice(-6) : [];
  const system = `You are ${BRAND.name}'s premium AI shopping stylist. Use ONLY the live browser store data supplied below. Never invent products, prices, stock, policies, links or social accounts. Keep replies concise and polished. If asked to open a product, output [NAV:PRODUCT:<id>]. For home/products/cart/login/profile/contact/FAQ output the matching [NAV:*] token. LIVE PRODUCTS: ${JSON.stringify(products)} LIVE SITE CONFIG: ${JSON.stringify(siteConfig)}`;
  const contents = [...history.map((m: any) => ({ role: m?.role === "model" ? "model" : "user", parts: [{ text: String(m?.text || m?.content || "") }] })), { role: "user", parts: [{ text: message }] }];
  const body = { systemInstruction: { parts: [{ text: system }] }, contents, generationConfig: { maxOutputTokens: 320 } };
  let last: any = null;
  for (const model of ["gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.6-flash", "gemini-3.5-flash", "gemini-2.5-flash"]) {
    try { const text = await generate(apiKey, model, body); if (text) return reply(res, 200, { success: true, text: String(text), model }); }
    catch (error) { last = error; console.warn(`[ai] ${model} unavailable`, error); }
  }
  console.error("[ai] all models failed", last);
  return reply(res, 503, { success: false, error: "AI service is temporarily unavailable. Please try again.", text: "The live stylist is taking a moment. Please try again." });
}
