/**
 * frontend/src/components/hadith/HadithCard.jsx
 *
 * Renders a single Hadith from the Ahadith table.
 *
 * GRADE BADGE LOGIC:
 *   The Grade column is NVARCHAR(300) in the v3 schema — wide enough for
 *   verbose Tirmidhi gradings like "Hasan (Darussalam) / Sahih (Al-Albani)".
 *   We use case-insensitive substring checks rather than exact matches:
 *     • Includes 'sahih'  → badge-green  (authenticated)
 *     • Includes 'hasan'  → badge-gold   (good)
 *     • Anything else     → badge-gray   (da'if, maudu', unknown, null)
 *   This handles the full range of Tirmidhi compound gradings gracefully.
 *
 * NULL HANDLING:
 *   • ArabicText   can be null → entire Arabic block hidden (not rendered)
 *   • EnglishText  can be null → show a "Translation unavailable" message
 *   • Grade        can be null → badge-gray with text "Ungraded"
 *   • Reference    can be null → reference badge hidden
 *
 * PROPS:
 *   hadith  {Object}  — Single Hadith row from the API (see shape below)
 *
 * HADITH OBJECT SHAPE:
 *   {
 *     HadithID       : number
 *     ArabicText     : string|null
 *     EnglishText    : string|null
 *     Grade          : string|null
 *     Reference      : string|null
 *     InBookReference: string|null
 *   }
 */

import React from 'react';

// ── Grade Badge Helper ────────────────────────────────────────────────────────
/**
 * getGradeBadge
 * Returns { badgeClass, label } for a given Grade string.
 * Handles null, empty, and compound grading strings.
 *
 * @param {string|null} grade
 * @returns {{ badgeClass: string, label: string }}
 */
function getGradeBadge(grade) {
  if (!grade || grade.trim() === '') {
    return { badgeClass: 'badge badge-gray', label: 'Ungraded' };
  }

  const g = grade.toLowerCase();

  // Check for Sahih first — a compound grade like "Hasan / Sahih" should
  // be treated as Sahih (stronger authentication takes precedence)
  if (g.includes('sahih')) {
    return { badgeClass: 'badge badge-green', label: grade };
  }
  if (g.includes('hasan')) {
    return { badgeClass: 'badge badge-gold', label: grade };
  }

  // Da'if, Maudu', Munkar, or any other classification
  return { badgeClass: 'badge badge-gray', label: grade };
}

// ─────────────────────────────────────────────────────────────────────────────
const HadithCard = ({ hadith }) => {
  const { badgeClass, label: gradeLabel } = getGradeBadge(hadith.Grade);

  return (
    <article className="deen-card mb-4 animate-fade-in-up">

      {/* ── Header row: Reference badge + Grade badge ──────────────────── */}
      <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">

        {/* Reference — e.g. "Sahih Bukhari 1" or "Sunan Abi Dawud 1234" */}
        {hadith.Reference && (
          <span
            className="text-xs font-mono px-2 py-1 rounded"
            style={{
              backgroundColor : 'var(--bg-elevated)',
              color           : 'var(--text-secondary)',
              border          : '1px solid var(--border-secondary)',
            }}
          >
            {hadith.Reference}
          </span>
        )}

        {/* Grade badge — color-coded by authentication level */}
        <span
          className={`${badgeClass} text-xs flex-shrink-0 max-w-xs truncate`}
          title={hadith.Grade || 'Grade not available'}
        >
          {gradeLabel}
        </span>
      </div>

      {/* ── Arabic Text ────────────────────────────────────────────────────
           Rendered ONLY if ArabicText is not null/empty.
           dir="rtl" ensures correct text direction and punctuation rendering.
           arabic-text-md gives a comfortable reading size for body Arabic.    */}
      {hadith.ArabicText && (
        <p
          className="arabic-text arabic-text-md text-right leading-loose mb-4 pb-4 border-b"
          dir="rtl"
          style={{
            color       : 'var(--arabic-text)',
            borderColor : 'var(--border-secondary)',
          }}
        >
          {hadith.ArabicText}
        </p>
      )}

      {/* ── English Translation ───────────────────────────────────────────
           If EnglishText is null (data gap in source CSV), show a styled
           placeholder rather than an empty card.                              */}
      {hadith.EnglishText ? (
        <p
          className="text-sm leading-relaxed"
          style={{ color: 'var(--text-primary)' }}
        >
          {hadith.EnglishText}
        </p>
      ) : (
        <p
          className="text-sm italic"
          style={{ color: 'var(--text-muted)' }}
        >
          English translation not available for this Hadith.
        </p>
      )}

      {/* ── Footer: In-book reference + Bookmark ─────────────────────────── */}
      <div
        className="flex items-center justify-between mt-3 pt-2 border-t flex-wrap gap-2"
        style={{ borderColor: 'var(--border-secondary)' }}
      >
        {/* In-book reference footnote — e.g. "In-book reference: Book 1, Hadith 3" */}
        {hadith.InBookReference ? (
          <p
            className="text-xs"
            style={{ color: 'var(--text-muted)' }}
          >
            {hadith.InBookReference}
          </p>
        ) : (
          <span /> /* Spacer to keep bookmark right-aligned */
        )}

        {/* Bookmark button — placeholder for Step 10 */}
        <button
          className="btn-ghost text-xs px-2 py-1 rounded opacity-50 cursor-not-allowed"
          title="Bookmarks coming in Step 10"
          onClick={() => {
            // TODO Step 10: POST /api/bookmarks { HadithID: hadith.HadithID }
          }}
          aria-label="Bookmark this Hadith"
        >
          🔖
        </button>
      </div>
    </article>
  );
};

export default HadithCard;