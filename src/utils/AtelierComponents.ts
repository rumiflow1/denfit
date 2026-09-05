import { ATELIER_CONFIG } from './AtelierAesthetics.js';
import { formatCurrency } from '../config/brand.js';
import { emailImageUrl } from './mail.js';

export const renderLine = () => `<div style="border-top:1px solid #E9E1D2;margin:30px 0;"></div>`;
export const renderButton = (text: string, path: string, color = '#0A0A0A') => `<div style="text-align:center;margin:30px 0;"><a href="${ATELIER_CONFIG.frontendUrl}${path}" style="background:${color};color:#fff !important;padding:15px 34px;text-decoration:none;font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;border-radius:2px;display:inline-block;">${text}</a></div>`;
const escapeHtml = (value: any) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' } as any)[char]);

export const renderTrendingGrid = (products: any[] = [], currency = 'USD') => {
  const live = Array.isArray(products) ? products.filter((p: any) => p && (p.id || p._id) && (p.name || p.title)).slice(0, 4) : [];
  if (!live.length) return `<div style="margin-top:38px;padding:26px;border:1px solid #E5D8C5;background:#FBF8F1;text-align:center;"><div style="font-size:10px;letter-spacing:.25em;color:#A78624;text-transform:uppercase;font-weight:700;">Curated for you</div><div style="font-size:13px;color:#555;margin-top:9px;line-height:1.7;">Explore the current ${escapeHtml(ATELIER_CONFIG.brandName)} collection.</div>${renderButton('Explore Collection','/products','#0A0A0A')}</div>`;
  let html = `<div style="margin-top:42px;padding-top:4px;"><p style="text-align:center;font-family:Georgia,'Times New Roman',serif;font-size:19px;letter-spacing:.18em;color:#171717;text-transform:uppercase;margin:0 0 7px;">Trending now</p><div style="width:42px;border-top:2px solid #D4AF37;margin:0 auto 22px;"></div><table width="100%" cellspacing="0" cellpadding="0" border="0"><tr>`;
  live.forEach((p: any) => {
    const id = escapeHtml(p.id || p._id || ''); const name = escapeHtml(p.name || p.title || 'Collection Piece');
    const rawImage = p.image || p.images?.[0] || ''; const image = escapeHtml(emailImageUrl(rawImage));
    const price = Number(p.price); const priceText = Number.isFinite(price) ? formatCurrency(price, currency) : '';
    const imageMarkup = image ? `<img src="${image}" width="145" height="175" alt="${name}" style="display:block;width:100%;height:175px;margin-bottom:12px;border:1px solid #E9E1D2;object-fit:cover;background:#F3EEE5;" />` : `<div style="width:100%;height:175px;background:#F3EEE5;border:1px solid #E9E1D2;line-height:175px;text-align:center;color:#A78624;font-size:10px;letter-spacing:.12em;">VIEW PIECE</div>`;
    html += `<td width="${live.length === 1 ? '100' : '25'}%" align="center" style="padding:0 5px 18px;vertical-align:top;"><a href="${ATELIER_CONFIG.frontendUrl}/product/${id}" style="text-decoration:none;color:#222;display:block;">${imageMarkup}<div style="font-size:11px;font-weight:700;line-height:1.5;min-height:31px;">${name}</div><div style="font-size:11px;color:#A78624;margin-top:5px;font-weight:600;">${priceText}</div></a></td>`;
  });
  return html + `</tr></table></div>`;
};

export const renderOrderItems = (items: any[] = [], currency = 'USD') => {
  const safe = Array.isArray(items) ? items.filter(Boolean) : [];
  if (!safe.length) return '';
  return `<div style="margin-top:32px;"><div style="font-family:Georgia,'Times New Roman',serif;font-size:19px;letter-spacing:.16em;color:#171717;text-transform:uppercase;margin-bottom:14px;">Your order</div>${safe.map((item: any) => { const name = escapeHtml(item.name || item.title || 'Collection Piece'); const image = escapeHtml(emailImageUrl(item.image || item.images?.[0] || '')); const qty = Number(item.quantity || 1); const price = Number(item.price || 0); const imageMarkup = image ? `<img src="${image}" width="64" height="82" alt="${name}" style="display:block;object-fit:cover;border:1px solid #E9E1D2;background:#F3EEE5;">` : `<div style="width:64px;height:82px;background:#F3EEE5;border:1px solid #E9E1D2;"></div>`; return `<table width="100%" cellspacing="0" cellpadding="0" border="0" style="border-top:1px solid #E9E1D2;"><tr><td width="76" valign="top" style="padding:12px 0;">${imageMarkup}</td><td valign="top" style="padding:14px 10px 12px 14px;"><div style="font-size:13px;font-weight:700;color:#171717;">${name}</div><div style="font-size:11px;color:#777;margin-top:6px;line-height:1.7;">${item.size ? `Size: ${escapeHtml(item.size)} · ` : ''}${item.color ? `Color: ${escapeHtml(item.color)} · ` : ''}Qty: ${qty}</div></td><td align="right" valign="top" style="padding:14px 0 12px;font-size:12px;font-weight:700;color:#171717;">${formatCurrency(price * qty, currency)}</td></tr></table>`; }).join('')}</div>`;
};

export const renderOrderSummary = (summary: any = {}, currency = 'USD') => {
  const row = (label: string, value: string, bold = false) => `<tr><td style="padding:7px 0;color:#666;font-size:12px;">${label}</td><td align="right" style="padding:7px 0;color:#171717;font-size:12px;${bold ? 'font-weight:700;font-size:16px;' : ''}">${value}</td></tr>`;
  const subtotal = Number(summary.subtotal ?? 0); const discount = Number(summary.discountAmount ?? 0); const shipping = Number(summary.shippingCost ?? 0); const total = Number(summary.totalAmount ?? 0);
  return `<div style="margin-top:20px;padding:20px;background:#FBF8F1;border:1px solid #E5D8C5;"><table width="100%" cellspacing="0" cellpadding="0" border="0">${row('Subtotal', formatCurrency(subtotal, currency))}${discount > 0 ? row(`Discount${summary.discountCode ? ` (${escapeHtml(summary.discountCode)})` : ''}`, `-${formatCurrency(discount, currency)}`) : ''}${row('Shipping', shipping > 0 ? formatCurrency(shipping, currency) : 'Complimentary')}${row('Total', formatCurrency(total, currency), true)}</table></div>`;
};
