import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: false }, // Logged-in users ke liye
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  isManual: { type: Boolean, default: false }, // True agar admin ne manually add kiya
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'hidden', 'disapproved'], 
    default: 'pending' 
  },
  isVisible: { type: Boolean, default: true } // Quick hide/unhide ke liye
}, { timestamps: true });

export default mongoose.model('Review', ReviewSchema);
