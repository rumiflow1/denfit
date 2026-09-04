const FALLBACK_BRAND = "DENFIT";
const FALLBACK_URL = "https://www.denfit.shop";

export const ATELIER_THEMES = {
    signup: { primary: "#1A5FB4", accent: "#C5A059" },
    login: { primary: "#4A4A4A", accent: "#888888" },
    order: { primary: "#1E8531", accent: "#2ECC71" },
    cart: { primary: "#D35400", accent: "#E67E22" },
    reset: { primary: "#8E44AD", accent: "#9B59B6" },
};

export const ATELIER_CONFIG = {
    brandName: process.env.BRAND_NAME || FALLBACK_BRAND,
    frontendUrl: (process.env.APP_URL || FALLBACK_URL).replace(/\/$/, ""),
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
        img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop",
    },
    {
        id: "silk-crimson",
        name: "Signature Silhouette",
        price: "1,850",
        img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800&auto=format&fit=crop",
    }
];
