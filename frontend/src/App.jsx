// =============================================================
// App.jsx — Root Router Configuration
// =============================================================
// Route structure:
//   /           → redirects to /login
//   /login      → Login page (public)
//   /signup     → Signup page (public)
//   /dashboard  → Dashboard (protected — requires valid JWT)
// =============================================================

import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import Login     from './pages/Login.jsx';
import Signup    from './pages/Signup.jsx';
import Dashboard from './pages/Dashboard.jsx';

// =============================================================
// ProtectedRoute — Guards a route behind JWT presence.
// Redirects to /login if no valid token found in localStorage.
//
// ARCHITECTURAL NOTE: For a production app, you'd also verify
// the JWT expiry client-side (jwt-decode) and refresh tokens
// via a /api/auth/refresh endpoint. We keep it simple for
// this deliverable but the server-side validation handles security.
// =============================================================
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('ud_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// =============================================================
// PublicRoute — Redirects authenticated users away from
// login/signup pages (so they go straight to dashboard).
// =============================================================
const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('ud_token');
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Default: redirect root to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Public routes (redirect to dashboard if already logged in) */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <Signup />
            </PublicRoute>
          }
        />

        {/* Protected route */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* 404 fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
