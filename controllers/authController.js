// ============================================
// NIRMANMITRA - AUTH CONTROLLER (FAIL-SAFE OTP)
// ============================================

const User = require('../models/User');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');
const sendSMS = require('../utils/sendSMS');

// Generate 6 Digit Numeric OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'nirmanmitra_jwt_secret', {
    expiresIn: '30d'
  });
};

// @desc    Register user & send verification OTP
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, phone, role, storeName, vehicleNumber } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (Name, Email, Phone, Password)'
      });
    }

    let user = await User.findOne({ email: email.toLowerCase() });

    if (user && user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Account with this email already exists'
      });
    }

    const otp = generateOTP();
    const otpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    if (user && !user.isVerified) {
      user.name = name;
      user.password = password;
      user.phone = phone;
      user.role = role || 'customer';
      user.storeName = storeName || '';
      user.vehicleNumber = vehicleNumber || '';
      user.otp = otp;
      user.otpExpire = otpExpire;
      await user.save();
    } else {
      user = await User.create({
        name,
        email: email.toLowerCase(),
        password,
        phone,
        role: role || 'customer',
        storeName: storeName || '',
        vehicleNumber: vehicleNumber || '',
        otp,
        otpExpire,
        isVerified: false
      });
    }

    // Backend Logs mein print karein testing ke liye
    console.log('==================================================');
    console.log(`🔐 NIRMANMITRA REGISTRATION OTP for ${user.email}: [ ${otp} ]`);
    console.log('==================================================');

    // Email & SMS send karein (errors handle karte hue taaki response break na ho)
    try {
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        await sendEmail({
          email: user.email,
          subject: '🔨 NirmanMitra - Verification OTP',
          message: `Hello ${user.name}, your account verification OTP is:`,
          otp
        });
      } else {
        console.warn('⚠️ EMAIL_USER or EMAIL_PASS not set in environment variables');
      }

      await sendSMS({ phone: user.phone, otp });
    } catch (deliveryErr) {
      console.warn('⚠️ OTP Delivery Warning (Email/SMS):', deliveryErr.message);
    }

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully to your Email & Phone',
      email: user.email,
      phone: user.phone
    });
  } catch (err) {
    console.error('Registration Error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: err.message
    });
  }
};

// @desc    Verify Registration OTP
// @route   POST /api/auth/verify-register-otp
// @access  Public
exports.verifyRegisterOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and OTP'
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
      otp: otp.trim(),
      otpExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpire = null;
    await user.save();

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Account verified successfully!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (err) {
    console.error('OTP Verification Error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error during OTP verification',
      error: err.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email/phone and password'
      });
    }

    const cleanInput = email.toLowerCase().trim();
    const user = await User.findOne({
      $or: [{ email: cleanInput }, { phone: cleanInput }]
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Account not verified. Please verify your OTP.'
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login Error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: err.message
    });
  }
};

// @desc    Forgot Password - Send OTP
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { identifier } = req.body;

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your email or phone number'
      });
    }

    const cleanId = identifier.trim().toLowerCase();
    const user = await User.findOne({
      $or: [{ email: cleanId }, { phone: cleanId }]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user registered with this email or phone number'
      });
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpire = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    console.log('==================================================');
    console.log(`🔑 NIRMANMITRA PASSWORD RESET OTP for ${user.email}: [ ${otp} ]`);
    console.log('==================================================');

    try {
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        await sendEmail({
          email: user.email,
          subject: '🔨 NirmanMitra - Password Reset OTP',
          message: `Hello ${user.name}, your OTP to reset your password is:`,
          otp
        });
      }
      await sendSMS({ phone: user.phone, otp });
    } catch (deliveryErr) {
      console.warn('⚠️ OTP Delivery Warning (Email/SMS):', deliveryErr.message);
    }

    res.status(200).json({
      success: true,
      message: 'Password reset OTP sent to registered Email & Phone',
      email: user.email,
      phone: user.phone
    });
  } catch (err) {
    console.error('Forgot Password Error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset request',
      error: err.message
    });
  }
};

// @desc    Reset Password with OTP
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { identifier, otp, newPassword } = req.body;

    if (!identifier || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email/phone, OTP, and new password'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    const cleanId = identifier.trim().toLowerCase();
    const user = await User.findOne({
      $or: [{ email: cleanId }, { phone: cleanId }],
      otp: otp.trim(),
      otpExpire: { $gt: Date.now() }
    }).select('+password');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    user.password = newPassword;
    user.otp = null;
    user.otpExpire = null;
    user.isVerified = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful! You can now login.'
    });
  } catch (err) {
    console.error('Reset Password Error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset',
      error: err.message
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Protected
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};