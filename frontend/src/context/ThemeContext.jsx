// =============================================================
// context/ThemeContext.jsx
// Understand Deen — Global Theme Manager
// =============================================================
// Responsibility:
//   - Tracks the active theme: 'Light' | 'Dark' | 'Sepia'
//   - Applies the corresponding class ('dark' | 'sepia') to <html>
//   - Persists the user's choice to localStorage (key: 'ud_theme')
//   - On startup, hydrates from localStorage (or defaults to 'Light')
//   - Exposes useTheme() hook for any component to read/change theme
//
// How theming works in this app:
//   - Tailwind's `darkMode: 'class'` is enabled in tailwind.config.js
//   - index.css defines CSS custom properties (--bg-primary etc.)
//     under :root (Light), html.dark (Dark), and html.sepia (Sepia)
//   - Components use Tailwind utility classes that reference these
//     CSS variables, so changing the class on <html> re-themes the
//     entire app instantly with no re-render of the whole tree.
//
// Usage in any component:
//   const { theme, setTheme, isDark, isSepia } = useTheme();
// =============================================================

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';

// ── Constants ─────────────────────────────────────────────────
const VALID_THEMES   = ['Light', 'Dark', 'Sepia'];
const STORAGE_KEY    = 'ud_theme';
const DEFAULT_THEME  = 'Light';

// Maps our theme names to the CSS class applied on <html>
// 'Light' needs no class because :root already defines Light variables
const THEME_CLASS_MAP = {
  Light: '',
  Dark:  'dark',
  Sepia: 'sepia',
};

// ── Context creation ──────────────────────────────────────────
const ThemeContext = createContext(null);

// ── Helper: apply theme class to <html> ──────────────────────
// Removes all theme classes first, then adds the new one.
// This ensures we never have conflicting classes like "dark sepia".
const applyThemeToDOM = (theme) => {
  const htmlEl = document.documentElement;

  // Remove any previously applied theme classes
  Object.values(THEME_CLASS_MAP).forEach((cls) => {
    if (cls) htmlEl.classList.remove(cls);
  });

  // Apply the new theme class (empty string = Light, no class needed)
  const newClass = THEME_CLASS_MAP[theme];
  if (newClass) htmlEl.classList.add(newClass);
};

// ── Provider component ────────────────────────────────────────
export const ThemeProvider = ({ children }) => {
  // Initialize from localStorage, fall back to 'Light'
  const [theme, setThemeState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return VALID_THEMES.includes(saved) ? saved : DEFAULT_THEME;
  });

  // Whenever theme state changes, sync to DOM and localStorage
  useEffect(() => {
    applyThemeToDOM(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  // Also apply on first mount (handles SSR hydration edge cases
  // and ensures the class is present before any paint)
  useEffect(() => {
    applyThemeToDOM(theme);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Public setter — validates the value before applying
  const setTheme = useCallback((newTheme) => {
    if (!VALID_THEMES.includes(newTheme)) {
      console.warn(`[ThemeContext] Invalid theme: "${newTheme}". Use 'Light', 'Dark', or 'Sepia'.`);
      return;
    }
    setThemeState(newTheme);
  }, []);

  // Convenience booleans so components don't need string comparisons
  const isDark  = theme === 'Dark';
  const isSepia = theme === 'Sepia';
  const isLight = theme === 'Light';

  const value = {
    theme,       // 'Light' | 'Dark' | 'Sepia'
    setTheme,    // (theme: string) => void
    isDark,      // boolean
    isSepia,     // boolean
    isLight,     // boolean
    validThemes: VALID_THEMES, // useful for rendering a theme picker
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// ── Custom hook ───────────────────────────────────────────────
/**
 * useTheme()
 * Must be called inside a component wrapped by <ThemeProvider>.
 * Returns: { theme, setTheme, isDark, isSepia, isLight, validThemes }
 */
export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('[useTheme] Must be used inside <ThemeProvider>. Check your App.jsx wrapping.');
  }
  return ctx;
};

export default ThemeContext;
