// =============================================================
// components/home/HabitSummaryCard.jsx
// Understand Deen — Habit Tracker Summary Card (Home page widget)
// =============================================================
// Purpose: A compact sidebar card on the Home page that previews
//          today's habit completion state.
//
// Current state (Step 3): Shows a static placeholder since
//   GET /api/habits/today is built in Step 8. The placeholder
//   is designed to look intentional (not broken), showing the
//   5 prayers in a pending state to motivate the user to start.
//
// Step 8 upgrade: Replace the static PLACEHOLDER_HABITS data with
//   an axios GET to /api/habits/today and render real IsCompleted
//   states. The component shape and layout should NOT change —
//   only the data source.
//
// Props: none — self-contained
// =============================================================

import React from 'react';
import { Link } from 'react-router-dom';

// ── Static placeholder data (replace with API call in Step 8) ─
// Mirrors the shape that /api/habits/today will return.
const PLACEHOLDER_HABITS = [
  { habitId: 1, name: 'Fajr',           nameArabic: 'الفَجْر',    isCompleted: false },
  { habitId: 2, name: 'Dhuhr',          nameArabic: 'الظُّهْر',   isCompleted: false },
  { habitId: 3, name: 'Asr',            nameArabic: 'العَصْر',    isCompleted: false },
  { habitId: 4, name: 'Maghrib',        nameArabic: 'المَغرِب',   isCompleted: false },
  { habitId: 5, name: 'Isha',           nameArabic: 'العِشَاء',   isCompleted: false },
  { habitId: 6, name: 'Morning Azkar',  nameArabic: 'أَذْكَار',   isCompleted: false },
];

// ── Check icon ────────────────────────────────────────────────
const CheckIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}
    className="w-3 h-3">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

// ── Arrow icon ─────────────────────────────────────────────────
const ArrowIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
    className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
  </svg>
);

// =============================================================
// HabitSummaryCard Component
// =============================================================
const HabitSummaryCard = () => {
  // Count completed habits for the progress bar
  const completed = PLACEHOLDER_HABITS.filter(h => h.isCompleted).length;
  const total     = PLACEHOLDER_HABITS.length;
  const pct       = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div
      className="deen-card p-5 flex flex-col gap-4 h-full animate-fade-in-up delay-200"
    >

      {/* ── Card header ──────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h3
            className="font-display text-lg font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            Habit Tracker
          </h3>
          <p
            className="font-body text-xs mt-0.5"
            style={{ color: 'var(--text-muted)' }}
          >
            Today's progress
          </p>
        </div>
        {/* Today date badge */}
        <span className="badge badge-green text-xs">
          {new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}
        </span>
      </div>

      {/* ── Progress bar ─────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-body text-xs" style={{ color: 'var(--text-secondary)' }}>
            {completed} of {total} completed
          </span>
          <span
            className="font-body text-xs font-semibold"
            style={{ color: pct > 0 ? 'var(--accent-primary)' : 'var(--text-muted)' }}
          >
            {pct}%
          </span>
        </div>
        {/* Track */}
        <div
          className="w-full rounded-full"
          style={{ height: '6px', backgroundColor: 'var(--border-primary)' }}
        >
          {/* Fill */}
          <div
            className="rounded-full transition-all duration-500"
            style={{
              width:           `${pct}%`,
              height:          '6px',
              backgroundColor: 'var(--accent-primary)',
              minWidth:        pct > 0 ? '6px' : '0',
            }}
          />
        </div>
      </div>

      {/* ── Habit list ───────────────────────────────────── */}
      <div className="flex flex-col gap-1.5 flex-1">
        {PLACEHOLDER_HABITS.map((habit) => (
          <div
            key={habit.habitId}
            className="flex items-center justify-between py-1.5 px-2.5 rounded-lg"
            style={{ backgroundColor: habit.isCompleted ? 'var(--accent-light)' : 'var(--bg-elevated)' }}
          >
            {/* Habit name */}
            <div className="flex items-center gap-2">
              {/* Completion circle */}
              <div
                className="flex items-center justify-center rounded-full flex-shrink-0"
                style={{
                  width:           '18px',
                  height:          '18px',
                  backgroundColor: habit.isCompleted ? 'var(--accent-primary)' : 'transparent',
                  border:          `1.5px solid ${habit.isCompleted ? 'var(--accent-primary)' : 'var(--border-primary)'}`,
                  color:           'var(--text-inverse)',
                }}
              >
                {habit.isCompleted && <CheckIcon />}
              </div>
              <span
                className="font-body text-xs font-medium"
                style={{ color: habit.isCompleted ? 'var(--accent-primary)' : 'var(--text-primary)' }}
              >
                {habit.name}
              </span>
            </div>
            {/* Arabic name — right aligned */}
            <span
              className="arabic-text"
              style={{
                fontSize: '0.7rem',
                color:    'var(--text-muted)',
                lineHeight: 1.5,
              }}
              dir="rtl"
            >
              {habit.nameArabic}
            </span>
          </div>
        ))}
      </div>

      {/* ── Placeholder notice + CTA ──────────────────────── */}
      {/* STEP 8 TODO: Remove this notice and the static data  */}
      {/* once /api/habits/today endpoint is implemented.      */}
      <div
        className="rounded-xl p-3 text-center"
        style={{ backgroundColor: 'var(--bg-elevated)', border: '1px dashed var(--border-primary)' }}
      >
        <p className="font-body text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
          Real-time tracking coming in Step 8
        </p>
        <Link
          to="/habits"
          className="inline-flex items-center gap-1.5 font-body text-xs font-semibold"
          style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}
        >
          Start Tracking
          <ArrowIcon />
        </Link>
      </div>

    </div>
  );
};

export default HabitSummaryCard;
