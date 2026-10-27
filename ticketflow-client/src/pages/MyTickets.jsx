// ---------------------------------------------------------------------------
// TicketFlow — My Wallet / Tickets Page
// ---------------------------------------------------------------------------

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import {
  Ticket,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  Timer,
  Receipt,
  Loader2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

const MyTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        const [ticketsRes, reservationsRes] = await Promise.all([
          API.get('/users/tickets'),
          API.get('/users/reservations'),
        ]);

        setTickets(ticketsRes.data.data || []);
        setReservations(reservationsRes.data.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch tickets and reservations');
      } finally {
        setLoading(false);
      }
    };

    fetchWalletData();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Timer className="w-3.5 h-3.5" />
            Pending Payment
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Completed
          </span>
        );
      case 'Expired':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" />
            Expired
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-surface-700/50 text-surface-300">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <Loader2 className="w-9 h-9 text-brand-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-10 py-4">
      {/* Page Title & Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Ticket className="w-8 h-8 text-brand-400" />
            My Wallet & Tickets
          </h1>
          <p className="text-sm text-surface-400 mt-1">
            Access your verified event admission passes and active reservations.
          </p>
        </div>

        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold transition-colors self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4" />
          Browse More Events
        </Link>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 p-4 rounded-xl bg-danger-500/10 border border-danger-500/20 text-danger-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* SECTION 1: Confirmed Tickets */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-surface-800 pb-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            Confirmed Tickets ({tickets.length})
          </h2>
          <span className="text-xs text-surface-400">Issued via Razorpay webhook</span>
        </div>

        {tickets.length === 0 ? (
          <div className="glass-card p-8 text-center space-y-3">
            <Ticket className="w-10 h-10 text-surface-600 mx-auto" />
            <p className="text-surface-300 font-medium">No confirmed tickets yet.</p>
            <p className="text-xs text-surface-500 max-w-sm mx-auto">
              Once you complete payment for an event, your permanent digital admission pass will appear here.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 font-semibold pt-2"
            >
              Explore events and book now <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tickets.map((ticket) => {
              const event = ticket.eventId || {};
              return (
                <div
                  key={ticket._id}
                  className="glass-card overflow-hidden border border-surface-700/60 hover:border-emerald-500/40 transition-colors"
                >
                  <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-brand-500" />
                  <div className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" />
                            {ticket.paymentStatus || 'Paid'}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-300 bg-brand-500/10 px-2 py-0.5 rounded-md border border-brand-500/20">
                            <Ticket className="w-3 h-3" />
                            {ticket.quantity || 1} {ticket.quantity === 1 ? 'Ticket' : 'Tickets'}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-white mt-2 leading-snug">
                          {event.title || 'Event Admission Ticket'}
                        </h3>
                      </div>
                      <div className="text-right">
                        <span className="text-base font-extrabold text-white">
                          ₹{Number((event.price || 0) * (ticket.quantity || 1)).toLocaleString('en-IN')}
                        </span>
                        {ticket.quantity > 1 && (
                          <p className="text-[10px] text-surface-400">
                            ₹{event.price} × {ticket.quantity}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-surface-300 bg-surface-900/60 p-3 rounded-lg border border-surface-800">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                        <span>{formatDate(event.date)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                        <span>{formatTime(event.date)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-surface-500 font-mono pt-1">
                      <span>Order: {ticket.razorpayOrderId || 'N/A'}</span>
                      <span>Pass #{ticket._id.slice(-6).toUpperCase()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 2: Temporary Reservations */}
      <section className="space-y-4 pt-4">
        <div className="flex items-center justify-between border-b border-surface-800 pb-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Timer className="w-5 h-5 text-amber-400" />
            Temporary Reservations ({reservations.length})
          </h2>
          <span className="text-xs text-surface-400">10-minute atomic hold history</span>
        </div>

        {reservations.length === 0 ? (
          <div className="glass-card p-8 text-center space-y-2">
            <Timer className="w-10 h-10 text-surface-600 mx-auto" />
            <p className="text-surface-300 font-medium">No active or historical reservations.</p>
            <p className="text-xs text-surface-500">
              When you initiate checkout, an atomic hold reservation is created while payment completes.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reservations.map((res) => {
              const event = res.eventId || {};
              const createdDate = new Date(res.createdAt);
              return (
                <div
                  key={res._id}
                  className="glass-card p-4 space-y-3 border border-surface-700/50"
                >
                  <div className="flex items-center justify-between gap-2">
                    {getStatusBadge(res.status)}
                    <span className="text-[11px] text-surface-500 font-mono">
                      #{res._id.slice(-6).toUpperCase()}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-white line-clamp-1">
                      {event.title || 'Reserved Event'}
                    </h4>
                    <p className="text-xs text-surface-400 mt-1 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-surface-500" />
                      Created {createdDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  {event.price !== undefined && (
                    <div className="flex justify-between items-center text-xs text-surface-300 pt-2 border-t border-surface-800">
                      <span className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/20">
                          x{res.quantity || 1}
                        </span>
                        <span>Total:</span>
                      </span>
                      <span className="font-semibold text-white">
                        ₹{(Number(event.price) * (res.quantity || 1)).toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default MyTickets;
