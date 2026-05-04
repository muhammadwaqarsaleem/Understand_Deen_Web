/**
 * frontend/src/pages/Quran.jsx
 *
 * The Quran Split-Pane Reader page — mounted at /quran inside AppLayout.
 *
 * ── LAYOUT ARCHITECTURE ─────────────────────────────────────────────────────
 *
 *   ┌─ AppLayout (TopNavbar 64px + Footer) ────────────────────────────────┐
 *   │  ┌─ Quran.jsx outer div — height: calc(100vh - 64px) ─────────────┐ │
 *   │  │                                                                  │ │
 *   │  │  ┌─ Left Panel (300px) ──┐  ┌─ Right Panel (flex: 1) ────────┐ │ │
 *   │  │  │  SurahList            │  │  AyatReader                    │ │ │
 *   │  │  │  overflowY: auto      │  │  overflowY: auto               │ │ │
 *   │  │  │  (independent scroll) │  │  (independent scroll)          │ │ │
 *   │  │  └───────────────────────┘  └────────────────────────────────┘ │ │
 *   │  └──────────────────────────────────────────────────────────────────┘ │
 *   └──────────────────────────────────────────────────────────────────────┘
 *
 * WHY calc(100vh - 64px) + overflow: hidden?
 *   The AppLayout renders TopNavbar (64px) + this page + Footer.
 *   If we let the page grow naturally, the whole page scrolls and both
 *   panels lose independent scroll control. By capping height and hiding
 *   overflow on the OUTER div, each inner panel gets its own scroll axis.
 *   This is the standard "sticky sidebar + scrollable main" pattern.
 *
 * ── MOBILE BEHAVIOR ─────────────────────────────────────────────────────────
 *   - selectedSurah === null  → Show SurahList fullscreen, hide AyatReader.
 *   - selectedSurah !== null  → Show AyatReader fullscreen with ← Back button,
 *                               hide SurahList.
 *   This mimics a native mobile master-detail navigation pattern.
 *
 *   IMPORTANT: We use Tailwind responsive classes for show/hide (hidden, flex,
 *   md:flex, etc.) — NEVER inline style={{ display: 'none' }}.
 *
 * ── App.jsx WIRING ───────────────────────────────────────────────────────────
 *   Replace the inline placeholder <p>Quran coming soon...</p> in App.jsx with:
 *     import Quran from './pages/Quran.jsx'
 *     <Route path="/quran" element={<Quran />} />
 */

import React, { useState } from 'react';
import SurahList  from '../components/quran/SurahList.jsx';
import AyatReader from '../components/quran/AyatReader.jsx';

const Quran = () => {
  /**
   * selectedSurah: null  = no Surah chosen (welcome state / mobile list view)
   * selectedSurah: 1–114 = that Surah is active, AyatReader fetches and renders it
   */
  const [selectedSurah, setSelectedSurah] = useState(null);

  return (
    /**
     * OUTER CONTAINER
     * ───────────────
     * height: calc(100vh - 64px)  → fills exactly the viewport below the navbar
     * overflow: hidden             → prevents the page itself from scrolling;
     *                                each panel scrolls independently instead
     *
     * These are layout constraints, not breakpoint-display toggles,
     * so inline style is appropriate here (per project rules).
     */
    <div
      className="flex"
      style={{ height: 'calc(100vh - 64px)', overflow: 'hidden' }}
    >

      {/* ── LEFT PANEL: Surah List ──────────────────────────────────────────
           DESKTOP (md+): Always visible. Fixed 300px width. Scrolls on its own.
           MOBILE: Shown fullscreen when no Surah selected (selectedSurah===null).
                   Hidden when a Surah is open (user navigates to AyatReader).

           Tailwind classes explanation:
             flex-shrink-0          → never squish below 300px on desktop
             md:w-[300px]           → fixed 300px on md+ screens
             w-full                 → full width on mobile when visible
             hidden md:flex         → hide on mobile when reading (surah selected)
             flex flex-col          → show on mobile when browsing (no surah) */}
      <div
        className={[
          'flex-shrink-0 border-r flex-col',
          selectedSurah !== null
            ? 'hidden md:flex md:w-[300px]'    // mobile: hidden while reading
            : 'flex w-full md:w-[300px]',       // mobile: visible while browsing
        ].join(' ')}
        style={{
          overflowY       : 'auto',
          borderColor     : 'var(--border-primary)',
          backgroundColor : 'var(--bg-card)',
        }}
      >
        <SurahList
          selectedSurah={selectedSurah}
          onSelect={setSelectedSurah}
        />
      </div>

      {/* ── RIGHT PANEL: Ayat Reader ────────────────────────────────────────
           DESKTOP (md+): Always visible. Takes all remaining horizontal space.
           MOBILE: Hidden while browsing (no surah). Fullscreen while reading.

           Tailwind classes explanation:
             flex-1                 → takes all remaining width (flex child)
             flex flex-col          → column direction for back-button + reader
             hidden md:flex         → hide on mobile when no surah selected
             flex                   → show on mobile when a surah is selected    */}
      <div
        className={[
          'flex-1 flex-col',
          selectedSurah !== null
            ? 'flex'            // mobile: visible when reading
            : 'hidden md:flex', // mobile: hidden when browsing list
        ].join(' ')}
        style={{
          overflowY       : 'auto',
          backgroundColor : 'var(--bg-primary)',
        }}
      >

        {/* ── Mobile Back Button ─────────────────────────────────────────
             Only rendered when a Surah is selected AND we're on mobile.
             On desktop (md+) this is hidden — both panels are always visible.
             sticky + top-0 + z-10 keeps it pinned while the user scrolls Ayat. */}
        {selectedSurah !== null && (
          <div
            className="md:hidden sticky top-0 z-10 flex items-center gap-2 px-4 py-2 border-b"
            style={{
              backgroundColor : 'var(--bg-card)',
              borderColor     : 'var(--border-primary)',
            }}
          >
            <button
              className="btn-ghost text-sm flex items-center gap-1 px-3 py-1.5"
              onClick={() => setSelectedSurah(null)}
              aria-label="Back to Surah list"
            >
              ← Back to Surahs
            </button>
          </div>
        )}

        {/* ── Ayat Reader — the main reading area ─────────────────────── */}
        <AyatReader surahNumber={selectedSurah} />
      </div>
    </div>
  );
};

export default Quran;