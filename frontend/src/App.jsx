// =============================================================
// App.jsx — Root Application Entry Point
// Understand Deen | React 18 + React Router v6
// =============================================================
// CHANGE LOG:
//   Step 1: Added ThemeProvider, AppProvider, updated route guards
//   Step 2: Added AppLayout wrapping all protected routes
//   Step 3: Replaced inline Home placeholder with real Home.jsx import
//   Step 4: Replaced inline Quran placeholder with real Quran.jsx import
//   Step 5: Replaced inline Hadith placeholder with real Hadith.jsx import
//
// RESPONSIVE RULE (from Step 2 fix):
//   Never use inline display styles for responsive behavior.
//   Always use Tailwind responsive classes (hidden, lg:flex, etc.)
//
// Route map:
//   PUBLIC (bare — no AppLayout):
//     /login    → Login.jsx
//     /signup   → Signup.jsx
//
//   PROTECTED (wrapped in AppLayout):
//     /home         → Home.jsx         ✅ Step 3
//     /quran        → Quran.jsx        ✅ Step 4
//     /hadith       → Hadith.jsx       ✅ Step 5
//     /new-muslim   → placeholder      (Step 6)
//     /fiqh         → placeholder      (Step 7)
//     /habits       → placeholder      (Step 8)
//     /profile      → placeholder      (Step 9)
//     /dashboard    → Dashboard.jsx    (Deliverable 2, bare)
// =============================================================

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// ── Context Providers ─────────────────────────────────────────
import { ThemeProvider }       from './context/ThemeContext.jsx';
import { AppProvider, useApp } from './context/AppContext.jsx';

// ── Layout Shell ──────────────────────────────────────────────
import AppLayout from './components/layout/AppLayout.jsx';

// ── Auth Pages (Deliverable 2) ────────────────────────────────
import Login     from './pages/Login.jsx';
import Signup    from './pages/Signup.jsx';
import Dashboard from './pages/Dashboard.jsx';

// ── Real Pages (replace placeholders as steps complete) ───────
import Home   from './pages/Home.jsx';   // ✅ Step 3
import Quran  from './pages/Quran.jsx';  // ✅ Step 4
import Hadith from './pages/Hadith.jsx'; // ✅ Step 5

// =============================================================
// PLACEHOLDER — used for steps not yet built (Steps 6–9)
// Replace each one with a real import as its step is completed.
// Uses CSS variables so it themes correctly in all 3 modes.
// =============================================================
const PlaceholderPage = ({ title, description, icon, step }) => (
  <div
    className="flex flex-col flex-1 items-center justify-center p-12"
    style={{ backgroundColor: 'var(--bg-primary)' }}
  >
    <div
      className="deen-card p-10 text-center max-w-lg w-full"
    >
      <div className="text-5xl mb-4">{icon}</div>
      <h1
        className="font-display text-3xl font-semibold mb-3"
        style={{ color: 'var(--text-primary)' }}
      >
        {title}
      </h1>
      <p
        className="font-body text-sm leading-relaxed mb-5"
        style={{ color: 'var(--text-secondary)' }}
      >
        {description}
      </p>
      <span
        className="badge badge-green"
        style={{ fontSize: '0.75rem' }}
      >
        🚧 Coming in {step}
      </span>
    </div>
  </div>
);

// ── Placeholder definitions (Steps 6–9) ─────────────────────
// Note: Hadith placeholder removed in Step 5!

const NewMuslim = () => (
  <PlaceholderPage icon="🌱" title="New Muslim Guide" step="Step 6"
    description="8 fundamentals checklist with toggleable completion and progress bar." />
);
const Fiqh = () => (
  <PlaceholderPage icon="⚖️" title="Fiqh" step="Step 7"
    description="Sticky Madhab filter sidebar and ruling cards with 4-tab comparison." />
);
const HabitTracker = () => (
  <PlaceholderPage icon="✅" title="Habit Tracker" step="Step 8"
    description="30-day heatmap and 1-tap daily prayer + Azkar checklist." />
);
const Profile = () => (
  <PlaceholderPage icon="👤" title="Profile & Preferences" step="Step 9"
    description="Theme (Light/Dark/Sepia) and Arabic font toggles saved to database." />
);

// =============================================================
// Route Guards — read from useApp() React state, NOT localStorage
// =============================================================
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useApp();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useApp();
  return isAuthenticated ? <Navigate to="/home" replace /> : children;
};

// =============================================================
// AppRoutes — separate component so hooks work inside guards
// =============================================================
const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/login" replace />} />

    {/* Public */}
    <Route path="/login"  element={<PublicRoute><Login /></PublicRoute>} />
    <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

    {/* Protected — all wrapped in AppLayout */}
    <Route path="/home" element={
      <ProtectedRoute><AppLayout><Home /></AppLayout></ProtectedRoute>
    } />
    <Route path="/quran" element={
      <ProtectedRoute><AppLayout><Quran /></AppLayout></ProtectedRoute>
    } />
    <Route path="/hadith" element={
      <ProtectedRoute><AppLayout><Hadith /></AppLayout></ProtectedRoute>
    } />
    <Route path="/new-muslim" element={
      <ProtectedRoute><AppLayout><NewMuslim /></AppLayout></ProtectedRoute>
    } />
    <Route path="/fiqh" element={
      <ProtectedRoute><AppLayout><Fiqh /></AppLayout></ProtectedRoute>
    } />
    <Route path="/habits" element={
      <ProtectedRoute><AppLayout><HabitTracker /></AppLayout></ProtectedRoute>
    } />
    <Route path="/profile" element={
      <ProtectedRoute><AppLayout><Profile /></AppLayout></ProtectedRoute>
    } />

    {/* Deliverable 2 dashboard — kept bare (has its own internal nav) */}
    <Route path="/dashboard" element={
      <ProtectedRoute><Dashboard /></ProtectedRoute>
    } />

    <Route path="*" element={<Navigate to="/login" replace />} />
  </Routes>
);

// =============================================================
// Root App — provider nesting order is critical:
//   ThemeProvider (outermost) > AppProvider > BrowserRouter
// =============================================================
function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;