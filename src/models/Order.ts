import mongoose from 'mongoose';

const generateTrackingNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `DNF-${year}-${random}`;
};

const OrderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  orderNumber: { type: String, unique: true },
  trackingNumber: { 
    type: String, 
    default: generateTrackingNumber,
    unique: true,
    sparse: true // Allow multiple null values but unique for non-null
  },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    image: String,
    images: [String],
    price: Number,
    quantity: Number,
    size: String,
    color: String
  }],
  shippingAddress: {
    name: String,
    phone: String,
    address: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  shippingCost: { type: Number, default: 0 },
  total: { type: Number, required: true },
  currency: { type: String, default: 'PKR' },
  status: { 
    type: String, 
    enum: ['pending', 'packed', 'shipped', 'on the way', 'delivered', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: String,
  paymentStatus: { type: String, default: 'pending' },
  notes: String
}, { timestamps: true });

// Generate order number before saving
OrderSchema.pre('save', function(next) {
  if (!this.orderNumber) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.orderNumber = `ORD-${timestamp}-${random}`;
  }
  
  // Generate tracking number if not set
  if (!this.trackingNumber) {
    this.trackingNumber = generateTrackingNumber();
  }
  
  next();
});

export default mongoose.model('Order', OrderSchema);
