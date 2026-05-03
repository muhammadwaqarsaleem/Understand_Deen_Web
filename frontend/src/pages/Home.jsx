// =============================================================
// pages/Home.jsx
// Understand Deen — Home Page
// =============================================================
// Layout (top to bottom):
//   1. Greeting header  — time-aware salutation + user name
//   2. ZikirCard        — full-width hero card (islamic-pattern bg)
//   3. Two-column area  — ModuleGrid (wider) + HabitSummaryCard
//      On mobile: stacks vertically (ModuleGrid first)
//      On desktop: side-by-side (lg:grid-cols-3, ModuleGrid takes 2 cols)
//
// This page is wrapped in AppLayout (navbar + footer) via App.jsx.
// AppLayout's <main> already provides paddingTop: 64px,
// so this page only needs to worry about its own internal padding.
//
// Theming: all colors via CSS variables. No hardcoded hex.
// =============================================================

import React from 'react';
import { Link }             from 'react-router-dom';
import { useApp }           from '../context/AppContext.jsx';
import ZikirCard            from '../components/home/ZikirCard.jsx';
import ModuleGrid           from '../components/home/ModuleGrid.jsx';
import HabitSummaryCard     from '../components/home/HabitSummaryCard.jsx';

// ── Time-based greeting helper ─────────────────────────────────
// Returns appropriate greeting based on the current hour.
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 5)  return 'Good night';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
};

// ── Prayer time greeting in Arabic ────────────────────────────
const getArabicGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 4  && hour < 7)  return 'وَقْتُ الفَجْر'; // Fajr time
  if (hour >= 12 && hour < 15) return 'وَقْتُ الظُّهْر'; // Dhuhr time
  if (hour >= 15 && hour < 18) return 'وَقْتُ العَصْر';  // Asr time
  if (hour >= 18 && hour < 20) return 'وَقْتُ المَغرِب'; // Maghrib time
  if (hour >= 20 || hour < 1)  return 'وَقْتُ العِشَاء'; // Isha time
  return 'اَلسَّلَامُ عَلَيْكُمْ';                          // Generic greeting
};

// =============================================================
// Home Page Component
// =============================================================
const Home = () => {
  const { user } = useApp();

  // Extract first name from fullName (e.g., "Ahmad Al-Rashid" → "Ahmad")
  const firstName = user?.fullName?.split(' ')[0] || 'Friend';

  return (
    <div
      className="flex flex-col flex-1"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* ── Max-width wrapper with padding ─────────────────── */}
      <div className="page-container flex flex-col gap-6 flex-1">

        {/* ══════════════════════════════════════════════════
            1. GREETING HEADER
            ════════════════════════════════════════════════ */}
        <div className="animate-fade-in-up pt-2">

          {/* Arabic greeting — subtle, above the main heading */}
          <p
            className="arabic-text arabic-text-sm mb-1"
            style={{ color: 'var(--gold)', opacity: 0.8 }}
            dir="rtl"
          >
            {getArabicGreeting()}
          </p>

          {/* Main greeting */}
          <h1
            className="font-display text-3xl md:text-4xl font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            {getGreeting()}, {firstName}.
          </h1>

          {/* Subtitle */}
          <p
            className="font-body text-sm md:text-base mt-1"
            style={{ color: 'var(--text-secondary)' }}
          >
            What would you like to explore today?
          </p>
        </div>

        {/* ══════════════════════════════════════════════════
            2. ZIKR HERO CARD — full width
            ════════════════════════════════════════════════ */}
        <div className="animate-fade-in-up delay-75">
          <ZikirCard />
        </div>

        {/* ══════════════════════════════════════════════════
            3. MAIN CONTENT GRID
            Layout:
              mobile  : single column (ModuleGrid, then Habits)
              desktop : 3 cols — ModuleGrid takes 2, Habits takes 1
            ════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 animate-fade-in-up delay-150">

          {/* Module Grid — takes 2/3 of the desktop width */}
          <div className="lg:col-span-2">
            <ModuleGrid />
          </div>

          {/* Habit Summary Card — takes 1/3 of the desktop width */}
          {/* On mobile: appears below ModuleGrid (natural stack order) */}
          <div className="lg:col-span-1">
            <HabitSummaryCard />
          </div>

        </div>

        {/* ══════════════════════════════════════════════════
            4. QUICK LINKS STRIP (small utility row)
            ════════════════════════════════════════════════ */}
        <div
          className="flex flex-wrap items-center justify-center gap-3 py-4 animate-fade-in delay-300"
          style={{ borderTop: '1px solid var(--border-secondary)' }}
        >
          {[
            { to: '/quran',      label: '📖 Open Quran' },
            { to: '/hadith',     label: '📜 Browse Hadith' },
            { to: '/new-muslim', label: '🌱 Fresh Start Guide' },
            { to: '/fiqh',       label: '⚖️ Fiqh Rulings' },
          ].map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="font-body text-xs font-medium px-3 py-1.5 rounded-full transition-all duration-150"
              style={{
                color:           'var(--text-secondary)',
                backgroundColor: 'var(--bg-elevated)',
                border:          '1px solid var(--border-primary)',
                textDecoration:  'none',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color           = 'var(--accent-primary)';
                e.currentTarget.style.backgroundColor = 'var(--accent-light)';
                e.currentTarget.style.borderColor     = 'var(--accent-border)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color           = 'var(--text-secondary)';
                e.currentTarget.style.backgroundColor = 'var(--bg-elevated)';
                e.currentTarget.style.borderColor     = 'var(--border-primary)';
              }}
            >
              {label}
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
};

export default Home;
