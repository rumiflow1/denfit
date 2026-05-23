import mongoose from 'mongoose';

const PromoSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true }, // جیسے: 'LUXE10'
  discountPercentage: { type: Number, required: true },
  expiryDate: Date,
  isActive: { type: Boolean, default: true },
  usageLimit: Number, // کتنی بار استعمال ہو سکتا ہے
  usedCount: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('Promo', PromoSchema);