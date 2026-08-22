// ============================================
// ORDER ROUTES
// ============================================

const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  verifyDeliveryOTP,
  getAllOrders
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Customer Protected Routes
router.post('/', protect, createOrder);
router.get('/myorders', protect, getMyOrders);
router.get('/:id', protect, getOrderById);

// Seller / Delivery Partner / Admin Routes
router.put('/:id/status', protect, authorize('seller', 'delivery', 'admin'), updateOrderStatus);
router.put('/:id/deliver-otp', protect, authorize('delivery', 'admin'), verifyDeliveryOTP);

// Admin Only Route
router.get('/', protect, authorize('admin'), getAllOrders);

module.exports = router;