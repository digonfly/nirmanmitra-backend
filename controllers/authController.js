// ============================================
// NIRMANMITRA - AUTH CONTROLLER (EMAIL + SMS OTP)
// ============================================

const User = require('../models/User');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');
const sendSMS = require('../utils/sendSMS');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// 1. REGISTER: Send OTP to Email & Phone
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, phone, role, storeName, vehicleNumber } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
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
    const otpExpire = new Date(Date.now() + 10 * 60 * 1000);

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

    // Send OTP to Email & Mobile SMS simultaneously
    await Promise.allSettled([
      sendEmail({
        email: user.email,
        subject: '🔨 NirmanMitra - Registration OTP',
        message: `Hello ${user.name}, your verification OTP is:`,
        otp
      }),
      sendSMS({
        phone: user.phone,
        otp
      })
    ]);

    res.status(200).json({
      success: true,
      message: 'OTP sent to your email and mobile number.',
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

// 2. VERIFY REGISTER OTP
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

// 3. LOGIN USER
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

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
        message: 'Account not verified. Please verify your OTP first.'
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

// 4. FORGOT PASSWORD: Send OTP to Email & Phone
exports.forgotPassword = async (req, res) => {
  try {
    const { identifier } = req.body; // Can be email OR phone

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your registered email or phone number'
      });
    }

    const cleanId = identifier.trim().toLowerCase();
    const user = await User.findOne({
      $or: [{ email: cleanId }, { phone: cleanId }]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email or phone number'
      });
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpire = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await Promise.allSettled([
      sendEmail({
        email: user.email,
        subject: '🔨 NirmanMitra - Password Reset OTP',
        message: `Hello ${user.name}, your OTP to reset password is:`,
        otp
      }),
      sendSMS({
        phone: user.phone,
        otp
      })
    ]);

    res.status(200).json({
      success: true,
      message: 'Password reset OTP sent to registered email & phone',
      email: user.email,
      phone: user.phone
    });
  } catch (err) {
    console.error('Forgot Password Error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to send reset OTP',
      error: err.message
    });
  }
};

// 5. RESET PASSWORD WITH OTP
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
        message: 'Password must be at least 6 characters'
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
      message: 'Password reset successfully! You can now log in.'
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

// 6. PROFILE
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};