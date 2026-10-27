// ---------------------------------------------------------------------------
// TicketFlow — Register Page
// ---------------------------------------------------------------------------

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, User, Mail, Lock, Loader2, AlertCircle, Ticket, ChevronDown } from 'lucide-react';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Attendee');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(name, email, password, role);
      navigate('/');
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      {/* Decorative gradient blob */}
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] rounded-full bg-brand-700/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative animate-slide-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-brand-600/10 mb-4">
            <Ticket className="w-8 h-8 text-brand-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Create your account</h1>
          <p className="text-surface-400">Join TicketFlow and never miss an event</p>
        </div>

        {/* Form card */}
        <div className="p-8 rounded-2xl bg-surface-900/80 border border-surface-700/50 backdrop-blur-sm">
          {error && (
            <div className="flex items-center gap-2.5 p-3.5 mb-6 rounded-lg bg-danger-500/10 border border-danger-500/20">
              <AlertCircle className="w-4.5 h-4.5 text-danger-400 shrink-0" />
              <p className="text-sm text-danger-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Name */}
            <div>
              <label htmlFor="register-name" className="block text-sm font-medium text-surface-300 mb-1.5">
                Full name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-surface-500" />
                <input
                  id="register-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                  maxLength={50}
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-surface-800 border border-surface-600 text-white placeholder-surface-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="register-email" className="block text-sm font-medium text-surface-300 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-surface-500" />
                <input
                  id="register-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-surface-800 border border-surface-600 text-white placeholder-surface-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="register-password" className="block text-sm font-medium text-surface-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-surface-500" />
                <input
                  id="register-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  required
                  minLength={6}
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-surface-800 border border-surface-600 text-white placeholder-surface-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-all"
                />
              </div>
            </div>

            {/* Role selector */}
            <div>
              <label htmlFor="register-role" className="block text-sm font-medium text-surface-300 mb-1.5">
                I want to
              </label>
              <div className="relative">
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-surface-500 pointer-events-none" />
                <select
                  id="register-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full appearance-none px-4 py-3 rounded-xl bg-surface-800 border border-surface-600 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-all cursor-pointer"
                >
                  <option value="Attendee">Attend events (Attendee)</option>
                  <option value="Organizer">Organize events (Organizer)</option>
                </select>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-[0_0_30px_rgba(139,92,246,0.25)] cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <UserPlus className="w-5 h-5" />
              )}
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-surface-400">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-brand-400 hover:text-brand-300 font-medium transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
