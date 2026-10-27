// ---------------------------------------------------------------------------
// TicketFlow — User Dashboard Controller
// ---------------------------------------------------------------------------
const Ticket = require('../models/Ticket');
const Reservation = require('../models/Reservation');
const { asyncHandler } = require('../utils/helpers');

// ---------------------------------------------------------------------------
// @desc    Get all tickets for the logged-in user
// @route   GET /api/users/tickets
// @access  Private (any authenticated user)
//
// Returns tickets populated with event details (title, date, price),
// sorted newest-first for a natural dashboard experience.
// ---------------------------------------------------------------------------
const getMyTickets = asyncHandler(async (req, res) => {
  const tickets = await Ticket.find({ userId: req.user._id })
    .populate('eventId', 'title description date price totalCapacity')
    .sort({ purchasedAt: -1 });

  res.status(200).json({
    success: true,
    count: tickets.length,
    data: tickets,
  });
});

// ---------------------------------------------------------------------------
// @desc    Get all reservations for the logged-in user
// @route   GET /api/users/reservations
// @access  Private (any authenticated user)
//
// Returns all reservations (Pending, Completed, Expired) populated with event
// details. Each pending reservation includes a computed `expiresAt` timestamp
// so the frontend can render a live countdown timer.
// ---------------------------------------------------------------------------
const getMyReservations = asyncHandler(async (req, res) => {
  const reservations = await Reservation.find({ userId: req.user._id })
    .populate('eventId', 'title description date price')
    .sort({ createdAt: -1 });

  // Enrich pending reservations with a computed expiration timestamp
  const RESERVATION_TTL_MS = 10 * 60 * 1000; // 10 minutes

  const enriched = reservations.map((reservation) => {
    const obj = reservation.toObject();

    if (obj.status === 'Pending') {
      obj.expiresAt = new Date(
        new Date(obj.createdAt).getTime() + RESERVATION_TTL_MS
      );
    }

    return obj;
  });

  res.status(200).json({
    success: true,
    count: enriched.length,
    data: enriched,
  });
});

module.exports = {
  getMyTickets,
  getMyReservations,
};
