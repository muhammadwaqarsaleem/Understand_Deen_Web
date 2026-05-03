// =============================================================
// components/home/ModuleGrid.jsx
// Understand Deen — Module Navigation Bento Grid
// =============================================================
// Renders 6 module cards in a responsive Bento-style layout.
// The "Bento" feel is achieved by giving specific cards a
// `col-span-2` on large screens so they occupy wider cells,
// creating visual hierarchy and breaking the rigid grid look.
//
// Cards:
//   1. Quran       — /quran       (col-span-2 on lg: "feature card")
//   2. Hadith      — /hadith
//   3. New Muslim  — /new-muslim
//   4. Fiqh        — /fiqh        (col-span-2 on lg)
//   5. Habit Tracker—/habits
//   6. Bookmarks   — /bookmarks   (Step 10 — shown as "coming soon")
//
// Layout:
//   mobile (1 col)  : all cards full-width, stacked
//   tablet (2 cols) : standard 2-column grid
//   desktop (3 cols): Quran and Fiqh span 2 cols for Bento effect
//
// Styling: uses .deen-card .deen-card-hover from index.css
// Colors: all via CSS variables — no hardcoded hex
// =============================================================

import React from 'react';
import { Link } from 'react-router-dom';

// ── Module definitions ────────────────────────────────────────
// Centralised here — change once, updates all cards.
const MODULES = [
  {
    id:          'quran',
    to:          '/quran',
    icon:        '📖',
    title:       'Quran',
    titleArabic: 'القُرْآن',
    description: 'Browse all 114 Surahs with Arabic text, English translation, and Tafseer.',
    tag:         '6,236 Ayat',
    // Bento feature: span 2 columns on desktop to make it the hero module
    featuredLg:  true,
    available:   true,
  },
  {
    id:          'hadith',
    to:          '/hadith',
    icon:        '📜',
    title:       'Hadith',
    titleArabic: 'الحَدِيث',
    description: 'Six authenticated collections — Bukhari, Muslim, Abu Dawood, Tirmidhi, Nasa\'i, Ibn Majah.',
    tag:         'Kutub al-Sittah',
    featuredLg:  false,
    available:   true,
  },
  {
    id:          'new-muslim',
    to:          '/new-muslim',
    icon:        '🌱',
    title:       'New Muslim',
    titleArabic: 'مُسلِم جَدِيد',
    description: 'A safe, gentle introduction to Islamic fundamentals — no sectarian debates.',
    tag:         '8 Core Topics',
    featuredLg:  false,
    available:   true,
  },
  {
    id:          'fiqh',
    to:          '/fiqh',
    icon:        '⚖️',
    title:       'Fiqh',
    titleArabic: 'الفِقْه',
    description: 'Compare rulings across all 4 Madhabs side-by-side with full source evidence.',
    tag:         '4 Madhabs',
    featuredLg:  true, // second featured card on desktop
    available:   true,
  },
  {
    id:          'habits',
    to:          '/habits',
    icon:        '✅',
    title:       'Habit Tracker',
    titleArabic: 'مُتابَعَة',
    description: 'Track daily prayers and Azkar. Celebrate streaks — never punish breaks.',
    tag:         'Guilt-Free Design',
    featuredLg:  false,
    available:   true,
  },
  {
    id:          'bookmarks',
    to:          '/bookmarks',
    icon:        '🔖',
    title:       'Bookmarks',
    titleArabic: 'المُفَضَّلَات',
    description: 'All your saved Ayat, Hadith, and Fiqh rulings in one personal library.',
    tag:         'Coming Soon',
    featuredLg:  false,
    available:   false, // Step 10
  },
];

// ── Arrow icon ────────────────────────────────────────────────
const ArrowIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
    className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
  </svg>
);

// ── Individual Module Card ────────────────────────────────────
const ModuleCard = ({ module }) => {
  const { to, icon, title, titleArabic, description, tag, featuredLg, available } = module;

  const cardContent = (
    <div
      // Tailwind responsive col-span: normal on mobile/tablet, span-2 on lg for featured cards
      className={`
        deen-card p-5 flex flex-col gap-3 h-full
        ${available ? 'deen-card-hover cursor-pointer' : 'opacity-60 cursor-default'}
        ${featuredLg ? 'lg:col-span-2' : ''}
        animate-fade-in-up
      `}
      style={{ minHeight: '160px' }}
    >
      {/* Top row: icon + Arabic title */}
      <div className="flex items-start justify-between">
        <span style={{ fontSize: '2rem', lineHeight: 1 }}>{icon}</span>
        <span
          className="arabic-text arabic-text-sm"
          style={{ color: 'var(--gold)', opacity: 0.7 }}
          dir="rtl"
        >
          {titleArabic}
        </span>
      </div>

      {/* Module title */}
      <h3
        className="font-display text-xl font-semibold"
        style={{ color: 'var(--text-primary)' }}
      >
        {title}
      </h3>

      {/* Description */}
      <p
        className="font-body text-sm leading-relaxed flex-1"
        style={{ color: 'var(--text-secondary)' }}
      >
        {description}
      </p>

      {/* Footer: tag + arrow */}
      <div className="flex items-center justify-between pt-1">
        <span className={`badge ${available ? 'badge-green' : 'badge-gray'}`}>
          {tag}
        </span>
        {available && (
          <span style={{ color: 'var(--accent-primary)' }}>
            <ArrowIcon />
          </span>
        )}
      </div>
    </div>
  );

  // Wrap in Link only if the module is available
  if (available) {
    return (
      <Link to={to} className="no-underline" style={{ display: 'contents' }}>
        {cardContent}
      </Link>
    );
  }

  return cardContent;
};

// =============================================================
// ModuleGrid Component
// =============================================================
const ModuleGrid = () => {
  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <h2
          className="font-display text-2xl font-semibold"
          style={{ color: 'var(--text-primary)' }}
        >
          Explore Modules
        </h2>
        <span
          className="font-body text-xs hidden sm:block"
          style={{ color: 'var(--text-muted)' }}
        >
          6 modules · more coming
        </span>
      </div>

      {/* Bento grid
          - 1 column on mobile
          - 2 columns on sm
          - 3 columns on lg (featured cards span 2 via lg:col-span-2)
      */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MODULES.map((mod) => (
          <ModuleCard key={mod.id} module={mod} />
        ))}
      </div>
    </div>
  );
};

export default ModuleGrid;
