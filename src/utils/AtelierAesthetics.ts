export const ATELIER_THEMES = {
    signup: { primary: "#1A5FB4", accent: "#C5A059" }, // Professional Blue
    login: { primary: "#4A4A4A", accent: "#888888" },  // Security Silver/Gray
    order: { primary: "#1E8531", accent: "#2ECC71" },  // Success Green
    cart: { primary: "#D35400", accent: "#E67E22" },   // Action Orange
    reset: { primary: "#8E44AD", accent: "#9B59B6" },  // Security Purple
};

export const ATELIER_CONFIG = {
    brandName: "ETHEREAL",
    frontendUrl: process.env.APP_URL || "http://localhost:3000",
    fonts: {
        heading: "'Playfair Display', serif",
        body: "'Inter', sans-serif"
    }
};

export const TRENDING_PIECES = [
    {
        id: 'dfede',
        name: "BLACK SHIRT",
        price: "12",
        img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=400",
    },
    {
        id: 'silk-crimson',
        name: "SILK CRIMSON SILHOUETTE",
        price: "1,850",
        img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=400",
    }
];