// ---------------------------------------------------------------------------
// TicketFlow — Payment & Webhook Controller
// ---------------------------------------------------------------------------
const crypto = require('crypto');
const mongoose = require('mongoose');
const razorpay = require('../config/razorpay');
const Reservation = require('../models/Reservation');
const Ticket = require('../models/Ticket');
const { asyncHandler } = require('../utils/helpers');

// ---------------------------------------------------------------------------
// @desc    Initialize Razorpay Order
// @route   POST /api/payments/create-order
// @access  Private (Attendee only)
//
// FLOW:
//   1. Validate reservationId from request body
//   2. Fetch the Reservation and populate associated Event details
//   3. Verify ownership (reservation belongs to the authenticated user)
//   4. Verify reservation is still 'Pending' (not expired or already completed)
//   5. Calculate amount in paise (1 INR = 100 paise)
//   6. Create Razorpay order via SDK with order notes (reservationId, userId, eventId)
//   7. Store razorpayOrderId on the reservation for audit/recovery
//   8. Return order_id and amount to the client to initialize Razorpay checkout
// ---------------------------------------------------------------------------
const createOrder = asyncHandler(async (req, res) => {
  const { reservationId } = req.body;
  const userId = req.user._id;

  if (!reservationId) {
    return res.status(400).json({
      success: false,
      message: 'reservationId is required',
    });
  }

  if (!mongoose.Types.ObjectId.isValid(reservationId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid reservationId format',
    });
  }

  // Fetch reservation with populated event details
  const reservation = await Reservation.findById(reservationId).populate('eventId');

  if (!reservation) {
    return res.status(404).json({
      success: false,
      message:
        'Reservation not found or has expired (10-minute TTL). Please reserve a new ticket.',
    });
  }

  // Ensure only the user who created the reservation can initiate payment
  if (reservation.userId.toString() !== userId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You are not authorized to pay for this reservation',
    });
  }

  // Ensure reservation is still pending payment
  if (reservation.status !== 'Pending') {
    return res.status(400).json({
      success: false,
      message: `Reservation is no longer pending (current status: ${reservation.status})`,
    });
  }

  const event = reservation.eventId;
  if (!event) {
    return res.status(404).json({
      success: false,
      message: 'Associated event could not be found',
    });
  }

  // Razorpay accepts amounts in the smallest currency sub-unit (paise for INR)
  const quantity = reservation.quantity || 1;
  const amountInPaise = Math.round(event.price * quantity * 100);

  if (amountInPaise <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Event price must be greater than zero for payment processing',
    });
  }

  // Create Razorpay Order
  const options = {
    amount: amountInPaise,
    currency: 'INR',
    receipt: `rcpt_${reservation._id.toString().slice(-8)}_${Date.now().toString().slice(-6)}`,
    notes: {
      reservationId: reservation._id.toString(),
      userId: userId.toString(),
      eventId: event._id.toString(),
      quantity: quantity.toString(),
    },
  };

  const order = await razorpay.orders.create(options);

  // Persist Razorpay Order ID to the reservation for cross-referencing
  reservation.razorpayOrderId = order.id;
  await reservation.save();

  return res.status(200).json({
    success: true,
    message: 'Razorpay order created successfully',
    data: {
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: process.env.RAZORPAY_KEY_ID,
      reservationId: reservation._id,
    },
  });
});

// ---------------------------------------------------------------------------
// @desc    Razorpay Webhook Handler
// @route   POST /api/webhooks/razorpay
// @access  Public (Signature-verified)
//
// ZERO-FAIL ARCHITECTURE:
//   1. Webhook Signature Verification:
//      Computes HMAC-SHA256 signature using RAZORPAY_WEBHOOK_SECRET and the raw
//      request payload. Compares using crypto.timingSafeEqual to prevent timing attacks.
//   2. Event Filter:
//      Listens strictly for 'payment.captured'. Other events are acknowledged
//      with 200 OK without side effects.
//   3. Idempotency Check:
//      Queries Ticket collection by razorpayOrderId. If a ticket exists,
//      returns 200 OK immediately to prevent duplicate issuance on webhook retries.
//   4. Mongoose Multi-Document Transaction:
//      Atomically:
//        a. Finds the reservation by reservationId or razorpayOrderId.
//        b. Edge Case (TTL Expiration): If reservation is null (auto-deleted
//           by MongoDB TTL index after 10 minutes), do NOT issue a ticket.
//           Log a high-priority refund alert and return 200 OK so Razorpay stops retrying.
//        c. Updates reservation status to 'Completed'.
//        d. Creates and persists the final Ticket document.
// ---------------------------------------------------------------------------
const handleWebhook = async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  // Guard: missing signature
  if (!signature) {
    console.warn('⚠️ Webhook rejected: missing x-razorpay-signature header');
    return res.status(400).json({
      success: false,
      message: 'Missing x-razorpay-signature header',
    });
  }

  // Guard: server secret configuration
  if (!webhookSecret) {
    console.error('❌ Server configuration error: RAZORPAY_WEBHOOK_SECRET is not set');
    return res.status(500).json({
      success: false,
      message: 'Server webhook secret is not configured',
    });
  }

  // -------------------------------------------------------------------------
  // Step 1: Signature Verification using Node.js crypto
  // -------------------------------------------------------------------------
  try {
    const rawPayload =
      req.rawBody ||
      (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawPayload)
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
    const signatureBuffer = Buffer.from(signature, 'utf8');

    const isValidSignature =
      expectedBuffer.length === signatureBuffer.length &&
      crypto.timingSafeEqual(expectedBuffer, signatureBuffer);

    if (!isValidSignature) {
      console.warn('⚠️ Webhook signature mismatch: potential forged request');
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook signature',
      });
    }
  } catch (err) {
    console.error('❌ Error verifying webhook signature:', err.message);
    return res.status(400).json({
      success: false,
      message: 'Webhook signature verification failed',
    });
  }

  // -------------------------------------------------------------------------
  // Step 2: Event Handling — Filter for 'payment.captured'
  // -------------------------------------------------------------------------
  const { event, payload } = req.body;

  if (event !== 'payment.captured') {
    // Return 200 to acknowledge other events without performing ticket issuance
    return res.status(200).json({
      success: true,
      message: `Event '${event}' acknowledged (no action taken)`,
    });
  }

  const payment = payload?.payment?.entity;
  const razorpayOrderId = payment?.order_id;
  const reservationId = payment?.notes?.reservationId;

  if (!razorpayOrderId) {
    console.warn('⚠️ Webhook received payment.captured without order_id');
    return res.status(200).json({
      success: true,
      message: 'Ignored: No order_id present in payment entity',
    });
  }

  // -------------------------------------------------------------------------
  // Step 3: Idempotency Check (Pre-Transaction)
  // Prevents duplicate ticket generation on network retries from Razorpay
  // -------------------------------------------------------------------------
  const existingTicket = await Ticket.findOne({ razorpayOrderId });
  if (existingTicket) {
    console.log(
      `ℹ️ [Idempotency] Ticket already exists for order ${razorpayOrderId} (Ticket ID: ${existingTicket._id})`
    );
    return res.status(200).json({
      success: true,
      message: 'Payment already processed — ticket previously issued',
      data: { ticketId: existingTicket._id },
    });
  }

  // -------------------------------------------------------------------------
  // Step 4: Multi-Document Mongoose Transaction for Fulfillment
  // -------------------------------------------------------------------------
  const session = await mongoose.startSession();
  let createdTicket = null;
  let reservationExpired = false;

  try {
    await session.withTransaction(async () => {
      // Re-verify ticket idempotency inside the session to prevent concurrent race conditions
      const duplicateInSession = await Ticket.findOne({ razorpayOrderId }).session(session);
      if (duplicateInSession) {
        createdTicket = duplicateInSession;
        return;
      }

      // Locate the reservation: first by reservationId (from order notes), then by razorpayOrderId
      let reservation = null;
      if (reservationId && mongoose.Types.ObjectId.isValid(reservationId)) {
        reservation = await Reservation.findById(reservationId).session(session);
      }
      if (!reservation) {
        reservation = await Reservation.findOne({ razorpayOrderId }).session(session);
      }

      // ---------------------------------------------------------------------
      // EDGE CASE: Reservation is null (deleted by MongoDB 10-minute TTL index)
      // Do NOT create a ticket. Log an error for manual refund processing and
      // return 200 OK so Razorpay stops retrying.
      // ---------------------------------------------------------------------
      if (!reservation) {
        reservationExpired = true;
        console.error(
          `🚨 [MANUAL REFUND REQUIRED] Payment captured (${payment?.id}) for Razorpay order ${razorpayOrderId}, ` +
            `but the Reservation has expired and was removed by the 10-minute TTL index!\n` +
            `   - Payment ID: ${payment?.id}\n` +
            `   - Order ID: ${razorpayOrderId}\n` +
            `   - Amount: ₹${(payment?.amount || 0) / 100}\n` +
            `   - User ID: ${payment?.notes?.userId || 'Unknown'}\n` +
            `   - Event ID: ${payment?.notes?.eventId || 'Unknown'}\n` +
            `   ACTION: Manual refund must be processed via Razorpay dashboard.`
        );
        return;
      }

      // Update reservation status to 'Completed'
      reservation.status = 'Completed';
      await reservation.save({ session });

      // Create finalized Ticket document
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

      createdTicket = ticketDocs[0];
    });

    // Handle outcome outside of transaction block
    if (reservationExpired) {
      return res.status(200).json({
        success: true,
        message:
          'Reservation expired prior to payment confirmation. Transaction logged for manual refund.',
      });
    }

    console.log(
      `✅ [Fulfillment Success] Ticket ${createdTicket?._id} issued for order ${razorpayOrderId}`
    );

    return res.status(200).json({
      success: true,
      message: 'Payment verified and ticket successfully issued',
      data: {
        ticketId: createdTicket?._id,
        orderId: razorpayOrderId,
      },
    });
  } catch (error) {
    console.error('❌ Error processing webhook fulfillment transaction:', error);

    // E11000 duplicate key error on Ticket.razorpayOrderId (unique index)
    if (error.code === 11000) {
      console.log(`ℹ️ [Idempotency] Duplicate key caught for order ${razorpayOrderId}`);
      return res.status(200).json({
        success: true,
        message: 'Ticket already exists (duplicate key handled)',
      });
    }

    // Return 500 on transient database failures so Razorpay retries the webhook
    return res.status(500).json({
      success: false,
      message: 'Internal server error while processing webhook transaction',
    });
  } finally {
    await session.endSession();
  }
};

module.exports = {
  createOrder,
  handleWebhook,
};
