// =============================================================
// components/home/ZikirCard.jsx
// Understand Deen — Daily Zikr Hero Card
// =============================================================
// Responsibilities:
//   - Fetches today's Zikr from GET /api/home/daily-zikr
//   - Shows a loading skeleton while waiting
//   - Displays: Arabic text, English translation, source badge
//   - "Refresh" button fetches a new random Zikr (same endpoint
//     returns same result for today, so refresh cycles through
//     a local array of classic Zikr texts as a bonus feature)
//   - Full-width hero card with .islamic-pattern background
//
// Responsive: full-width on all screen sizes (no grid wrapping
// needed — parent Home.jsx places this above the module grid).
//
// Props: none — fully self-contained data fetching component
// =============================================================

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useApp } from '../../context/AppContext.jsx';

const API_BASE = '/api'; // proxied to localhost:5000 by vite.config.js

// ── Supplementary local Zikr pool ─────────────────────────────
// Used when the user clicks "Next Zikr" to cycle through more
// remembrances without requiring additional API calls.
// These are all authentic, well-known Adhkar.
const LOCAL_ZIKR_POOL = [
  {
    arabicText:  'اللّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ',
    text:        'Allahumma salli ala Muhammad wa ala ali Muhammad',
    translation: 'O Allah, send blessings upon Muhammad and upon the family of Muhammad.',
    source:      'Salawat — Recommended Daily',
  },
  {
    arabicText:  'أَسْتَغْفِرُ اللهَ وَأَتُوبُ إِلَيْهِ',
    text:        'Astaghfirullaha wa atubu ilayh',
    translation: 'I seek forgiveness from Allah and I repent to Him.',
    source:      'Morning & Evening Azkar',
  },
  {
    arabicText:  'لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ',
    text:        'La ilaha illallahu wahdahu la sharika lah',
    translation: 'There is no god but Allah, alone, without any partner.',
    source:      'Tahlil — Morning Azkar',
  },
  {
    arabicText:  'سُبْحَانَ اللهِ وَبِحَمْدِهِ سُبْحَانَ اللهِ الْعَظِيمِ',
    text:        'SubhanAllahi wa bihamdih, SubhanAllahil Azim',
    translation: 'Glory be to Allah and praise be to Him; Glory be to Allah the Magnificent.',
    source:      'Tasbih — Sahih al-Bukhari',
  },
  {
    arabicText:  'اللَّهُ أَكْبَرُ وَلِلَّهِ الْحَمْدُ',
    text:        'Allahu Akbar wa lillahil hamd',
    translation: 'Allah is the Greatest, and all praise belongs to Allah.',
    source:      'Takbir — Post-Prayer Azkar',
  },
];

// ── Loading Skeleton ──────────────────────────────────────────
// Mimics the layout of the real card to prevent layout shift
const ZikirSkeleton = () => (
  <div className="islamic-pattern rounded-2xl p-8 md:p-10 w-full animate-pulse">
    <div className="flex flex-col items-center gap-4 max-w-2xl mx-auto">
      <div className="h-4 w-28 rounded-full bg-white opacity-20" />
      <div className="h-10 w-3/4 rounded-xl bg-white opacity-15" />
      <div className="h-6 w-full rounded-xl bg-white opacity-15" />
      <div className="h-6 w-2/3 rounded-xl bg-white opacity-10" />
      <div className="h-8 w-32 rounded-full bg-white opacity-20 mt-2" />
    </div>
  </div>
);

// ── Refresh Icon ──────────────────────────────────────────────
const RefreshIcon = ({ spinning }) => (
  <svg
    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
    className="w-4 h-4"
    style={{ transition: 'transform 0.4s ease', transform: spinning ? 'rotate(360deg)' : 'rotate(0deg)' }}
  >
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);

// =============================================================
// ZikirCard Component
// =============================================================
const ZikirCard = () => {
  const { getToken } = useApp();

  // ── State ──────────────────────────────────────────────────
  const [zikr,       setZikr]       = useState(null);   // current Zikr data
  const [loading,    setLoading]    = useState(true);   // initial fetch loading
  const [spinning,   setSpinning]   = useState(false);  // refresh animation
  const [localIndex, setLocalIndex] = useState(0);      // pointer into LOCAL_ZIKR_POOL
  const [useLocal,   setUseLocal]   = useState(false);  // true after first manual refresh

  // ── Fetch daily Zikr from backend ─────────────────────────
  const fetchDailyZikr = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_BASE}/home/daily-zikr`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setZikr(data);
      setUseLocal(false); // reset to API data on fresh fetch
    } catch (err) {
      // If API fails, fall through to the local pool silently
      console.warn('[ZikirCard] API fetch failed, using local pool:', err.message);
      setZikr(LOCAL_ZIKR_POOL[0]);
      setUseLocal(true);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  // ── Initial fetch on mount ─────────────────────────────────
  useEffect(() => {
    fetchDailyZikr();
  }, [fetchDailyZikr]);

  // ── "Next Zikr" handler ───────────────────────────────────
  // Cycles through the local pool so the user gets variety
  // without hammering the API on every button press.
  const handleNext = () => {
    setSpinning(true);
    const next = (localIndex + 1) % LOCAL_ZIKR_POOL.length;
    setLocalIndex(next);
    setZikr(LOCAL_ZIKR_POOL[next]);
    setUseLocal(true);
    // Reset spin animation after 400ms
    setTimeout(() => setSpinning(false), 400);
  };

  // ── Render states ─────────────────────────────────────────
  if (loading) return <ZikirSkeleton />;

  const displayArabic = zikr?.arabicText;
  const displayText   = zikr?.text || zikr?.translation || '';
  const displayTrans  = zikr?.translation || '';
  const displaySource = zikr?.source || '';

  return (
    <div className="islamic-pattern rounded-2xl p-8 md:p-10 w-full relative overflow-hidden animate-fade-in">

      {/* Decorative circles — pure CSS, no color hardcoding */}
      <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full border border-white opacity-5 pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-56 h-56 rounded-full border border-white opacity-5 pointer-events-none" />

      <div className="relative flex flex-col items-center text-center gap-4 max-w-2xl mx-auto">

        {/* Label pill */}
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-body font-medium"
          style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)' }}>
          ✦ {useLocal ? 'Azkar' : 'Zikr of the Day'}
        </span>

        {/* Arabic text — only shown if we have it */}
        {displayArabic && (
          <p
            className="arabic-text arabic-text-xl"
            dir="rtl"
            style={{ color: 'rgba(255,255,255,0.95)', lineHeight: 2.2 }}
          >
            {displayArabic}
          </p>
        )}

        {/* Transliteration — shown when different from translation */}
        {displayText && displayText !== displayTrans && (
          <p className="font-body text-base italic"
            style={{ color: 'rgba(255,255,255,0.75)' }}>
            {displayText}
          </p>
        )}

        {/* English translation */}
        {displayTrans && (
          <p className="font-body text-base md:text-lg leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.85)' }}>
            {displayTrans}
          </p>
        )}

        {/* Source badge */}
        {displaySource && (
          <span className="font-body text-xs px-2.5 py-1 rounded-full"
            style={{ color: 'var(--gold)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
            — {displaySource}
          </span>
        )}

        {/* Next Zikr button */}
        <button
          onClick={handleNext}
          className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-full font-body text-sm font-medium transition-all duration-200 active:scale-95"
          style={{
            backgroundColor: 'rgba(255,255,255,0.15)',
            color:           'rgba(255,255,255,0.9)',
            border:          '1px solid rgba(255,255,255,0.2)',
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'}
          aria-label="Show next Zikr"
        >
          <RefreshIcon spinning={spinning} />
          Next Zikr
        </button>

      </div>
    </div>
  );
};

export default ZikirCard;
