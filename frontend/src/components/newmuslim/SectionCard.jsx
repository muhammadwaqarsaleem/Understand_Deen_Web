/**
 * frontend/src/components/newmuslim/SectionCard.jsx
 *
 * Renders a single Islamic fundamental section as an interactive card.
 *
 * VISUAL STATES:
 *   Incomplete: standard .deen-card appearance, empty custom checkbox.
 *   Completed:  --accent-light bg tint, green left border, filled checkbox,
 *               green "Completed" badge, and a formatted LastToggled date.
 *
 * CUSTOM CHECKBOX:
 *   We use a styled <div> instead of a native <input type="checkbox"> for
 *   two reasons:
 *     1. Native checkboxes are notoriously difficult to style consistently
 *        across browsers while respecting our CSS variable theme system.
 *     2. The entire card is clickable — a real checkbox inside would create
 *        conflicting click targets. One div, one onClick, clean UX.
 *
 * BORDER FIX (post-Step-5 architecture rule):
 *   We use separate borderLeftWidth, borderLeftStyle, borderLeftColor
 *   properties instead of the shorthand borderLeft string. This prevents
 *   React inline styles from overriding Tailwind's .deen-card-hover class,
 *   which was the CSS specificity bug fixed after Step 5.
 *
 * PROPS:
 *   section   {Object}      — Static metadata (name, emoji, title, subtitle, description)
 *   progress  {Object|null} — DB row { sectionName, isCompleted, lastToggled } or null
 *   onToggle  {Function}    — Called with section.name when card or checkbox clicked
 */

import React from 'react';

// ── Date Formatter ────────────────────────────────────────────────────────────
/**
 * formatDate
 * Converts an ISO datetime string to a human-readable "Jan 15, 2025" format.
 * Returns null if the input is null/undefined (handles first-visit state).
 *
 * @param {string|null} isoString
 * @returns {string|null}
 */
function formatDate(isoString) {
  if (!isoString) return null;
  const d = new Date(isoString);
  return d.toLocaleDateString('en-GB', {
    day   : 'numeric',
    month : 'short',
    year  : 'numeric',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
const SectionCard = ({ section, progress, onToggle }) => {
  // Derive completion status — false if progress row is null (no DB row yet)
  const isCompleted  = progress ? progress.isCompleted  : false;
  const lastToggled  = progress ? progress.lastToggled  : null;
  const toggledLabel = formatDate(lastToggled);

  // ── Click Handler ──────────────────────────────────────────────────────────
  // The entire card is a button for maximum tap target size (mobile-friendly).
  // We pass section.name (the DB SectionName) to the parent toggle handler.
  const handleClick = () => onToggle(section.name);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <button
      onClick={handleClick}
      className="deen-card deen-card-hover w-full text-left flex flex-col gap-3 p-5 transition-all duration-200 relative"
      style={{
        borderLeftWidth   : '4px',
        borderLeftStyle   : 'solid',
        // Use undefined when false so the CSS :hover class can take over!
        borderLeftColor   : isCompleted ? 'var(--accent-primary)' : undefined,
        backgroundColor   : isCompleted ? 'var(--accent-light)' : undefined,
      }}
      aria-pressed={isCompleted}
      aria-label={`${section.title} — ${isCompleted ? 'Completed. Click to unmark.' : 'Not completed. Click to mark as complete.'}`}
    >

      {/* ── Top row: Emoji + Checkbox ──────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3">

        {/* Large emoji icon — provides instant visual identification */}
        <span className="text-3xl flex-shrink-0" aria-hidden="true">
          {section.emoji}
        </span>

        {/* ── Custom Checkbox ────────────────────────────────────────────────
             A styled div that acts as a visual checkbox.
             Completed: filled accent-primary circle with white ✓
             Incomplete: empty circle with border                              */}
        <div
          className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 mt-1"
          style={{
            backgroundColor : isCompleted ? 'var(--accent-primary)' : 'transparent',
            borderWidth     : '2px',
            borderStyle     : 'solid',
            borderColor     : isCompleted ? 'var(--accent-primary)' : 'var(--border-primary)',
          }}
          aria-hidden="true" // Parent button already carries the aria-label
        >
          {isCompleted && (
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="white"
              strokeWidth={3}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>

      {/* ── Section Title ─────────────────────────────────────────────────── */}
      <div>
        <h3
          className="font-bold text-base leading-tight"
          style={{
            color      : 'var(--text-primary)',
            fontFamily : 'Cormorant Garamond, serif',
          }}
        >
          {section.title}
        </h3>

        {/* Subtitle: Arabic/transliteration — uses arabic-text for font */}
        <p
          className="arabic-text arabic-text-sm mt-0.5"
          style={{ color: 'var(--accent-primary)' }}
        >
          {section.subtitle}
        </p>
      </div>

      {/* ── Description: 2–3 sentence scholarly summary ───────────────────── */}
      <p
        className="text-xs leading-relaxed flex-1"
        style={{ color: 'var(--text-secondary)' }}
      >
        {section.description}
      </p>

      {/* ── Footer: Completion status ─────────────────────────────────────── */}
      <div
        className="flex items-center justify-between pt-2 border-t"
        style={{ borderColor: 'var(--border-secondary)' }}
      >
        {/* Completion badge — only shown when completed */}
        {isCompleted ? (
          <span className="badge badge-green text-xs flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Completed
          </span>
        ) : (
          <span
            className="text-xs"
            style={{ color: 'var(--text-muted)' }}
          >
            Tap to mark complete
          </span>
        )}

        {/* LastToggled date — shown only when completed and date is available */}
        {isCompleted && toggledLabel && (
          <span
            className="text-xs"
            style={{ color: 'var(--text-muted)' }}
          >
            {toggledLabel}
          </span>
        )}
      </div>
    </button>
  );
};

export default SectionCard;