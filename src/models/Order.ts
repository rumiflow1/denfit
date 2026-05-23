import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    title: String,
    image: String,
    price: Number,
    quantity: Number,
    size: String,
    color: String
  }],
  totalAmount: { type: Number, required: true },
  shippingDetails: {
    address: String,
    city: String,
    phone: String,
    postalCode: String
  },
  // آرڈر کا اسٹیٹس (ایڈمن یہاں سے کنٹرول کرے گا)
  status: { 
    type: String, 
    enum: ['Pending', 'Packed', 'On the way', 'Delivered', 'Cancelled'], 
    default: 'Pending' 
  },
  paymentStatus: { type: String, default: 'Unpaid' },
  orderDate: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('Order', OrderSchema);