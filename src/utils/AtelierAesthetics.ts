import { BRAND } from "../config/brand.js";

export const ATELIER_THEMES = {
    signup: { primary: "#1A5FB4", accent: "#C5A059" },
    login: { primary: "#4A4A4A", accent: "#888888" },
    order: { primary: "#1E8531", accent: "#2ECC71" },
    cart: { primary: "#D35400", accent: "#E67E22" },
    reset: { primary: "#8E44AD", accent: "#9B59B6" },
};

export const ATELIER_CONFIG = {
    brandName: BRAND.name,
    frontendUrl: BRAND.siteUrl.replace(/\/$/, ""),
    supportEmail: BRAND.supportEmail,
    fonts: {
        heading: "'Playfair Display', serif",
        body: "'Inter', sans-serif"
    }
};

export const TRENDING_PIECES = [
    {
        id: "dfede",
        name: "Featured Masterpiece",
        price: "12",
        img: `${ATELIER_CONFIG.frontendUrl}/api/media/dfede`,
    },
    {
        id: "silk-crimson",
        name: "Signature Silhouette",
        price: "1,850",
        img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800&auto=format&fit=crop",
    }
];
