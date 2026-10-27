const mongoose = require('mongoose');
const Event = require('../models/Event');
const Reservation = require('../models/Reservation');
const Ticket = require('../models/Ticket');
const { asyncHandler } = require('../utils/helpers');

// ---------------------------------------------------------------------------
// @desc    Reserve a ticket (atomic inventory decrement + TTL reservation)
// @route   POST /api/tickets/reserve
// @access  Private (Attendee only)
//
// CONCURRENCY STRATEGY:
//   We use findOneAndUpdate with a filter condition { availableTickets > 0 }
//   combined with { $inc: { availableTickets: -1 } }.
//   MongoDB guarantees this is an ATOMIC operation — even if 1000 users hit
//   this endpoint simultaneously, each one either succeeds (gets a decrement)
//   or fails (returns null because availableTickets reached 0). No overselling.
//
// TTL STRATEGY:
//   The resulting Reservation document has a TTL of 600s on `createdAt`.
//   If the user doesn't confirm payment within 10 minutes, MongoDB's
//   background TTL monitor deletes the reservation automatically.
//   A pre-remove hook / change stream / scheduled worker then increments
//   availableTickets back on the event.
// ---------------------------------------------------------------------------
const reserveTicket = asyncHandler(async (req, res) => {
  const { eventId, quantity = 1 } = req.body;
  const userId = req.user._id;

  const qty = Math.max(1, parseInt(quantity, 10) || 1);

  if (!eventId) {
    return res.status(400).json({
      success: false,
      message: 'eventId is required',
    });
  }

  // -------------------------------------------------------------------------
  // Guard: check if this user already has a pending reservation for this event
  // -------------------------------------------------------------------------
  const existingReservation = await Reservation.findOne({
    eventId,
    userId,
    status: 'Pending',
  });

  if (existingReservation) {
    return res.status(409).json({
      success: false,
      message: 'You already have a pending reservation for this event',
      data: {
        reservationId: existingReservation._id,
        quantity: existingReservation.quantity || 1,
      },
    });
  }

  // -------------------------------------------------------------------------
  // ATOMIC OPERATION — single-query check-and-decrement by quantity
  // Filter ensures: event exists AND has at least `qty` tickets AND date is in future
  // Update atomically decrements availableTickets by `qty`
  // If no document matches the filter, `updatedEvent` is null → sold out / insufficient
  // -------------------------------------------------------------------------
  const updatedEvent = await Event.findOneAndUpdate(
    {
      _id: eventId,
      availableTickets: { $gte: qty },
      date: { $gt: new Date() },
    },
    {
      $inc: { availableTickets: -qty },
    },
    { new: true }
  );

  if (!updatedEvent) {
    return res.status(409).json({
      success: false,
      message:
        `Unable to reserve — event not found, only ${qty > 1 ? 'insufficient tickets left' : 'sold out'}, or has already passed`,
    });
  }

  // -------------------------------------------------------------------------
  // Create TTL-backed reservation with requested quantity (auto-expires in 10 minutes)
  // -------------------------------------------------------------------------
  const reservation = await Reservation.create({
    eventId,
    userId,
    quantity: qty,
  });

  res.status(201).json({
    success: true,
    message: `${qty} ticket(s) reserved! Complete payment within 10 minutes.`,
    data: {
      reservationId: reservation._id,
      eventId: updatedEvent._id,
      eventTitle: updatedEvent.title,
      price: updatedEvent.price,
      quantity: qty,
      totalPrice: updatedEvent.price * qty,
      availableTickets: updatedEvent.availableTickets,
      expiresAt: new Date(reservation.createdAt.getTime() + 600 * 1000),
    },
  });
});

// ---------------------------------------------------------------------------
// @desc    Confirm payment and issue ticket (Mongoose Transaction)
// @route   POST /api/tickets/confirm
// @access  Private
//
// TRANSACTION STRATEGY:
//   We use session.withTransaction() to ensure the following steps are
//   atomic across multiple collections:
//     1. Find & validate the reservation (must exist, must be Pending)
//     2. Mark reservation as Completed
//     3. Create a Ticket document with razorpayOrderId
//   If ANY step fails, the entire transaction aborts — no partial state.
//
// IDEMPOTENCY:
//   - We check reservation.status !== 'Pending' to prevent double-confirm.
//   - The Ticket.razorpayOrderId unique index prevents duplicate tickets
//     even if this endpoint is called twice with the same order ID.
// ---------------------------------------------------------------------------
const confirmPayment = asyncHandler(async (req, res) => {
  const { reservationId, razorpayOrderId } = req.body;
  const userId = req.user._id;

  if (!reservationId || !razorpayOrderId) {
    return res.status(400).json({
      success: false,
      message: 'reservationId and razorpayOrderId are required',
    });
  }

  // -------------------------------------------------------------------------
  // Idempotency check — if a ticket with this order ID already exists,
  // return success without processing again
  // -------------------------------------------------------------------------
  const existingTicket = await Ticket.findOne({ razorpayOrderId });
  if (existingTicket) {
    return res.status(200).json({
      success: true,
      message: 'Payment already confirmed — ticket was previously issued',
      data: existingTicket,
    });
  }

  // -------------------------------------------------------------------------
  // Start Mongoose session for multi-document transaction
  // -------------------------------------------------------------------------
  const session = await mongoose.startSession();

  try {
    let ticket;

    await session.withTransaction(async () => {
      // -------------------------------------------------------------------
      // Step 1: Find the reservation within the transaction
      // -------------------------------------------------------------------
      const reservation = await Reservation.findById(reservationId).session(
        session
      );

      if (!reservation) {
        throw Object.assign(
          new Error(
            'Reservation not found — it may have expired (10-min TTL). Please reserve again.'
          ),
          { statusCode: 400 }
        );
      }

      // Verify ownership — user can only confirm their own reservation
      if (reservation.userId.toString() !== userId.toString()) {
        throw Object.assign(
          new Error('You are not authorized to confirm this reservation'),
          { statusCode: 403 }
        );
      }

      // -------------------------------------------------------------------
      // Step 2: Idempotency — if reservation is already Completed, abort
      // -------------------------------------------------------------------
      if (reservation.status === 'Completed') {
        throw Object.assign(
          new Error(
            'This reservation has already been completed'
          ),
          { statusCode: 409 }
        );
      }

      // -------------------------------------------------------------------
      // Step 3: Mark reservation as Completed
      // -------------------------------------------------------------------
      reservation.status = 'Completed';
      await reservation.save({ session });

      // -------------------------------------------------------------------
      // Step 4: Create the Ticket document within the same transaction
      // -------------------------------------------------------------------
      const ticketDocs = await Ticket.create(
        [
          {
            eventId: reservation.eventId,
            userId: reservation.userId,
            razorpayOrderId,
            quantity: reservation.quantity || 1,
            paymentStatus: 'Completed',
          },
        ],
        { session }
      );

      ticket = ticketDocs[0];
    });

    // Transaction committed successfully
    res.status(201).json({
      success: true,
      message: 'Payment confirmed — ticket issued successfully!',
      data: ticket,
    });
  } catch (error) {
    // If the error has a custom statusCode, use it; otherwise 500
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Payment confirmation failed',
    });
  } finally {
    await session.endSession();
  }
});

// ---------------------------------------------------------------------------
// @desc    Get all tickets for the logged-in user
// @route   GET /api/tickets/my-tickets
// @access  Private
// ---------------------------------------------------------------------------
const getMyTickets = asyncHandler(async (req, res) => {
  const tickets = await Ticket.find({ userId: req.user._id })
    .populate('eventId', 'title date price')
    .sort({ purchasedAt: -1 });

  res.status(200).json({
    success: true,
    count: tickets.length,
    data: tickets,
  });
});

// ---------------------------------------------------------------------------
// @desc    Get active reservation for a specific event (for the checkout UI)
// @route   GET /api/tickets/reservation/:eventId
// @access  Private
// ---------------------------------------------------------------------------
const getActiveReservation = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findOne({
    eventId: req.params.eventId,
    userId: req.user._id,
    status: 'Pending',
  });

  if (!reservation) {
    return res.status(404).json({
      success: false,
      message: 'No active reservation found for this event',
    });
  }

  res.status(200).json({
    success: true,
    data: {
      reservationId: reservation._id,
      eventId: reservation.eventId,
      status: reservation.status,
      createdAt: reservation.createdAt,
      expiresAt: new Date(reservation.createdAt.getTime() + 600 * 1000),
    },
  });
});

module.exports = {
  reserveTicket,
  confirmPayment,
  getMyTickets,
  getActiveReservation,
};
