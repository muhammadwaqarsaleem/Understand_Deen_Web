/**
 * frontend/src/pages/Hadith.jsx — Step 5
 *
 * Split-pane Hadith browser — same layout pattern as Quran.jsx.
 *
 *   ┌─ Left Panel (300px) ────────┐  ┌─ Right Panel (flex-1) ────────┐
 *   │  BookList                   │  │  HadithReader                  │
 *   │  6 books + chapter browser  │  │  hadiths + search + pagination │
 *   └─────────────────────────────┘  └────────────────────────────────┘
 *
 * MOBILE:
 *   selection === null → BookList fullscreen, HadithReader hidden.
 *   selection !== null → HadithReader fullscreen with ← Back button.
 */

import React, { useState } from 'react';
import BookList     from '../components/hadith/BookList.jsx';
import HadithReader from '../components/hadith/HadithReader.jsx';

const Hadith = () => {
  // selection: null | { book, chapter, chapterTitle }
  const [selection, setSelection] = useState(null);

  return (
    <div
      className="flex"
      style={{ height: 'calc(100vh - 64px)', overflow: 'hidden' }}
    >

      {/* ── LEFT PANEL: Book + Chapter browser ─────────────────────────────── */}
      <div
        className={[
          'flex-shrink-0 border-r flex-col',
          selection !== null
            ? 'hidden md:flex md:w-[300px]'   // mobile: hidden while reading
            : 'flex w-full md:w-[300px]',      // mobile: visible while browsing
        ].join(' ')}
        style={{
          overflowY       : 'auto',
          borderColor     : 'var(--border-primary)',
          backgroundColor : 'var(--bg-card)',
        }}
      >
        <BookList selection={selection} onSelect={setSelection} />
      </div>

      {/* ── RIGHT PANEL: Hadith reader ─────────────────────────────────────── */}
      <div
        className={[
          'flex-1 flex-col',
          selection !== null
            ? 'flex'
            : 'hidden md:flex',
        ].join(' ')}
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >

        {/* Mobile back button */}
        {selection !== null && (
          <div
            className="md:hidden sticky top-0 z-10 flex items-center gap-2 px-4 py-2 border-b"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}
          >
            <button
              className="btn-ghost text-sm flex items-center gap-1 px-3 py-1.5"
              onClick={() => setSelection(null)}
              aria-label="Back to book list"
            >
              ← Back to Books
            </button>
          </div>
        )}

        <HadithReader selection={selection} />
      </div>
    </div>
  );
};

export default Hadith;
