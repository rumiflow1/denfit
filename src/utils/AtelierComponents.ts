import { ATELIER_CONFIG, TRENDING_PIECES } from './AtelierAesthetics.js';

export const renderLine = () => `<div style="border-top: 1px solid #eeeeee; margin: 25px 0;"></div>`;

export const renderButton = (text: string, path: string, color: string) => `
    <div style="text-align: center; margin: 30px 0;">
        <a href="${ATELIER_CONFIG.frontendUrl}${path}" style="background-color: ${color}; color: #ffffff !important; padding: 14px 35px; text-decoration: none; font-size: 12px; font-weight: bold; border-radius: 4px; display: inline-block;">
            ${text}
        </a>
    </div>
`;

export const renderTrendingGrid = () => {
    let html = `
    <div style="margin-top: 40px;">
        <p style="text-align: center; font-size: 11px; letter-spacing: 0.2em; color: #C5A059; text-transform: uppercase; margin-bottom: 20px;">Trending Masterpieces</p>
        <table width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>`;
    TRENDING_PIECES.forEach(p => {
        html += `
            <td width="50%" align="center" style="padding: 0 10px;">
                <a href="${ATELIER_CONFIG.frontendUrl}/product/${p.id}" style="text-decoration: none; color: #333;">
                    <img src="${p.img}" width="100%" style="display: block; margin-bottom: 10px; border: 1px solid #eee;">
                    <div style="font-size: 11px; font-weight: bold;">${p.name}</div>
                    <div style="font-size: 11px; color: #C5A059; margin-top: 4px;">$${p.price}</div>
                </a>
            </td>`;
    });
    return html + `</tr></table></div>`;
};