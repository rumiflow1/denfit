import { ATELIER_CONFIG } from './AtelierAesthetics.js';
import { formatCurrency } from '../config/brand.js';

export const renderLine = () => `<div style="border-top:1px solid #E9E1D2;margin:28px 0;"></div>`;
export const renderButton = (text: string, path: string, color = '#0A0A0A') => `<div style="text-align:center;margin:30px 0;"><a href="${ATELIER_CONFIG.frontendUrl}${path}" style="background:${color};color:#fff !important;padding:15px 34px;text-decoration:none;font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;border-radius:2px;display:inline-block;">${text}</a></div>`;
const escapeHtml = (value: any) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' } as any)[char]);

export const renderTrendingGrid = (products: any[] = [], currency = 'USD') => {
  const live = Array.isArray(products) ? products.filter((p: any) => p && (p.id || p._id) && (p.name || p.title)).slice(0, 4) : [];
  if (!live.length) return `<div style="margin-top:34px;padding:22px;border:1px solid #E9E1D2;background:#FBF8F1;text-align:center;"><div style="font-size:10px;letter-spacing:.22em;color:#A78624;text-transform:uppercase;font-weight:700;">Trending now</div><div style="font-size:13px;color:#555;margin-top:8px;line-height:1.7;">Explore the current ${escapeHtml(ATELIER_CONFIG.brandName)} collection.</div>${renderButton('Explore Collection','/products','#0A0A0A')}</div>`;
  let html = `<div style="margin-top:40px;"><p style="text-align:center;font-size:10px;letter-spacing:.24em;color:#A78624;text-transform:uppercase;margin-bottom:20px;font-weight:700;">Trending now</p><table width="100%" cellspacing="0" cellpadding="0" border="0"><tr>`;
  live.forEach((p: any) => {
    const id = escapeHtml(p.id || p._id || ''); const name = escapeHtml(p.name || p.title || 'Collection Piece'); const image = escapeHtml(p.image || p.images?.[0] || '');
    const price = Number(p.price); const priceText = Number.isFinite(price) ? formatCurrency(price, currency) : '';
    html += `<td width="${live.length === 1 ? '100' : '25'}%" align="center" style="padding:0 6px 18px;vertical-align:top;"><a href="${ATELIER_CONFIG.frontendUrl}/product/${id}" style="text-decoration:none;color:#222;"><img src="${image}" width="100%" height="170" alt="${name}" style="display:block;margin-bottom:10px;border:1px solid #E9E1D2;object-fit:cover;"><div style="font-size:11px;font-weight:700;line-height:1.5;">${name}</div><div style="font-size:11px;color:#A78624;margin-top:5px;font-weight:600;">${priceText}</div></a></td>`;
  });
  return html + `</tr></table></div>`;
};

export const renderOrderItems = (items: any[] = [], currency = 'USD') => {
  const safe = Array.isArray(items) ? items.filter(Boolean) : [];
  if (!safe.length) return '';
  return `<div style="margin-top:30px;"><div style="font-size:10px;letter-spacing:.22em;color:#A78624;text-transform:uppercase;font-weight:700;margin-bottom:14px;">Your order</div>${safe.map((item: any) => { const name = escapeHtml(item.name || item.title || 'Collection Piece'); const image = escapeHtml(item.image || item.images?.[0] || ''); const qty = Number(item.quantity || 1); const price = Number(item.price || 0); return `<table width="100%" cellspacing="0" cellpadding="0" border="0" style="border-top:1px solid #E9E1D2;padding:12px 0;"><tr><td width="76" valign="top"><img src="${image}" width="64" height="82" alt="${name}" style="display:block;object-fit:cover;border:1px solid #E9E1D2;"></td><td valign="top" style="padding-left:14px;"><div style="font-size:13px;font-weight:700;color:#171717;">${name}</div><div style="font-size:11px;color:#777;margin-top:6px;">${item.size ? `Size: ${escapeHtml(item.size)} · ` : ''}${item.color ? `Color: ${escapeHtml(item.color)} · ` : ''}Qty: ${qty}</div></td><td align="right" valign="top" style="font-size:12px;font-weight:700;color:#171717;">${formatCurrency(price * qty, currency)}</td></tr></table>`; }).join('')}</div>`;
};

export const renderOrderSummary = (summary: any = {}, currency = 'USD') => {
  const row = (label: string, value: string, bold = false) => `<tr><td style="padding:6px 0;color:#666;font-size:12px;">${label}</td><td align="right" style="padding:6px 0;color:#171717;font-size:12px;${bold ? 'font-weight:700;font-size:15px;' : ''}">${value}</td></tr>`;
  const subtotal = Number(summary.subtotal ?? 0); const discount = Number(summary.discountAmount ?? 0); const shipping = Number(summary.shippingCost ?? 0); const total = Number(summary.totalAmount ?? 0);
  return `<div style="margin-top:18px;padding:18px 20px;background:#FBF8F1;border:1px solid #E9E1D2;"><table width="100%" cellspacing="0" cellpadding="0" border="0">${row('Subtotal', formatCurrency(subtotal, currency))}${discount > 0 ? row(`Discount${summary.discountCode ? ` (${escapeHtml(summary.discountCode)})` : ''}`, `-${formatCurrency(discount, currency)}`) : ''}${row('Shipping', shipping > 0 ? formatCurrency(shipping, currency) : 'Complimentary')}${row('Total', formatCurrency(total, currency), true)}</table></div>`;
};
