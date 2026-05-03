// =============================================================
// components/layout/TopNavbar.jsx
// Understand Deen — Fixed Top Navigation Bar
// =============================================================
// Responsibilities:
//   - Fixed 64px (h-16) bar across full viewport width
//   - Desktop (lg+): Logo | Nav Links | Date Display | Profile + Logout
//   - Mobile (<lg):  Logo | Hamburger button only
//   - Uses NavLink from React Router for automatic active class
//   - Reads user from useApp() for avatar initial and logout
//   - Reads theme state but does NOT set it (Profile page owns that)
//   - All colors via CSS variables — zero hardcoded hex values
//
// Props:
//   onMenuOpen : () => void — called when hamburger is clicked
//                             (state lives in AppLayout.jsx)
// =============================================================

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useApp }   from '../../context/AppContext.jsx';
import { getSolarDate, getHijriDate } from '../../utils/hijriDate.js';

// ── Navigation link definitions ───────────────────────────────
// Single source of truth — MobileDrawer.jsx imports this too
// so both navbars always stay in sync.
export const NAV_LINKS = [
  { to: '/home',        label: 'Home',        icon: '🏠' },
  { to: '/quran',       label: 'Quran',       icon: '📖' },
  { to: '/hadith',      label: 'Hadith',      icon: '📜' },
  { to: '/new-muslim',  label: 'New Muslim',  icon: '🌱' },
  { to: '/fiqh',        label: 'Fiqh',        icon: '⚖️' },
];

// ── Inline SVG Icons ─────────────────────────────────────────
// Kept inline to avoid an icon library dependency at this stage.

const StarIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M12 1L14.09 7.26L20.7 7.27L15.45 11.27L17.18 17.53L12 14L6.82 17.53L8.55 11.27L3.3 7.27L9.91 7.26L12 1Z" />
  </svg>
);

const HamburgerIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const LogoutIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const UserIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const CalendarIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
  </svg>
);

// =============================================================
// TopNavbar Component
// =============================================================
const TopNavbar = ({ onMenuOpen }) => {
  const { user, logout } = useApp();
  const navigate = useNavigate();

  // Pre-compute dates once on render (they won't change mid-session)
  const solarDate = getSolarDate();
  const hijriDate = getHijriDate();

  // Get the first letter of the user's name for the avatar circle
  const avatarInitial = user?.fullName
    ? user.fullName.charAt(0).toUpperCase()
    : '?';

  const handleLogout = () => {
    logout();              // clears localStorage + React state (AppContext)
    navigate('/login', { replace: true });
  };

  return (
    <header
      style={{
        position:        'fixed',
        top:             0,
        left:            0,
        right:           0,
        height:          '64px',          // h-16 — referenced by all pages as pt-16
        zIndex:          50,
        backgroundColor: 'var(--bg-card)',
        borderBottom:    '1px solid var(--border-primary)',
        display:         'flex',
        alignItems:      'center',
        boxShadow:       '0 1px 0 var(--border-primary)',
      }}
    >
      <div
        style={{
          width:          '100%',
          maxWidth:       '1280px',
          margin:         '0 auto',
          padding:        '0 1.5rem',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          gap:            '1rem',
        }}
      >

        {/* ── LEFT: Logo ─────────────────────────────────────── */}
        <NavLink
          to="/home"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
          aria-label="Understand Deen — Go to Home"
        >
          {/* Green star badge */}
          <div style={{
            width:           '32px',
            height:          '32px',
            borderRadius:    '8px',
            backgroundColor: 'var(--accent-primary)',
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            color:           'var(--text-inverse)',
            flexShrink:      0,
          }}>
            <StarIcon />
          </div>
          {/* Wordmark — hidden on very small screens */}
          <span style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontSize:   '1.25rem',
            fontWeight: 600,
            color:      'var(--text-primary)',
            whiteSpace: 'nowrap',
          }}
            className="hidden xs:block"
          >
            Understand Deen
          </span>
        </NavLink>

        {/* ── CENTER: Nav Links (desktop only — hidden on mobile) ── */}
        <nav
          className="hidden lg:flex items-center gap-2"
          aria-label="Main navigation"
        >
          {/* Override the hidden above for lg screens via Tailwind */}
          <style>{`@media (min-width: 1024px) { nav.desktop-nav { display: flex !important; } }`}</style>
          {NAV_LINKS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              // NavLink automatically adds 'active' class when the route matches
              // Our .nav-link and .nav-link.active classes in index.css handle styling
              className={({ isActive }) =>
                `nav-link${isActive ? ' active' : ''}`
              }
              style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem' }}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* ── RIGHT: Dates + Profile + Logout ──────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>

          {/* Date display — desktop only */}
          <div
            className="hidden lg:flex"
            style={{
              flexDirection: 'column',
              alignItems:    'flex-end',
              gap:           '1px',
            }}
          >
            {/* Hijri date — gold accent color */}
            <div style={{
              display:    'flex',
              alignItems: 'center',
              gap:        '0.25rem',
              color:      'var(--gold)',
              fontSize:   '0.7rem',
              fontFamily: '"DM Sans", sans-serif',
              fontWeight: 500,
            }}>
              <CalendarIcon />
              <span>{hijriDate}</span>
            </div>
            {/* Solar date — secondary text */}
            <span style={{
              color:      'var(--text-secondary)',
              fontSize:   '0.65rem',
              fontFamily: '"DM Sans", sans-serif',
            }}>
              {solarDate}
            </span>
          </div>

          {/* Vertical divider — desktop only */}
          <div
            className="hidden lg:block"
            style={{
              width:           '1px',
              height:          '28px',
              backgroundColor: 'var(--border-primary)',
            }}
          />

          {/* Profile avatar link */}
          <NavLink
            to="/profile"
            title={`Profile — ${user?.fullName || 'User'}`}
            style={{ textDecoration: 'none' }}
            className={({ isActive }) => isActive ? 'opacity-100' : 'opacity-80 hover:opacity-100'}
          >
            <div style={{
              width:           '32px',
              height:          '32px',
              borderRadius:    '50%',
              backgroundColor: 'var(--accent-primary)',
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'center',
              color:           'var(--text-inverse)',
              fontFamily:      '"Cormorant Garamond", serif',
              fontSize:        '0.9rem',
              fontWeight:      600,
              transition:      'box-shadow 0.2s ease',
              cursor:          'pointer',
            }}>
              {avatarInitial}
            </div>
          </NavLink>

          {/* Logout button — icon only on desktop to save space */}
          <button
            onClick={handleLogout}
            title="Log out"
            className="hidden lg:flex btn-ghost"
            style={{
              padding:    '0.4rem 0.6rem',
              borderRadius: '8px',
              color:      'var(--text-secondary)',
              fontSize:   '0.8rem',
              gap:        '0.375rem',
              alignItems: 'center',
            }}
            aria-label="Log out"
          >
            <LogoutIcon />
            <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8rem' }}>
              Logout
            </span>
          </button>

          {/* ── Hamburger — mobile only ───────────────────────── */}
          <button
            onClick={onMenuOpen}
            className="lg:hidden btn-ghost"
            style={{
              padding:      '0.5rem',
              borderRadius: '8px',
              color:        'var(--text-primary)',
            }}
            aria-label="Open navigation menu"
            aria-expanded="false"
          >
            <HamburgerIcon />
          </button>

        </div>
      </div>
    </header>
  );
};

export default TopNavbar;
