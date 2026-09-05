import { BRAND } from "../config/brand.js";

export const ATELIER_THEMES = {
  signup: { primary: "#0A0A0A", accent: "#D4AF37" },
  login: { primary: "#0A0A0A", accent: "#D4AF37" },
  order: { primary: "#0A0A0A", accent: "#D4AF37" },
  cart: { primary: "#0A0A0A", accent: "#D4AF37" },
  reset: { primary: "#0A0A0A", accent: "#D4AF37" },
};

export const ATELIER_CONFIG = {
  brandName: BRAND.name,
  frontendUrl: BRAND.siteUrl.replace(/\/$/, ""),
  logoUrl: BRAND.logoUrl,
  supportEmail: BRAND.supportEmail,
  fonts: { heading: "'Playfair Display', Georgia, serif", body: "'Inter', Arial, sans-serif" }
};
