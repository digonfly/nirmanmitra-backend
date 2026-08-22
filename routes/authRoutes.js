// ============================================
// NIRMANMITRA - AUTH ROUTES
// ============================================

const express = require('express');
const router = express.Router();
const {
  registerUser,
  verifyRegisterOTP,
  loginUser,
  forgotPassword,
  resetPassword,
  getProfile
} = require('../controllers/authController');

// Public Auth Endpoints
router.post('/register', registerUser);
router.post('/verify-register-otp', verifyRegisterOTP);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Profile Endpoint
router.get('/profile', getProfile);

module.exports = router;