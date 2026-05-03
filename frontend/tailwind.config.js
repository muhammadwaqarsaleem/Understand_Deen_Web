// =============================================================
// tailwind.config.js — Understand Deen
// =============================================================
// Key decisions documented here for future developers:
//
// 1. darkMode: 'class'
//    Tailwind's dark mode is triggered by a class on <html>, NOT
//    by OS preference (media query). This is required because we
//    support THREE themes (Light, Dark, Sepia), and OS preference
//    only covers two states. ThemeContext.jsx adds/removes the
//    'dark' or 'sepia' class on <html>.
//
// 2. CSS Variable Bridge
//    All semantic color tokens (--bg-primary, --text-primary, etc.)
//    are defined as CSS custom properties in index.css.
//    We expose them here as Tailwind utilities (e.g., bg-theme-base,
//    text-theme-primary) so you can write:
//      <div className="bg-theme-base text-theme-primary">
//    and the correct color automatically applies in all 3 themes.
//
// 3. Hard-coded Brand Colors
//    'deen', 'gold', 'parchment' palettes are static — they don't
//    change between themes. Use these for brand elements (logos,
//    buttons, icons). Use CSS-variable-based tokens for content
//    backgrounds and text that must adapt to the theme.
//
// 4. Font families
//    Three fonts are pre-loaded in index.html via Google Fonts:
//      - 'Cormorant Garamond' → font-display (headings, titles)
//      - 'DM Sans'            → font-body (UI text, labels)
//      - 'Amiri'              → font-arabic (Quranic text, Hadith)
// =============================================================

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  // REQUIRED: enables .dark class strategy on <html>
  // ThemeContext.jsx also adds a .sepia class — handled via index.css
  darkMode: 'class',

  theme: {
    extend: {

      // ── Brand color palettes (static, theme-independent) ──
      colors: {
        // Primary Islamic green — used for brand elements
        deen: {
          50:  '#f0fdf8',
          100: '#dcfcef',
          200: '#bbf7e0',
          300: '#86efca',
          400: '#4adea8',
          500: '#22c58c',
          600: '#14a374',
          700: '#12825d',
          800: '#13674b',  // PRIMARY — buttons, active nav, hero banners
          900: '#115540',
          950: '#052e22',
        },

        // Gold — for Hijri dates, Arabic labels, premium accents
        gold: {
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },

        // Parchment — Light mode background scale
        parchment: {
          50:  '#fdfcf8',
          100: '#faf7ef',
          200: '#f4edd8',
          300: '#ebe0c0',
        },

        // Sepia-specific warm tones
        sepia: {
          50:  '#fdf8f0',
          100: '#faefd8',
          200: '#f2dbb0',
          300: '#e8c47a',
          400: '#c8914a',
          500: '#a0622a',
          600: '#7a4a1e',
          700: '#5c3616',
          800: '#3d2410',
          900: '#1e1208',
        },

        // ── CSS Variable Bridge ──────────────────────────────
        // These colors map to CSS custom properties defined in
        // index.css. They automatically adapt to the active theme
        // (Light / Dark / Sepia) by reading the current variable.
        //
        // Usage: bg-theme-base, text-theme-primary, border-theme, etc.
        theme: {
          base:       'var(--bg-primary)',
          card:       'var(--bg-card)',
          elevated:   'var(--bg-elevated)',
          input:      'var(--bg-input)',
          border:     'var(--border-primary)',
          'border-2': 'var(--border-secondary)',
        },

        // Text colors that adapt to theme
        content: {
          primary:   'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted:     'var(--text-muted)',
          inverse:   'var(--text-inverse)',
        },
      },

      // ── Typography ────────────────────────────────────────
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        body:    ['"DM Sans"', 'system-ui', 'sans-serif'],
        // font-arabic is used for all Arabic script rendering
        // The actual font-face changes with ArabicScript preference
        // (Uthmanic vs Naskh) — handled via CSS class in Profile step
        arabic:  ['"Amiri"', '"Traditional Arabic"', 'serif'],
      },

      // ── Spacing ───────────────────────────────────────────
      // Additional spacing values for layout components
      spacing: {
        '18':  '4.5rem',
        '22':  '5.5rem',
        '72':  '18rem',
        '84':  '21rem',
        '96':  '24rem',
        '112': '28rem',
        '128': '32rem',
      },

      // ── Border radius ─────────────────────────────────────
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },

      // ── Animations ───────────────────────────────────────
      // Used on page mounts (fade-in-up) and banners (fade-in)
      animation: {
        'fade-in-up':     'fadeInUp 0.5s ease-out forwards',
        'fade-in':        'fadeIn 0.4s ease-out forwards',
        'slide-in':       'slideIn 0.4s ease-out forwards', // Kept from your original code
        'slide-in-left':  'slideInLeft 0.35s ease-out forwards',
        'slide-in-right': 'slideInRight 0.35s ease-out forwards',
        'scale-in':       'scaleIn 0.3s ease-out forwards',
        'pulse-soft':     'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: { // Kept from your original code
          '0%':   { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInLeft: {
          '0%':   { opacity: '0', transform: 'translateX(-16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%':   { opacity: '0', transform: 'translateX(16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%':   { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.6' },
        },
      },

      // ── Background Images ─────────────────────────────────
      // Kept from original to prevent breaking Deliverable 2 backgrounds
      backgroundImage: {
        'geometric': "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.06'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
      },

      // ── Screen breakpoints ────────────────────────────────
      // Default Tailwind breakpoints are fine; adding 'xs' for
      // very small phones and '3xl' for ultra-wide monitors
      screens: {
        'xs':  '375px',
        '3xl': '1920px',
      },

      // ── Box shadows ───────────────────────────────────────
      // Semantic shadows for cards and elevated elements
      boxShadow: {
        'card':       '0 2px 12px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 8px 24px rgba(0, 0, 0, 0.10)',
        'modal':      '0 24px 64px rgba(0, 0, 0, 0.16)',
        'nav':        '0 1px 0 var(--border-primary)',
        'inner-sm':   'inset 0 1px 3px rgba(0, 0, 0, 0.08)',
      },
    },
  },

  plugins: [],
};