// ============================================
// NIRMANMITRA BACKEND - MAIN SERVER FILE
// ============================================

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route Imports
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// Base Route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🔨 Welcome to NirmanMitra API!',
    version: '1.0.0',
    database: 'MongoDB Connected ✅',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        profile: 'GET /api/auth/profile (Protected)'
      },
      products: {
        getAll: 'GET /api/products',
        getSingle: 'GET /api/products/:id',
        create: 'POST /api/products (Seller/Admin)',
        seed: 'POST /api/products/seed'
      },
      orders: {
        create: 'POST /api/orders (Protected)',
        myOrders: 'GET /api/orders/myorders (Protected)',
        track: 'GET /api/orders/:id (Protected)',
        updateStatus: 'PUT /api/orders/:id/status (Seller/Delivery/Admin)',
        verifyOTP: 'PUT /api/orders/:id/deliver-otp (Delivery/Admin)'
      },
      health: 'GET /api/health'
    }
  });
});

// Health Check Route
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is healthy ✅',
    database: 'Connected',
    timestamp: new Date().toISOString(),
    uptime: process.uptime() + ' seconds'
  });
});

// 404 Route Not Found Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '❌ Route not found',
    path: req.path
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.message);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: err.message
  });
});

// Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('');
  console.log('╔════════════════════════════════════════╗');
  console.log('║   🔨 NIRMANMITRA BACKEND SERVER 🔨    ║');
  console.log('╚════════════════════════════════════════╝');
  console.log(`✅ Server running on: http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔑 Auth Endpoints: /api/auth`);
  console.log(`📦 Product Endpoints: /api/products`);
  console.log(`🚚 Order Endpoints: /api/orders`);
  console.log('');
});