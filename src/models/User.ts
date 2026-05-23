import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  email: { type: String, required: true, lowercase: true },
  displayName: String,
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  phone: String,
  photoURL: String,
  
  // Tracking for Admin (Point #12)
  activity: [{
    action: String, // 'LOGIN', 'ADD_TO_CART', 'VIEW_PRODUCT'
    timestamp: { type: Date, default: Date.now }
  }],
  
  // For Abandoned Cart & Emails
  cart: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: Number,
    addedAt: { type: Date, default: Date.now }
  }],
  cartEmailSent: { type: Boolean, default: false },
  lastActive: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('User', UserSchema);