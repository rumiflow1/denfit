import { BRAND } from "../src/config/brand.js";

const reply = (res: any, status: number, body: any) => res.status(status).json(body);

const generate = async (apiKey: string, model: string, body: any, timeoutMs: number) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify(body),
      }
    );
    const data: any = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(`${model}:${response.status}:${String(data?.error?.message || "")}`);
    return data?.candidates?.[0]?.content?.parts
      ?.map((part: any) => String(part?.text || ""))
      .join("")
      .trim() || "";
  } finally {
    clearTimeout(timer);
  }
};

export async function handleAI(req: any, res: any): Promise<boolean> {
  const url = String(req.url || "").split("?")[0];
  if (req.method !== "POST" || url !== "/api/ai/stylist") return false;

  const apiKey = String(process.env.GEMINI_API_KEY || "").trim();
  const message = String(req.body?.message || "").trim();

  if (!apiKey) {
    return reply(res, 503, {
      success: false,
      error: "AI service is not configured",
      text: "The AI stylist is temporarily unavailable.",
    });
  }
  if (!message) {
    return reply(res, 400, {
      success: false,
      error: "Message is required",
      text: "Tell me what you are looking for.",
    });
  }

  const products = Array.isArray(req.body?.products) ? req.body.products.slice(0, 24) : [];
  const siteConfig = req.body?.siteConfig || {};
  const history = Array.isArray(req.body?.history) ? req.body.history.slice(-4) : [];

  const system = `You are ${BRAND.name}'s premium shopping stylist. Use only the supplied live store data. Never invent products, prices, stock, policies, links or social accounts. Keep replies concise, natural and polished. Do not use decorative markdown stars. If asked to open a product, output exactly [NAV:PRODUCT:<id>]. For home/products/cart/login/profile/contact/FAQ use the matching [NAV:*] token. LIVE PRODUCTS: ${JSON.stringify(products)} LIVE SITE CONFIG: ${JSON.stringify(siteConfig)}`;

  const contents = [
    ...history.map((m: any) => ({
      role: m?.role === "model" ? "model" : "user",
      parts: [{ text: String(m?.text || m?.content || "") }],
    })),
    { role: "user", parts: [{ text: message }] },
  ];

  const base = {
    systemInstruction: { parts: [{ text: system }] },
    contents,
    generationConfig: { maxOutputTokens: 320, temperature: 0.65 },
  };

  const attempts: Array<{ model: string; timeout: number; body: any }> = [
    { model: "gemini-2.5-flash-lite", timeout: 4500, body: base },
    {
      model: "gemini-2.5-flash",
      timeout: 6000,
      body: {
        ...base,
        generationConfig: {
          ...base.generationConfig,
          thinkingConfig: { thinkingBudget: 0 },
        },
      },
    },
  ];

  let last: any = null;
  for (const attempt of attempts) {
    try {
      const text = await generate(apiKey, attempt.model, attempt.body, attempt.timeout);
      if (text) return reply(res, 200, { success: true, text, model: attempt.model });
    } catch (error) {
      last = error;
      console.warn("[ai]", attempt.model, "unavailable", error);
    }
  }

  console.error("[ai] all attempts failed", last);
  return reply(res, 503, {
    success: false,
    error: "AI service is temporarily unavailable. Please try again.",
    text: "The live stylist is taking a moment. Please try again.",
  });
}
