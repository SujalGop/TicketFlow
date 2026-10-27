// ---------------------------------------------------------------------------
// TicketFlow — Payment Routes
// ---------------------------------------------------------------------------
const express = require('express');
const router = express.Router();
const {
  createOrder,
  handleWebhook,
} = require('../controllers/paymentController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

// ---------------------------------------------------------------------------
// @route   POST /api/payments/create-order
// @desc    Initialize a Razorpay order for an active ticket reservation
// @access  Private (Attendee only)
// ---------------------------------------------------------------------------
router.post('/create-order', protect, authorizeRoles('Attendee'), createOrder);

// ---------------------------------------------------------------------------
// @route   POST /api/payments/webhook
// @desc    Razorpay webhook endpoint (can be accessed via /api/payments/webhook
//          or mounted at /api/webhooks/razorpay)
// @access  Public (HMAC signature verified)
// ---------------------------------------------------------------------------
router.post('/webhook', handleWebhook);

module.exports = router;
