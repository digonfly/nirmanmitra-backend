// ============================================
// AUTHENTICATION CONTROLLER (FIXED)
// ============================================

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'nirmanmitra_secret_key_2025',
    { expiresIn: '30d' }
  );
};

// REGISTER
const registerUser = async (req, res) => {
  try {
    console.log('📩 Register body:', req.body);

    let { name, email, password, phone, role, storeName, vehicleNumber, address } = req.body;

    // Clean values
    name = (name || '').trim();
    email = (email || '').trim().toLowerCase();
    password = (password || '').trim();
    phone = (phone || '').trim();
    role = (role || 'customer').toLowerCase();

    // Validation
    if (!name || name.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid name'
      });
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please enter an email address'
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a phone number'
      });
    }

    // Valid roles only
    const allowedRoles = ['customer', 'seller', 'delivery', 'admin'];
    if (!allowedRoles.includes(role)) {
      role = 'customer';
    }

    // Check existing user
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists. Please login.'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone,
      role,
      storeName: storeName || '',
      vehicleNumber: vehicleNumber || '',
      address: address || {
        street: '',
        city: '',
        pincode: '',
        state: ''
      }
    });

    const token = generateToken(user._id);

    console.log('✅ User created:', user.email);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully 🎉',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        storeName: user.storeName,
        vehicleNumber: user.vehicleNumber
      }
    });
  } catch (error) {
    console.error('❌ Registration Error:', error);

    // Duplicate email
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered. Please login.'
      });
    }

    // Mongoose validation error
    if (error.name === 'ValidationError') {
      const msg = Object.values(error.errors).map(e => e.message).join(', ');
      return res.status(400).json({
        success: false,
        message: msg || 'Validation failed'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Server Error during registration',
      error: error.message
    });
  }
};

// LOGIN
const loginUser = async (req, res) => {
  try {
    console.log('📩 Login body:', req.body);

    let { email, password } = req.body;
    email = (email || '').trim().toLowerCase();
    password = (password || '').trim();

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password'
      });
    }

    const user = await User.findOne({ email }).select('+password');

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

    const token = generateToken(user._id);

    console.log('✅ Login success:', user.email);

    return res.json({
      success: true,
      message: 'Logged in successfully ✅',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        storeName: user.storeName,
        vehicleNumber: user.vehicleNumber,
        address: user.address
      }
    });
  } catch (error) {
    console.error('❌ Login Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error during login',
      error: error.message
    });
  }
};

// PROFILE
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    return res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        storeName: user.storeName,
        vehicleNumber: user.vehicleNumber,
        address: user.address,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server Error retrieving profile',
      error: error.message
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile
};