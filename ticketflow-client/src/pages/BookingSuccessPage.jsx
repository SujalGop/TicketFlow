// ---------------------------------------------------------------------------
// TicketFlow — Booking Success Page
// ---------------------------------------------------------------------------

import { Link, useLocation, Navigate } from 'react-router-dom';
import {
  CheckCircle2,
  Calendar,
  Ticket,
  ArrowRight,
  ShieldCheck,
  Receipt,
  Download,
  PartyPopper,
} from 'lucide-react';

const BookingSuccessPage = () => {
  const location = useLocation();
  const state = location.state;

  // Fallback: If user accessed /booking-success directly without payment state, redirect to dashboard
  if (!state) {
    return <Navigate to="/dashboard" replace />;
  }

  const {
    eventTitle = 'Event Ticket',
    eventDate,
    amount,
    quantity = 1,
    orderId,
    paymentId,
  } = state;

  const formattedDate = eventDate
    ? new Date(eventDate).toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-xl">
        {/* Animated Success Badge */}
        <div className="text-center mb-8">
          <div className="relative inline-flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>
            <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center shadow-lg">
              <PartyPopper className="w-4 h-4 text-white" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mt-4 tracking-tight">
            Booking Confirmed!
          </h1>
          <p className="text-surface-400 text-sm mt-2 max-w-md mx-auto">
            Your ticket has been reserved and payment was successfully processed. A digital pass has been generated.
          </p>
        </div>

        {/* Ticket Stub Card */}
        <div className="glass-card overflow-hidden relative">
          {/* Top highlight bar */}
          <div className="h-2 bg-gradient-to-r from-brand-500 via-emerald-500 to-brand-600" />

          <div className="p-6 sm:p-8 space-y-6">
            {/* Event Header */}
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Payment Verified
                </span>
                <span className="text-xs text-surface-500 font-mono">
                  CONF-#{orderId ? orderId.slice(-8).toUpperCase() : 'VALID'}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-white mt-3 leading-snug">
                {eventTitle}
              </h2>
              {formattedDate && (
                <div className="flex items-center gap-2 text-surface-300 text-sm mt-2">
                  <Calendar className="w-4 h-4 text-brand-400 shrink-0" />
                  <span>{formattedDate}</span>
                </div>
              )}
            </div>

            {/* Dotted perforation separator */}
            <div className="relative my-4">
              <div className="border-t-2 border-dashed border-surface-700/60" />
              <div className="absolute -left-10 sm:-left-12 -top-3 w-6 h-6 rounded-full bg-surface-950 border border-surface-700/50" />
              <div className="absolute -right-10 sm:-right-12 -top-3 w-6 h-6 rounded-full bg-surface-950 border border-surface-700/50" />
            </div>

            {/* Transaction Details */}
            <div className="space-y-3 bg-surface-800/40 rounded-xl p-4 border border-surface-700/30 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-surface-400 flex items-center gap-1.5">
                  <Ticket className="w-4 h-4 text-surface-500" />
                  Tickets Issued
                </span>
                <span className="text-sm font-semibold text-white">
                  {quantity} {quantity === 1 ? 'Pass' : 'Passes'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-surface-400 flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-surface-500" />
                  Total Amount Paid
                </span>
                <span className="text-base font-bold text-white">
                  ₹{Number(amount || 0).toLocaleString('en-IN')}
                </span>
              </div>

              {orderId && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-surface-400 font-mono">Order ID</span>
                  <span className="text-surface-300 font-mono selection:bg-brand-500/30">
                    {orderId}
                  </span>
                </div>
              )}

              {paymentId && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-surface-400 font-mono">Payment ID</span>
                  <span className="text-emerald-400 font-mono selection:bg-emerald-500/30">
                    {paymentId}
                  </span>
                </div>
              )}
            </div>

            {/* Call to Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                to="/dashboard"
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 transition-all duration-200 shadow-lg shadow-brand-600/25 cursor-pointer text-sm"
              >
                <Ticket className="w-4 h-4" />
                View in My Tickets
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/"
                className="px-6 py-3.5 rounded-xl font-medium text-surface-300 bg-surface-800 hover:bg-surface-700 hover:text-white transition-all duration-200 text-center text-sm border border-surface-700/50 cursor-pointer"
              >
                Explore Events
              </Link>
            </div>
          </div>
        </div>

        {/* Reassurance footer */}
        <p className="text-center text-xs text-surface-500 mt-6 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Webhook-verified & inventory locked. Your booking is 100% secure.
        </p>
      </div>
    </div>
  );
};

export default BookingSuccessPage;
