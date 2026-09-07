import { ATELIER_CONFIG } from './AtelierAesthetics.js';

const escapeHtml = (value: any) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' } as any)[char]);

export const atelierBase = (content: string, previewText: string, themeColor = '#0B1220') => `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><meta name="x-apple-disable-message-reformatting"><title>${escapeHtml(ATELIER_CONFIG.brandName)}</title></head>
<body style="margin:0;padding:0;background:#F4F2EE;font-family:Arial,Helvetica,sans-serif;color:#171717;-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(previewText)}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#F4F2EE;padding:28px 8px;"><tr><td align="center">
<table role="presentation" width="700" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:700px;background:#fff;border:1px solid #D9DDE3;box-shadow:0 18px 55px rgba(15,23,42,.10);">
<tr><td style="height:5px;background:${themeColor};font-size:0;line-height:0;">&nbsp;</td></tr>
<tr><td align="center" style="padding:30px 24px 27px;background:#F7F5F1;border-bottom:1px solid #E1E5EA;">
<a href="${ATELIER_CONFIG.frontendUrl}" style="text-decoration:none;display:block;">
<img src="${ATELIER_CONFIG.logoUrl}" alt="${escapeHtml(ATELIER_CONFIG.brandName)}" width="168" style="display:block;width:168px;height:auto;max-height:105px;object-fit:contain;margin:0 auto 11px;" />
<div style="font-family:Georgia,'Times New Roman',serif;font-size:10px;letter-spacing:.42em;color:#0B1220;text-transform:uppercase;padding-left:.42em;">THE HOUSE OF ${escapeHtml(ATELIER_CONFIG.brandName)}</div>
</a></td></tr>
<tr><td style="height:1px;background:#CBD5E1;font-size:0;line-height:0;">&nbsp;</td></tr>
<tr><td style="padding:46px 42px 44px;background:#fff;">${content}</td></tr>
<tr><td style="padding:15px 20px;background:#F8FAFC;border-top:1px solid #E2E8F0;border-bottom:1px solid #E2E8F0;text-align:center;"><span style="font-size:9px;color:#6D665D;letter-spacing:.12em;text-transform:uppercase;">Curated quality</span><span style="color:#64748B;padding:0 12px;">•</span><span style="font-size:9px;color:#6D665D;letter-spacing:.12em;text-transform:uppercase;">Secure service</span><span style="color:#C7A45C;padding:0 12px;">•</span><span style="font-size:9px;color:#6D665D;letter-spacing:.12em;text-transform:uppercase;">Client care</span></td></tr>
<tr><td style="padding:30px 24px;background:#0B1220;text-align:center;">
<img src="${ATELIER_CONFIG.logoUrl}" alt="${escapeHtml(ATELIER_CONFIG.brandName)}" width="120" style="display:block;width:120px;height:auto;max-height:72px;object-fit:contain;margin:0 auto 13px;" />
<div style="font-family:Georgia,'Times New Roman',serif;font-size:11px;color:#F8FAFC;letter-spacing:.18em;text-transform:uppercase;">Private Client Services</div>
<div style="margin-top:16px;font-size:10px;line-height:1.8;">
<a href="${ATELIER_CONFIG.frontendUrl}/support?tab=privacy" style="color:#E2E8F0;text-decoration:none;">Privacy</a><span style="color:#64748B;padding:0 7px;">•</span>
<a href="${ATELIER_CONFIG.frontendUrl}/support?tab=returns" style="color:#E2E8F0;text-decoration:none;">Returns</a><span style="color:#555;padding:0 7px;">•</span>
<a href="${ATELIER_CONFIG.frontendUrl}/support?tab=faq" style="color:#E2E8F0;text-decoration:none;">FAQs</a><span style="color:#555;padding:0 7px;">•</span>
<a href="mailto:${ATELIER_CONFIG.supportEmail}" style="color:#E2E8F0;text-decoration:none;">Support</a></div>
<div style="margin-top:17px;font-size:9px;color:#94A3B8;">&copy; 2026 ${escapeHtml(ATELIER_CONFIG.brandName)}. All rights reserved.</div>
</td></tr></table></td></tr></table></body></html>`;
