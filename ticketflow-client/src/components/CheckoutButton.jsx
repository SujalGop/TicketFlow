// ---------------------------------------------------------------------------
// TicketFlow — Checkout Button Component
// ---------------------------------------------------------------------------
// A drop-in checkout button that triggers the full Razorpay payment flow.
// Supports single or multi-ticket checkout with dynamic price calculation.
// ---------------------------------------------------------------------------

import { Loader2, CreditCard, AlertCircle, ShieldCheck } from 'lucide-react';
import { useCheckout } from '../hooks/useCheckout';

const STEP_LABELS = {
  idle: 'Pay & Book',
  reserving: 'Reserving your tickets...',
  'creating-order': 'Preparing payment order...',
  paying: 'Completing payment with Razorpay...',
};

const CheckoutButton = ({
  eventId,
  eventTitle,
  eventDate,
  price,
  quantity = 1,
  className = '',
}) => {
  const { initiateCheckout, resetCheckout, processing, error, step } = useCheckout();
  const qty = Math.max(1, parseInt(quantity, 10) || 1);
  const total = (Number(price) || 0) * qty;

  const handleClick = () => {
    initiateCheckout(eventId, {
      title: eventTitle,
      date: eventDate,
      price,
      quantity: qty,
    });
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Main checkout button */}
      <button
        onClick={handleClick}
        disabled={processing}
        className={`
          relative flex items-center justify-center gap-2.5
          w-full px-6 py-3.5 rounded-xl
          font-semibold text-white text-base
          transition-all duration-300 ease-out
          cursor-pointer
          ${
            processing
              ? 'bg-surface-700 cursor-not-allowed opacity-80'
              : 'bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 hover:shadow-[0_0_30px_rgba(139,92,246,0.3)] hover:scale-[1.01] active:scale-[0.99]'
          }
          ${className}
        `}
      >
        {processing ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <CreditCard className="w-5 h-5" />
        )}

        <span>
          {processing
            ? STEP_LABELS[step] || 'Processing...'
            : qty > 1
            ? `Book ${qty} Tickets • ₹${total.toLocaleString('en-IN')}`
            : `Book Ticket • ₹${total.toLocaleString('en-IN')}`}
        </span>
      </button>

      {/* Secure payment badge */}
      {!error && (
        <div className="flex items-center justify-center gap-1.5 text-xs text-surface-500">
          <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
          <span>Secured by Razorpay · 256-bit encryption</span>
        </div>
      )}

      {/* Error state alert */}
      {error && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-danger-500/10 border border-danger-500/20 text-xs text-danger-400">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">{error}</p>
            <button
              onClick={resetCheckout}
              className="mt-1.5 text-brand-400 hover:underline cursor-pointer"
            >
              Try again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutButton;
