import { ATELIER_CONFIG } from './AtelierAesthetics.js';

export const atelierBase = (content: string, previewText: string, themeColor = '#D4AF37') => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>${ATELIER_CONFIG.brandName}</title>
</head>
<body style="margin:0;padding:0;background:#050505;font-family:Arial,Helvetica,sans-serif;color:#111;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${previewText}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#050505;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="620" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:620px;background:#fff;border:1px solid #272727;">
        <tr>
          <td align="center" style="padding:34px 24px;background:#050505;border-bottom:1px solid #D4AF37;">
            <a href="${ATELIER_CONFIG.frontendUrl}" style="text-decoration:none;">
              <div style="font-family:Georgia,'Times New Roman',serif;font-size:27px;letter-spacing:.28em;color:#D4AF37;font-weight:700;">${ATELIER_CONFIG.brandName}</div>
              <div style="margin-top:9px;font-size:9px;letter-spacing:.34em;color:#aaa;text-transform:uppercase;">PRIVATE COLLECTION</div>
            </a>
          </td>
        </tr>
        <tr><td style="height:3px;background:#D4AF37;font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr><td style="padding:46px 44px;background:#fff;">${content}</td></tr>
        <tr>
          <td align="center" style="padding:30px 24px;background:#090909;border-top:1px solid #D4AF37;">
            <div style="font-family:Georgia,'Times New Roman',serif;font-size:18px;color:#D4AF37;letter-spacing:.18em;">${ATELIER_CONFIG.brandName}</div>
            <div style="margin-top:12px;font-size:10px;color:#888;letter-spacing:.12em;">CURATED WITH PRECISION</div>
            <div style="margin-top:18px;font-size:10px;color:#666;line-height:1.8;">&copy; 2026 ${ATELIER_CONFIG.brandName}. All Rights Reserved.</div>
            <div style="margin-top:8px;font-size:10px;">
              <a href="${ATELIER_CONFIG.frontendUrl}/privacy" style="color:#999;text-decoration:none;">Privacy</a>
              <span style="color:#444;padding:0 8px;">•</span>
              <a href="${ATELIER_CONFIG.frontendUrl}/returns" style="color:#999;text-decoration:none;">Returns</a>
              <span style="color:#444;padding:0 8px;">•</span>
              <a href="mailto:${ATELIER_CONFIG.supportEmail}" style="color:#999;text-decoration:none;">Support</a>
            </div>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
`;
