/**
 * frontend/src/components/hadith/HadithReader.jsx
 *
 * RIGHT PANEL of the Hadith page (View 3).
 * Architecturally mirrors AyatReader.jsx from Step 4.
 *
 * RESPONSIBILITIES:
 *   1. Accept bookName + chapterNumber props from Hadith.jsx.
 *   2. Fetch all Ahadith for that chapter from GET /api/hadith/chapter/:book/:ch.
 *   3. Render a chapter header card, then all HadithCard components.
 *   4. Show loading skeleton while in-flight.
 *   5. Show welcome state when no book/chapter is selected.
 *
 * PROPS:
 *   bookName       {string|null}  — Selected book name
 *   chapterNumber  {number|null}  — Selected chapter number
 *
 * PERFORMANCE NOTE:
 *   Some chapters in Sahih Bukhari contain 100+ Ahadith. React renders all
 *   of them at once currently. If performance becomes an issue in Step 10,
 *   virtual scrolling (react-virtual) can be added as a polish enhancement.
 */

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useApp } from '../../context/AppContext.jsx';
import HadithCard from './HadithCard.jsx';

const HadithReader = ({ bookName, chapterNumber }) => {
  const { getToken } = useApp();

  // ── State ─────────────────────────────────────────────────────────────────
  const [chapterData, setChapterData] = useState(null); // { bookName, chapterTitleEn, chapterTitleAr, ahadith[] }
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);

  // Ref for scroll-to-top on chapter change
  const topRef = useRef(null);

  // ── Fetch on Prop Change ──────────────────────────────────────────────────
  useEffect(() => {
    // Both props must be present before we fetch
    if (!bookName || !chapterNumber) {
      setChapterData(null);
      setError(null);
      return;
    }

    const fetchChapter = async () => {
      setLoading(true);
      setError(null);
      setChapterData(null);

      // Scroll right panel to top when switching chapters
      topRef.current?.scrollIntoView({ behavior: 'smooth' });

      try {
        const { data } = await axios.get(
          `/api/hadith/chapter/${encodeURIComponent(bookName)}/${chapterNumber}`,
          { headers: { Authorization: `Bearer ${getToken()}` } }
        );
        setChapterData(data);
      } catch (err) {
        console.error('[HadithReader] Fetch error:', err.message);
        setError('Could not load this chapter. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchChapter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookName, chapterNumber]);

  // ── Empty / Welcome State ─────────────────────────────────────────────────
  if (!bookName || !chapterNumber) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 animate-fade-in px-6 text-center">
        <p
          className="arabic-text arabic-text-2xl"
          style={{ color: 'var(--accent-primary)' }}
        >
          ﴿ وَمَا يَنطِقُ عَنِ الْهَوَىٰ ﴾
        </p>
        <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>
          "He does not speak from his own desire" — An-Najm 53:3
        </p>
        <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
          {bookName
            ? 'Select a chapter from the list to read its Ahadith'
            : 'Select a book above, then choose a chapter to begin'
          }
        </p>
      </div>
    );
  }

  // ── Loading Skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-4 md:p-6 animate-fade-in">
        {/* Chapter header skeleton */}
        <div
          className="rounded-xl mb-5 animate-pulse"
          style={{ backgroundColor: 'var(--bg-elevated)', height: '120px' }}
        />
        {/* 4 Hadith card skeletons */}
        {[...Array(4)].map((_, i) => (
          <div key={i} className="deen-card mb-4 animate-pulse">
            <div className="flex gap-2 mb-3">
              <div className="h-5 rounded w-24" style={{ backgroundColor: 'var(--bg-elevated)' }} />
              <div className="h-5 rounded w-16 ml-auto" style={{ backgroundColor: 'var(--bg-elevated)' }} />
            </div>
            <div className="h-4 rounded mb-2 ml-auto" style={{ backgroundColor: 'var(--bg-elevated)', width: '88%' }} />
            <div className="h-4 rounded mb-4 ml-auto" style={{ backgroundColor: 'var(--bg-elevated)', width: '70%' }} />
            <div className="h-3 rounded mb-1.5" style={{ backgroundColor: 'var(--bg-elevated)', width: '100%' }} />
            <div className="h-3 rounded mb-1.5" style={{ backgroundColor: 'var(--bg-elevated)', width: '80%' }} />
            <div className="h-3 rounded" style={{ backgroundColor: 'var(--bg-elevated)', width: '55%' }} />
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

  if (!chapterData) return null;

  const { chapterTitleEn, chapterTitleAr, ahadith } = chapterData;

  // ── Main Render ───────────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-6" ref={topRef}>

      {/* ── Chapter Header Card ───────────────────────────────────────────
           Uses .islamic-pattern — same green geometric bg as Quran Surah header.
           Maintains consistent design language across content modules.          */}
      <div className="islamic-pattern rounded-2xl p-5 mb-5 shadow-lg animate-fade-in">

        {/* Book name pill */}
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-2"
          style={{ color: 'rgba(255,255,255,0.7)' }}
        >
          {bookName}
        </p>

        {/* Arabic chapter title — shown only if available */}
        {chapterTitleAr && (
          <p
            className="arabic-text arabic-text-lg text-right mb-2"
            style={{ color: '#ffffff' }}
          >
            {chapterTitleAr}
          </p>
        )}

        {/* English chapter title */}
        <p
          className="text-lg font-bold"
          style={{
            color      : '#ffffff',
            fontFamily : 'Cormorant Garamond, serif',
          }}
        >
          {chapterTitleEn || `Chapter ${chapterNumber}`}
        </p>

        {/* Hadith count */}
        <div className="flex items-center gap-2 mt-3">
          <span className="badge badge-gold">Chapter {chapterNumber}</span>
          <span className="badge badge-gold">{ahadith.length} Ahadith</span>
        </div>
      </div>

      {/* ── Hadith List ───────────────────────────────────────────────────── */}
      {ahadith.length === 0 ? (
        <p
          className="text-sm text-center py-8"
          style={{ color: 'var(--text-muted)' }}
        >
          No Ahadith found in this chapter.
        </p>
      ) : (
        ahadith.map(h => (
          <HadithCard key={h.HadithID} hadith={h} />
        ))
      )}
    </div>
  );
};

export default HadithReader;