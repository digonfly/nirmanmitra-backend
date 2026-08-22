// ============================================
// PRODUCT MODEL (Hardware & Tools)
// ============================================

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please enter a product name'],
      trim: true
    },
    brand: {
      type: String,
      required: [true, 'Please enter a brand name'],
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Please select a category'],
      enum: [
        'Hand Tools',
        'Power Tools',
        'Fasteners',
        'Plumbing',
        'Electrical',
        'Paint',
        'Construction',
        'Safety',
        'Woodworking',
        'Measuring'
      ]
    },
    description: {
      type: String,
      required: [true, 'Please enter a product description']
    },
    price: {
      type: Number,
      required: [true, 'Please enter product price'],
      min: [0, 'Price cannot be negative']
    },
    originalPrice: {
      type: Number,
      required: [true, 'Please enter original price']
    },
    discount: {
      type: Number,
      default: 0
    },
    stock: {
      type: Number,
      required: [true, 'Please enter product stock quantity'],
      min: [0, 'Stock cannot be negative'],
      default: 10
    },
    emoji: {
      type: String,
      default: '📦'
    },
    tag: {
      type: String,
      enum: ['popular', 'sale', 'new', ''],
      default: ''
    },
    rating: {
      type: Number,
      default: 4.5,
      min: 1,
      max: 5
    },
    reviewsCount: {
      type: Number,
      default: 120
    },
    deliveryEstimate: {
      type: String,
      default: 'Delivery in 45 min'
    },
    storeName: {
      type: String,
      required: [true, 'Please enter store name'],
      default: 'Sharma Hardware Store'
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    isAvailable: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Calculate discount percentage automatically before saving
productSchema.pre('save', function (next) {
  if (this.originalPrice > 0 && this.originalPrice > this.price) {
    this.discount = Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);