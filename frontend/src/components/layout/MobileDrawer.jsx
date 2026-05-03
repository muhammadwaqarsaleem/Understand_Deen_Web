// =============================================================
// components/layout/MobileDrawer.jsx
// Understand Deen — Mobile Slide-Out Navigation Drawer
// =============================================================
// Responsibilities:
//   - Renders a full-height panel that slides in from the LEFT
//   - A semi-transparent overlay covers the rest of the screen;
//     clicking it closes the drawer
//   - Contains: logo, all 5 nav links + Profile + Logout
//   - Auto-closes on ANY route navigation (via useEffect on location)
//   - Uses CSS variables for all colors — theme-aware automatically
//   - Uses .animate-slide-in-left class from index.css for entry
//
// Props:
//   isOpen   : boolean — whether the drawer is visible
//   onClose  : () => void — called to close the drawer
//             (state lives in AppLayout.jsx)
//
// Accessibility:
//   - Drawer has role="dialog" and aria-modal="true"
//   - Focus is not trapped here for simplicity; future enhancement
//     would add a focus trap for full WCAG compliance
// =============================================================

import React, { useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext.jsx';
import { NAV_LINKS } from './TopNavbar.jsx'; // single source of truth for nav items
import { getSolarDate, getHijriDate } from '../../utils/hijriDate.js';

// ── Inline SVG Icons ─────────────────────────────────────────

const StarIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M12 1L14.09 7.26L20.7 7.27L15.45 11.27L17.18 17.53L12 14L6.82 17.53L8.55 11.27L3.3 7.27L9.91 7.26L12 1Z" />
  </svg>
);

const CloseIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
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

// =============================================================
// MobileDrawer Component
// =============================================================
const MobileDrawer = ({ isOpen, onClose }) => {
  const { user, logout } = useApp();
  const location         = useLocation();
  const navigate         = useNavigate();

  // ── Auto-close when route changes ──────────────────────────
  // This handles the case where a NavLink is clicked; the route
  // changes and this effect fires, closing the drawer smoothly.
  useEffect(() => {
    if (isOpen) onClose();
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Prevent body scroll when drawer is open ────────────────
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    // Cleanup on unmount
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleLogout = () => {
    onClose();
    logout();
    navigate('/login', { replace: true });
  };

  const avatarInitial = user?.fullName
    ? user.fullName.charAt(0).toUpperCase()
    : '?';

  // Don't render the DOM at all when closed — saves memory and
  // prevents any CSS transition artifacts on first mount
  if (!isOpen) return null;

  return (
    <>
      {/* ── Backdrop overlay ─────────────────────────────── */}
      {/* Clicking anywhere outside the drawer closes it     */}
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{
          position:        'fixed',
          inset:           0,
          zIndex:          40,
          backgroundColor: 'var(--bg-overlay)',
          // Fade in the backdrop
          animation:       'fadeIn 0.2s ease-out forwards',
        }}
      />

      {/* ── Drawer panel ─────────────────────────────────── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className="animate-slide-in-left"
        style={{
          position:        'fixed',
          top:             0,
          left:            0,
          bottom:          0,
          width:           '280px',
          maxWidth:        '85vw',
          zIndex:          50,
          backgroundColor: 'var(--bg-card)',
          borderRight:     '1px solid var(--border-primary)',
          display:         'flex',
          flexDirection:   'column',
          overflowY:       'auto',
        }}
      >

        {/* ── Drawer Header ──────────────────────────────── */}
        <div style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          padding:        '1rem 1.25rem',
          borderBottom:   '1px solid var(--border-primary)',
          minHeight:      '64px', // matches TopNavbar height
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width:           '30px',
              height:          '30px',
              borderRadius:    '8px',
              backgroundColor: 'var(--accent-primary)',
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'center',
              color:           'var(--text-inverse)',
            }}>
              <StarIcon />
            </div>
            <span style={{
              fontFamily: '"Cormorant Garamond", serif',
              fontSize:   '1.1rem',
              fontWeight: 600,
              color:      'var(--text-primary)',
            }}>
              Understand Deen
            </span>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              padding:         '0.375rem',
              borderRadius:    '8px',
              border:          'none',
              backgroundColor: 'transparent',
              color:           'var(--text-secondary)',
              cursor:          'pointer',
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'center',
              transition:      'background-color 0.15s ease',
            }}
            aria-label="Close menu"
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <CloseIcon />
          </button>
        </div>

        {/* ── User Info Strip ────────────────────────────── */}
        <div style={{
          display:       'flex',
          alignItems:    'center',
          gap:           '0.75rem',
          padding:       '1rem 1.25rem',
          borderBottom:  '1px solid var(--border-secondary)',
          backgroundColor: 'var(--bg-elevated)',
        }}>
          {/* Avatar */}
          <div style={{
            width:           '40px',
            height:          '40px',
            borderRadius:    '50%',
            backgroundColor: 'var(--accent-primary)',
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            color:           'var(--text-inverse)',
            fontFamily:      '"Cormorant Garamond", serif',
            fontSize:        '1.1rem',
            fontWeight:      600,
            flexShrink:      0,
          }}>
            {avatarInitial}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{
              fontFamily:   '"DM Sans", sans-serif',
              fontSize:     '0.875rem',
              fontWeight:   600,
              color:        'var(--text-primary)',
              margin:       0,
              overflow:     'hidden',
              textOverflow: 'ellipsis',
              whiteSpace:   'nowrap',
            }}>
              {user?.fullName || 'Guest'}
            </p>
            <p style={{
              fontFamily:   '"DM Sans", sans-serif',
              fontSize:     '0.75rem',
              color:        'var(--text-muted)',
              margin:       0,
              overflow:     'hidden',
              textOverflow: 'ellipsis',
              whiteSpace:   'nowrap',
            }}>
              {user?.email || ''}
            </p>
          </div>
        </div>

        {/* ── Navigation Links ───────────────────────────── */}
        <nav
          style={{ flex: 1, padding: '0.75rem 0.75rem 0' }}
          aria-label="Mobile navigation"
        >
          {/* Section label */}
          <p style={{
            fontFamily:    '"DM Sans", sans-serif',
            fontSize:      '0.65rem',
            fontWeight:    600,
            color:         'var(--text-muted)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            padding:       '0 0.5rem',
            margin:        '0 0 0.5rem',
          }}>
            Navigation
          </p>

          {/* Main nav links */}
          {NAV_LINKS.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `nav-link${isActive ? ' active' : ''}`
              }
              style={{
                display:      'flex',
                alignItems:   'center',
                gap:          '0.75rem',
                padding:      '0.625rem 0.75rem',
                marginBottom: '0.125rem',
                borderRadius: '10px',
                fontFamily:   '"DM Sans", sans-serif',
                fontSize:     '0.9rem',
                width:        '100%',
                textDecoration: 'none',
              }}
            >
              <span style={{ fontSize: '1rem', lineHeight: 1 }}>{icon}</span>
              {label}
            </NavLink>
          ))}

          {/* Divider between main nav and utilities */}
          <div style={{
            height:          '1px',
            backgroundColor: 'var(--border-secondary)',
            margin:          '0.75rem 0.5rem',
          }} />

          {/* Profile link */}
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `nav-link${isActive ? ' active' : ''}`
            }
            style={{
              display:      'flex',
              alignItems:   'center',
              gap:          '0.75rem',
              padding:      '0.625rem 0.75rem',
              marginBottom: '0.125rem',
              borderRadius: '10px',
              fontFamily:   '"DM Sans", sans-serif',
              fontSize:     '0.9rem',
              width:        '100%',
              textDecoration: 'none',
            }}
          >
            <UserIcon />
            Profile
          </NavLink>
        </nav>

        {/* ── Bottom: Date + Logout ──────────────────────── */}
        <div style={{
          padding:      '0.75rem',
          borderTop:    '1px solid var(--border-primary)',
          marginTop:    'auto',
        }}>
          {/* Date display */}
          <div style={{
            backgroundColor: 'var(--bg-elevated)',
            borderRadius:    '10px',
            padding:         '0.625rem 0.75rem',
            marginBottom:    '0.5rem',
          }}>
            <p style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize:   '0.7rem',
              color:      'var(--gold)',
              fontWeight: 500,
              margin:     '0 0 0.125rem',
            }}>
              {getHijriDate()}
            </p>
            <p style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize:   '0.65rem',
              color:      'var(--text-muted)',
              margin:     0,
            }}>
              {getSolarDate()}
            </p>
          </div>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            style={{
              display:         'flex',
              alignItems:      'center',
              gap:             '0.5rem',
              width:           '100%',
              padding:         '0.625rem 0.75rem',
              borderRadius:    '10px',
              border:          'none',
              backgroundColor: 'transparent',
              color:           '#ef4444', // red — consistent across themes for danger action
              fontFamily:      '"DM Sans", sans-serif',
              fontSize:        '0.875rem',
              fontWeight:      500,
              cursor:          'pointer',
              transition:      'background-color 0.15s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.08)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <LogoutIcon />
            Log out
          </button>
        </div>

      </div>
    </>
  );
};

export default MobileDrawer;
