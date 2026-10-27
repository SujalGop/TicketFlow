// ---------------------------------------------------------------------------
// TicketFlow — Authentication Context (Global Auth State)
// ---------------------------------------------------------------------------
// Provides:
//   - user: null | { _id, name, email, role }
//   - token: null | string
//   - loading: boolean (true while initial auth check is running)
//   - login(email, password): Promise
//   - register(name, email, password, role): Promise
//   - logout(): void
//
// Initialization:
//   On first mount, checks localStorage for a saved token. If found,
//   calls GET /api/auth/me to verify it's still valid and hydrate the user.
// ---------------------------------------------------------------------------

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import API from '../api/axios';

const AuthContext = createContext(null);

// Custom hook for consuming auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('ticketflow_token'));
  const [loading, setLoading] = useState(true);

  // -------------------------------------------------------------------------
  // Persist auth state to localStorage
  // -------------------------------------------------------------------------
  const saveAuth = (userData, tokenStr) => {
    setUser(userData);
    setToken(tokenStr);
    localStorage.setItem('ticketflow_token', tokenStr);
    localStorage.setItem('ticketflow_user', JSON.stringify(userData));
  };

  const clearAuth = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('ticketflow_token');
    localStorage.removeItem('ticketflow_user');
  };

  // -------------------------------------------------------------------------
  // Initial Load — verify stored token by calling /api/auth/me
  // -------------------------------------------------------------------------
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('ticketflow_token');

      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await API.get('/auth/me');

        if (data.success && data.data) {
          setUser(data.data);
          setToken(storedToken);
        } else {
          clearAuth();
        }
      } catch {
        // Token is invalid or expired — clear everything
        clearAuth();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // -------------------------------------------------------------------------
  // Login
  // -------------------------------------------------------------------------
  const login = useCallback(async (email, password) => {
    const { data } = await API.post('/auth/login', { email, password });

    if (data.success && data.data) {
      const { token: newToken, ...userData } = data.data;
      saveAuth(userData, newToken);
      return data;
    }

    throw new Error(data.message || 'Login failed');
  }, []);

  // -------------------------------------------------------------------------
  // Register
  // -------------------------------------------------------------------------
  const register = useCallback(async (name, email, password, role = 'Attendee') => {
    const { data } = await API.post('/auth/register', {
      name,
      email,
      password,
      role,
    });

    if (data.success && data.data) {
      const { token: newToken, ...userData } = data.data;
      saveAuth(userData, newToken);
      return data;
    }

    throw new Error(data.message || 'Registration failed');
  }, []);

  // -------------------------------------------------------------------------
  // Logout
  // -------------------------------------------------------------------------
  const logout = useCallback(() => {
    clearAuth();
  }, []);

  // -------------------------------------------------------------------------
  // Context Value
  // -------------------------------------------------------------------------
  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user && !!token,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
