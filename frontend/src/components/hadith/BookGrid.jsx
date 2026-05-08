/**
 * frontend/src/components/hadith/BookGrid.jsx
 *
 * Displays a responsive grid of the 6 Kutub al-Sittah (Six Authenticated Books).
 *
 * DATA STRATEGY — Hybrid (hardcoded metadata + live API counts):
 * The 6 books are fixed Islamic canon — their names and descriptions will
 * never change. We hardcode this metadata (Arabic name, description, color
 * accent) so the UI looks rich even before the API responds. The live
 * HadithCount is fetched from GET /api/hadith/books and merged in by
 * matching BookName. This prevents an empty grid flash on load.
 *
 * PROPS:
 * selectedBook  {string|null}  — Currently selected book name (or null)
 * onSelect      {Function}     — Called with bookName string when card clicked
 *
 * ACTIVE STATE:
 * The selected book card gets a colored left border + --accent-light bg,
 * matching the SurahList active-item pattern from Step 4.
 *
 * RESPONSIVE GRID:
 * 1 column on mobile, 2 on sm, 3 on lg — using Tailwind grid classes.
 * No inline display styles used.
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useApp } from '../../context/AppContext.jsx';

// ── Static Book Metadata ──────────────────────────────────────────────────────
/**
 * BOOK_META: Hardcoded scholarly metadata for the 6 authenticated books.
 *
 * The `key` field MUST match the exact BookName value in the DB (case-sensitive,
 * including the backtick in "Jami` at-Tirmidhi"). These are protected by a
 * SQL CHECK constraint and cannot be mismatched.
 *
 * `description`: One-sentence scholarly summary for student context.
 */
const BOOK_META = [
  {
    key         : 'Sahih al-Bukhari',
    nameAr      : 'صحيح البخاري',
    description : 'Compiled by Imam al-Bukhari, widely considered the most authentic book after the Quran, containing ~7,275 hadith selected from 600,000.',
  },
  {
    key         : 'Sahih Muslim',
    nameAr      : 'صحيح مسلم',
    description : 'Compiled by Imam Muslim ibn al-Hajjaj, the second most authoritative Hadith collection, renowned for its rigorous chain-of-narration methodology.',
  },
  {
    key         : 'Sunan Abi Dawud',
    nameAr      : 'سنن أبي داود',
    description : 'Compiled by Abu Dawud al-Sijistani, focused primarily on Fiqh-relevant Ahadith covering Islamic law and jurisprudence.',
  },
  {
    key         : 'Jami` at-Tirmidhi',
    nameAr      : 'جامع الترمذي',
    description : 'Compiled by Imam at-Tirmidhi, unique for including the grading of each Hadith and noting scholarly differences of opinion directly in the text.',
  },
  {
    key         : 'Sunan an-Nasa\'i',
    nameAr      : 'سنن النسائي',
    description : "Compiled by Imam an-Nasa'i, known for its stringent criteria on narrator reliability — often considered the most critical of the Six Books.",
  },
  {
    key         : 'Sunan Ibn Majah',
    nameAr      : 'سنن ابن ماجه',
    description : 'Compiled by Ibn Majah al-Qazwini, the sixth of the Kutub al-Sittah, containing many unique Ahadith not found in the other five collections.',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
const BookGrid = ({ selectedBook, onSelect }) => {
  const { getToken } = useApp();

  // ── State ─────────────────────────────────────────────────────────────────
  // liveCounts maps BookName → HadithCount from the API
  const [liveCounts, setLiveCounts] = useState({});
  const [loading,    setLoading]    = useState(true);

  // ── Fetch Live Counts ─────────────────────────────────────────────────────
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const { data } = await axios.get('/api/hadith/books', {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        // Convert array to lookup map: { 'Sahih al-Bukhari': 7277, ... }
        const countsMap = {};
        data.books.forEach(b => { countsMap[b.BookName] = b.HadithCount; });
        setLiveCounts(countsMap);
      } catch (err) {
        console.error('[BookGrid] Failed to fetch counts:', err.message);
        // Non-fatal — cards still render with metadata, just without counts
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto animate-fade-in">

      {/* Page header */}
      <div className="mb-6 text-center">
        <p
          className="arabic-text arabic-text-xl mb-1"
          style={{ color: 'var(--accent-primary)' }}
        >
          الكتب الستة
        </p>
        <h1
          className="text-2xl font-bold"
          style={{ color: 'var(--text-primary)', fontFamily: 'Cormorant Garamond, serif' }}
        >
          Kutub al-Sittah — The Six Authenticated Books
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Select a book to browse its chapters and Ahadith
        </p>
      </div>

      {/* ── 6-Book Grid ─────────────────────────────────────────────────── */}
      {/* Responsive: 1 col mobile → 2 col sm → 3 col lg */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {BOOK_META.map(book => {
          const isActive = selectedBook === book.key;
          const count    = liveCounts[book.key];

          return (
            <button
              key={book.key}
              onClick={() => onSelect(book.key)}
              className="deen-card deen-card-hover p-5 text-left w-full flex flex-col gap-2 transition-all duration-200"
              style={{
                borderLeftWidth: '4px',
                borderLeftStyle: 'solid',
                // Separating color logic fixes the CSS hover override bug
                borderLeftColor: isActive ? 'var(--accent-primary)' : undefined,
                backgroundColor: isActive ? 'var(--accent-light)' : undefined,
              }}
            >
              {/* ── Arabic Book Name ─────────────────────────────────── */}
              <p
                className="arabic-text arabic-text-lg text-right"
                style={{ color: 'var(--accent-primary)' }}
              >
                {book.nameAr}
              </p>

              {/* ── English Book Name ────────────────────────────────── */}
              <p
                className="font-bold text-base"
                style={{
                  color      : 'var(--text-primary)',
                  fontFamily : 'Cormorant Garamond, serif',
                }}
              >
                {book.key}
              </p>

              {/* ── One-sentence description ─────────────────────────── */}
              <p
                className="text-xs leading-relaxed flex-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                {book.description}
              </p>

              {/* ── Footer: Hadith count badge ───────────────────────── */}
              <div className="flex items-center justify-between mt-1 pt-2 border-t"
                style={{ borderColor: 'var(--border-secondary)' }}
              >
                <span className="badge badge-green text-xs">
                  {/* Show skeleton pulse while loading, then real count */}
                  {loading
                    ? '...'
                    : count != null
                      ? `${count.toLocaleString()} Ahadith`
                      : 'No data'
                  }
                </span>

                {isActive && (
                  <span
                    className="text-xs font-semibold"
                    style={{ color: 'var(--accent-primary)' }}
                  >
                    Selected ✓
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BookGrid;