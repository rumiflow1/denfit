import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  customerName: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: String,
  profession: String, // جیسے: 'Fashion Designer' یا 'Influencer'
  isManual: { type: Boolean, default: true }, // ایڈمن نے خود ڈالا یا کسٹمر نے
  isVisible: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Review', ReviewSchema);
