/**
 * frontend/src/components/hadith/HadithReader.jsx
 *
 * RIGHT PANEL of the Hadith Split-Pane browser.
 *
 * RESPONSIBILITIES:
 *   1. Fetch paginated hadiths for the active book / chapter from the API.
 *   2. Provide a debounced keyword search on EnglishText.
 *   3. Render HadithCard list with prev/next pagination controls.
 *   4. Show loading skeleton, empty state, and error state.
 *
 * PROPS:
 *   selection  {object|null}  — { book, chapter, chapterTitle } from Hadith.jsx
 *
 * DEBOUNCE:
 *   Raw search input (search) is displayed immediately in the input.
 *   A 400 ms timeout delays updating debouncedSearch, which is what triggers
 *   the fetch. This avoids an API call on every keystroke.
 *
 * ABORT CONTROLLER:
 *   Each fetch is tied to an AbortController so an in-flight request is
 *   cancelled if selection or search changes before the response arrives.
 *   This prevents stale responses from overwriting fresh UI state.
 */

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useApp } from '../../context/AppContext.jsx';
import HadithCard from './HadithCard.jsx';

const LIMIT = 20;

const HadithReader = ({ selection }) => {
  const { getToken } = useApp();

  const [hadiths,    setHadiths]    = useState([]);
  const [total,      setTotal]      = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page,       setPage]       = useState(1);
  const [search,     setSearch]     = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);

  const topRef = useRef(null);

  // ── Reset search and page when book / chapter selection changes ───────────
  useEffect(() => {
    setSearch('');
    setDebouncedSearch('');
    setPage(1);
  }, [selection?.book, selection?.chapter]);

  // ── Debounce search input → debouncedSearch ───────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Return to first page whenever search term changes
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  // ── Fetch hadiths whenever selection, debounced search, or page changes ───
  useEffect(() => {
    if (!selection) {
      setHadiths([]);
      return;
    }

    const controller = new AbortController();

    const fetchHadiths = async () => {
      setLoading(true);
      setError(null);

      topRef.current?.scrollIntoView({ behavior: 'smooth' });

      try {
        const params = new URLSearchParams({
          book:  selection.book,
          page:  String(page),
          limit: String(LIMIT),
        });
        if (selection.chapter != null) params.set('chapter', String(selection.chapter));
        if (debouncedSearch)           params.set('search',  debouncedSearch);

        const { data } = await axios.get(`/api/hadith/hadiths?${params}`, {
          headers: { Authorization: `Bearer ${getToken()}` },
          signal:  controller.signal,
        });

        setHadiths(data.hadiths);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      } catch (err) {
        if (err.name === 'CanceledError' || err.name === 'AbortError') return;
        console.error('[HadithReader] Fetch error:', err.message);
        setError('Could not load hadiths. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchHadiths();
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection, debouncedSearch, page]);

  // ── Empty / welcome state ─────────────────────────────────────────────────
  if (!selection) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 animate-fade-in px-6 text-center">
        <p
          className="arabic-text arabic-text-2xl"
          style={{ color: 'var(--accent-primary)' }}
        >
          ﴿ وَمَا آتَاكُمُ الرَّسُولُ فَخُذُوهُ ﴾
        </p>
        <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>
          "Whatever the Messenger gives you, take it" — Al-Hashr 59:7
        </p>
        <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
          Select a book from the list to begin reading
        </p>
      </div>
    );
  }

  // ── Loading skeleton ──────────────────────────────────────────────────────
  const Skeleton = () => (
    <div className="p-4 md:p-6 animate-fade-in">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="deen-card mb-3 p-5 animate-pulse">
          <div className="h-3 rounded mb-3 ml-auto" style={{ backgroundColor: 'var(--bg-elevated)', width: '85%' }} />
          <div className="h-3 rounded mb-3 ml-auto" style={{ backgroundColor: 'var(--bg-elevated)', width: '70%' }} />
          <div className="h-3 rounded mb-2"         style={{ backgroundColor: 'var(--bg-elevated)', width: '100%' }} />
          <div className="h-3 rounded"              style={{ backgroundColor: 'var(--bg-elevated)', width: '60%' }} />
        </div>
      ))}
    </div>
  );

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full" ref={topRef}>

      {/* ── Sticky header: title + search bar ─────────────────────────────── */}
      <div
        className="flex-shrink-0 sticky top-0 z-10 px-4 md:px-6 py-3 border-b"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
          {selection.chapterTitle
            ? `Ch. ${selection.chapter} — ${selection.chapterTitle}`
            : selection.book}
        </p>
        <input
          type="text"
          className="deen-input w-full text-sm"
          placeholder="Search English text…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="Search hadiths"
        />
      </div>

      {/* ── Content area ──────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">

        {loading && <Skeleton />}

        {!loading && error && (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{error}</p>
          </div>
        )}

        {!loading && !error && hadiths.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {debouncedSearch ? `No hadiths found for "${debouncedSearch}"` : 'No hadiths found.'}
            </p>
          </div>
        )}

        {!loading && !error && hadiths.length > 0 && (
          <div className="p-4 md:p-6">

            {/* Result count */}
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
              Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total.toLocaleString()} hadiths
            </p>

            {hadiths.map(h => (
              <HadithCard key={h.HadithID} hadith={h} />
            ))}

            {/* ── Pagination controls ───────────────────────────────────── */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-6 pb-4">
                <button
                  className="btn-ghost text-sm px-4 py-2"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{ opacity: page === 1 ? 0.4 : 1 }}
                >
                  ← Prev
                </button>

                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {page} / {totalPages}
                </span>

                <button
                  className="btn-ghost text-sm px-4 py-2"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  style={{ opacity: page === totalPages ? 0.4 : 1 }}
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HadithReader;
