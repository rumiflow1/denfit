import { ATELIER_CONFIG } from './AtelierAesthetics.js';

const escapeHtml = (value: any) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' } as any)[char]);

export const atelierBase = (content: string, previewText: string, themeColor = '#D4AF37') => `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><meta name="x-apple-disable-message-reformatting"><title>${escapeHtml(ATELIER_CONFIG.brandName)}</title></head>
<body style="margin:0;padding:0;background:#F4F0E8;font-family:Arial,Helvetica,sans-serif;color:#171717;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(previewText)}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#F4F0E8;padding:24px 8px;"><tr><td align="center">
<table role="presentation" width="680" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:680px;background:#fff;border:1px solid #DCCFB9;box-shadow:0 12px 40px rgba(0,0,0,.08);">
<tr><td style="height:4px;background:${themeColor};font-size:0;line-height:0;">&nbsp;</td></tr>
<tr><td align="center" style="padding:26px 24px 24px;background:#090909;">
<a href="${ATELIER_CONFIG.frontendUrl}" style="text-decoration:none;display:block;">
<img src="${ATELIER_CONFIG.logoUrl}" alt="${escapeHtml(ATELIER_CONFIG.brandName)}" width="150" style="display:block;width:150px;height:auto;max-height:100px;object-fit:contain;margin:0 auto 10px;" />
<div style="font-size:9px;letter-spacing:.32em;color:#D8D0C2;text-transform:uppercase;">Premium Collection</div>
</a></td></tr>
<tr><td style="height:1px;background:#D4AF37;font-size:0;line-height:0;">&nbsp;</td></tr>
<tr><td style="padding:42px 38px 40px;background:#fff;">${content}</td></tr>
<tr><td style="padding:28px 24px;background:#090909;text-align:center;">
<img src="${ATELIER_CONFIG.logoUrl}" alt="${escapeHtml(ATELIER_CONFIG.brandName)}" width="115" style="display:block;width:115px;height:auto;max-height:70px;object-fit:contain;margin:0 auto 12px;" />
<div style="font-size:10px;color:#A9A39A;letter-spacing:.14em;">Premium fashion, curated with care.</div>
<div style="margin-top:17px;font-size:10px;line-height:1.8;">
<a href="${ATELIER_CONFIG.frontendUrl}/support?tab=privacy" style="color:#D4AF37;text-decoration:none;">Privacy</a><span style="color:#555;padding:0 7px;">•</span>
<a href="${ATELIER_CONFIG.frontendUrl}/support?tab=returns" style="color:#D4AF37;text-decoration:none;">Returns</a><span style="color:#555;padding:0 7px;">•</span>
<a href="${ATELIER_CONFIG.frontendUrl}/support?tab=faq" style="color:#D4AF37;text-decoration:none;">FAQs</a><span style="color:#555;padding:0 7px;">•</span>
<a href="mailto:${ATELIER_CONFIG.supportEmail}" style="color:#D4AF37;text-decoration:none;">Support</a></div>
<div style="margin-top:16px;font-size:9px;color:#666;">&copy; 2026 ${escapeHtml(ATELIER_CONFIG.brandName)}. All rights reserved.</div>
</td></tr></table></td></tr></table></body></html>`;
