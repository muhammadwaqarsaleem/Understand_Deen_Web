// =============================================================
// components/layout/Footer.jsx
// Understand Deen — Application Footer
// =============================================================
// Intentionally minimal. Contains:
//   - App name + copyright
//   - Arabic Shahada verse (rendered with .arabic-text class)
//   - About and Contact links
//
// Design decision: The footer uses a slightly elevated background
// (--bg-elevated) to visually separate it from page content,
// while the top border uses --border-primary.
//
// Arabic text:
//   "فَاعْلَمْ أَنَّهُ لَا إِلَٰهَ إِلَّا اللَّهُ"
//   Translation: "Know that there is no god but Allah"
//   Source: Quran 47:19
// =============================================================

import React from 'react';

const StarIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '14px', height: '14px' }}>
    <path d="M12 1L14.09 7.26L20.7 7.27L15.45 11.27L17.18 17.53L12 14L6.82 17.53L8.55 11.27L3.3 7.27L9.91 7.26L12 1Z" />
  </svg>
);

const Footer = () => {
  return (
    <footer
      style={{
        backgroundColor: 'var(--bg-elevated)',
        borderTop:       '1px solid var(--border-primary)',
        padding:         '2rem 1.5rem',
      }}
    >
      <div
        style={{
          maxWidth:       '1280px',
          margin:         '0 auto',
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          gap:            '1rem',
          textAlign:      'center',
        }}
      >

        {/* ── Arabic verse ─────────────────────────────────── */}
        {/* Quran 47:19 — rendered with full Arabic typography  */}
        <p
          className="arabic-text arabic-text-md"
          dir="rtl"
          style={{ color: 'var(--gold)', margin: 0, opacity: 0.85 }}
          title="Know that there is no god but Allah — Quran 47:19"
        >
          فَاعْلَمْ أَنَّهُ لَا إِلَٰهَ إِلَّا اللَّهُ
        </p>

        {/* ── Divider ──────────────────────────────────────── */}
        <div style={{
          width:           '48px',
          height:          '1px',
          backgroundColor: 'var(--border-primary)',
        }} />

        {/* ── Bottom row: branding + links ─────────────────── */}
        <div style={{
          display:        'flex',
          flexWrap:       'wrap',
          alignItems:     'center',
          justifyContent: 'center',
          gap:            '1rem',
        }}>

          {/* App name + copyright */}
          <div style={{
            display:    'flex',
            alignItems: 'center',
            gap:        '0.375rem',
            color:      'var(--text-secondary)',
          }}>
            <span style={{ color: 'var(--accent-primary)' }}>
              <StarIcon />
            </span>
            <span style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize:   '0.8rem',
            }}>
              Understand Deen © 2026
            </span>
          </div>

          {/* Dot separator */}
          <span style={{ color: 'var(--border-primary)', fontSize: '0.75rem' }}>·</span>

          {/* Navigation links */}
          <div style={{ display: 'flex', gap: '1.25rem' }}>
            {/* Using plain <a> tags as specified in requirements */}
            <a
              href="/about"
              style={{
                fontFamily:     '"DM Sans", sans-serif',
                fontSize:       '0.8rem',
                color:          'var(--text-secondary)',
                textDecoration: 'none',
                transition:     'color 0.15s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-primary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              About
            </a>
            <a
              href="/contact"
              style={{
                fontFamily:     '"DM Sans", sans-serif',
                fontSize:       '0.8rem',
                color:          'var(--text-secondary)',
                textDecoration: 'none',
                transition:     'color 0.15s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-primary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              Contact
            </a>
          </div>

          {/* Dot separator */}
          <span style={{ color: 'var(--border-primary)', fontSize: '0.75rem' }}>·</span>

          {/* Course note */}
          <span style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize:   '0.7rem',
            color:      'var(--text-muted)',
          }}>
            BCS-6A University Project
          </span>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
