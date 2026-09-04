import { atelierBase } from './AtelierBase.js';
import { ATELIER_CONFIG, ATELIER_THEMES } from './AtelierAesthetics.js';
import { renderButton, renderLine, renderTrendingGrid } from './AtelierComponents.js';

export const getSignupEmail = (name: string) => {
    const theme = ATELIER_THEMES.signup;
    const content = `<div style="font-size:10px;color:${theme.accent};letter-spacing:.3em;margin-bottom:25px;text-transform:uppercase;font-weight:600">Patronage Established</div><h2 style="color:${theme.primary};font-family:'Playfair Display',serif;font-size:32px;font-weight:400;margin-bottom:30px;line-height:1.2">Welcome to ${ATELIER_CONFIG.brandName}, <b>${name}</b></h2><p style="color:#555;line-height:1.8;font-size:15px">Your account is now active and ready for your curated shopping experience.</p>${renderLine()}${renderButton('Enter Your Account','/profile',theme.primary)}${renderLine()}${renderTrendingGrid()}`;
    return atelierBase(content, `Welcome to ${ATELIER_CONFIG.brandName}`, theme.primary);
};
export const getLoginEmail = (name: string) => {
    const theme = ATELIER_THEMES.login;
    const content = `<h2 style="color:#0F0F0F;font-family:'Playfair Display',serif;font-size:28px;font-weight:400;margin-bottom:30px">Secure Access Detected</h2><p style="color:#666;line-height:1.8">Dear <b>${name}</b>, our system detected a successful sign-in to your ${ATELIER_CONFIG.brandName} account at <b>${new Date().toLocaleTimeString()}</b>.</p><p style="color:#888;font-size:13px;margin-top:20px">If this access was not authorized by you, please secure your credentials immediately.</p>${renderLine()}${renderButton('Open Your Account','/profile','#0F0F0F')}${renderLine()}${renderTrendingGrid()}`;
    return atelierBase(content, `${ATELIER_CONFIG.brandName} | Login Notification`, theme.primary);
};
export const getOrderEmail = (name: string, orderId: string, total: string) => {
    const theme = ATELIER_THEMES.order;
    const content = `<h2 style="color:${theme.primary};font-family:'Playfair Display',serif;font-size:30px;font-weight:400;margin-bottom:25px">Order Confirmed, <b>${name}</b></h2><p style="color:#555;line-height:1.8">Thank you for shopping with ${ATELIER_CONFIG.brandName}. Your selected pieces have been secured and are being prepared for shipment.</p>${renderLine()}<div style="background-color:#FDFCFB;padding:20px;border:1px solid #F3E5D8"><p style="margin:5px 0;font-size:14px"><b>Order Identifier:</b> <span style="color:${theme.primary}">#${orderId}</span></p><p style="margin:5px 0;font-size:18px;color:#0F0F0F"><b>Total Value: $${total}</b></p></div>${renderLine()}${renderButton('Track Your Order','/orders',theme.primary)}`;
    return atelierBase(content, `${ATELIER_CONFIG.brandName} | Order Confirmed`, theme.primary);
};
export const getAbandonedCartEmail = (name: string) => {
    const theme = ATELIER_THEMES.cart;
    const content = `<div style="font-size:10px;color:${theme.accent};letter-spacing:.3em;margin-bottom:25px;text-transform:uppercase">Selection Reminder</div><h2 style="color:${theme.primary};font-family:'Playfair Display',serif;font-size:32px;font-weight:400;margin-bottom:35px">Your Selection Awaits</h2><p style="color:#555;line-height:1.8">Dear <b>${name}</b>, the pieces you selected are still waiting in your private cart.</p><div style="border:1px dashed #C5A059;padding:35px;margin:40px 0;text-align:center;background-color:#FDFCFB"><p style="margin:0;font-size:11px;color:#888;letter-spacing:.2em">PRIVATE OFFER (10% OFF)</p><h3 style="margin:10px 0 0;font-size:32px;letter-spacing:.4em;font-family:'Playfair Display',serif;color:#0F0F0F">SOVEREIGN10</h3></div>${renderLine()}${renderButton('Restore Your Selection','/cart',theme.primary)}${renderLine()}${renderTrendingGrid()}`;
    return atelierBase(content, `${ATELIER_CONFIG.brandName} | Your Selection Awaits`, theme.primary);
};
export const getOTPEmail = (otp: string) => {
    const theme = ATELIER_THEMES.reset;
    const content = `<h2 style="color:${theme.primary};font-family:'Playfair Display',serif;font-size:28px;font-weight:400;margin-bottom:30px">Account Recovery</h2><p style="color:#555;line-height:1.8">Use the following secure code to continue resetting your ${ATELIER_CONFIG.brandName} account password.</p><div style="background-color:#F9F8F6;padding:30px;font-size:40px;letter-spacing:.6em;color:#0F0F0F;margin:30px 0;border:1px solid #EAEAEA;text-align:center;font-weight:bold">${otp}</div><p style="font-size:12px;color:#999;text-align:center">This code expires in 10 minutes.</p>${renderLine()}${renderTrendingGrid()}`;
    return atelierBase(content, `${ATELIER_CONFIG.brandName} | Secure Access Key`, theme.primary);
};
export const getWishlistEmail = (name: string) => {
    const content = `<h2 style="color:#0F0F0F;font-family:'Playfair Display',serif;font-size:30px;font-weight:400;margin-bottom:30px">Your Wishlist Awaits</h2><p style="color:#555;line-height:1.8">Dear <b>${name}</b>, the pieces you admired are waiting for you.</p>${renderLine()}${renderButton('View Your Wishlist','/wishlist','#0F0F0F')}${renderLine()}${renderTrendingGrid()}`;
    return atelierBase(content, `${ATELIER_CONFIG.brandName} | Wishlist Reminder`, '#0F0F0F');
};
export const getShippedEmail = (name: string, orderId: string) => {
    const theme = ATELIER_THEMES.signup;
    const content = `<h2 style="color:${theme.primary};font-family:'Playfair Display',serif;font-size:28px;font-weight:400;margin-bottom:25px">On the Way, <b>${name}</b></h2><p style="color:#555;line-height:1.8">Your ${ATELIER_CONFIG.brandName} order <b>#${orderId}</b> has been dispatched and is now in transit.</p>${renderLine()}<div style="text-align:center;font-size:14px;color:#0F0F0F"><b>STATUS:</b> <span style="color:${theme.primary}">DISPATCHED / IN TRANSIT</span></div>${renderLine()}${renderButton('Track Your Shipment','/orders',theme.primary)}`;
    return atelierBase(content, `${ATELIER_CONFIG.brandName} | Order In Transit`, theme.primary);
};
export const getDeliveredEmail = (name: string, orderId: string) => {
    const theme = ATELIER_THEMES.order;
    const content = `<h2 style="color:${theme.primary};font-family:'Playfair Display',serif;font-size:28px;font-weight:400;margin-bottom:25px">Order Delivered</h2><p style="color:#555;line-height:1.8">Dear <b>${name}</b>, your ${ATELIER_CONFIG.brandName} order <b>#${orderId}</b> has been successfully delivered.</p>${renderLine()}${renderButton('Leave a Review','/profile',theme.primary)}${renderLine()}${renderTrendingGrid()}`;
    return atelierBase(content, `${ATELIER_CONFIG.brandName} | Delivery Confirmed`, theme.primary);
};
