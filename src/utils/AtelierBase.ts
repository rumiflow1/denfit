import { ATELIER_CONFIG } from './AtelierAesthetics.js';

export const atelierBase = (content: string, previewText: string, themeColor = '#D4AF37') => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>${ATELIER_CONFIG.brandName}</title>
</head>
<body style="margin:0;padding:0;background:#F5F1E8;font-family:Arial,Helvetica,sans-serif;color:#171717;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${previewText}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#F5F1E8;padding:28px 10px;">
    <tr><td align="center">
      <table role="presentation" width="640" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:640px;background:#fff;border:1px solid #DED4C0;box-shadow:0 12px 40px rgba(20,16,8,.08);">
        <tr><td style="height:5px;background:#D4AF37;font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr><td align="center" style="padding:34px 24px 28px;background:#0A0A0A;">
          <a href="${ATELIER_CONFIG.frontendUrl}" style="text-decoration:none;display:block;">
            <div style="font-family:Georgia,'Times New Roman',serif;font-size:29px;letter-spacing:.28em;color:#D4AF37;font-weight:700;text-transform:uppercase;">${ATELIER_CONFIG.brandName}</div>
            <div style="margin-top:10px;font-size:9px;letter-spacing:.38em;color:#E8E0CF;text-transform:uppercase;">THE HOUSE OF CURATED STYLE</div>
          </a>
        </td></tr>
        <tr><td style="padding:7px 18px;background:#D4AF37;color:#0A0A0A;text-align:center;font-size:9px;font-weight:700;letter-spacing:.24em;text-transform:uppercase;">Private Client Communication</td></tr>
        <tr><td style="padding:46px 42px 38px;background:#fff;">${content}</td></tr>
        <tr><td style="padding:30px 26px;background:#0A0A0A;border-top:1px solid #D4AF37;text-align:center;">
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:19px;color:#D4AF37;letter-spacing:.2em;text-transform:uppercase;">${ATELIER_CONFIG.brandName}</div>
          <div style="margin-top:10px;font-size:9px;color:#B9B1A2;letter-spacing:.2em;text-transform:uppercase;">Crafted for the modern wardrobe</div>
          <div style="margin-top:18px;font-size:10px;color:#888;line-height:1.8;">Curated collections • Secure checkout • Dedicated support</div>
          <div style="margin-top:14px;font-size:10px;">
            <a href="${ATELIER_CONFIG.frontendUrl}/support?tab=privacy" style="color:#D4AF37;text-decoration:none;">Privacy Policy</a>
            <span style="color:#555;padding:0 8px;">•</span>
            <a href="${ATELIER_CONFIG.frontendUrl}/support?tab=returns" style="color:#D4AF37;text-decoration:none;">Returns</a>
            <span style="color:#555;padding:0 8px;">•</span>
            <a href="mailto:${ATELIER_CONFIG.supportEmail}" style="color:#D4AF37;text-decoration:none;">Support</a>
          </div>
          <div style="margin-top:18px;font-size:9px;color:#666;line-height:1.7;">&copy; 2026 ${ATELIER_CONFIG.brandName}. All Rights Reserved.</div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
`;
