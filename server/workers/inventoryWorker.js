// ---------------------------------------------------------------------------
// TicketFlow — Inventory Worker (Background Reservation Sweeper)
// ---------------------------------------------------------------------------
// PURPOSE:
//   Replaces the MongoDB native TTL index on Reservation.createdAt.
//   The TTL index silently deleted expired documents — causing "ticket leak"
//   because availableTickets on the Event was never incremented back.
//
//   This worker runs every 1 minute and deterministically:
//     1. Finds all Reservations with status 'Pending' older than 10 minutes.
//     2. For each, runs a Mongoose transaction that atomically:
//        a. Sets reservation.status → 'Expired'
//        b. Increments event.availableTickets by +1
//     3. Uses Promise.allSettled for bulk processing so one failure doesn't
//        block other expirations.
//
// CONCURRENCY SAFETY:
//   The worker uses findOneAndUpdate with a filter { status: 'Pending' } inside
//   the transaction. If two worker ticks overlap or the app runs in a cluster,
//   only one instance will successfully match and update each reservation — the
//   other gets null back and skips. No double-increment is possible.
// ---------------------------------------------------------------------------

const cron = require('node-cron');
const mongoose = require('mongoose');
const Reservation = require('../models/Reservation');
const Event = require('../models/Event');

// 10 minutes in milliseconds
const RESERVATION_TTL_MS = 10 * 60 * 1000;

/**
 * Expire a single reservation inside a Mongoose transaction.
 * Atomically marks it 'Expired' and restores +1 availableTickets.
 *
 * @param {string} reservationId - The _id of the pending reservation
 * @param {string} eventId - The _id of the associated event
 * @returns {Promise<{ success: boolean, reservationId: string, error?: string }>}
 */
const expireSingleReservation = async (reservationId, eventId) => {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      // -------------------------------------------------------------------
      // Step 1: Atomically claim this reservation for expiration.
      // The filter { _id, status: 'Pending' } ensures that if another
      // worker tick or cluster node already expired it, this returns null.
      // -------------------------------------------------------------------
      const reservation = await Reservation.findOneAndUpdate(
        { _id: reservationId, status: 'Pending' },
        { status: 'Expired' },
        { new: true, session }
      );

      if (!reservation) {
        // Already expired by another tick or a concurrent process — skip
        return;
      }

      // -------------------------------------------------------------------
      // Step 2: Restore tickets to the event's available inventory.
      // $inc is atomic — restores full quantity reserved.
      // -------------------------------------------------------------------
      const qtyToRestore = reservation.quantity || 1;
      const updatedEvent = await Event.findByIdAndUpdate(
        eventId,
        { $inc: { availableTickets: qtyToRestore } },
        { new: true, session }
      );

      if (!updatedEvent) {
        console.warn(
          `⚠️ [InventoryWorker] Event ${eventId} not found while restoring ` +
            `ticket for expired reservation ${reservationId}`
        );
      }
    });

    return { success: true, reservationId: reservationId.toString() };
  } catch (error) {
    console.error(
      `❌ [InventoryWorker] Failed to expire reservation ${reservationId}:`,
      error.message
    );
    return {
      success: false,
      reservationId: reservationId.toString(),
      error: error.message,
    };
  } finally {
    await session.endSession();
  }
};

/**
 * Main sweep function — called every cron tick.
 * Queries all stale pending reservations and expires them in parallel.
 */
const sweepExpiredReservations = async () => {
  try {
    const cutoff = new Date(Date.now() - RESERVATION_TTL_MS);

    // Find all pending reservations older than 10 minutes
    const staleReservations = await Reservation.find({
      status: 'Pending',
      createdAt: { $lt: cutoff },
    }).select('_id eventId');

    if (staleReservations.length === 0) {
      return; // Nothing to expire — silent exit
    }

    console.log(
      `🔄 [InventoryWorker] Found ${staleReservations.length} expired reservation(s). Processing...`
    );

    // Process all expirations concurrently with allSettled (fault-tolerant)
    const results = await Promise.allSettled(
      staleReservations.map((reservation) =>
        expireSingleReservation(reservation._id, reservation.eventId)
      )
    );

    // Summary logging
    const succeeded = results.filter(
      (r) => r.status === 'fulfilled' && r.value.success
    ).length;
    const failed = results.filter(
      (r) => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)
    ).length;

    console.log(
      `✅ [InventoryWorker] Sweep complete: ${succeeded} expired, ${failed} failed ` +
        `out of ${staleReservations.length} total`
    );
  } catch (error) {
    console.error(
      '❌ [InventoryWorker] Critical error during sweep cycle:',
      error.message
    );
  }
};

/**
 * Initialize the inventory worker cron schedule.
 * Call this once after MongoDB connection is established.
 */
const startInventoryWorker = () => {
  // Run every 1 minute
  const task = cron.schedule('* * * * *', sweepExpiredReservations, {
    scheduled: true,
    timezone: 'Asia/Kolkata',
  });

  console.log('⏰ [InventoryWorker] Cron job started — sweeping every 1 minute');

  return task;
};

module.exports = {
  startInventoryWorker,
  sweepExpiredReservations, // Exported for manual invocation / testing
};
