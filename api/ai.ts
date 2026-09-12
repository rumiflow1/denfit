import { BRAND } from "../src/config/brand.js";

const reply = (res: any, status: number, body: any) => res.status(status).json(body);

const generate = async (apiKey: string, model: string, body: any, timeoutMs: number) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify(body),
    });
    const data: any = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(`${model}:${response.status}:${String(data?.error?.message || "")}`);
    return data?.candidates?.[0]?.content?.parts?.map((part: any) => String(part?.text || "")).join("").trim() || "";
  } finally { clearTimeout(timer); }
};

const localStylistReply = (message: string, products: any[], currency: string) => {
  const q = message.toLowerCase();
  const live = Array.isArray(products) ? products.filter((p:any) => p && (p.id || p._id) && (p.name || p.title)) : [];
  const pick = live.slice(0, 3);
  const money = (value:any) => Number.isFinite(Number(value)) ? `${currency} ${Number(value).toLocaleString()}` : '';
  if (!live.length) return `Welcome to ${BRAND.name}. I can help with styling, collections, sizing and orders. Tell me what you want to wear and I’ll guide you.`;
  if (/new|latest|arrival|trending/i.test(q)) return `Here are a few current ${BRAND.name} pieces worth exploring: ${pick.map((p:any) => `${p.name || p.title}${p.price ? ` (${money(p.price)})` : ''}`).join(', ')}.`;
  if (/price|cost|budget|cheap|expensive/i.test(q)) return `I can help compare prices. ${pick.map((p:any) => `${p.name || p.title}: ${money(p.discountPrice ?? p.price)}`).join(' · ')}.`;
  if (/order|track|shipping|delivery|return/i.test(q)) return `I can help with your order journey. For a specific order, open your profile and use the order details to view the latest status and tracking information.`;
  if (/recommend|style|wear|outfit|look|dress/i.test(q)) return `For a polished ${BRAND.name} look, I’d start with ${pick.map((p:any) => p.name || p.title).join(', ')}. Tell me your occasion, preferred colour and fit for a more precise recommendation.`;
  return `Absolutely. I’m your ${BRAND.name} style assistant. I can help you choose products, compare prices, plan an outfit, and navigate your order. What are you shopping for?`;
};

export async function handleAI(req: any, res: any): Promise<boolean> {
  const url = String(req.url || "").split("?")[0];
  if (req.method !== "POST" || url !== "/api/ai/stylist") return false;

  const apiKey = String(process.env.GEMINI_API_KEY || "").trim();
  const message = String(req.body?.message || "").trim();
  if (!message) return reply(res, 400, { success: false, error: "Message is required", text: "Tell me what you are looking for." });

  const products = Array.isArray(req.body?.products) ? req.body.products.slice(0, 24) : [];
  const siteConfig = req.body?.siteConfig || {};
  const currency = String(req.body?.currency || "PKR").toUpperCase();
  const history = Array.isArray(req.body?.history) ? req.body.history.slice(-6) : [];

  const system = `You are ${BRAND.name}'s premium shopping stylist. Use only supplied live store data. Never invent products, prices, stock, policies or links. Keep replies concise, natural and polished. Do not use decorative markdown. LIVE PRODUCTS: ${JSON.stringify(products)} LIVE SITE CONFIG: ${JSON.stringify(siteConfig)}`;
  const contents = [
    ...history.map((m:any) => ({ role: m?.role === "model" ? "model" : "user", parts: [{ text: String(m?.text || m?.content || "") }] })),
    { role: "user", parts: [{ text: message }] },
  ];
  const base = { systemInstruction: { parts: [{ text: system }] }, contents, generationConfig: { maxOutputTokens: 420, temperature: 0.65 } };
  const attempts = [
    { model: String(process.env.GEMINI_TEXT_MODEL || "gemini-2.5-flash-lite"), timeout: 12000, body: base },
    { model: "gemini-2.5-flash", timeout: 18000, body: base },
  ];

  if (apiKey) {
    for (const attempt of attempts) {
      try {
        const text = await generate(apiKey, attempt.model, attempt.body, attempt.timeout);
        if (text) return reply(res, 200, { success: true, text, model: attempt.model });
      } catch (error) { console.warn("[ai] provider attempt failed", attempt.model, error); }
    }
  }

  // The assistant remains usable even when an external AI key/provider is unavailable.
  return reply(res, 200, { success: true, text: localStylistReply(message, products, currency), model: "denfit-local-fallback" });
}
