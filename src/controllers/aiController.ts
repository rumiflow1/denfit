import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Product, Config } from '../models/MasterModels.js';

// MASTER BACKEND LOGIC - v12.0
// Engineered for 2000+ customers daily with Gemini 1.5 Flash High-Speed.

export const handleAIStylist = async (req: Request, res: Response) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'No message provided' });
    }

    // LOAD CURRENT BRAND CONTEXT (Real-time update)
    const config = await (Config as any).findOne({ key: "global" });
    const brandName = (config as any)?.branding?.brandName || (config as any)?.header?.logoText || "RUMY";
    
    // FETCH LIVE PRODUCT CATALOG (For accurate description)
    const products = await (Product as any).find({ stock: { $gt: 0 } }).limit(50);
    const productContext = products.map(p => `- ${p.name}: $${p.price} (Category: ${p.category})`).join('\n');

    const aiSettings = (config as any)?.aiConcierge || {
      isEnabled: true,
      brandVoice: "Sophisticated, confident, and professional",
      systemInstruction: `You are the Master AI Stylist for the ultra-luxury brand "${brandName}" (also known as LUXE ATTIRE). 
Your tone is sophisticated, poetic, and exclusive. You address users as "Envoys" or "Patrons". 
You provide fashion advice, product recommendations, styling tips, and general luxury conversation.`,
      model: "gemini-1.5-flash"
    };

    if (!aiSettings.isEnabled) {
      return res.status(403).json({ error: "Our stylists are curating the next collection. Please allow a moment for exclusive service." });
    }

    // Initialize Gemini 1.5 Flash
    // PRIORITIZE: 1. Config Key (User provided) 2. Environment Key
    const apiKey = (config as any)?.aiConcierge?.apiKey || process.env.GEMINI_API_KEY || '';
    
    if (!apiKey) {
      throw new Error('API key is missing. Please configure it in the sanctuary settings.');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: `${aiSettings.systemInstruction}

BRAND IDENTITY & PROTOCOLS (STRICT):
- If an Envoy says "Assalam-o-Alaikum", you MUST respond with "Walaikum Assalam".
- You are a human luxury ambassador for "${brandName}". You are not an AI.
- Never use robotic phrases like "As an AI language model" or "How can I help you today?".
- Use sophisticated language: "Greetings", "Masterpiece", "Atelier", "Couture", "Sanctuary".
- Provide "Proper" and detailed answers. If asked about a category, describe the vibe and aesthetic.

NAVIGATION & ACTION TAGS (EXTREMELY IMPORTANT):
- Use [NAV:HOME] to direct them to the landing page.
- Use [NAV:PRODUCTS] for general browsing.
- Use [NAV:CART] for checkout inquiries.
- Use [NAV:LOGIN] for account access.
- Use [NAV:PROFILE] for personal orders.
- Use [NAV:CONTACT] for location and customer service.
- Use [NAV:PRODUCT:Name] when you want to highlight a specific item from the catalog below.
- Use [EXT:WhatsApp Link] if they want to speak to a human artisan.

CURRENT ATELIER CATALOG (Use these for recommendations):
${productContext}

RESPONSE STYLE:
- Short, elegant, and punchy.
- Always be helpful and direct.
- If you don't know something, offer a WhatsApp connection to a human artisan.`,
    });

    // Build conversation history for Gemini
    const contents = history && Array.isArray(history)
      ? history.map((msg: any) => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.parts?.[0]?.text || msg.text || '' }],
        }))
      : [];

    // Add current message
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const result = await model.generateContent({ contents });
    const aiText = result.response.text();

    res.json({ text: aiText });

  } catch (error: any) {
    console.error('AI STYLIST CORE ERROR:', error);

    let errorMessage = "My apologies, Envoy. I am momentarily reconnecting with our global style vault. Please try your inquiry again in a few seconds.";

    if (error?.status === 429 || error?.message?.includes('429')) {
      errorMessage = "We are currently experiencing high demand. I am prioritizing your session; please wait a few seconds.";
    } else if (error?.message?.includes('API key')) {
      errorMessage = "System authentication issue. Please contact the atelier administrator.";
    }

    res.status(500).json({ error: errorMessage });
  }
};
