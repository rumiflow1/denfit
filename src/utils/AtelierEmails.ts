import { atelierBase } from './AtelierBase.js';
import { ATELIER_CONFIG, ATELIER_THEMES } from './AtelierAesthetics.js';
import { renderButton, renderLine, renderTrendingGrid } from './AtelierComponents.js';

export const getSignupEmail = (name: string) => {
    const theme = ATELIER_THEMES.signup;
    const content = `<div style="font-size:10px;color:${theme.accent};letter-spacing:.3em;margin-bottom:25px;text-transform:uppercase;font-weight:700">Patronage Established</div><h2 style="color:${theme.primary};font-family:Georgia,'Times New Roman',serif;font-size:32px;font-weight:400;margin-bottom:22px;line-height:1.2">Welcome to ${ATELIER_CONFIG.brandName}, <b>${name}</b></h2><p style="color:#555;line-height:1.8;font-size:15px">Your account is active. You can now explore the live collection, save favourites and manage your orders from one private account.</p>${renderLine()}${renderButton('Enter Your Account','/profile',theme.primary)}${renderTrendingGrid()}`;
    return atelierBase(content, `Welcome to ${ATELIER_CONFIG.brandName}`, theme.primary);
};

export const getLoginEmail = (name: string) => {
    const theme = ATELIER_THEMES.login;
    const content = `<div style="font-size:10px;color:${theme.accent};letter-spacing:.3em;margin-bottom:20px;text-transform:uppercase;font-weight:700">Secure Access</div><h2 style="color:#0F0F0F;font-family:Georgia,'Times New Roman',serif;font-size:30px;font-weight:400;margin-bottom:24px">Welcome back, <b>${name}</b></h2><p style="color:#666;line-height:1.8">A successful sign-in to your ${ATELIER_CONFIG.brandName} account was detected at <b>${new Date().toLocaleTimeString()}</b>.</p><p style="color:#888;font-size:13px;margin-top:18px">If you did not make this sign-in, please secure your credentials immediately.</p>${renderLine()}${renderButton('Open Your Account','/profile','#0A0A0A')}${renderTrendingGrid()}`;
    return atelierBase(content, `${ATELIER_CONFIG.brandName} | Login Notification`, theme.primary);
};

export const getOrderEmail = (name: string, orderId: string, total: string) => {
    const theme = ATELIER_THEMES.order;
    const content = `<div style="font-size:10px;color:${theme.accent};letter-spacing:.3em;margin-bottom:20px;text-transform:uppercase;font-weight:700">Order Secured</div><h2 style="color:${theme.primary};font-family:Georgia,'Times New Roman',serif;font-size:30px;font-weight:400;margin-bottom:22px">Order Confirmed, <b>${name}</b></h2><p style="color:#555;line-height:1.8">Thank you for shopping with ${ATELIER_CONFIG.brandName}. Your selected pieces have been secured and are being prepared for shipment.</p>${renderLine()}<div style="background:#FBF8F1;padding:22px;border:1px solid #E9E1D2"><p style="margin:5px 0;font-size:14px"><b>Order Identifier:</b> <span style="color:#A78624">#${orderId}</span></p><p style="margin:8px 0 0;font-size:18px;color:#0F0F0F"><b>Total Value: PKR ${total}</b></p></div>${renderLine()}${renderButton('Track Your Order','/profile',theme.primary)}`;
    return atelierBase(content, `${ATELIER_CONFIG.brandName} | Order Confirmed`, theme.primary);
};

export const getAbandonedCartEmail = (name: string, liveProducts: any[] = []) => {
    const theme = ATELIER_THEMES.cart;
    const content = `<div style="font-size:10px;color:${theme.accent};letter-spacing:.3em;margin-bottom:25px;text-transform:uppercase;font-weight:700">Selection Reminder</div><h2 style="color:${theme.primary};font-family:Georgia,'Times New Roman',serif;font-size:32px;font-weight:400;margin-bottom:24px">Your Selection Awaits</h2><p style="color:#555;line-height:1.8">Dear <b>${name}</b>, the pieces you selected are still waiting in your private cart. Return when you are ready—your cart remains yours.</p>${renderLine()}${renderButton('Restore Your Selection','/cart',theme.primary)}${renderTrendingGrid(liveProducts)}`;
    return atelierBase(content, `${ATELIER_CONFIG.brandName} | Your Selection Awaits`, theme.primary);
};

export const getOTPEmail = (otp: string) => {
    const theme = ATELIER_THEMES.reset;
    const content = `<div style="font-size:10px;color:${theme.accent};letter-spacing:.3em;margin-bottom:20px;text-transform:uppercase;font-weight:700">Account Recovery</div><h2 style="color:${theme.primary};font-family:Georgia,'Times New Roman',serif;font-size:30px;font-weight:400;margin-bottom:22px">Secure Access Key</h2><p style="color:#555;line-height:1.8">Use the following secure code to continue resetting your ${ATELIER_CONFIG.brandName} account password.</p><div style="background:#FBF8F1;padding:28px;font-size:38px;letter-spacing:.55em;color:#0F0F0F;margin:28px 0;border:1px solid #D4AF37;text-align:center;font-weight:700">${otp}</div><p style="font-size:12px;color:#999;text-align:center">This code expires in 10 minutes.</p>${renderLine()}${renderButton('Return to Secure Login','/auth','#0A0A0A')}`;
    return atelierBase(content, `${ATELIER_CONFIG.brandName} | Secure Access Key`, theme.primary);
};

export const getWishlistEmail = (name: string) => {
    const content = `<div style="font-size:10px;color:#D4AF37;letter-spacing:.3em;margin-bottom:20px;text-transform:uppercase;font-weight:700">Saved Collection</div><h2 style="color:#0F0F0F;font-family:Georgia,'Times New Roman',serif;font-size:30px;font-weight:400;margin-bottom:24px">Your Wishlist Awaits</h2><p style="color:#555;line-height:1.8">Dear <b>${name}</b>, the pieces you admired are waiting for you.</p>${renderLine()}${renderButton('View Your Wishlist','/wishlist','#0A0A0A')}${renderTrendingGrid()}`;
    return atelierBase(content, `${ATELIER_CONFIG.brandName} | Wishlist Reminder`, '#0A0A0A');
};

export const getShippedEmail = (name: string, orderId: string) => {
    const theme = ATELIER_THEMES.signup;
    const content = `<div style="font-size:10px;color:${theme.accent};letter-spacing:.3em;margin-bottom:20px;text-transform:uppercase;font-weight:700">Dispatch Notice</div><h2 style="color:${theme.primary};font-family:Georgia,'Times New Roman',serif;font-size:30px;font-weight:400;margin-bottom:22px">On the Way, <b>${name}</b></h2><p style="color:#555;line-height:1.8">Your ${ATELIER_CONFIG.brandName} order <b>#${orderId}</b> has been dispatched and is now in transit.</p>${renderLine()}<div style="text-align:center;font-size:14px;color:#0F0F0F"><b>STATUS:</b> <span style="color:${theme.accent}">DISPATCHED / IN TRANSIT</span></div>${renderLine()}${renderButton('Track Your Order','/profile',theme.primary)}`;
    return atelierBase(content, `${ATELIER_CONFIG.brandName} | Order In Transit`, theme.primary);
};

export const getDeliveredEmail = (name: string, orderId: string) => {
    const theme = ATELIER_THEMES.order;
    const content = `<div style="font-size:10px;color:${theme.accent};letter-spacing:.3em;margin-bottom:20px;text-transform:uppercase;font-weight:700">Delivery Complete</div><h2 style="color:${theme.primary};font-family:Georgia,'Times New Roman',serif;font-size:30px;font-weight:400;margin-bottom:22px">Order Delivered</h2><p style="color:#555;line-height:1.8">Dear <b>${name}</b>, your ${ATELIER_CONFIG.brandName} order <b>#${orderId}</b> has been successfully delivered.</p>${renderLine()}${renderButton('Visit Your Account','/profile',theme.primary)}${renderTrendingGrid()}`;
    return atelierBase(content, `${ATELIER_CONFIG.brandName} | Delivery Confirmed`, theme.primary);
};
