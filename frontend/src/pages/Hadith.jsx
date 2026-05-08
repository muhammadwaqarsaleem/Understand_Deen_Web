/**
 * frontend/src/pages/Hadith.jsx
 *
 * The Hadith Browser page — mounted at /hadith inside AppLayout.
 *
 * ── THREE-VIEW ARCHITECTURE ─────────────────────────────────────────────────
 *
 *   View 1 — No book selected:
 *   ┌──────────────────────────────────────────────────────────────────┐
 *   │  BookGrid (fullscreen, scrollable grid of 6 book cards)          │
 *   └──────────────────────────────────────────────────────────────────┘
 *
 *   View 2 — Book selected, no chapter:
 *   ┌─ Collapsed Book Strip (book name + "Change Book" button) ────────┐
 *   │  ChapterList (fullscreen, scrollable chapter list)               │
 *   └──────────────────────────────────────────────────────────────────┘
 *
 *   View 3 — Book + chapter selected:
 *   ┌─ Collapsed Book Strip ───────────────────────────────────────────┐
 *   │  ┌─ ChapterList (300px) ─┐  ┌─ HadithReader (flex: 1) ────────┐ │
 *   │  │  Left panel            │  │  Right panel                    │ │
 *   │  │  overflowY: auto       │  │  overflowY: auto                │ │
 *   │  └───────────────────────┘  └─────────────────────────────────┘ │
 *   └──────────────────────────────────────────────────────────────────┘
 *
 * ── OUTER CONTAINER ─────────────────────────────────────────────────────────
 *   Always: height calc(100vh - 64px), overflow hidden.
 *   Internal sections use flex/overflow-y: auto for independent scrolling.
 *
 * ── MOBILE BEHAVIOR ─────────────────────────────────────────────────────────
 *   Single-column navigation: Books → Chapters → Hadith.
 *   Each step shows a ← Back button to return to the previous view.
 *   Tailwind responsive classes control show/hide — NO inline display styles.
 *
 * ── STATE ───────────────────────────────────────────────────────────────────
 *   selectedBook    : null | string   (book name)
 *   selectedChapter : null | number   (chapter number)
 *
 * ── App.jsx WIRING ───────────────────────────────────────────────────────────
 *   Replace the inline Hadith placeholder in App.jsx with:
 *     import Hadith from './pages/Hadith.jsx'
 *     <Route path="/hadith" element={<Hadith />} />
 */

import React, { useState } from 'react';
import BookGrid     from '../components/hadith/BookGrid.jsx';
import ChapterList  from '../components/hadith/ChapterList.jsx';
import HadithReader from '../components/hadith/HadithReader.jsx';

const Hadith = () => {
  const [selectedBook,    setSelectedBook]    = useState(null); // string | null
  const [selectedChapter, setSelectedChapter] = useState(null); // number | null

  // ── Event Handlers ────────────────────────────────────────────────────────

  /**
   * When a book is selected from BookGrid or the "Change Book" button resets:
   *   - Set selectedBook
   *   - Clear selectedChapter (user must re-pick a chapter for the new book)
   */
  const handleSelectBook = (bookName) => {
    setSelectedBook(bookName);
    setSelectedChapter(null);
  };

  /**
   * When a chapter is selected from ChapterList:
   *   - Set selectedChapter
   *   - selectedBook remains unchanged
   */
  const handleSelectChapter = (chapterNumber) => {
    setSelectedChapter(chapterNumber);
  };

  /**
   * "Change Book" — collapses back to View 1 (BookGrid fullscreen).
   */
  const handleChangeBook = () => {
    setSelectedBook(null);
    setSelectedChapter(null);
  };

  /**
   * Mobile "Back to Chapters" — from HadithReader back to ChapterList.
   */
  const handleBackToChapters = () => {
    setSelectedChapter(null);
  };

  // ── Derived Booleans ──────────────────────────────────────────────────────
  const hasBook    = selectedBook    !== null;
  const hasChapter = selectedChapter !== null;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    /**
     * OUTER CONTAINER
     * height: calc(100vh - 64px) → fills viewport below the 64px TopNavbar
     * overflow: hidden            → prevents page scroll; inner panels scroll
     * flex flex-col               → Collapsed strip stacks above the content area
     */
    <div
      className="flex flex-col"
      style={{ height: 'calc(100vh - 64px)', overflow: 'hidden' }}
    >

      {/* ══════════════════════════════════════════════════════════════════
           COLLAPSED BOOK STRIP (Views 2 & 3 only)
           ══════════════════════════════════════════════════════════════════
           A thin sticky header that shows the selected book name + a button
           to go back to the full BookGrid. Modeled on breadcrumb navigation.
           flex-shrink-0 prevents it from being squished by the content below.
      ══════════════════════════════════════════════════════════════════ */}
      {hasBook && (
        <div
          className="flex-shrink-0 flex items-center gap-3 px-4 py-2 border-b"
          style={{
            backgroundColor : 'var(--bg-card)',
            borderColor     : 'var(--border-primary)',
          }}
        >
          {/* Book icon + name */}
          <span
            className="text-sm font-semibold truncate flex-1"
            style={{ color: 'var(--text-primary)' }}
          >
            📖 {selectedBook}
          </span>

          {/* Chapter breadcrumb — visible in View 3 */}
          {hasChapter && (
            <span
              className="text-xs hidden sm:inline"
              style={{ color: 'var(--text-muted)' }}
            >
              › Chapter {selectedChapter}
            </span>
          )}

          {/* Change Book button */}
          <button
            className="btn-ghost text-xs px-3 py-1.5 flex-shrink-0"
            onClick={handleChangeBook}
          >
            ↩ Change Book
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
           CONTENT AREA — switches between the 3 views
      ══════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 overflow-hidden flex flex-col">

        {/* ── VIEW 1: BookGrid (no book selected) ─────────────────────────
             Full-width, scrollable grid of the 6 book cards.
             On desktop: always visible when !hasBook.
             On mobile:  same — no difference at this level.
             Hidden with Tailwind when a book has been selected.              */}
        {!hasBook && (
          <div className="flex-1 overflow-y-auto">
            <BookGrid
              selectedBook={selectedBook}
              onSelect={handleSelectBook}
            />
          </div>
        )}

        {/* ── VIEWS 2 & 3: Book selected ───────────────────────────────── */}
        {hasBook && (
          <div className="flex-1 overflow-hidden flex flex-col md:flex-row">

            {/* ── ChapterList panel ────────────────────────────────────────
                 VIEW 2 (mobile + desktop): Full-width column of chapters.
                 VIEW 3 desktop: Left panel, 300px wide.
                 VIEW 3 mobile: HIDDEN — HadithReader takes the full screen.

                 Tailwind class logic:
                   !hasChapter → always visible (both mobile + desktop)
                   hasChapter  → hidden on mobile, 300px fixed on desktop   */}
            <div
              className={[
                'flex-col border-b md:border-b-0 md:border-r',
                // Mobile: show full-width in View 2, hide in View 3
                // Desktop: always show, fixed 300px via md:w-[300px]
                hasChapter
                  ? 'hidden md:flex md:flex-shrink-0 md:w-[300px]'
                  : 'flex flex-1 md:flex-none md:flex-shrink-0 md:w-[300px]',
              ].join(' ')}
              style={{
                overflowY   : 'auto',
                borderColor : 'var(--border-primary)',
                backgroundColor: 'var(--bg-card)',
              }}
            >
              <ChapterList
                bookName={selectedBook}
                selectedChapter={selectedChapter}
                onSelect={handleSelectChapter}
              />
            </div>

            {/* ── HadithReader panel ───────────────────────────────────────
                 VIEW 2: Hidden on mobile, hidden on desktop (no chapter yet)
                         → Shows the welcome/empty state from HadithReader.
                         On desktop in View 2, flex-1 shows the empty state.
                 VIEW 3: Full-screen on mobile, flex-1 on desktop.

                 Tailwind class logic:
                   !hasChapter mobile → hidden (ChapterList is fullscreen)
                   !hasChapter desktop → flex flex-1 (empty state visible)
                   hasChapter  → always flex (full mobile + right panel desktop) */}
            <div
              className={[
                'flex-col flex-1',
                hasChapter
                  ? 'flex'               // View 3: always visible
                  : 'hidden md:flex',    // View 2: desktop shows empty state
              ].join(' ')}
              style={{
                overflowY       : 'auto',
                backgroundColor : 'var(--bg-primary)',
              }}
            >
              {/* ── Mobile: Back to Chapters button (View 3 only) ──────────
                   Only shown on mobile (md:hidden) when a chapter is active.
                   Lets user navigate back to ChapterList without losing their
                   book selection.                                               */}
              {hasChapter && (
                <div
                  className="md:hidden flex-shrink-0 sticky top-0 z-10 flex items-center gap-2 px-4 py-2 border-b"
                  style={{
                    backgroundColor : 'var(--bg-card)',
                    borderColor     : 'var(--border-primary)',
                  }}
                >
                  <button
                    className="btn-ghost text-sm flex items-center gap-1 px-3 py-1.5"
                    onClick={handleBackToChapters}
                    aria-label="Back to chapter list"
                  >
                    ← Back to Chapters
                  </button>
                  <span
                    className="text-xs truncate"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Chapter {selectedChapter}
                  </span>
                </div>
              )}

              {/* The reader itself — shows welcome state until both props are set */}
              <HadithReader
                bookName={selectedBook}
                chapterNumber={selectedChapter}
              />
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default Hadith;