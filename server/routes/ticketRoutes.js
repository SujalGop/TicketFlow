const express = require('express');
const router = express.Router();
const {
  reserveTicket,
  confirmPayment,
  getMyTickets,
  getActiveReservation,
} = require('../controllers/ticketController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

// ---------------------------------------------------------------------------
// All ticket routes require authentication
// ---------------------------------------------------------------------------
router.use(protect);

// Reserve a ticket — Attendee only
router.post('/reserve', authorizeRoles('Attendee'), reserveTicket);

// Confirm payment — any authenticated user (Attendee)
router.post('/confirm', confirmPayment);

// Get logged-in user's tickets
router.get('/my-tickets', getMyTickets);

// Get active reservation for a specific event (checkout UI polling)
router.get('/reservation/:eventId', getActiveReservation);

module.exports = router;
