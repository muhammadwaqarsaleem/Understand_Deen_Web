/**
 * frontend/src/components/hadith/BookList.jsx
 *
 * LEFT PANEL of the Hadith Split-Pane browser.
 *
 * RESPONSIBILITIES:
 *   1. Fetch the 6 Kutub al-Sittah books on mount.
 *   2. Let the user expand a book to browse its chapters.
 *   3. Notify parent (Hadith.jsx) when a book or chapter is selected.
 *
 * PROPS:
 *   selection  {object|null}  — { book, chapter } currently active
 *   onSelect   {Function}     — called with { book, chapter: null|number, chapterTitle: null|string }
 *
 * CHAPTER CACHING:
 *   Chapter lists are fetched once per book and stored in chaptersCache so
 *   collapsing and re-expanding a book does not fire a second API call.
 */

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useApp } from '../../context/AppContext.jsx';

// Display metadata for each of the 6 Kutub al-Sittah.
// Keys must exactly match BookName values stored in the DB.
const BOOK_META = {
  'Sahih al-Bukhari':  { short: 'Al-Bukhari',  icon: '📘', color: '#22c58c' },
  'Sahih Muslim':      { short: 'Muslim',       icon: '📗', color: '#16a34a' },
  'Sunan Abi Dawud':   { short: 'Abi Dawud',    icon: '📙', color: '#d97706' },
  "Sunan an-Nasa'i":   { short: "An-Nasa'i",    icon: '📕', color: '#dc2626' },
  'Jami` at-Tirmidhi': { short: 'At-Tirmidhi',  icon: '📒', color: '#7c3aed' },
  'Sunan Ibn Majah':   { short: 'Ibn Majah',     icon: '📓', color: '#0891b2' },
};

const BookList = ({ selection, onSelect }) => {
  const { getToken } = useApp();

  const [books,        setBooks]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [expandedBook, setExpandedBook] = useState(null); // BookName string | null
  const [chaptersCache, setChaptersCache] = useState({});  // { BookName: chapters[] }
  const [chaptersLoading, setChaptersLoading] = useState(false);

  // ── Fetch book list on mount ──────────────────────────────────────────────
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const { data } = await axios.get('/api/hadith/books', {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        setBooks(data.books);
      } catch (err) {
        console.error('[BookList] Fetch error:', err.message);
        setError('Could not load books. Please refresh.');
      } finally {
        setLoading(false);
      }
    };
    fetchBooks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Expand / collapse a book and fetch its chapters ───────────────────────
  const handleBookClick = async (bookName) => {
    // Clicking the already-open book collapses it
    if (expandedBook === bookName) {
      setExpandedBook(null);
      return;
    }

    setExpandedBook(bookName);

    // Notify parent: select the whole book (no chapter filter)
    onSelect({ book: bookName, chapter: null, chapterTitle: null });

    // Chapters already cached — no API call needed
    if (chaptersCache[bookName]) return;

    setChaptersLoading(true);
    try {
      const { data } = await axios.get('/api/hadith/chapters', {
        params:  { book: bookName },
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setChaptersCache(prev => ({ ...prev, [bookName]: data.chapters }));
    } catch (err) {
      console.error('[BookList] Chapter fetch error:', err.message);
    } finally {
      setChaptersLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div
        className="flex-shrink-0 p-3 border-b"
        style={{ borderColor: 'var(--border-primary)' }}
      >
        <p
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: 'var(--text-muted)' }}
        >
          Kutub al-Sittah — الكتب الستة
        </p>
      </div>

      {/* List body */}
      <div className="flex-1 overflow-y-auto">

        {loading && (
          <div className="flex items-center justify-center h-32">
            <div className="spinner" aria-label="Loading books" />
          </div>
        )}

        {!loading && error && (
          <p className="p-4 text-sm text-center" style={{ color: 'var(--text-muted)' }}>
            {error}
          </p>
        )}

        {!loading && !error && books.map((book) => {
          const meta       = BOOK_META[book.BookName] || { short: book.BookName, icon: '📖', color: '#22c58c' };
          const isExpanded = expandedBook === book.BookName;
          const isActive   = selection?.book === book.BookName && selection?.chapter == null;
          const chapters   = chaptersCache[book.BookName] || [];

          return (
            <div key={book.BookName}>

              {/* ── Book row ─────────────────────────────────────────────── */}
              <button
                onClick={() => handleBookClick(book.BookName)}
                className="w-full text-left flex items-center gap-3 px-3 py-3 border-b transition-colors duration-150"
                style={{
                  backgroundColor : isActive ? 'var(--accent-light)' : 'transparent',
                  borderColor     : 'var(--border-primary)',
                  borderLeft      : isActive
                    ? '3px solid var(--accent-primary)'
                    : '3px solid transparent',
                }}
              >
                {/* Book icon badge */}
                <span
                  className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-base"
                  style={{ backgroundColor: meta.color + '22' }}
                >
                  {meta.icon}
                </span>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                    {book.BookName}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {book.HadithCount.toLocaleString()} hadiths · {book.ChapterCount} chapters
                  </p>
                </div>

                {/* Expand/collapse chevron */}
                <span
                  className="flex-shrink-0 text-xs transition-transform duration-200"
                  style={{
                    color: 'var(--text-muted)',
                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                  }}
                >
                  ›
                </span>
              </button>

              {/* ── Chapter list (visible when book is expanded) ──────────── */}
              {isExpanded && (
                <div style={{ backgroundColor: 'var(--bg-elevated)' }}>

                  {chaptersLoading && !chapters.length && (
                    <div className="flex items-center justify-center py-4">
                      <div className="spinner" style={{ width: '16px', height: '16px' }} />
                    </div>
                  )}

                  {/* "All hadiths" row — selects the book with no chapter filter */}
                  {chapters.length > 0 && (
                    <button
                      onClick={() => onSelect({ book: book.BookName, chapter: null, chapterTitle: null })}
                      className="w-full text-left px-4 py-2 text-xs border-b transition-colors duration-150"
                      style={{
                        borderColor     : 'var(--border-secondary)',
                        color           : selection?.book === book.BookName && selection?.chapter == null
                          ? 'var(--accent-primary)'
                          : 'var(--text-muted)',
                        fontWeight      : selection?.book === book.BookName && selection?.chapter == null
                          ? 600
                          : 400,
                        borderLeft      : selection?.book === book.BookName && selection?.chapter == null
                          ? '2px solid var(--accent-primary)'
                          : '2px solid transparent',
                      }}
                    >
                      All Hadiths ({book.HadithCount.toLocaleString()})
                    </button>
                  )}

                  {chapters.map((ch) => {
                    const isChActive =
                      selection?.book    === book.BookName &&
                      selection?.chapter === ch.ChapterNumber;

                    return (
                      <button
                        key={ch.ChapterNumber}
                        onClick={() => onSelect({
                          book:         book.BookName,
                          chapter:      ch.ChapterNumber,
                          chapterTitle: ch.ChapterTitleEn,
                        })}
                        className="w-full text-left px-4 py-2 border-b transition-colors duration-150"
                        style={{
                          borderColor     : 'var(--border-secondary)',
                          backgroundColor : isChActive ? 'var(--accent-light)' : 'transparent',
                          borderLeft      : isChActive
                            ? '2px solid var(--accent-primary)'
                            : '2px solid transparent',
                        }}
                      >
                        <span className="text-xs font-medium truncate block" style={{ color: 'var(--text-primary)' }}>
                          {ch.ChapterNumber}. {ch.ChapterTitleEn || `Chapter ${ch.ChapterNumber}`}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {ch.HadithCount} hadiths
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BookList;
