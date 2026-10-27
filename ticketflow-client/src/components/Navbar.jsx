// ---------------------------------------------------------------------------
// TicketFlow — Navbar Component
// ---------------------------------------------------------------------------

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Ticket,
  LogOut,
  LayoutDashboard,
  LogIn,
  UserPlus,
  Menu,
  X,
  Compass,
} from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileOpen(false);
  };

  const isOrganizer = user?.role === 'Organizer' || user?.role === 'Admin';

  return (
    <nav className="sticky top-0 z-50 border-b border-surface-700/50 bg-surface-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group"
          >
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 group-hover:from-brand-400 group-hover:to-brand-600 transition-all duration-300 shadow-md shadow-brand-500/20">
              <Ticket className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-white to-brand-200 bg-clip-text text-transparent">
              TicketFlow
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            <Link
              to="/"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium text-surface-300 hover:text-white hover:bg-surface-800 transition-all duration-200"
            >
              <Compass className="w-4 h-4 text-surface-400" />
              Events
            </Link>

            {isAuthenticated ? (
              <>
                {/* My Tickets (Attendee View) */}
                <Link
                  to="/tickets"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium text-surface-300 hover:text-white hover:bg-surface-800 transition-all duration-200"
                >
                  <Ticket className="w-4 h-4 text-brand-400" />
                  My Tickets
                </Link>

                {/* Organizer Dashboard (Organizer View) */}
                {isOrganizer && (
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium text-surface-300 hover:text-white hover:bg-surface-800 transition-all duration-200"
                  >
                    <LayoutDashboard className="w-4 h-4 text-emerald-400" />
                    Organizer Dashboard
                  </Link>
                )}

                {/* User Info & Logout */}
                <div className="ml-2 flex items-center gap-3 pl-3 border-l border-surface-700/80">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white leading-tight">
                      {user?.name}
                    </p>
                    <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-brand-400">
                      {user?.role}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-lg text-surface-400 hover:text-danger-400 hover:bg-surface-800 transition-all duration-200 cursor-pointer"
                    title="Logout"
                  >
                    <LogOut className="w-4.5 h-4.5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 pl-2">
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-surface-300 hover:text-white hover:bg-surface-800 transition-all duration-200"
                >
                  <LogIn className="w-4 h-4" />
                  Login
                </Link>
                <Link
                  to="/register"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-brand-600 hover:bg-brand-500 transition-all duration-200 shadow-md shadow-brand-600/20"
                >
                  <UserPlus className="w-4 h-4" />
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-surface-400 hover:text-white hover:bg-surface-800 transition-colors cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div className="md:hidden pb-4 pt-2 flex flex-col gap-1 border-t border-surface-800 animate-fade-in">
            <Link
              to="/"
              onClick={() => setMobileOpen(false)}
              className="px-4 py-2.5 rounded-lg text-sm font-medium text-surface-300 hover:text-white hover:bg-surface-800 transition-all"
            >
              Events
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  to="/tickets"
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium text-surface-300 hover:text-white hover:bg-surface-800 transition-all"
                >
                  My Tickets
                </Link>
                {isOrganizer && (
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="px-4 py-2.5 rounded-lg text-sm font-medium text-emerald-400 hover:bg-surface-800 transition-all"
                  >
                    Organizer Dashboard
                  </Link>
                )}
                <div className="pt-2 border-t border-surface-800/80 mt-1 px-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">{user?.name}</p>
                    <span className="text-[10px] text-brand-400 uppercase font-semibold">{user?.role}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-danger-400 font-semibold cursor-pointer"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="pt-2 flex flex-col gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium text-surface-300 hover:text-white hover:bg-surface-800 transition-all"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-2.5 rounded-lg text-sm font-semibold text-center text-white bg-brand-600 hover:bg-brand-500 transition-all"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
