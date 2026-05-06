/**
 * frontend/src/components/hadith/HadithCard.jsx
 *
 * Renders a single Hadith row.
 *
 * PROPS:
 *   hadith  {Object} — shape:
 *     HadithID, BookName, ChapterNumber, ChapterTitleEn,
 *     ArabicText, EnglishText, Grade, Reference, InBookReference
 *
 * GRADE BADGE COLORS:
 *   Sahih  → green  (authentic — highest grade)
 *   Hasan  → gold   (good)
 *   Da'if  → inline red-muted  (weak — shown but visually de-emphasised)
 *   Other  → muted grey
 */

import React from 'react';

// Returns badge styles based on hadith grade string.
// Grade values in the DB can be composite, e.g. "Sahih (Al-Albani)".
const gradeStyle = (grade) => {
  if (!grade) return null;
  const g = grade.toLowerCase();
  if (g.includes('sahih')) return { backgroundColor: 'var(--accent-light)',  color: 'var(--accent-primary)', border: '1px solid var(--accent-border)' };
  if (g.includes('hasan')) return { backgroundColor: '#fef9c3',              color: '#92400e',               border: '1px solid #fde68a' };
  return                          { backgroundColor: 'var(--bg-elevated)',   color: 'var(--text-muted)',      border: '1px solid var(--border-primary)' };
};

const HadithCard = ({ hadith }) => {
  const gradeSty = gradeStyle(hadith.Grade);

  return (
    <article className="deen-card p-5 mb-3 animate-fade-in-up">

      {/* ── Chapter label ──────────────────────────────────────────────────── */}
      {hadith.ChapterTitleEn && (
        <p className="text-xs mb-3 truncate" style={{ color: 'var(--text-muted)' }}>
          Ch. {hadith.ChapterNumber} — {hadith.ChapterTitleEn}
        </p>
      )}

      {/* ── Arabic text ────────────────────────────────────────────────────── */}
      {hadith.ArabicText && (
        <p
          className="arabic-text arabic-text-lg text-right leading-loose mb-4"
          dir="rtl"
          style={{ color: 'var(--arabic-text)' }}
        >
          {hadith.ArabicText}
        </p>
      )}

      {/* ── English translation ────────────────────────────────────────────── */}
      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        {hadith.EnglishText}
      </p>

      {/* ── Footer: grade + reference + bookmark placeholder ──────────────── */}
      <div
        className="flex items-center justify-between mt-3 pt-2 border-t flex-wrap gap-2"
        style={{ borderColor: 'var(--border-secondary)' }}
      >
        <div className="flex items-center gap-2 flex-wrap">

          {/* Grade badge */}
          {gradeSty && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={gradeSty}>
              {hadith.Grade}
            </span>
          )}

          {/* Reference */}
          {hadith.Reference && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {hadith.Reference}
            </span>
          )}
          {hadith.InBookReference && !hadith.Reference && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {hadith.InBookReference}
            </span>
          )}
        </div>

        {/* Bookmark — placeholder, wired in Step 10 */}
        <button
          className="btn-ghost text-xs px-2 py-1 rounded opacity-50 cursor-not-allowed"
          title="Bookmarks coming in Step 10"
          onClick={() => { /* TODO Step 10 */ }}
          aria-label="Bookmark this hadith"
        >
          🔖
        </button>
      </div>
    </article>
  );
};

export default HadithCard;
