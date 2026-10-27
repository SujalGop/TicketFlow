const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { asyncHandler } = require('../utils/helpers');

// ---------------------------------------------------------------------------
// Helper — Generate JWT with user id and role
// ---------------------------------------------------------------------------
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// ---------------------------------------------------------------------------
// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
// ---------------------------------------------------------------------------
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'A user with this email already exists',
    });
  }

  // Create user (password is hashed automatically by the pre-save hook)
  const user = await User.create({ name, email, password, role });

  // Generate token
  const token = generateToken(user);

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    },
  });
});

// ---------------------------------------------------------------------------
// @desc    Login user & return JWT
// @route   POST /api/auth/login
// @access  Public
// ---------------------------------------------------------------------------
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide both email and password',
    });
  }

  // Find user and explicitly include the password field
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password',
    });
  }

  // Compare passwords
  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password',
    });
  }

  // Generate token
  const token = generateToken(user);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    },
  });
});

// ---------------------------------------------------------------------------
// @desc    Get current logged-in user's profile
// @route   GET /api/auth/me
// @access  Private
// ---------------------------------------------------------------------------
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user,
  });
});

module.exports = { register, login, getMe };
