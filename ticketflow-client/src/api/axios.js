// ---------------------------------------------------------------------------
// TicketFlow — Axios Instance with JWT Interceptor
// ---------------------------------------------------------------------------
// Centralized Axios configuration:
//   1. Base URL points to the backend API
//   2. Request interceptor auto-attaches JWT from localStorage
//   3. Response interceptor handles 401 (expired token → redirect to login)
// ---------------------------------------------------------------------------

import axios from 'axios';

let apiBase = (import.meta.env.VITE_API_URL || '/api').trim().replace(/\/$/, '');
if (apiBase.startsWith('http') && !apiBase.endsWith('/api')) {
  apiBase = `${apiBase}/api`;
}

const API = axios.create({
  baseURL: apiBase,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ---------------------------------------------------------------------------
// Request Interceptor — Attach JWT token to every outgoing request
// ---------------------------------------------------------------------------
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ticketflow_token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ---------------------------------------------------------------------------
// Response Interceptor — Handle expired/invalid tokens globally
// ---------------------------------------------------------------------------
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // If the backend returns 401, the token is invalid/expired
    if (error.response?.status === 401) {
      // Clear stored auth state
      localStorage.removeItem('ticketflow_token');
      localStorage.removeItem('ticketflow_user');

      // Redirect to login (only if not already on login/register page)
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default API;
