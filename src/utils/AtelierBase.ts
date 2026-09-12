import { ATELIER_CONFIG } from './AtelierAesthetics.js';

const escapeHtml = (value: any) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' } as any)[char]);

export const atelierBase = (content: string, previewText: string, themeColor = '#0B1220') => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>${escapeHtml(ATELIER_CONFIG.brandName)}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #F4F2EE; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #171717; -webkit-text-size-adjust: 100%; }
    .container { max-width: 680px; margin: 0 auto; background-color: #FFFFFF; border: 1px solid #E1E5EA; }
    .header { padding: 40px 24px 32px; background-color: #F7F5F1; border-bottom: 1px solid #E1E5EA; text-align: center; }
    .brand-name { font-family: Georgia, 'Times New Roman', serif; font-size: 11px; letter-spacing: 0.35em; color: #0B1220; text-transform: uppercase; margin-top: 12px; }
    .content { padding: 48px 40px; background-color: #FFFFFF; line-height: 1.6; font-size: 15px; color: #333333; }
    .footer { padding: 32px 24px; background-color: #0B1220; text-align: center; }
    .footer-text { font-size: 10px; color: #94A3B8; letter-spacing: 0.1em; text-transform: uppercase; margin-top: 16px; }
    .footer-link { color: #E2E8F0; text-decoration: none; font-size: 11px; }
    .divider { color: #64748B; padding: 0 10px; }
  </style>
</head>
<body style="margin:0;padding:0;background:#F4F2EE;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(previewText)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#F4F2EE;padding:28px 8px;">
    <tr><td align="center">
      <table role="presentation" class="container" width="100%" cellspacing="0" cellpadding="0" border="0">
        <!-- Top Accent Line -->
        <tr><td style="height:4px;background:${themeColor};font-size:0;line-height:0;">&nbsp;</td></tr>
        
        <!-- Header with Logo -->
        <tr><td class="header" align="center">
          <a href="${ATELIER_CONFIG.frontendUrl}" style="text-decoration:none;display:inline-block;">
            <img src="${ATELIER_CONFIG.logoUrl}" alt="${escapeHtml(ATELIER_CONFIG.brandName)}" width="140" style="display:block;width:140px;height:auto;max-height:90px;object-fit:contain;margin:0 auto;" />
            <div class="brand-name">The House of ${escapeHtml(ATELIER_CONFIG.brandName)}</div>
          </a>
        </td></tr>
        
        <!-- Main Content -->
        <tr><td class="content">
          ${content}
        </td></tr>
        
        <!-- Trust Badges -->
        <tr><td style="padding:20px;background:#F8FAFC;border-top:1px solid #E2E8F0;border-bottom:1px solid #E2E8F0;text-align:center;">
          <span style="font-size:9px;color:#6D665D;letter-spacing:0.15em;text-transform:uppercase;">Curated Quality</span>
          <span class="divider">•</span>
          <span style="font-size:9px;color:#6D665D;letter-spacing:0.15em;text-transform:uppercase;">Secure Service</span>
          <span class="divider">•</span>
          <span style="font-size:9px;color:#6D665D;letter-spacing:0.15em;text-transform:uppercase;">Client Care</span>
        </td></tr>
        
        <!-- Footer -->
        <tr><td class="footer">
          <img src="${ATELIER_CONFIG.logoUrl}" alt="${escapeHtml(ATELIER_CONFIG.brandName)}" width="100" style="display:block;width:100px;height:auto;max-height:60px;object-fit:contain;margin:0 auto 12px;opacity:0.9;" />
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:11px;color:#F8FAFC;letter-spacing:0.2em;text-transform:uppercase;">Private Client Services</div>
          <div style="margin-top:16px;font-size:10px;line-height:1.8;">
            <a href="${ATELIER_CONFIG.frontendUrl}/support?tab=privacy" class="footer-link">Privacy</a>
            <span class="divider">•</span>
            <a href="${ATELIER_CONFIG.frontendUrl}/support?tab=returns" class="footer-link">Returns</a>
            <span class="divider">•</span>
            <a href="${ATELIER_CONFIG.frontendUrl}/support?tab=faq" class="footer-link">FAQs</a>
            <span class="divider">•</span>
            <a href="mailto:${ATELIER_CONFIG.supportEmail}" class="footer-link">Support</a>
          </div>
          <div class="footer-text">&copy; 2026 ${escapeHtml(ATELIER_CONFIG.brandName)}. All rights reserved.</div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
