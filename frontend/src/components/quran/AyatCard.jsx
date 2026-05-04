/**
 * frontend/src/components/quran/AyatCard.jsx
 *
 * Renders a single Ayah (verse) of the Quran.
 *
 * LAYOUT (per Ayah):
 *   ┌─ Juz Banner (conditional — only first Ayah of a new Juz) ───────────┐
 *   │  ┌─ Number Badge ─┐  ┌─ Arabic Text (RTL, large)                    │
 *   │  └────────────────┘  │  English Translation                          │
 *   │                      │  [Sajdah badge?]  [🔖 Bookmark placeholder]   │
 *   └──────────────────────┴───────────────────────────────────────────────┘
 *
 * PROPS:
 *   ayat          {Object}  — Ayah data from the API (see shape below)
 *   isFirstOfJuz  {boolean} — True if this is the first Ayah of a new Juz
 *
 * AYAH OBJECT SHAPE (from AyatReader):
 *   {
 *     AyatID      : number   — DB primary key
 *     AyahNoSurah : number   — Verse number within this Surah (1-indexed)
 *     AyahAr      : string   — Arabic verse text (Unicode)
 *     AyahEn      : string   — English translation
 *     JuzNo       : number   — Which of the 30 Juz this verse belongs to
 *     isSajdah    : boolean  — True if this verse requires a prostration (Sajdah Tilawah)
 *   }
 *
 * SAJDAH:
 *   There are 15 Sajdah verses in the Quran. When IsSajdahAyah is true,
 *   we display a gold badge with the Sajdah symbol (۩).
 *   The ۩ glyph is the Unicode "Sajda" character (U+06E9), not an emoji.
 *
 * BOOKMARK:
 *   The bookmark button is a placeholder — onClick is wired in Step 10
 *   when the User_Bookmarks API endpoint is built.
 */

import React from 'react';

const AyatCard = ({ ayat, isFirstOfJuz }) => {
  return (
    <article className="deen-card p-6 mb-3 animate-fade-in-up">

      {/* ── Juz Banner ─────────────────────────────────────────────────────
           The Quran is divided into 30 equal parts (Juz/Para) for monthly
           recitation. We show this banner only when a new Juz begins mid-Surah
           AND it's not the very first Ayah (AyatReader suppresses index=0).    */}
      {isFirstOfJuz && (
        <div
          className="mb-3 py-1.5 px-3 rounded-lg text-xs font-semibold text-center tracking-wider uppercase"
          style={{
            backgroundColor : 'var(--accent-light)',
            color           : 'var(--accent-primary)',
            border          : '1px solid var(--accent-border)',
          }}
        >
          ✦ Juz {ayat.JuzNo} begins here ✦
        </div>
      )}

      {/* ── Main Content Row ──────────────────────────────────────────────── */}
      <div className="flex items-start gap-3">

        {/* ── Verse Number Badge ──────────────────────────────────────── */}
        {/* Outlined circle style to differentiate it from the Surah badge */}
        <span
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mt-1"
          style={{
            backgroundColor : 'var(--bg-elevated)',
            color           : 'var(--accent-primary)',
            border          : '1px solid var(--accent-border)',
          }}
          aria-label={`Verse ${ayat.AyahNoSurah}`}
        >
          {ayat.AyahNoSurah}
        </span>

        {/* ── Text Block ──────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">

          {/* Arabic text — RTL, large, uses Amiri/Uthmanic font via .arabic-text
              The leading-loose gives the diacritics (tashkeel) breathing room.
              dir="rtl" ensures correct punctuation & ligature rendering.          */}
          <p
            className="arabic-text arabic-text-lg text-right leading-loose mb-4"
            dir="rtl"
            style={{ color: 'var(--arabic-text)' }}
          >
            {ayat.AyahAr}
          </p>

          {/* English translation — left-aligned, secondary color, relaxed line-height */}
          <p
            className="text-sm leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
          >
            {ayat.AyahEn}
          </p>

          {/* ── Footer Row: badges + bookmark ──────────────────────────── */}
          <div className="flex items-center justify-between mt-3 pt-2 border-t"
            style={{ borderColor: 'var(--border-secondary)' }}
          >
            {/* Left: indicator badges */}
            <div className="flex items-center gap-2">

              {/* Sajdah Tilawah indicator */}
              {ayat.isSajdah && (
                <span
                  className="badge badge-gold text-xs"
                  title="Sajdah Tilawah — a prostration is recommended upon reciting this verse"
                >
                  ۩ Sajdah
                </span>
              )}
            </div>

            {/* Right: Bookmark button — visual placeholder, wired in Step 10 */}
            <button
              className="btn-ghost text-xs px-2 py-1 rounded opacity-50 cursor-not-allowed"
              title="Bookmarks coming in Step 10"
              onClick={() => {
                // TODO Step 10: POST /api/bookmarks { AyatID: ayat.AyatID }
              }}
              aria-label="Bookmark this verse"
            >
              🔖
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

export default AyatCard;