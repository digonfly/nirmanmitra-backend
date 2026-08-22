// ============================================
// ORDER CONTROLLER
// ============================================

const Order = require('../models/Order');
const Product = require('../models/Product');

// Helper: Generate random 4-digit OTP for delivery verification
const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// @desc    Create new order (Checkout)
// @route   POST /api/orders
// @access  Private (Customer)
const createOrder = async (req, res) => {
  try {
    const {
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      discountPrice,
      totalAmount
    } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No order items provided'
      });
    }

    const deliveryOTP = generateOTP();

    const order = new Order({
      customer: req.user._id,
      orderItems,
      shippingAddress,
      paymentMethod,
      paymentStatus: paymentMethod === 'COD' ? 'Pending' : 'Completed',
      itemsPrice: itemsPrice || 0,
      taxPrice: taxPrice || 0,
      shippingPrice: shippingPrice || 0,
      discountPrice: discountPrice || 0,
      totalAmount: totalAmount || 0,
      deliveryOTP,
      timeline: [
        {
          status: 'Placed',
          message: 'Your order has been placed successfully'
        }
      ]
    });

    const createdOrder = await order.save();

    // Reduce product stock in background
    for (const item of orderItems) {
      if (item.product) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.qty }
        });
      }
    }

    res.status(201).json({
      success: true,
      message: '🎉 Order placed successfully!',
      order: createdOrder
    });
  } catch (error) {
    console.error('Create Order Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to place order',
      error: error.message
    });
  }
};

// @desc    Get logged in customer order history
// @route   GET /api/orders/myorders
// @access  Private (Customer)
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user._id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order history',
      error: error.message
    });
  }
};

// @desc    Get order details & tracking info by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('customer', 'name email phone');

    if (order) {
      res.json({
        success: true,
        order
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Invalid order ID or Server Error',
      error: error.message
    });
  }
};

// @desc    Update order status (Seller / Delivery / Admin)
// @route   PUT /api/orders/:id/status
// @access  Private (Seller/Delivery/Admin)
const updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus, message } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.orderStatus = orderStatus;
    order.timeline.push({
      status: orderStatus,
      message: message || `Order status updated to ${orderStatus}`
    });

    if (orderStatus === 'Delivered') {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
      order.paymentStatus = 'Completed';
    }

    const updatedOrder = await order.save();

    res.json({
      success: true,
      message: `Order status updated to ${orderStatus} ✅`,
      order: updatedOrder
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message
    });
  }
};

// @desc    Verify Delivery OTP (Delivery Partner completes order)
// @route   PUT /api/orders/:id/deliver-otp
// @access  Private (Delivery Partner / Admin)
const verifyDeliveryOTP = async (req, res) => {
  try {
    const { otp } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.deliveryOTP !== otp) {
      return res.status(400).json({
        success: false,
        message: '❌ Invalid OTP code. Please check with customer.'
      });
    }

    order.orderStatus = 'Delivered';
    order.isDelivered = true;
    order.deliveredAt = Date.now();
    order.paymentStatus = 'Completed';
    order.timeline.push({
      status: 'Delivered',
      message: 'Order verified via OTP and delivered successfully 🎉'
    });

    const completedOrder = await order.save();

    res.json({
      success: true,
      message: '✅ Order delivered & OTP verified successfully!',
      order: completedOrder
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'OTP Verification Failed',
      error: error.message
    });
  }
};

// @desc    Get all orders across platform (Admin only)
// @route   GET /api/orders
// @access  Private (Admin)
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('customer', 'name email phone')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error fetching all orders',
      error: error.message
    });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  verifyDeliveryOTP,
  getAllOrders
};