const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
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
  status: {
    type: String,
    enum: ['Pending', 'Completed', 'Expired'],
    default: 'Pending',
  },
  quantity: {
    type: Number,
    default: 1,
    min: [1, 'Quantity must be at least 1'],
  },
  razorpayOrderId: {
    type: String,
    index: true,
  },
  // -----------------------------------------------------------------------
  // createdAt is used by the inventoryWorker cron job to determine if a
  // pending reservation has exceeded the 10-minute payment window.
  // Unlike the previous TTL index approach, documents are NOT auto-deleted.
  // The worker marks them 'Expired' and atomically restores availableTickets.
  // -----------------------------------------------------------------------
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// ---------------------------------------------------------------------------
// Compound index: prevent duplicate pending reservations per user per event
// ---------------------------------------------------------------------------
reservationSchema.index({ eventId: 1, userId: 1 });

// ---------------------------------------------------------------------------
// Worker query index: the inventoryWorker queries { status: 'Pending', createdAt: { $lt } }
// every minute. This compound index makes that scan an efficient index-only operation.
// ---------------------------------------------------------------------------
reservationSchema.index({ status: 1, createdAt: 1 });

module.exports = mongoose.model('Reservation', reservationSchema);
