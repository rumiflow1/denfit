import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema({
  adminEmail: String,
  action: String, // e.g., 'PRICE_CHANGE', 'PRODUCT_DELETE'
  details: Object,
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('AuditLog', AuditLogSchema);