import { atelierBase } from './AtelierBase.js';
import { ATELIER_THEMES } from './AtelierAesthetics.js';
import { renderButton, renderLine, renderTrendingGrid } from './AtelierComponents.js';

/**
 * MASTER EMAIL EDITORIAL SYSTEM - SOVEREIGN EDITION v7.0
 * Engineered for high-conversion and ultra-premium brand experience.
 * This file contains 8 distinct luxury communication portals.
 */

// 1. SIGNUP PORTAL (Blue Theme - Patronage Established)
export const getSignupEmail = (name: string) => {
    const theme = ATELIER_THEMES.signup;
    const content = `
        <div style="font-size: 10px; color: ${theme.accent}; letter-spacing: 0.3em; margin-bottom: 25px; text-transform: uppercase; font-weight: 600;">Patronage Established</div>
        <h2 style="color: ${theme.primary}; font-family: 'Playfair Display', serif; font-size: 32px; font-weight: 400; margin-bottom: 30px; line-height: 1.2;">Welcome to the Inner Circle, <b>${name}</b></h2>
        <p style="color: #555; line-height: 1.8; font-size: 15px;">It is a rare privilege to welcome you to the Ethereal circle. Your aesthetic profile is now officially active within our global vault, granting you priority access to our most elusive masterpieces.</p>
        ${renderLine()}
        ${renderButton("Enter Your Atelier", "/profile", theme.primary)}
        ${renderLine()}
        ${renderTrendingGrid()}
    `;
    return atelierBase(content, "Identity Verified | Welcome to Ethereal", theme.primary);
};

// 2. LOGIN ALERT (Silver/Gray Theme - Security Protocol)
export const getLoginEmail = (name: string) => {
    const theme = ATELIER_THEMES.login;
    const content = `
        <h2 style="color: #0F0F0F; font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 400; margin-bottom: 30px;">Sovereign Access Detected</h2>
        <p style="color: #666; line-height: 1.8;">Dear <b>${name}</b>, our intelligence system detected a successful entry into your digital vault at <b>${new Date().toLocaleTimeString()}</b>. Accessing your profile ensures your sanctuary remains absolute.</p>
        <p style="color: #888; font-size: 13px; margin-top: 20px;">If this access was not authorized by you, please lock your identity credentials immediately to prevent a security breach.</p>
        ${renderLine()}
        ${renderButton("Secure Your Identity", "/security", "#0F0F0F")}
        ${renderLine()}
        ${renderTrendingGrid()}
    `;
    return atelierBase(content, "Security Alert | Login Notification", theme.primary);
};

// 3. ORDER CONFIRMATION (Green Theme - Acquisition Secured)
export const getOrderEmail = (name: string, orderId: string, total: string) => {
    const theme = ATELIER_THEMES.order;
    const content = `
        <h2 style="color: ${theme.primary}; font-family: 'Playfair Display', serif; font-size: 30px; font-weight: 400; margin-bottom: 25px;">Acquisition Secured, <b>${name}</b></h2>
        <p style="color: #555; line-height: 1.8;">Thank you for your patronage. Your selection of masterpieces has been secured in our archives. Our artisans are now orchestrating your shipment with meticulous precision.</p>
        ${renderLine()}
        <div style="background-color: #FDFCFB; padding: 20px; border: 1px solid #F3E5D8;">
            <p style="margin: 5px 0; font-size: 14px;"><b>Order Identifier:</b> <span style="color: ${theme.primary};">#${orderId}</span></p>
            <p style="margin: 5px 0; font-size: 18px; color: #0F0F0F;"><b>Total Value: $${total}</b></p>
        </div>
        ${renderLine()}
        ${renderButton("Track Your Journey", "/orders", theme.primary)}
    `;
    return atelierBase(content, "Your Order is Confirmed", theme.primary);
};

// 4. ABANDONED CART (Orange Theme - Unfinished Vision)
export const getAbandonedCartEmail = (name: string) => {
    const theme = ATELIER_THEMES.cart;
    const content = `
        <div style="font-size: 10px; color: ${theme.accent}; letter-spacing: 0.3em; margin-bottom: 25px; text-transform: uppercase;">Intelligence Alert</div>
        <h2 style="color: ${theme.primary}; font-family: 'Playfair Display', serif; font-size: 32px; font-weight: 400; margin-bottom: 35px;">An Unfinished Vision</h2>
        <p style="color: #555; line-height: 1.8;">Dear <b>${name}</b>, the finest silhouettes are often the most elusive. We have momentarily reserved your selections in the private vault, but they yearn for the light.</p>
        <div style="border: 1px dashed #C5A059; padding: 35px; margin: 40px 0; text-align: center; background-color: #FDFCFB;">
            <p style="margin: 0; font-size: 11px; color: #888; letter-spacing: 0.2em;">PRIVATE PRIVILEGE CODE (10% OFF)</p>
            <h3 style="margin: 10px 0 0 0; font-size: 32px; letter-spacing: 0.4em; font-family: 'Playfair Display', serif; color: #0F0F0F;">SOVEREIGN10</h3>
        </div>
        ${renderLine()}
        ${renderButton("Restore Your Selection", "/cart", theme.primary)}
        ${renderLine()}
        ${renderTrendingGrid()}
    `;
    return atelierBase(content, "A Piece of Art Awaits Your Return", theme.primary);
};

// 5. OTP / PASSWORD RESET (Purple Theme - Vault Recovery)
export const getOTPEmail = (otp: string) => {
    const theme = ATELIER_THEMES.reset;
    const content = `
        <h2 style="color: ${theme.primary}; font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 400; margin-bottom: 30px;">Vault Access Recovery</h2>
        <p style="color: #555; line-height: 1.8;">You have requested a secure digital key to reset your identity credentials. Please use the following code to complete the authentication process.</p>
        <div style="background-color: #F9F8F6; padding: 30px; font-size: 40px; letter-spacing: 0.6em; color: #0F0F0F; margin: 30px 0; border: 1px solid #EAEAEA; text-align: center; font-weight: bold;">
            ${otp}
        </div>
        <p style="font-size: 12px; color: #999; text-align: center;">This unique key will expire in 10 minutes for your protection.</p>
        ${renderLine()}
        ${renderTrendingGrid()}
    `;
    return atelierBase(content, "Your Secure Access Key", theme.primary);
};

// 6. WISHLIST REMINDER (Midnight Theme - Silent Desire)
export const getWishlistEmail = (name: string) => {
    const content = `
        <h2 style="color: #0F0F0F; font-family: 'Playfair Display', serif; font-size: 30px; font-weight: 400; margin-bottom: 30px;">A Silent Desire</h2>
        <p style="color: #555; line-height: 1.8;">Dear <b>${name}</b>, the pieces you admired are waiting. In the world of high couture, true beauty should never be left behind. We invite you to make them yours before they return to our archives.</p>
        ${renderLine()}
        ${renderButton("View Your Desires", "/wishlist", "#0F0F0F")}
        ${renderLine()}
        ${renderTrendingGrid()}
    `;
    return atelierBase(content, "Your Wishlist Awaits Your Return", "#0F0F0F");
};

// 7. ORDER SHIPPED (In Transit)
export const getShippedEmail = (name: string, orderId: string) => {
    const theme = ATELIER_THEMES.signup;
    const content = `
        <h2 style="color: ${theme.primary}; font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 400; margin-bottom: 25px;">On the Way, <b>${name}</b></h2>
        <p style="color: #555; line-height: 1.8;">Our artisans have finished preparing your acquisition. Your masterpieces for order <b>#${orderId}</b> have officially left the atelier and are now in transit to your sanctuary.</p>
        ${renderLine()}
        <div style="text-align: center; font-size: 14px; color: #0F0F0F;"><b>STATUS:</b> <span style="color: ${theme.primary}; text-transform: uppercase;">Dispatched / In Transit</span></div>
        ${renderLine()}
        ${renderButton("Track Your Shipment", "/orders", theme.primary)}
    `;
    return atelierBase(content, "Your Masterpieces are in Transit", theme.primary);
};

// 8. ORDER DELIVERED (Final Arrival)
export const getDeliveredEmail = (name: string, orderId: string) => {
    const theme = ATELIER_THEMES.order;
    const content = `
        <h2 style="color: ${theme.primary}; font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 400; margin-bottom: 25px;">Masterpiece Delivered</h2>
        <p style="color: #555; line-height: 1.8;">Dear <b>${name}</b>, your acquisition <b>#${orderId}</b> has been successfully delivered to your location. We hope these selections bring a sense of timeless elegance to your lifestyle.</p>
        ${renderLine()}
        <p style="font-size: 13px; font-style: italic; color: #777;">We invite you to share your experience with the world by leaving a review in your patron dashboard.</p>
        ${renderButton("Leave a Review", "/profile", theme.primary)}
        ${renderLine()}
        ${renderTrendingGrid()}
    `;
    return atelierBase(content, "Delivery Confirmed | Ethereal Couture", theme.primary);
};