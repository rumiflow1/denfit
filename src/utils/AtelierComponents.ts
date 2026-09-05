import { ATELIER_CONFIG } from './AtelierAesthetics.js';

export const renderLine = () => `<div style="border-top:1px solid #E9E1D2;margin:28px 0;"></div>`;

export const renderButton = (text: string, path: string, color = '#0A0A0A') => `
  <div style="text-align:center;margin:30px 0;">
    <a href="${ATELIER_CONFIG.frontendUrl}${path}" style="background:${color};color:#fff !important;padding:15px 34px;text-decoration:none;font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;border-radius:2px;display:inline-block;">${text}</a>
  </div>
`;

const escapeHtml = (value: any) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' } as any)[char]);

export const renderTrendingGrid = (products: any[] = []) => {
  const live = Array.isArray(products) ? products.filter(Boolean).slice(0, 4) : [];
  if (!live.length) return `<div style="margin-top:34px;padding:22px;border:1px solid #E9E1D2;background:#FBF8F1;text-align:center;"><div style="font-size:10px;letter-spacing:.22em;color:#A78624;text-transform:uppercase;font-weight:700;">The Live Collection</div><div style="font-size:13px;color:#555;margin-top:8px;line-height:1.7;">Explore the current collection directly on ${escapeHtml(ATELIER_CONFIG.brandName)}. Product recommendations are never fabricated.</div>${renderButton('Explore Collection','/products','#0A0A0A')}</div>`;
  let html = `<div style="margin-top:40px;"><p style="text-align:center;font-size:10px;letter-spacing:.24em;color:#A78624;text-transform:uppercase;margin-bottom:20px;font-weight:700;">From the Live Collection</p><table width="100%" cellspacing="0" cellpadding="0" border="0"><tr>`;
  live.forEach((p: any) => {
    const id = escapeHtml(p.id || p._id || '');
    const name = escapeHtml(p.name || p.title || 'Collection Piece');
    const image = escapeHtml(p.image || p.images?.[0] || '');
    const price = Number(p.price);
    const priceText = Number.isFinite(price) ? `${price.toLocaleString()} ${p.currency || 'PKR'}` : '';
    html += `<td width="${live.length === 1 ? '100' : '50'}%" align="center" style="padding:0 8px 18px;vertical-align:top;"><a href="${ATELIER_CONFIG.frontendUrl}/product/${id}" style="text-decoration:none;color:#222;"><img src="${image}" width="100%" alt="${name}" style="display:block;margin-bottom:10px;border:1px solid #E9E1D2;object-fit:cover;"><div style="font-size:11px;font-weight:700;line-height:1.5;">${name}</div><div style="font-size:11px;color:#A78624;margin-top:5px;font-weight:600;">${priceText}</div></a></td>`;
  });
  return html + `</tr></table></div>`;
};
