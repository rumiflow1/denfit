import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Product from '../models/Product.js';
import Config from '../models/Config.js';

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';

export const handleAIStylist = async (req: Request, res: Response) => {
  try {
    const { message, history } = req.body;
    if (!message || typeof message !== 'string') return res.status(400).json({ error:'No message provided' });

    const config:any = await Config.findOne({ key:'global' }).lean();
    const brandName = config?.branding?.brandName || config?.header?.logoText || process.env.BRAND_NAME || 'DENFIT';
    const aiSettings = config?.aiConcierge || {};
    if (aiSettings.isEnabled === false) return res.status(403).json({ error:'The assistant is temporarily unavailable. Please try again shortly.' });

    const apiKey = process.env.GEMINI_API_KEY || aiSettings.apiKey || '';
    if (!apiKey) return res.status(503).json({ error:'AI service is not configured yet. Please contact support.' });

    const products:any[] = await Product.find({ stock:{ $gt:0 } }).sort({ isFeatured:-1, isNewArrival:-1, createdAt:-1 }).limit(50).lean();
    const catalog = products.map(p => `- ${p.title || p.name}: ${p.price} (Category: ${p.category}, Stock: ${p.stock})`).join('\n');
    const systemInstruction = `${aiSettings.systemInstruction || `You are the premium shopping assistant for ${brandName}.`}

BRAND RULES:
- Be helpful, concise, friendly and accurate.
- Identify yourself honestly as the store's AI shopping assistant; never claim to be a human.
- Recommend only products present in the live catalogue below. Never invent prices, stock, names or product details.
- If a product is unavailable, say so and suggest an available alternative.
- If the user says Assalam-o-Alaikum, reply Walaikum Assalam.
- For navigation, use [NAV:HOME], [NAV:PRODUCTS], [NAV:CART], [NAV:LOGIN], [NAV:PROFILE], or [NAV:CONTACT].
- For a specific catalogue item, use [NAV:PRODUCT:Exact Product Title].
- For human help, use [EXT:WhatsApp Link] only when the configured storefront supports that route.

LIVE CATALOGUE:
${catalog}`;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model:MODEL, systemInstruction });
    const contents = Array.isArray(history) ? history.slice(-12).map((m:any)=>({ role:m.role==='user'?'user':'model', parts:[{ text:String(m.parts?.[0]?.text || m.text || '') }] })) : [];
    contents.push({ role:'user', parts:[{ text:message.trim() }] });

    const result = await model.generateContent({ contents });
    const text = result.response.text();
    if (!text) throw new Error('Empty AI response');
    return res.json({ text });
  } catch (error:any) {
    console.error('AI Stylist Error:', error);
    const status = error?.status === 429 || String(error?.message||'').includes('429') ? 429 : 500;
    const errorMessage = status === 429
      ? 'The stylist is receiving many requests right now. Please try again in a moment.'
      : 'The stylist is temporarily reconnecting. Please try again in a few seconds.';
    return res.status(status).json({ error:errorMessage });
  }
};
