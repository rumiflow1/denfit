import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  title: { type: String, required: true },
  price: { type: Number, required: true },
  discountPrice: Number,
  description: String,
  category: { type: String, required: true }, // 'Men', 'Women', etc.
  images: [String],
  sizes: [String],
  colors: [String],
  stock: { type: Number, default: 0 },
  lowStockAlert: { type: Number, default: 5 },
  
  // Features for UI Control
  isNewArrival: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  showOnHomePage: { type: Boolean, default: true },
  
  // Style Notes (Luxury Content)
  styleNotes: String,
  fabricCare: String,
  shippingReturns: String,
  
  reviews: [{
    customerName: String,
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    isManual: { type: Boolean, default: true }
  }]
}, { timestamps: true });

export default mongoose.model('Product', ProductSchema);