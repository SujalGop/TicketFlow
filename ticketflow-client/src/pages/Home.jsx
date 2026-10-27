// ---------------------------------------------------------------------------
// TicketFlow — Event Listing Page (Home)
// ---------------------------------------------------------------------------

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  Clock,
  Ticket,
  Users,
  Loader2,
  Search,
  Sparkles,
  AlertCircle,
  Tag,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';

const Home = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const { isAuthenticated } = useAuth();

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await API.get('/events');
      setEvents(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch events:', err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Network Error: Unable to connect to backend';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const filteredEvents = events.filter((event) =>
    event.title.toLowerCase().includes(search.toLowerCase()) ||
    (event.description && event.description.toLowerCase().includes(search.toLowerCase()))
  );

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-10">
      {/* Hero Header */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-brand-900/40 via-surface-900/60 to-surface-950 p-8 sm:p-12 border border-surface-800">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/20 mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            High-Concurrency Atomic Ticketing
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Discover & Book Live Experiences
          </h1>
          <p className="mt-3 text-base sm:text-lg text-surface-400 max-w-xl">
            Real-time zero-race-condition ticket reservation powered by MongoDB ACID transactions and instant Razorpay settlement.
          </p>

          {/* Search Bar */}
          <div className="mt-6 relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              type="text"
              placeholder="Search by event title or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-900 border border-surface-700/60 text-white placeholder-surface-500 text-sm focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>
        </div>
      </section>

      {/* Prominent Red Error Banner */}
      {error && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-sm animate-fade-in shadow-lg shadow-red-950/40">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
            <div>
              <p className="font-semibold text-red-200">Failed to load events</p>
              <p className="text-xs text-red-400 mt-0.5">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchEvents}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-900/60 hover:bg-red-800 text-red-200 text-xs font-medium border border-red-700/50 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      )}

      {/* Events Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Upcoming Events</h2>
            {!loading && !error && (
              <p className="text-xs text-surface-400 mt-0.5">
                Showing {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'}
              </p>
            )}
          </div>
        </div>

        {/* Loading Spinner State */}
        {loading ? (
          <div className="min-h-[250px] flex flex-col items-center justify-center gap-3 glass-card p-12">
            <Loader2 className="w-10 h-10 text-brand-500 animate-spin" />
            <p className="text-surface-300 text-sm font-medium">Loading events...</p>
          </div>
        ) : error ? null : filteredEvents.length === 0 ? (
          /* Empty State */
          <div className="glass-card p-12 text-center max-w-md mx-auto space-y-4">
            <Ticket className="w-12 h-12 text-surface-600 mx-auto" />
            <h3 className="text-lg font-semibold text-white">No events found</h3>
            <p className="text-sm text-surface-400">
              {search
                ? `No upcoming events match "${search}". Try searching for something else.`
                : 'There are currently no upcoming events with available tickets. Check back soon!'}
            </p>
          </div>
        ) : (
          /* Event Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => {
              const isSoldOut = event.availableTickets <= 0;
              const percentLeft = Math.round(
                (event.availableTickets / (event.totalCapacity || 1)) * 100
              );

              return (
                <div
                  key={event._id}
                  className="glass-card flex flex-col justify-between overflow-hidden border border-surface-700/50 hover:border-brand-500/40 transition-all duration-300 group"
                >
                  <div className="p-6 space-y-4">
                    {/* Header Badges */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                        <Tag className="w-3 h-3" />
                        ₹{Number(event.price).toLocaleString('en-IN')}
                      </span>
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                          isSoldOut
                            ? 'bg-danger-500/10 text-danger-400 border-danger-500/20'
                            : percentLeft < 20
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}
                      >
                        {isSoldOut ? 'Sold Out' : `${event.availableTickets} tickets left`}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <Link to={`/events/${event._id}`}>
                        <h3 className="text-lg font-bold text-white group-hover:text-brand-300 transition-colors line-clamp-1">
                          {event.title}
                        </h3>
                      </Link>
                      <p className="text-xs text-surface-400 mt-2 line-clamp-2 leading-relaxed">
                        {event.description || 'No description provided for this event.'}
                      </p>
                    </div>

                    {/* Meta info */}
                    <div className="space-y-2 pt-2 border-t border-surface-800 text-xs text-surface-300">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                        <span>{formatDate(event.date)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                        <span>{formatTime(event.date)}</span>
                      </div>
                      {event.organizerId?.name && (
                        <div className="flex items-center gap-2 text-surface-400">
                          <Users className="w-3.5 h-3.5 shrink-0" />
                          <span>Organized by {event.organizerId.name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Action Footer */}
                  <div className="p-4 bg-surface-900/50 border-t border-surface-800/80">
                    <Link
                      to={`/events/${event._id}`}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-surface-800 hover:bg-brand-600 transition-all duration-200 border border-surface-700/60 group/btn"
                    >
                      <span>View Details</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
