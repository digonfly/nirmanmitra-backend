// ============================================
// ORDER MODEL (Marketplace & Delivery)
// ============================================

const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: { type: String, required: true },
  qty: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
  emoji: { type: String, default: '📦' },
  storeName: { type: String, default: 'Sharma Hardware Store' }
});

const orderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    orderItems: [orderItemSchema],
    shippingAddress: {
      addressType: { type: String, default: 'Home' },
      street: { type: String, required: true },
      city: { type: String, required: true },
      pincode: { type: String, required: true },
      state: { type: String, required: true },
      phone: { type: String, required: true }
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['UPI', 'Card', 'NetBanking', 'COD'],
      default: 'UPI'
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Completed', 'Failed', 'Refunded'],
      default: 'Pending'
    },
    itemsPrice: { type: Number, required: true, default: 0 },
    taxPrice: { type: Number, required: true, default: 0 },
    shippingPrice: { type: Number, required: true, default: 0 },
    discountPrice: { type: Number, required: true, default: 0 },
    totalAmount: { type: Number, required: true, default: 0 },
    orderStatus: {
      type: String,
      enum: ['Placed', 'Confirmed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'],
      default: 'Placed'
    },
    deliveryOTP: {
      type: String,
      required: true
    },
    isDelivered: {
      type: Boolean,
      default: false
    },
    deliveredAt: {
      type: Date
    },
    deliveryPartner: {
      name: { type: String, default: 'Amit Verma' },
      phone: { type: String, default: '+91 98765 43210' },
      vehicleNumber: { type: String, default: 'KA-01-AB-1234' },
      rating: { type: Number, default: 4.8 }
    },
    timeline: [
      {
        status: { type: String },
        message: { type: String },
        time: { type: Date, default: Date.now }
      }
    ]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Order', orderSchema);