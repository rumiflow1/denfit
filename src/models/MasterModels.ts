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
    items: [
      { id: 'men', name: "Men's Atelier", image: "https://images.unsplash.com/photo-1488161628813-04466f872be2", link: "/products?category=men" },
      { id: 'women', name: "Women's Couture", image: "https://images.unsplash.com/photo-1483985988355-763728e1935b", link: "/products?category=women" },
      { id: 'children', name: "Children's Elite", image: "https://images.unsplash.com/photo-1519702281827-04664539860b?q=80&w=2070", link: "/products?category=children" },
      { id: 'accessories', name: "Luxury Accessories", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=2099", link: "/products?category=accessories" }
    ] 
  },
  auth: {
    leftImage: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=2070',
    loginTitle: 'Sovereign Access',
    loginSubtitle: 'Welcome to the Ethereal Atelier Vault.',
    signupTitle: 'Establish Patronage',
    signupSubtitle: 'Orchestrate Your Style Identity',
    recoveryTitle: 'Identity Recovery',
    recoverySubtitleEmail: 'Enter email for reset code',
    recoverySubtitleCode: 'A private key was dispatched.',
    recoverySubtitleReset: 'Establish new luxury credentials'
  },
  account: {
    profileTitle: 'Personal Information',
    wishlistTitle: 'My Wishlist',
    ordersTitle: 'Order History',
    paymentsTitle: 'Payment Methods',
    addressesTitle: 'Shipping Addresses',
    discountsTitle: 'My Discounts',
    securityTitle: 'Security Settings',
    welcomeMessage: 'Welcome back to your sanctuary.'
  },
  customerReviews: { 
    isVisible: true, 
    title: { content: "PATRON VOICES" }, 
    tagline: { content: "True Luxury Experience" }, 
    items: [
        { id: '1', name: "Ayan Khan", role: "Elite Member", rating: 5, content: "The craftsmanship is unparalleled. Truly a luxury experience.", date: "2026-04-01" },
        { id: '2', name: "Sarah Malik", role: "Verified Buyer", rating: 5, content: "Best couture pieces I've ever owned. Worth every cent.", date: "2026-04-10" }
    ] 
  },
  trustBadges: { isVisible: true, items: [] },
  purchaseNotifications: { isVisible: true, items: [] },
  footer: { 
    isVisible: true, 
    brandName: "RUMY",
    description: { content: "The definitive destination for luxury attire." }, 
    copyright: { content: "© 2026 RUMY. ALL RIGHTS RESERVED." },
    newsletterTitle: "Newsletter",
    newsletterDesc: "Subscribe to receive updates, access to exclusive deals, and more.",
    privacyLabel: "Privacy Policy",
    termsLabel: "Terms of Service",
    shopLinks: [], 
    supportLinks: [], 
    socials: [] 
  },
  aiConcierge: {
    isEnabled: true,
    brandVoice: "Sophisticated, confident, and professional",
    systemInstruction: "You are the Elite AI Stylist. You are sophisticated, confident, and professional. Identify yourself as a human luxury ambassador, not an AI. NEVER say 'I apologize', 'I am at your service', or 'I am an AI'. Focus on helping users find the perfect luxury attire from our available collection.",
    model: "gemini-1.5-flash",
    welcomeMessage: "Greetings. I am your personal stylist. How may I assist your style journey today?"
  },
  pages: {
    shippingPolicy: "Our luxury items are handled with extreme care.",
    returnPolicy: "Complimentary 30-day returns.",
    faq: "# FAQs\nEverything you need to know.",
    privacyPolicy: "Your privacy is our priority."
  },
  elements: {}
};
