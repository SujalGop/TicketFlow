const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ---------------------------------------------------------------------------
// protect — Verify JWT and attach user to req.user
// ---------------------------------------------------------------------------
const protect = async (req, res, next) => {
  try {
    let token;

    // Extract token from "Authorization: Bearer <token>" header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized — no token provided',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user to request (exclude password)
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized — user no longer exists',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized — token is invalid or expired',
    });
  }
};

// ---------------------------------------------------------------------------
// authorizeRoles — RBAC gate: only allow users whose role is in the list
// Usage: authorizeRoles('Organizer', 'Admin')
// ---------------------------------------------------------------------------
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied — role '${req.user?.role}' is not authorized for this resource`,
      });
    }
    next();
  };
};

module.exports = { protect, authorizeRoles };
