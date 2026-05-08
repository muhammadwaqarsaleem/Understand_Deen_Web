/**
 * frontend/src/components/newmuslim/ProgressHeader.jsx
 *
 * Displays the user's overall progress through the 8 Islamic fundamentals.
 *
 * COMPONENTS:
 *   1. Summary line  — "X of 8 pillars completed"
 *   2. Progress bar  — Animated width, --accent-primary fill
 *   3. Motivational quote — Changes based on 4 completion thresholds:
 *        0%      (0/8)  → Encouraging start quote
 *        1–50%   (1–4)  → Perseverance hadith
 *        51–99%  (5–7)  → Near-completion hadith
 *        100%    (8/8)  → Congratulatory Arabic verse + English
 *
 * PROGRESS BAR ANIMATION:
 *   We use a CSS transition on the width property. The bar is a child div
 *   whose width% is set via inline style — this is NOT a breakpoint style,
 *   so inline style is appropriate here (project rule only restricts
 *   inline display styles for responsive show/hide, not dynamic values).
 *
 * PROPS:
 *   completed  {number}  — Number of sections with IsCompleted = true
 *   total      {number}  — Always 8 (passed explicitly for clarity)
 */

import React from 'react';

// ── Motivational Quotes ───────────────────────────────────────────────────────
/**
 * QUOTES: Four threshold-based messages.
 * Each entry has: arabic (optional), text (English), source.
 *
 * Scholarly sources are cited so students can look them up.
 */
const QUOTES = [
  // 0% — Threshold: completed === 0
  {
    arabic : null,
    text   : '"The most beloved of deeds to Allah is to bring happiness to a Muslim." Begin your journey — every great path starts with one step of intention.',
    source : 'Principle of Niyyah (Intention) — Hadith: Sahih al-Bukhari 1',
  },
  // 1–50% — Threshold: 1 ≤ completed ≤ 4
  {
    arabic : null,
    text   : '"The most beloved deeds to Allah are those done consistently, even if they are small."',
    source : 'Sahih al-Bukhari 6464 / Sahih Muslim 783',
  },
  // 51–99% — Threshold: 5 ≤ completed ≤ 7
  {
    arabic : null,
    text   : '"When Allah wills good for a person, He grants them understanding of the religion." You are well on your way.',
    source : 'Sahih al-Bukhari 71 / Sahih Muslim 1037',
  },
  // 100% — Threshold: completed === 8
  {
    arabic : 'وَالَّذِينَ جَاهَدُوا فِينَا لَنَهْدِيَنَّهُمْ سُبُلَنَا',
    text   : '"And those who strive in Our cause — We will surely guide them to Our ways."',
    source : 'Al-Quran — Al-Ankabut 29:69',
  },
];

/**
 * getQuote
 * Returns the appropriate quote object based on completion count.
 * @param {number} completed
 * @param {number} total
 * @returns {Object} Quote entry from QUOTES array
 */
function getQuote(completed, total) {
  if (completed === 0)           return QUOTES[0]; // Not started
  if (completed <= total / 2)    return QUOTES[1]; // 1–4 (1–50%)
  if (completed < total)         return QUOTES[2]; // 5–7 (51–99%)
  return QUOTES[3];                                 // 8   (100%)
}

// ─────────────────────────────────────────────────────────────────────────────
const ProgressHeader = ({ completed, total }) => {
  const pct   = total > 0 ? Math.round((completed / total) * 100) : 0;
  const quote = getQuote(completed, total);
  const isDone = completed === total;

  return (
    <div
      className="rounded-2xl p-5 md:p-6 mb-6 animate-fade-in"
      style={{
        backgroundColor : 'var(--bg-card)',
        border          : '1px solid var(--border-primary)',
      }}
    >
      {/* ── Top row: Count + Percentage ─────────────────────────────────── */}
      <div className="flex items-baseline justify-between gap-4 mb-3 flex-wrap">

        <div>
          {/* Primary summary */}
          <p
            className="text-lg font-bold"
            style={{
              color      : 'var(--text-primary)',
              fontFamily : 'Cormorant Garamond, serif',
            }}
          >
            {isDone
              ? '🎉 All 8 Pillars Completed!'
              : `${completed} of ${total} pillars completed`
            }
          </p>
          <p
            className="text-xs mt-0.5"
            style={{ color: 'var(--text-muted)' }}
          >
            Your guided journey through the Islamic fundamentals
          </p>
        </div>

        {/* Percentage badge */}
        <span
          className={`badge text-sm font-bold ${isDone ? 'badge-green' : 'badge-gold'}`}
        >
          {pct}%
        </span>
      </div>

      {/* ── Progress Bar ─────────────────────────────────────────────────── */}
      {/*
           The outer div is the track (bg-elevated).
           The inner div is the fill, width set via inline style because it's
           a dynamic numeric value — not a breakpoint/display style.
           CSS transition animates the fill as completed count changes.
      */}
      <div
        className="w-full rounded-full h-3 overflow-hidden mb-4"
        style={{ backgroundColor: 'var(--bg-elevated)' }}
        role="progressbar"
        aria-valuenow={completed}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={`${completed} of ${total} sections completed`}
      >
        <div
          className="h-3 rounded-full transition-all duration-700 ease-out"
          style={{
            width           : `${pct}%`,
            backgroundColor : isDone ? '#22c55e' : 'var(--accent-primary)',
            // Green override on 100% completion for clear visual celebration
            minWidth        : completed > 0 ? '12px' : '0px', // Always show some fill
          }}
        />
      </div>

      {/* ── Motivational Quote ───────────────────────────────────────────── */}
      <div
        className="rounded-xl px-4 py-3"
        style={{
          backgroundColor : 'var(--bg-elevated)',
          border          : '1px solid var(--border-secondary)',
        }}
      >
        {/* Arabic verse — only for the 100% completion state */}
        {quote.arabic && (
          <p
            className="arabic-text arabic-text-lg text-center mb-2"
            style={{ color: 'var(--accent-primary)' }}
          >
            ﴿ {quote.arabic} ﴾
          </p>
        )}

        {/* English text */}
        <p
          className="text-sm italic text-center leading-relaxed"
          style={{ color: 'var(--text-secondary)' }}
        >
          {quote.text}
        </p>

        {/* Source attribution */}
        <p
          className="text-xs text-center mt-1 font-medium"
          style={{ color: 'var(--text-muted)' }}
        >
          — {quote.source}
        </p>
      </div>
    </div>
  );
};

export default ProgressHeader;