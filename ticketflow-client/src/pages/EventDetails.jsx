// ---------------------------------------------------------------------------
// TicketFlow — Event Details Page (with Multi-Ticket Selection)
// ---------------------------------------------------------------------------

import { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Checkout from '../components/Checkout';
import {
  Calendar,
  Clock,
  Ticket,
  Users,
  ArrowLeft,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Lock,
  Minus,
  Plus,
} from 'lucide-react';

const EventDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchEvent = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await API.get(`/events/${id}`);
        setEvent(data.data);
      } catch (err) {
        console.error('Failed to load event details:', err);
        setError(
          err.response?.data?.message ||
          err.message ||
          'Failed to load event details'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 text-brand-500 animate-spin" />
        <p className="text-surface-400 text-sm font-medium">Loading event details...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-4">
        <div className="inline-flex p-3 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white">Event Not Found</h2>
        <p className="text-surface-400 text-sm max-w-md mx-auto">
          {error || "The event you are looking for does not exist or has already taken place."}
        </p>
        <div className="pt-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface-800 hover:bg-surface-700 text-white text-sm font-semibold transition-colors border border-surface-700/60"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to All Events
          </Link>
        </div>
      </div>
    );
  }

  const isSoldOut = event.availableTickets <= 0;
  const percentLeft = Math.round(
    (event.availableTickets / (event.totalCapacity || 1)) * 100
  );
  const isPast = new Date(event.date) < new Date();
  const maxAllowedTickets = Math.min(10, event.availableTickets || 1);
  const totalPrice = (Number(event.price) || 0) * quantity;

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* Back button */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-surface-400 hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1 text-brand-400" />
          Back to Events
        </Link>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column (2 Cols): Event Information */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6 sm:p-8 space-y-5 border border-surface-700/60 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                <Sparkles className="w-3.5 h-3.5" />
                Featured Experience
              </span>
              <span
                className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                  isSoldOut
                    ? 'bg-danger-500/10 text-danger-400 border-danger-500/20'
                    : percentLeft < 20
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}
              >
                {isSoldOut ? 'Sold Out' : `${event.availableTickets} tickets remaining`}
              </span>
              {isPast && (
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-surface-700/50 text-surface-400">
                  Past Event
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
              {event.title}
            </h1>

            {/* Quick Metadata Chips */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-sm text-surface-300">
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-900/60 border border-surface-800">
                <Calendar className="w-4 h-4 text-brand-400 shrink-0" />
                <div>
                  <p className="text-[11px] text-surface-400 uppercase font-semibold">Date</p>
                  <p className="text-white font-medium">{formatDate(event.date)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-900/60 border border-surface-800">
                <Clock className="w-4 h-4 text-brand-400 shrink-0" />
                <div>
                  <p className="text-[11px] text-surface-400 uppercase font-semibold">Time</p>
                  <p className="text-white font-medium">{formatTime(event.date)}</p>
                </div>
              </div>
            </div>

            {/* Organizer Info */}
            {event.organizerId && (
              <div className="flex items-center gap-3 pt-3 border-t border-surface-800 text-xs text-surface-400">
                <div className="w-8 h-8 rounded-full bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-400 font-bold">
                  {event.organizerId.name ? event.organizerId.name[0].toUpperCase() : 'O'}
                </div>
                <div>
                  <p className="text-surface-400 text-[11px]">Organized by</p>
                  <p className="text-white font-semibold">{event.organizerId.name || 'Verified Organizer'}</p>
                </div>
              </div>
            )}
          </div>

          {/* Description Section */}
          <div className="glass-card p-6 sm:p-8 space-y-4 border border-surface-700/60">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Ticket className="w-5 h-5 text-brand-400" />
              About This Event
            </h2>
            <div className="text-sm text-surface-300 leading-relaxed whitespace-pre-line">
              {event.description || 'No detailed description provided for this event.'}
            </div>
          </div>

          {/* Real-time Inventory Progress Bar */}
          <div className="glass-card p-6 space-y-3 border border-surface-700/60">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Live Atomic Inventory
              </span>
              <span className="text-surface-400">
                {event.availableTickets} of {event.totalCapacity} available
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-surface-900 overflow-hidden border border-surface-800">
              <div
                className="h-full bg-gradient-to-r from-brand-500 to-emerald-500 rounded-full transition-all duration-700"
                style={{ width: `${Math.max(5, percentLeft)}%` }}
              />
            </div>
            <p className="text-[11px] text-surface-400">
              Multi-ticket atomic reservations with MongoDB ACID transactions. Selected tickets are locked for 10 minutes upon checkout.
            </p>
          </div>
        </div>

        {/* Right Column (1 Col): Sticky Checkout Sidebar */}
        <div className="lg:sticky lg:top-24 space-y-4">
          <div className="glass-card p-6 space-y-5 border border-surface-700/60 shadow-xl shadow-surface-950/50">
            <div className="pb-4 border-b border-surface-800">
              <p className="text-xs text-surface-400 uppercase tracking-wider font-semibold">Price per Attendee</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-extrabold text-white">
                  ₹{Number(event.price).toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-surface-400">/ ticket</span>
              </div>
            </div>

            {/* Interactive Quantity Selector */}
            {!isSoldOut && !isPast && (
              <div className="space-y-2 pb-4 border-b border-surface-800">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-white">Number of Tickets</span>
                  <span className="text-surface-400 text-[11px]">
                    Max {maxAllowedTickets} per order
                  </span>
                </div>
                <div className="flex items-center justify-between bg-surface-900/80 border border-surface-700/70 rounded-xl p-1.5">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-white bg-surface-800 hover:bg-surface-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    title="Decrease quantity"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <div className="text-center">
                    <span className="font-extrabold text-lg text-white">
                      {quantity}
                    </span>
                    <span className="text-xs text-surface-400 ml-1.5">
                      {quantity === 1 ? 'ticket' : 'tickets'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(maxAllowedTickets, q + 1))}
                    disabled={quantity >= maxAllowedTickets}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-white bg-surface-800 hover:bg-surface-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    title="Increase quantity"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Price Breakdown */}
            <div className="space-y-2 text-xs text-surface-300">
              <div className="flex justify-between">
                <span>Admission ({quantity} × ₹{Number(event.price).toLocaleString('en-IN')})</span>
                <span className="font-medium text-white">₹{totalPrice.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Booking & Platform Fee</span>
                <span className="font-medium text-emerald-400">Free (₹0)</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-surface-800 font-semibold text-white text-sm">
                <span>Total Due</span>
                <span className="text-brand-300 font-extrabold text-base">₹{totalPrice.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Action Button: Checkout or Sign-In Prompt */}
            <div>
              {isPast ? (
                <button
                  disabled
                  className="w-full py-3.5 rounded-xl font-semibold text-sm bg-surface-800 text-surface-400 cursor-not-allowed text-center border border-surface-700/50"
                >
                  Event Concluded
                </button>
              ) : isSoldOut ? (
                <button
                  disabled
                  className="w-full py-3.5 rounded-xl font-semibold text-sm bg-danger-500/10 text-danger-400 cursor-not-allowed text-center border border-danger-500/20"
                >
                  Sold Out
                </button>
              ) : isAuthenticated ? (
                <div className="space-y-2">
                  <Checkout event={event} quantity={quantity} className="w-full" />
                  <p className="text-[11px] text-center text-surface-400">
                    Locks your {quantity} ticket{quantity > 1 ? 's' : ''} for 10 minutes via Razorpay
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <Link
                    to="/login"
                    state={{ from: location }}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm text-white bg-brand-600 hover:bg-brand-500 transition-all duration-200 shadow-lg shadow-brand-600/25"
                  >
                    <Lock className="w-4 h-4" />
                    Sign In to Buy Tickets
                  </Link>
                  <p className="text-[11px] text-center text-surface-400">
                    Sign in or register an account to book tickets.
                  </p>
                </div>
              )}
            </div>

            {/* Trust Badges */}
            <div className="pt-4 border-t border-surface-800 space-y-2 text-[11px] text-surface-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Instant digital ticket issuance via webhook</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                <span>Encrypted 256-bit Razorpay checkout</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;
