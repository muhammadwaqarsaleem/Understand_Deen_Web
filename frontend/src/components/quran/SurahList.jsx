/**
 * frontend/src/components/quran/SurahList.jsx
 *
 * LEFT PANEL of the Quran Split-Pane Reader.
 *
 * RESPONSIBILITIES:
 *   1. Fetch the 114-Surah index from GET /api/quran/surahs on mount.
 *   2. Render a scrollable, searchable list of Surahs.
 *   3. Notify the parent (Quran.jsx) when a Surah is selected via onSelect().
 *   4. Highlight the currently active Surah.
 *
 * PROPS:
 *   selectedSurah  {number|null}  — The currently selected SurahNo (or null).
 *   onSelect       {Function}     — Called with SurahNo when user clicks a row.
 *
 * DESIGN DECISIONS:
 *   - Search filters on SurahNameEn, SurahNameRoman, and SurahNo.
 *     This covers "Fatiha", "Al-Fatiha", and "1" as valid queries.
 *   - The active Surah uses --accent-light bg + a left border accent strip.
 *     This mimics VS Code's file explorer active-file pattern — familiar to devs.
 *   - PlaceOfRevelation badge: Meccan → badge-gold, Medinan → badge-green.
 *     Classical Islamic scholarship distinguishes Meccan vs Medinan Surahs by
 *     their tone (Aqeedah-focused vs legislation-focused). The badge surfaces this.
 *
 * RESPONSIVE:
 *   This component has no breakpoint logic — Quran.jsx handles show/hide.
 *   SurahList always renders at 100% of whatever container it's placed in.
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useApp } from '../../context/AppContext.jsx';

const SurahList = ({ selectedSurah, onSelect }) => {
  const { getToken } = useApp();

  // ── State ─────────────────────────────────────────────────────────────────
  const [surahs,  setSurahs]  = useState([]);  // Full 114-Surah array from API
  const [search,  setSearch]  = useState('');  // Live search query
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // ── Fetch on Mount ────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchSurahs = async () => {
      try {
        const { data } = await axios.get('/api/quran/surahs', {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        setSurahs(data.surahs);
      } catch (err) {
        console.error('[SurahList] Fetch error:', err.message);
        setError('Could not load Surah list. Please refresh.');
      } finally {
        setLoading(false);
      }
    };

    fetchSurahs();
    // getToken is stable (comes from context ref) — no dep needed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Client-Side Search Filter ─────────────────────────────────────────────
  // We filter in-memory (no extra API call) because 114 rows is negligible.
  const query    = search.trim().toLowerCase();
  const filtered = query === ''
    ? surahs
    : surahs.filter(s =>
        s.SurahNameEn.toLowerCase().includes(query)     ||
        s.SurahNameRoman.toLowerCase().includes(query)  ||
        String(s.SurahNo).includes(query)
      );

  // ── Helpers ───────────────────────────────────────────────────────────────
  /**
   * Determines the badge class for PlaceOfRevelation.
   * The DB stores 'Mecca' or 'Medina' (or 'Meccan'/'Medinan') depending
   * on the CSV source — we handle both conventions.
   */
  const revelationBadge = (place) =>
    (place === 'Meccan' || place === 'Mecca')
      ? 'badge badge-gold'
      : 'badge badge-green';

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">

      {/* ── Search Bar ───────────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 p-3 border-b"
        style={{ borderColor: 'var(--border-primary)' }}
      >
        {/* Title row */}
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-2"
          style={{ color: 'var(--text-muted)' }}
        >
          Surahs — القرآن الكريم
        </p>

        <input
          type="text"
          className="deen-input w-full text-sm"
          placeholder="Search by name or number…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="Search Surahs"
        />
      </div>

      {/* ── List Body ────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">

        {/* Loading spinner */}
        {loading && (
          <div className="flex items-center justify-center h-32">
            <div className="spinner" aria-label="Loading Surahs" />
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
              No Surahs match "{search}"
            </p>
          </div>
        )}

        {/* Surah rows */}
        {!loading && !error && filtered.map((surah) => {
          const isActive = selectedSurah === surah.SurahNo;

          return (
            <button
              key={surah.SurahNo}
              onClick={() => onSelect(surah.SurahNo)}
              className="w-full text-left flex items-center gap-3 px-3 py-3 border-b transition-colors duration-150"
              style={{
                backgroundColor : isActive ? 'var(--accent-light)'    : 'transparent',
                borderColor     : 'var(--border-primary)',
                // Left accent strip — the visual "active file" indicator
                borderLeft      : isActive
                  ? '3px solid var(--accent-primary)'
                  : '3px solid transparent',
              }}
              aria-current={isActive ? 'true' : undefined}
            >
              {/* ── Surah Number Badge ────────────────────────────────── */}
              <span
                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  backgroundColor : 'var(--accent-primary)',
                  color           : 'var(--text-inverse)',
                }}
              >
                {surah.SurahNo}
              </span>

              {/* ── Names + Meta ──────────────────────────────────────── */}
              <div className="flex-1 min-w-0">

                {/* Top row: English name (left) + Arabic name (right) */}
                <div className="flex items-center justify-between gap-1">
                  <span
                    className="text-sm font-semibold truncate"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {surah.SurahNameEn}
                  </span>

                  {/* Arabic name — uses the dedicated .arabic-text class
                      which applies the correct font (Amiri/Uthmanic) */}
                  <span
                    className="arabic-text arabic-text-sm flex-shrink-0"
                    style={{ color: 'var(--accent-primary)' }}
                  >
                    {surah.SurahNameAr}
                  </span>
                </div>

                {/* Bottom row: Ayat count + Revelation badge */}
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className="text-xs"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {surah.TotalAyahSurah} Ayat
                  </span>
                  <span className={revelationBadge(surah.PlaceOfRevelation)}>
                    {surah.PlaceOfRevelation}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SurahList;