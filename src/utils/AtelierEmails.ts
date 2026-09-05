import { atelierBase } from './AtelierBase.js';
import { ATELIER_THEMES, ATELIER_CONFIG } from './AtelierAesthetics.js';
import { renderButton, renderLine, renderTrendingGrid } from './AtelierComponents.js';

export const getSignupEmail = (name: string, liveProducts: any[] = []) => {
  const theme = ATELIER_THEMES.signup;
  const content = `<div style="font-size:10px;color:${theme.accent};letter-spacing:.28em;margin-bottom:18px;text-transform:uppercase;font-weight:700">Welcome</div><h2 style="color:${theme.primary};font-family:Georgia,'Times New Roman',serif;font-size:31px;font-weight:400;margin:0 0 20px;line-height:1.25">Welcome to ${ATELIER_CONFIG.brandName}, <b>${name}</b></h2><p style="color:#555;line-height:1.8;font-size:15px;margin:0">Your account is ready. You can now explore the collection, save favourites and manage your orders from your account.</p>${renderLine()}${renderButton('Open Your Account','/profile',theme.primary)}${renderTrendingGrid(liveProducts)}`;
  return atelierBase(content, `Welcome to ${ATELIER_CONFIG.brandName}`, theme.primary);
};

export const getLoginEmail = (name: string, liveProducts: any[] = []) => {
  const theme = ATELIER_THEMES.login;
  const content = `<div style="font-size:10px;color:${theme.accent};letter-spacing:.28em;margin-bottom:18px;text-transform:uppercase;font-weight:700">Account Security</div><h2 style="color:#0F0F0F;font-family:Georgia,'Times New Roman',serif;font-size:30px;font-weight:400;margin:0 0 20px">Welcome back, <b>${name}</b></h2><p style="color:#666;line-height:1.8;margin:0">A successful sign-in to your ${ATELIER_CONFIG.brandName} account was detected at <b>${new Date().toLocaleTimeString()}</b>.</p><p style="color:#888;font-size:13px;line-height:1.7;margin-top:16px">If you did not make this sign-in, please secure your account and contact support.</p>${renderLine()}${renderButton('Open Your Account','/profile','#0A0A0A')}${renderTrendingGrid(liveProducts)}`;
  return atelierBase(content, `${ATELIER_CONFIG.brandName} | Sign-in notification`, theme.primary);
};

export const getOrderEmail = (name: string, orderId: string, total: string, liveProducts: any[] = []) => {
  const theme = ATELIER_THEMES.order;
  const content = `<div style="font-size:10px;color:${theme.accent};letter-spacing:.28em;margin-bottom:18px;text-transform:uppercase;font-weight:700">Order Confirmation</div><h2 style="color:${theme.primary};font-family:Georgia,'Times New Roman',serif;font-size:30px;font-weight:400;margin:0 0 20px">Thank you, <b>${name}</b></h2><p style="color:#555;line-height:1.8;margin:0">Your order with ${ATELIER_CONFIG.brandName} has been confirmed. We are preparing your items for dispatch.</p>${renderLine()}<div style="background:#FBF8F1;padding:20px;border:1px solid #E9E1D2"><p style="margin:4px 0;font-size:13px;color:#555">Order number</p><p style="margin:4px 0;font-size:17px;color:#0F0F0F;font-weight:700">#${orderId}</p><p style="margin:14px 0 0;font-size:18px;color:#0F0F0F;font-weight:700">Total: PKR ${total}</p></div>${renderLine()}${renderButton('Track Your Order','/profile',theme.primary)}${renderTrendingGrid(liveProducts)}`;
  return atelierBase(content, `${ATELIER_CONFIG.brandName} | Order confirmed`, theme.primary);
};

export const getAbandonedCartEmail = (name: string, liveProducts: any[] = []) => {
  const theme = ATELIER_THEMES.cart;
  const content = `<div style="font-size:10px;color:${theme.accent};letter-spacing:.28em;margin-bottom:18px;text-transform:uppercase;font-weight:700">Your Cart</div><h2 style="color:${theme.primary};font-family:Georgia,'Times New Roman',serif;font-size:31px;font-weight:400;margin:0 0 20px">Your selection is still waiting</h2><p style="color:#555;line-height:1.8;margin:0">Hi <b>${name}</b>, the items you selected are still in your cart. Return whenever you are ready to complete your purchase.</p>${renderLine()}${renderButton('Return to Cart','/cart',theme.primary)}${renderTrendingGrid(liveProducts)}`;
  return atelierBase(content, `${ATELIER_CONFIG.brandName} | Your cart is waiting`, theme.primary);
};

export const getOTPEmail = (otp: string) => {
  const theme = ATELIER_THEMES.reset;
  const content = `<div style="font-size:10px;color:${theme.accent};letter-spacing:.28em;margin-bottom:18px;text-transform:uppercase;font-weight:700">Password Reset</div><h2 style="color:${theme.primary};font-family:Georgia,'Times New Roman',serif;font-size:30px;font-weight:400;margin:0 0 20px">Reset your password</h2><p style="color:#555;line-height:1.8;margin:0">Use the code below to continue resetting your ${ATELIER_CONFIG.brandName} account password.</p><div style="background:#FBF8F1;padding:26px;font-size:38px;letter-spacing:.45em;color:#0F0F0F;margin:26px 0;border:1px solid #D4AF37;text-align:center;font-weight:700">${otp}</div><p style="font-size:12px;color:#999;text-align:center;margin:0">This code expires in 10 minutes.</p>${renderLine()}${renderButton('Return to Login','/auth','#0A0A0A')}`;
  return atelierBase(content, `${ATELIER_CONFIG.brandName} | Password reset`, theme.primary);
};

export const getWishlistEmail = (name: string, liveProducts: any[] = []) => {
  const content = `<div style="font-size:10px;color:#D4AF37;letter-spacing:.28em;margin-bottom:18px;text-transform:uppercase;font-weight:700">Wishlist</div><h2 style="color:#0F0F0F;font-family:Georgia,'Times New Roman',serif;font-size:30px;font-weight:400;margin:0 0 20px">Your saved pieces are waiting</h2><p style="color:#555;line-height:1.8;margin:0">Hi <b>${name}</b>, the pieces you saved are still waiting for you.</p>${renderLine()}${renderButton('View Wishlist','/wishlist','#0A0A0A')}${renderTrendingGrid(liveProducts)}`;
  return atelierBase(content, `${ATELIER_CONFIG.brandName} | Wishlist`, '#0A0A0A');
};

export const getShippedEmail = (name: string, orderId: string, liveProducts: any[] = []) => {
  const theme = ATELIER_THEMES.signup;
  const content = `<div style="font-size:10px;color:${theme.accent};letter-spacing:.28em;margin-bottom:18px;text-transform:uppercase;font-weight:700">Order Update</div><h2 style="color:${theme.primary};font-family:Georgia,'Times New Roman',serif;font-size:30px;font-weight:400;margin:0 0 20px">Your order is on the way</h2><p style="color:#555;line-height:1.8;margin:0">Hi <b>${name}</b>, order <b>#${orderId}</b> has been dispatched and is now in transit.</p>${renderLine()}${renderButton('Track Your Order','/profile',theme.primary)}${renderTrendingGrid(liveProducts)}`;
  return atelierBase(content, `${ATELIER_CONFIG.brandName} | Order in transit`, theme.primary);
};

export const getDeliveredEmail = (name: string, orderId: string, liveProducts: any[] = []) => {
  const theme = ATELIER_THEMES.order;
  const content = `<div style="font-size:10px;color:${theme.accent};letter-spacing:.28em;margin-bottom:18px;text-transform:uppercase;font-weight:700">Delivery Update</div><h2 style="color:#0F0F0F;font-family:Georgia,'Times New Roman',serif;font-size:30px;font-weight:400;margin:0 0 20px">Your order has arrived</h2><p style="color:#555;line-height:1.8;margin:0">Hi <b>${name}</b>, order <b>#${orderId}</b> has been successfully delivered.</p>${renderLine()}${renderButton('Open Your Account','/profile','#0A0A0A')}${renderTrendingGrid(liveProducts)}`;
  return atelierBase(content, `${ATELIER_CONFIG.brandName} | Delivery confirmed`, theme.primary);
};
