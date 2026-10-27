// ---------------------------------------------------------------------------
// TicketFlow — Protected Route Component
// ---------------------------------------------------------------------------
// Wraps routes requiring authentication and optional role-based access control.
// - If user is not authenticated, redirects to /login (saving current path).
// - If allowedRoles is specified and user's role is not permitted, redirects to /
//   or unauthorized fallback.
// ---------------------------------------------------------------------------

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children, allowedRoles, roles }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Show spinner while checking token validity on initial mount
  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  // Not authenticated → redirect to login with return route state
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role validation (supports both `allowedRoles` and legacy `roles` prop)
  const requiredRoles = allowedRoles || roles;
  if (requiredRoles && requiredRoles.length > 0) {
    const hasPermission = requiredRoles.includes(user.role);
    if (!hasPermission) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
