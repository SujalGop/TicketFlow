// ---------------------------------------------------------------------------
// TicketFlow — Organizer Dashboard Page
// ---------------------------------------------------------------------------

import { useState, useEffect } from 'react';
import API from '../api/axios';
import {
  Calendar,
  Clock,
  Ticket,
  Users,
  DollarSign,
  PlusCircle,
  Loader2,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  Layers,
} from 'lucide-react';

const OrganizerDashboard = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    price: '',
    totalCapacity: '',
  });

  // Fetch organizer events on mount
  useEffect(() => {
    const fetchOrganizerEvents = async () => {
      try {
        const { data } = await API.get('/events/my-events');
        setEvents(data.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load your events');
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizerEvents();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Basic validation
    if (!formData.title || !formData.date || !formData.price || !formData.totalCapacity) {
      setError('Please fill in all required fields.');
      return;
    }

    if (Number(formData.price) < 0 || Number(formData.totalCapacity) <= 0) {
      setError('Price must be 0 or greater, and capacity must be at least 1.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        date: new Date(formData.date).toISOString(),
        price: Number(formData.price),
        totalCapacity: Number(formData.totalCapacity),
      };

      const { data } = await API.post('/events', payload);
      setSuccess('Event published successfully!');
      
      // Prepend newly created event to the list
      if (data.data) {
        setEvents((prev) => [data.data, ...prev]);
      }

      // Reset form
      setFormData({
        title: '',
        description: '',
        date: '',
        price: '',
        totalCapacity: '',
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create event. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

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
    <div className="space-y-10 py-4 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <Layers className="w-8 h-8 text-brand-400" />
          Organizer Dashboard
        </h1>
        <p className="text-sm text-surface-400 mt-1">
          Publish new ticketed events and monitor real-time inventory and sales.
        </p>
      </div>

      {/* Form: Create New Event */}
      <section className="glass-card p-6 sm:p-8 border border-surface-700/60">
        <div className="flex items-center gap-2.5 pb-4 mb-6 border-b border-surface-800">
          <PlusCircle className="w-5 h-5 text-brand-400" />
          <h2 className="text-xl font-bold text-white">Create New Event</h2>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3.5 mb-5 rounded-xl bg-danger-500/10 border border-danger-500/20 text-danger-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-3.5 mb-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Title */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-xs font-semibold text-surface-300 uppercase tracking-wider">
                Event Title *
              </label>
              <input
                type="text"
                name="title"
                required
                placeholder="e.g. Neon Horizon Music Festival 2026"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-900 border border-surface-700/70 text-white placeholder-surface-500 text-sm focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-xs font-semibold text-surface-300 uppercase tracking-wider">
                Description
              </label>
              <textarea
                name="description"
                rows="3"
                placeholder="Provide event overview, lineup, schedule, and venue details..."
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-900 border border-surface-700/70 text-white placeholder-surface-500 text-sm focus:outline-none focus:border-brand-500 transition-colors resize-none"
              />
            </div>

            {/* Date & Time */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-surface-300 uppercase tracking-wider">
                Date & Time *
              </label>
              <input
                type="datetime-local"
                name="date"
                required
                value={formData.date}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-900 border border-surface-700/70 text-white placeholder-surface-500 text-sm focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>

            {/* Price */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-surface-300 uppercase tracking-wider">
                Ticket Price (INR ₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 font-semibold text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  name="price"
                  min="0"
                  step="1"
                  required
                  placeholder="e.g. 499"
                  value={formData.price}
                  onChange={handleChange}
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-surface-900 border border-surface-700/70 text-white placeholder-surface-500 text-sm focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>
            </div>

            {/* Total Capacity */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-surface-300 uppercase tracking-wider">
                Total Capacity (Available Tickets) *
              </label>
              <input
                type="number"
                name="totalCapacity"
                min="1"
                step="1"
                required
                placeholder="e.g. 250"
                value={formData.totalCapacity}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-900 border border-surface-700/70 text-white placeholder-surface-500 text-sm focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-brand-600/25 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Publishing Event...
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  Publish Event
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      {/* Events List: Created by this Organizer */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-surface-800 pb-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-brand-400" />
            Your Created Events ({events.length})
          </h2>
          <span className="text-xs text-surface-400">Live atomic inventory tracking</span>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <div className="glass-card p-10 text-center space-y-2">
            <Layers className="w-10 h-10 text-surface-600 mx-auto" />
            <p className="text-surface-300 font-medium">No events created yet.</p>
            <p className="text-xs text-surface-500">
              Use the form above to publish your first ticketed event.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {events.map((ev) => {
              const total = ev.totalCapacity || 1;
              const available = ev.availableTickets ?? total;
              const sold = Math.max(0, total - available);
              const percentSold = Math.round((sold / total) * 100);

              return (
                <div
                  key={ev._id}
                  className="glass-card p-5 space-y-4 border border-surface-700/60 hover:border-brand-500/40 transition-colors"
                >
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="text-base font-bold text-white line-clamp-1">
                      {ev.title}
                    </h3>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-brand-500/10 text-brand-400 border border-brand-500/20 shrink-0">
                      ₹{Number(ev.price).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <p className="text-xs text-surface-400 line-clamp-2">
                    {ev.description || 'No description provided.'}
                  </p>

                  <div className="space-y-1.5 text-xs text-surface-300">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-brand-400" />
                      <span>{formatDate(ev.date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-brand-400" />
                      <span>{formatTime(ev.date)}</span>
                    </div>
                  </div>

                  {/* Inventory progress bar */}
                  <div className="space-y-1.5 pt-2 border-t border-surface-800">
                    <div className="flex justify-between text-xs">
                      <span className="text-surface-400">Sold: {sold} / {total}</span>
                      <span className="font-semibold text-emerald-400">{available} left</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-surface-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-brand-500 to-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${percentSold}%` }}
                      />
                    </div>
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

export default OrganizerDashboard;
