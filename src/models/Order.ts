import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  // Guest checkout orders are supported; authenticated users are linked by uid/string.
  userId: { type: String, default: 'GUEST', index: true },
  orderNumber: { type: String, unique: true, sparse: true, index: true },
  // A tracking number is assigned only when the order is dispatched/shipped.
  trackingNumber: { type: String, default: '', index: true, sparse: true },
  items: [{
    productId: { type: mongoose.Schema.Types.Mixed },
    name: String,
    title: String,
    image: String,
    images: [String],
    price: Number,
    quantity: Number,
    size: String,
    color: String,
    discountPrice: Number,
    subtotal: Number
  }],
  email: { type: String, lowercase: true, trim: true, index: true },
  fullName: String,
  phone: String,
  shippingAddress: mongoose.Schema.Types.Mixed,
  shippingDetails: mongoose.Schema.Types.Mixed,
  subtotal: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  discountCode: { type: String, default: '' },
  shippingCost: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  currency: { type: String, default: 'PKR' },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Packed', 'Shipped', 'On the Way', 'Delivered', 'Cancelled'],
    default: 'Pending'
  },
  statusHistory: [{ status: String, at: Date }],
  tracking: mongoose.Schema.Types.Mixed,
  paymentMethod: String,
  paymentStatus: { type: String, default: 'pending' },
  notes: String
}, { timestamps: true, strict: false });

OrderSchema.pre('save', function(next) {
  // Public order numbers are created by the order route. Never create a tracking number here.
  next();
});

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
