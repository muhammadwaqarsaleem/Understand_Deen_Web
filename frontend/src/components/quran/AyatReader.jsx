/**
 * frontend/src/components/quran/AyatReader.jsx
 *
 * RIGHT PANEL of the Quran Split-Pane Reader.
 *
 * RESPONSIBILITIES:
 *   1. Accept a surahNumber prop from Quran.jsx.
 *   2. Fetch all Ayat for that Surah from GET /api/quran/surah/:number.
 *   3. Render the Surah header card, Bismillah banner, then all AyatCards.
 *   4. Show loading skeleton while the request is in-flight.
 *   5. Show an empty/welcome state when no Surah is selected yet.
 *
 * PROPS:
 *   surahNumber  {number|null}  — SurahNo of the Surah to display (null = empty state)
 *
 * BISMILLAH RULE (Islamic scholarly consensus):
 *   - Surah 1 (Al-Fatihah): Bismillah IS its first Ayah — do not prepend a banner.
 *   - Surah 9 (At-Tawbah): No Bismillah by scholarly agreement (Ijma').
 *   - All other 112 Surahs: Show the Bismillah banner above the first Ayah.
 *
 * JUZ BANNER LOGIC:
 *   We track which Juz numbers we have already shown a banner for via a Set.
 *   The banner is suppressed for the first Ayah of the Surah (index 0) because
 *   the Surah header already establishes context. It shows from index 1 onward.
 *
 * SCROLL RESET:
 *   When the user selects a new Surah, we scroll the right panel to the top
 *   via a ref on the outermost wrapper div. This uses smooth scrollIntoView
 *   which respects the `scroll-behavior: smooth` set globally in index.css.
 */

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useApp } from '../../context/AppContext.jsx';
import AyatCard from './AyatCard.jsx';

const AyatReader = ({ surahNumber }) => {
  const { getToken } = useApp();

  // ── State ─────────────────────────────────────────────────────────────────
  const [surahData, setSurahData] = useState(null); // { surah: {}, ayat: [] }
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);

  // Ref to the top of this panel — used to scroll back up on Surah change
  const topRef = useRef(null);

  // ── Fetch on surahNumber Change ───────────────────────────────────────────
  useEffect(() => {
    // No surah selected → clear state and show empty/welcome screen
    if (!surahNumber) {
      setSurahData(null);
      setError(null);
      return;
    }

    const fetchSurah = async () => {
      setLoading(true);
      setError(null);
      setSurahData(null); // Clear previous Surah immediately to avoid flash

      // Scroll to top of right panel before loading new content
      topRef.current?.scrollIntoView({ behavior: 'smooth' });

      try {
        const { data } = await axios.get(`/api/quran/surah/${surahNumber}`, {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        setSurahData(data); // { surah: {...}, ayat: [...] }
      } catch (err) {
        console.error('[AyatReader] Fetch error:', err.message);
        setError('Could not load this Surah. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchSurah();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surahNumber]); // Re-run whenever the selected Surah changes

  // ── Empty / Welcome State ─────────────────────────────────────────────────
  if (!surahNumber) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 animate-fade-in px-6 text-center">
        {/* Quran 96:1 — the first revealed verse — as a poetic welcome */}
        <p
          className="arabic-text arabic-text-2xl"
          style={{ color: 'var(--accent-primary)' }}
        >
          ﴿ اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ ﴾
        </p>
        <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>
          "Read in the name of your Lord who created" — Al-Alaq 96:1
        </p>
        <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
          Select a Surah from the list to begin reading
        </p>
      </div>
    );
  }

  // ── Loading Skeleton ──────────────────────────────────────────────────────
  // Skeleton shapes mimic the actual content layout to reduce layout shift.
  if (loading) {
    return (
      <div className="p-4 md:p-6 animate-fade-in">
        {/* Header skeleton */}
        <div
          className="rounded-2xl mb-6 animate-pulse"
          style={{ backgroundColor: 'var(--bg-elevated)', height: '144px' }}
        />
        {/* Ayat skeletons × 5 */}
        {[...Array(5)].map((_, i) => (
          <div key={i} className="deen-card mb-3 animate-pulse">
            {/* Arabic line placeholders (RTL, wide) */}
            <div className="h-5 rounded mb-2 ml-auto"
              style={{ backgroundColor: 'var(--bg-elevated)', width: '90%' }} />
            <div className="h-5 rounded mb-3 ml-auto"
              style={{ backgroundColor: 'var(--bg-elevated)', width: '75%' }} />
            {/* English line placeholders */}
            <div className="h-3 rounded mb-1.5"
              style={{ backgroundColor: 'var(--bg-elevated)', width: '100%' }} />
            <div className="h-3 rounded"
              style={{ backgroundColor: 'var(--bg-elevated)', width: '65%' }} />
          </div>
        ))}
      </div>
    );
  }

  // ── Error State ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex items-center justify-center h-full animate-fade-in">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{error}</p>
      </div>
    );
  }

  // Guard: data still null after loading (shouldn't happen, but be defensive)
  if (!surahData) return null;

  const { surah, ayat } = surahData;

  // ── Juz tracking set ──────────────────────────────────────────────────────
  // We mutate this during render (not state) because it's purely a render-time
  // computation — no re-renders needed. It resets naturally each render cycle.
  const seenJuz = new Set();

  // ── Main Render ───────────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-6" ref={topRef}>

      {/* ── Surah Header Card ──────────────────────────────────────────────
           Uses .islamic-pattern for the green geometric background.
           Text is white (#fff) because the pattern background is always dark green,
           regardless of Light/Dark/Sepia theme — the pattern class sets its own bg. */}
      <div className="islamic-pattern rounded-2xl p-6 mb-6 text-center shadow-lg animate-fade-in">
        {/* Arabic name */}
        <p
          className="arabic-text arabic-text-2xl mb-1"
          style={{ color: '#ffffff' }}
        >
          {surah.SurahNameAr}
        </p>

        {/* English name — Cormorant Garamond for the scholarly serif aesthetic */}
        <p
          className="text-xl font-bold mb-0.5"
          style={{ color: '#ffffff', fontFamily: 'Cormorant Garamond, serif' }}
        >
          {surah.SurahNameEn}
        </p>

        {/* Roman transliteration — smaller, muted white */}
        <p
          className="text-sm mb-4 italic"
          style={{ color: 'rgba(255, 255, 255, 0.75)' }}
        >
          {surah.SurahNameRoman}
        </p>

        {/* Meta badges row */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <span className="badge badge-gold">Surah {surah.SurahNo}</span>
          <span className="badge badge-gold">{surah.TotalAyahSurah} Ayat</span>
          <span className="badge badge-gold">{surah.PlaceOfRevelation}</span>
        </div>
      </div>

      {/* ── Bismillah Banner ───────────────────────────────────────────────
           RULE: Show for all Surahs EXCEPT 1 (Al-Fatihah) and 9 (At-Tawbah).
           - Surah 1: Its first Ayah IS "Bismillah ir-Rahman ir-Raheem".
             Adding a banner would duplicate it.
           - Surah 9: Omitted by scholarly consensus (Ijma'). The Companion
             Uthman ibn Affan (RA) confirmed no Bismillah when compiling the Mushaf. */}
      {surahNumber !== 1 && surahNumber !== 9 && (
        <div
          className="text-center py-5 px-4 mb-5 rounded-xl animate-fade-in"
          style={{
            backgroundColor : 'var(--bg-card)',
            border          : '1px solid var(--border-secondary)',
          }}
        >
          <p
            className="arabic-text arabic-text-xl"
            style={{ color: 'var(--accent-primary)' }}
          >
            بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
          </p>
          <p
            className="text-xs mt-2 italic"
            style={{ color: 'var(--text-muted)' }}
          >
            In the name of Allah, the Most Gracious, the Most Merciful
          </p>
        </div>
      )}

      {/* ── Ayat List ──────────────────────────────────────────────────────
           We iterate with map() + index so we can suppress the Juz banner
           for the very first Ayah (index 0). From index 1 onward, any new
           Juz number triggers the banner.                                    */}
      {ayat.map((a, index) => {
        // Has this Juz been rendered before in this Surah?
        const isNewJuz = !seenJuz.has(a.JuzNo);

        // Mark this Juz as seen regardless
        seenJuz.add(a.JuzNo);

        // Only show the banner if: new Juz AND not the very first verse
        // (index 0 is already contextualised by the Surah header above)
        const showJuzBanner = isNewJuz && index > 0;

        return (
          <AyatCard
            key={a.AyatID}
            ayat={a}
            isFirstOfJuz={showJuzBanner}
          />
        );
      })}

    </div>
  );
};

export default AyatReader;