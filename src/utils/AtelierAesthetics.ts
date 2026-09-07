import { BRAND } from "../config/brand.js";

export const ATELIER_THEMES = {
  signup: { primary: "#0B1220", accent: "#152238" },
  login: { primary: "#0B1220", accent: "#152238" },
  order: { primary: "#0B1220", accent: "#152238" },
  cart: { primary: "#0B1220", accent: "#152238" },
  reset: { primary: "#0B1220", accent: "#152238" },
};

export const ATELIER_CONFIG = {
  brandName: BRAND.name,
  frontendUrl: BRAND.siteUrl.replace(/\/$/, ""),
  logoUrl: BRAND.logoUrl,
  supportEmail: BRAND.supportEmail,
  fonts: { heading: "'Playfair Display', Georgia, serif", body: "'Inter', Arial, sans-serif" }
};
