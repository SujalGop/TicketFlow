// ---------------------------------------------------------------------------
// TicketFlow — Login Page
// ---------------------------------------------------------------------------

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Mail, Lock, Loader2, AlertCircle, Ticket } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Login failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      {/* Decorative gradient blob */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-brand-600/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative animate-slide-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-brand-600/10 mb-4">
            <Ticket className="w-8 h-8 text-brand-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome back</h1>
          <p className="text-surface-400">Sign in to your TicketFlow account</p>
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
            {/* Email */}
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-surface-300 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-surface-500" />
                <input
                  id="login-email"
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
              <label htmlFor="login-password" className="block text-sm font-medium text-surface-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-surface-500" />
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-surface-800 border border-surface-600 text-white placeholder-surface-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-all"
                />
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
                <LogIn className="w-5 h-5" />
              )}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-surface-400">
            Don&apos;t have an account?{' '}
            <Link
              to="/register"
              className="text-brand-400 hover:text-brand-300 font-medium transition-colors"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
