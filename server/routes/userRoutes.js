// ---------------------------------------------------------------------------
// TicketFlow — User Dashboard Routes
// ---------------------------------------------------------------------------
const express = require('express');
const router = express.Router();
const {
  getMyTickets,
  getMyReservations,
} = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');

// ---------------------------------------------------------------------------
// All user dashboard routes require authentication
// ---------------------------------------------------------------------------
router.use(protect);

// Get logged-in user's finalized tickets (with event details)
router.get('/tickets', getMyTickets);

// Get logged-in user's reservations (Pending / Completed / Expired)
router.get('/reservations', getMyReservations);

module.exports = router;
