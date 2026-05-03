// =============================================================
// App.jsx — Root Application Entry Point
// Understand Deen | React 18 + React Router v6
// =============================================================
// CHANGE LOG:
//   Step 1: Added ThemeProvider, AppProvider, updated route guards
//           to use useApp().isAuthenticated instead of localStorage
//   Step 2: Imported AppLayout; all protected routes now wrapped
//           in <AppLayout> so every page gets the navbar + footer.
//           Auth routes (/login, /signup) remain bare — no layout.
//
// Route map:
//   PUBLIC (bare — no navbar):
//     /            → redirect to /login
//     /login       → Login.jsx
//     /signup      → Signup.jsx
//
//   PROTECTED (wrapped in AppLayout — has navbar + footer):
//     /home        → Home.jsx         (Step 3)
//     /quran       → Quran.jsx        (Step 4)
//     /hadith      → Hadith.jsx       (Step 5)
//     /new-muslim  → NewMuslim.jsx    (Step 6)
//     /fiqh        → Fiqh.jsx         (Step 7)
//     /habits      → HabitTracker.jsx (Step 8)
//     /profile     → Profile.jsx      (Step 9)
//     /dashboard   → Dashboard.jsx    (Deliverable 2 — kept for compat)
//
//   FALLBACK:
//     *            → redirect to /login
// =============================================================

import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

// ── Context Providers (Step 1) ────────────────────────────────
import { ThemeProvider }       from './context/ThemeContext.jsx';
import { AppProvider, useApp } from './context/AppContext.jsx';

// ── Layout Shell (Step 2) ─────────────────────────────────────
import AppLayout from './components/layout/AppLayout.jsx';

// ── Completed pages (Deliverable 2) ──────────────────────────
import Login     from './pages/Login.jsx';
import Signup    from './pages/Signup.jsx';
import Dashboard from './pages/Dashboard.jsx';

// =============================================================
// PLACEHOLDER PAGE COMPONENTS
// Each renders a themed card confirming routing + layout works.
// Replace the inline definition with a real import as each
// step is completed (Steps 3–9).
// =============================================================

const PlaceholderPage = ({ title, description, icon, step }) => (
  <div style={{
    flex:            1,
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    padding:         '3rem 1.5rem',
    backgroundColor: 'var(--bg-primary)',
  }}>
    <div style={{
      maxWidth:        '520px',
      width:           '100%',
      backgroundColor: 'var(--bg-card)',
      border:          '1px solid var(--border-primary)',
      borderRadius:    '1.5rem',
      padding:         '2.5rem',
      textAlign:       'center',
      boxShadow:       '0 4px 24px rgba(0,0,0,0.05)',
    }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{icon}</div>
      <h1 style={{
        fontFamily:   '"Cormorant Garamond", serif',
        fontSize:     '2rem',
        fontWeight:   600,
        color:        'var(--text-primary)',
        marginBottom: '0.75rem',
      }}>
        {title}
      </h1>
      <p style={{
        fontFamily:   '"DM Sans", sans-serif',
        fontSize:     '0.9rem',
        color:        'var(--text-secondary)',
        lineHeight:   1.6,
        marginBottom: '1.5rem',
      }}>
        {description}
      </p>
      <span style={{
        display:         'inline-block',
        fontSize:        '0.75rem',
        fontFamily:      '"DM Sans", sans-serif',
        fontWeight:      500,
        color:           'var(--accent-primary)',
        backgroundColor: 'var(--accent-light)',
        border:          '1px solid var(--accent-border)',
        borderRadius:    '999px',
        padding:         '0.375rem 0.875rem',
      }}>
        🚧 Coming in {step}
      </span>
    </div>
  </div>
);

// ── /home — Step 3 ───────────────────────────────────────────
const Home = () => (
  <PlaceholderPage icon="🏠" title="Home" step="Step 3"
    description="Bento grid with Zikr of the Day hero card, module links, and habit summary widget." />
);

// ── /quran — Step 4 ──────────────────────────────────────────
const Quran = () => (
  <PlaceholderPage icon="📖" title="Quran" step="Step 4"
    description="Split-pane reader: Surah list (25%) left panel, Ayat viewer (75%) right panel." />
);

// ── /hadith — Step 5 ─────────────────────────────────────────
const Hadith = () => (
  <PlaceholderPage icon="📜" title="Hadith" step="Step 5"
    description="Six Kutub al-Sittah book cards, chapter browser, and full-text keyword search." />
);

// ── /new-muslim — Step 6 ─────────────────────────────────────
const NewMuslim = () => (
  <PlaceholderPage icon="🌱" title="New Muslim Guide" step="Step 6"
    description="Progress checklist of 8 Islamic fundamentals with toggleable completion and progress bar." />
);

// ── /fiqh — Step 7 ───────────────────────────────────────────
const Fiqh = () => (
  <PlaceholderPage icon="⚖️" title="Fiqh — Islamic Jurisprudence" step="Step 7"
    description="Sticky Madhab filter sidebar and ruling cards with 4-tab side-by-side comparison." />
);

// ── /habits — Step 8 ─────────────────────────────────────────
const HabitTracker = () => (
  <PlaceholderPage icon="✅" title="Habit Tracker" step="Step 8"
    description="30-day GitHub-style contribution heatmap and 1-tap daily prayer + Azkar checklist." />
);

// ── /profile — Step 9 ────────────────────────────────────────
const Profile = () => (
  <PlaceholderPage icon="👤" title="Profile & Preferences" step="Step 9"
    description="Theme (Light/Dark/Sepia) and Arabic font (Uthmanic/Naskh) toggles persisted to database." />
);

// =============================================================
// Route Guards
// Both guards read from useApp() — React state — NOT localStorage.
// =============================================================

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useApp();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useApp();
  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }
  return children;
};

// =============================================================
// AppRoutes — separate component so useApp() works in guards
// =============================================================
const AppRoutes = () => (
  <Routes>

    {/* ── Default redirect ──────────────────────────────── */}
    <Route path="/" element={<Navigate to="/login" replace />} />

    {/* ── Public routes (bare — no AppLayout) ───────────── */}
    <Route path="/login"  element={<PublicRoute><Login /></PublicRoute>} />
    <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

    {/* ── Protected routes (wrapped in AppLayout) ────────── */}
    <Route path="/home" element={
      <ProtectedRoute><AppLayout><Home /></AppLayout></ProtectedRoute>
    } />

    {/* Old dashboard — kept bare; Dashboard.jsx has its own nav */}
    <Route path="/dashboard" element={
      <ProtectedRoute><Dashboard /></ProtectedRoute>
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

    {/* ── 404 fallback ──────────────────────────────────── */}
    <Route path="*" element={<Navigate to="/login" replace />} />

  </Routes>
);

// =============================================================
// Root App — provider nesting order is intentional:
//   ThemeProvider > AppProvider > BrowserRouter > AppRoutes
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
