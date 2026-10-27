// ---------------------------------------------------------------------------
// TicketFlow — Main Application Router & Shell
// ---------------------------------------------------------------------------

import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import MyTickets from './pages/MyTickets';
import OrganizerDashboard from './pages/OrganizerDashboard';
import EventDetails from './pages/EventDetails';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import BookingSuccessPage from './pages/BookingSuccessPage';

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-surface-950 text-white flex flex-col font-sans selection:bg-brand-500/30 selection:text-white">
        {/* Navigation Bar */}
        <Navbar />

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/events/:id" element={<EventDetails />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Attendee Protected Routes */}
            <Route
              path="/tickets"
              element={
                <ProtectedRoute>
                  <MyTickets />
                </ProtectedRoute>
              }
            />

            {/* Organizer Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['Organizer', 'Admin']}>
                  <OrganizerDashboard />
                </ProtectedRoute>
              }
            />

            {/* Booking Success Confirmation */}
            <Route
              path="/booking-success"
              element={
                <ProtectedRoute>
                  <BookingSuccessPage />
                </ProtectedRoute>
              }
            />

            {/* Catch-all Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Minimalist Footer */}
        <footer className="border-t border-surface-800/80 bg-surface-950/60 backdrop-blur-md py-6 text-center text-xs text-surface-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p>© {new Date().getFullYear()} TicketFlow. High-concurrency event ticketing.</p>
            <div className="flex items-center gap-4 text-surface-400">
              <span>MongoDB Transactions</span>
              <span>•</span>
              <span>Atomic Inventory Sweeper</span>
              <span>•</span>
              <span>Razorpay Integration</span>
            </div>
          </div>
        </footer>
      </div>
    </AuthProvider>
  );
}

export default App;
