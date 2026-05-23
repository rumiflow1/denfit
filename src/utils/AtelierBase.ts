import { ATELIER_CONFIG } from './AtelierAesthetics.js';

export const atelierBase = (content: string, previewText: string, themeColor: string) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@300;400;600&display=swap');
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Inter', sans-serif;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f4f4; padding: 30px 0;">
        <tr>
            <td align="center">
                <!-- MAIN BOX START -->
                <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border: 1px solid #dddddd; border-radius: 4px; overflow: hidden;">
                    <!-- LOGO SECTION -->
                    <tr>
                        <td align="center" style="padding: 30px 0; border-bottom: 1px solid #eeeeee;">
                            <a href="${ATELIER_CONFIG.frontendUrl}" style="text-decoration: none;">
                                <span style="font-family: 'Playfair Display', serif; font-size: 28px; letter-spacing: 0.4em; color: #000; font-weight: bold;">${ATELIER_CONFIG.brandName}</span>
                            </a>
                        </td>
                    </tr>
                    <!-- CONTENT SECTION -->
                    <tr>
                        <td style="padding: 40px 50px;">
                            ${content}
                        </td>
                    </tr>
                    <!-- FOOTER SECTION -->
                    <tr>
                        <td align="center" style="padding: 30px; background-color: #fafafa; border-top: 1px solid #eeeeee;">
                            <div style="font-size: 11px; color: #999999; letter-spacing: 0.1em; margin-bottom: 10px;">
                                &copy; 2026 ${ATELIER_CONFIG.brandName}. All Rights Reserved.
                            </div>
                            <div style="font-size: 10px; color: #bbbbbb;">
                                <a href="${ATELIER_CONFIG.frontendUrl}/privacy" style="color: #bbbbbb; text-decoration: underline;">Privacy Policy</a> | 
                                <a href="${ATELIER_CONFIG.frontendUrl}/returns" style="color: #bbbbbb; text-decoration: underline;">Returns</a>
                            </div>
                        </td>
                    </tr>
                </table>
                <!-- MAIN BOX END -->
            </td>
        </tr>
    </table>
</body>
</html>
`;