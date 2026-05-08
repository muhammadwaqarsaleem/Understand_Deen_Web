/**
 * frontend/src/components/hadith/ChapterList.jsx
 *
 * LEFT PANEL (or full-screen panel in View 2) of the Hadith page.
 * Architecturally mirrors SurahList.jsx from Step 4.
 *
 * RESPONSIBILITIES:
 *   1. Fetch chapters for the selected book from GET /api/hadith/chapters/:book.
 *   2. Render a searchable, scrollable list of chapters.
 *   3. Notify parent (Hadith.jsx) when a chapter is selected via onSelect().
 *   4. Highlight the currently active chapter.
 *
 * PROPS:
 *   bookName        {string}       — The currently selected book
 *   selectedChapter {number|null}  — Currently selected ChapterNumber (or null)
 *   onSelect        {Function}     — Called with ChapterNumber when row clicked
 *
 * SEARCH:
 *   Filters on ChapterTitleEn (case-insensitive) and ChapterNumber.
 *   ChapterTitleAr is not searched — Arabic keyword search requires IME input.
 *
 * NULL TITLES:
 *   Some chapters have null ChapterTitleEn (data gaps in source CSV).
 *   We display "Chapter {number}" as a fallback so the row still renders.
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useApp } from '../../context/AppContext.jsx';

const ChapterList = ({ bookName, selectedChapter, onSelect }) => {
  const { getToken } = useApp();

  // ── State ─────────────────────────────────────────────────────────────────
  const [chapters, setChapters] = useState([]);
  const [search,   setSearch]   = useState('');
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  // ── Fetch When bookName Changes ───────────────────────────────────────────
  useEffect(() => {
    if (!bookName) return;

    const fetchChapters = async () => {
      setLoading(true);
      setError(null);
      setChapters([]);
      setSearch(''); // Reset search on book change

      try {
        // encodeURIComponent handles spaces and special chars in book names
        // e.g. "Jami` at-Tirmidhi" → "Jami%60%20at-Tirmidhi"
        const { data } = await axios.get(
          `/api/hadith/chapters/${encodeURIComponent(bookName)}`,
          { headers: { Authorization: `Bearer ${getToken()}` } }
        );
        setChapters(data.chapters);
      } catch (err) {
        console.error('[ChapterList] Fetch error:', err.message);
        setError('Could not load chapters. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchChapters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookName]);

  // ── Client-Side Search Filter ─────────────────────────────────────────────
  const query    = search.trim().toLowerCase();
  const filtered = query === ''
    ? chapters
    : chapters.filter(ch => {
        const title = (ch.ChapterTitleEn || '').toLowerCase();
        return title.includes(query) || String(ch.ChapterNumber).includes(query);
      });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">

      {/* ── Search Bar ───────────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 p-3 border-b"
        style={{ borderColor: 'var(--border-primary)' }}
      >
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-2 truncate"
          style={{ color: 'var(--text-muted)' }}
          title={bookName}
        >
          {bookName}
        </p>
        <input
          type="text"
          className="deen-input w-full text-sm"
          placeholder="Search chapters…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="Search chapters"
        />
      </div>

      {/* ── List Body ────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">

        {/* Loading spinner */}
        {loading && (
          <div className="flex items-center justify-center h-32">
            <div className="spinner" aria-label="Loading chapters" />
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="p-4 text-center">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{error}</p>
          </div>
        )}

        {/* Empty search result */}
        {!loading && !error && filtered.length === 0 && (
          <div className="p-4 text-center">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {search ? `No chapters match "${search}"` : 'No chapters available.'}
            </p>
          </div>
        )}

        {/* Chapter rows */}
        {!loading && !error && filtered.map(ch => {
          const isActive    = selectedChapter === ch.ChapterNumber;
          const displayTitle = ch.ChapterTitleEn || `Chapter ${ch.ChapterNumber}`;

          return (
            <button
              key={ch.ChapterNumber}
              onClick={() => onSelect(ch.ChapterNumber)}
              className="w-full text-left flex items-start gap-3 px-3 py-3 border-b transition-colors duration-150"
              style={{
                backgroundColor : isActive ? 'var(--accent-light)'    : 'transparent',
                borderColor     : 'var(--border-primary)',
                borderLeft      : isActive
                  ? '3px solid var(--accent-primary)'
                  : '3px solid transparent',
              }}
              aria-current={isActive ? 'true' : undefined}
            >
              {/* Chapter number badge */}
              <span
                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
                style={{
                  backgroundColor : 'var(--accent-primary)',
                  color           : 'var(--text-inverse)',
                }}
              >
                {ch.ChapterNumber}
              </span>

              {/* Titles + meta */}
              <div className="flex-1 min-w-0">
                {/* English chapter title */}
                <p
                  className="text-sm font-medium leading-snug"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {displayTitle}
                </p>

                {/* Arabic chapter title — only rendered if available */}
                {ch.ChapterTitleAr && (
                  <p
                    className="arabic-text arabic-text-sm text-right mt-0.5"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {ch.ChapterTitleAr}
                  </p>
                )}

                {/* Hadith count */}
                <p
                  className="text-xs mt-1"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {ch.HadithCount} Hadith
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ChapterList;