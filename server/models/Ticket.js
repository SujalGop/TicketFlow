const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: [true, 'Event ID is required'],
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
  },
  razorpayOrderId: {
    type: String,
    required: [true, 'Razorpay Order ID is required'],
    unique: true, // Enforces webhook idempotency — duplicate order IDs rejected
  },
  paymentStatus: {
    type: String,
    enum: ['Completed', 'Refunded'],
    default: 'Completed',
  },
  quantity: {
    type: Number,
    default: 1,
    min: [1, 'Quantity must be at least 1'],
  },
  purchasedAt: {
    type: Date,
    default: Date.now,
  },
});

// ---------------------------------------------------------------------------
// Index on razorpayOrderId — fast lookups for webhook idempotency checks
// (unique: true above already creates this, listed here for clarity)
// ---------------------------------------------------------------------------
ticketSchema.index({ eventId: 1, userId: 1 });

module.exports = mongoose.model('Ticket', ticketSchema);
