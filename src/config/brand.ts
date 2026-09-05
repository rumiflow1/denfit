/**
 * SINGLE SOURCE OF TRUTH — change only these values when rebranding.
 * Runtime email links, email branding and backend identity consume this file.
 */
export const BRAND = {
  name: "DENFIT",
  siteUrl: "https://www.denfit.shop",
  logoUrl: "https://www.denfit.shop/denfit-logo.svg",
  supportEmail: "support@denfit.shop",
} as const;

export const CURRENCY = {
  USD: { code: "USD", symbol: "$", rateToUSD: 1 },
  PKR: { code: "PKR", symbol: "Rs.", rateToUSD: 278.5 },
  INR: { code: "INR", symbol: "₹", rateToUSD: 83.3 },
  SAR: { code: "SAR", symbol: "SR", rateToUSD: 3.75 },
  EUR: { code: "EUR", symbol: "€", rateToUSD: 0.92 },
  GBP: { code: "GBP", symbol: "£", rateToUSD: 0.79 },
  AED: { code: "AED", symbol: "د.إ", rateToUSD: 3.67 },
} as const;

export type CurrencyCode = keyof typeof CURRENCY;

export const formatCurrency = (amount: number, currency: string = "USD") => {
  const code = (currency.toUpperCase() in CURRENCY ? currency.toUpperCase() : "USD") as CurrencyCode;
  const meta = CURRENCY[code];
  const safe = Number.isFinite(Number(amount)) ? Number(amount) : 0;
  const digits = code === "PKR" || code === "INR" ? 0 : 2;
  return `${meta.symbol}${code === "PKR" ? " " : ""}${safe.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
};
