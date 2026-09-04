import mongoose from "mongoose";

// =========================================================
// --- 1. SCHEMAS (Premium Data Definitions) ---
// =========================================================

export const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  originalPrice: Number,
  discount: Number,
  image: { type: String, required: true },
  images: [String],
  category: { type: String, required: true },
  collectionName: String,
  isNewArrival: { type: Boolean, default: false },
  showOnHomePage: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  description: String,
  stock: { type: Number, default: 0 },
  sizes: [String],
  colors: [String],
  details: [String],
  fabric: String,
  style: String,
  sizeGuide: String,
  shippingPolicy: String,
  fabricCare: String,
  styleNotes: String,
  lowStockAlert: { type: Number, default: 5 },
  reviews: [{
    user: String,
    profession: String,
    rating: Number,
    comment: String,
    date: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      (ret as any).id = ret._id.toString();
      return ret;
    }
  }
});

export const UserSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  displayName: String,
  photoURL: String,
  role: { type: String, default: "user" },
  phone: String,
  addresses: Array,
  payments: Array,
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: Date.now }
}, {
  toJSON: {
    transform: (doc, ret) => {
      (ret as any).id = ret._id.toString();
      return ret;
    }
  }
});

export const CustomerLogSchema = new mongoose.Schema({
  userId: String,
  email: String,
  action: { type: String, required: true },
  details: Object,
  timestamp: { type: Date, default: Date.now }
});

export const OrderSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  email: { type: String, required: true },
  fullName: { type: String, required: true },
  phone: String,
  items: Array,
  totalAmount: Number,
  status: { type: String, default: "Pending" },
  shippingAddress: Object,
  shippingDetails: Object,
  paymentMethod: String,
  createdAt: { type: Date, default: Date.now },
}, {
  toJSON: {
    transform: (doc, ret) => {
      (ret as any).id = ret._id.toString();
      return ret;
    }
  }
});

// Compatibility middleware: the production API currently constructs orders
// with shippingDetails, while the historical schema stores customer identity
// at the top level. Copy the nested values before validation/save.
OrderSchema.pre("validate", function(next) {
  const order = this as any;
  const details = order.shippingDetails || {};
  if (!order.email && details.email) order.email = details.email;
  if (!order.fullName) {
    const name = [details.firstName, details.lastName].filter(Boolean).join(" ").trim();
    if (name) order.fullName = name;
  }
  if (!order.phone && details.phone) order.phone = details.phone;
  if (!order.shippingAddress && details.address) order.shippingAddress = details.address;
  next();
});

export const PasswordResetSchema = new mongoose.Schema({
  email: { type: String, required: true },
  code: { type: String, required: true },
  expiresAt: { type: Date, required: true }
});

export const ElementSchema = new mongoose.Schema({
  content: { type: String, default: "" },
  color: { type: String, default: "#1a1a1a" },
  fontFamily: { type: String, default: "Inter" },
  fontSize: { type: String, default: "14px" },
  link: { type: String, default: "" },
  background: { type: String, default: "transparent" },
  isVisible: { type: Boolean, default: true },
  addContent: mongoose.Schema.Types.Mixed,
  deleteContent: Boolean
});

export const ConfigSchema = new mongoose.Schema({
  key: { type: String, default: "global", unique: true },
  branding: mongoose.Schema.Types.Mixed,
  announcementBar: mongoose.Schema.Types.Mixed,
  header: mongoose.Schema.Types.Mixed,
  heroBanner: mongoose.Schema.Types.Mixed,
  collections: mongoose.Schema.Types.Mixed,
  featuredCollections: mongoose.Schema.Types.Mixed,
  newArrivals: mongoose.Schema.Types.Mixed,
  featuredArrivals: mongoose.Schema.Types.Mixed,
  customerReviews: mongoose.Schema.Types.Mixed,
  trustBadges: mongoose.Schema.Types.Mixed,
  purchaseNotifications: mongoose.Schema.Types.Mixed,
  footer: mongoose.Schema.Types.Mixed,
  pages: mongoose.Schema.Types.Mixed,
  internalPages: mongoose.Schema.Types.Mixed,
  auth: mongoose.Schema.Types.Mixed,
  account: mongoose.Schema.Types.Mixed,
  elements: mongoose.Schema.Types.Mixed,
  aiConcierge: mongoose.Schema.Types.Mixed
}, {
  minimize: false,
  timestamps: true,
  strict: false
});

// =========================================================
// --- 2. MODELS (The Bridge to Atlas) ---
// =========================================================

export const Product = mongoose.models.Product || mongoose.model("Product", ProductSchema);
export const User = mongoose.models.User || mongoose.model("User", UserSchema);
export const CustomerLog = mongoose.models.CustomerLog || mongoose.model("CustomerLog", CustomerLogSchema);
export const Order = mongoose.models.Order || mongoose.model("Order", OrderSchema);
export const PasswordReset = mongoose.models.PasswordReset || mongoose.model("PasswordReset", PasswordResetSchema);
export const Config = mongoose.models.Config || mongoose.model("Config", ConfigSchema);

// The production API defines SiteConfig in api/index.ts. Register the same
// model name here first so that index.ts reuses this loose, full-config schema
// instead of silently dropping rich frontend sections on save.
export const SiteConfig = mongoose.models.SiteConfig || mongoose.model("SiteConfig", ConfigSchema);

export const DEFAULT_SITE_CONFIG = {
  key: "global",
  announcementBar: {
    isVisible: true,
    bgColor: "linear-gradient(to right, #000, #1a1a1a)",
    items: [{ text: "SUMMER SALE: 40% OFF", path: "/shop" }, { text: "FREE WORLDWIDE SHIPPING", path: "/shipping" }],
    socials: []
  },
  header: {
    isVisible: true,
    logoText: "RUMY",
    logoImage: "",
    logoColor: "#C5A059",
    logoSize: "24px",
    logoFontFamily: "serif",
    navLinks: [
      { label: "New Arrivals", path: "/new" },
      { label: "Collections", path: "/shop" },
      { label: "Our Story", path: "/story" }
    ],
    search: { placeholder: "Search the catalog...", buttonText: "Search", trendingTitle: "Trending Now", trending: ["Summer Collection", "Luxury Sets"], trendingProducts: [] },
    account: { loginLabel: "Identity", signupLabel: "Registry", emailLabel: "Email Address", passwordLabel: "Secure Access", loginBtnText: "Login", signupBtnText: "Signup" },
    wishlist: { title: "Sanctuary", emptyText: "Your sanctuary is vacant.", btnText: "Curate Now" },
    cart: { title: "Acquisitions", emptyText: "No acquisitions pending.", checkoutBtnText: "Proceed to Checkout", viewCartBtnText: "View Cart" }
  },
  heroBanner: { isVisible: true, slides: [] },
  newArrivals: { isVisible: true, title: "NEW ARRIVALS", tagline: "The Latest Masterpieces" },
  featuredArrivals: { isVisible: true, title: "FEATURED", tagline: "Hand-Selected Perfection" },
  featuredCollections: {
    isVisible: true,
    title: "COLLECTIONS",
    tagline: "Explore Our Finest Selection",
    items: []
  }
};
