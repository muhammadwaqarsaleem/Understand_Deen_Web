// =============================================================
// context/AppContext.jsx
// Understand Deen — Global Application State Manager
// =============================================================
// Responsibility:
//   - Holds the currently authenticated user object in React state
//   - On mount, reads 'ud_user' and 'ud_token' from localStorage
//     so the user stays logged in across page refreshes
//   - Exposes useApp() hook for any component to access user state
//   - Provides a logout() function that clears both storage keys
//     and resets state
//   - Holds user preferences (theme, arabicScript) separately from
//     the user identity object, because preferences are loaded from
//     the DB after login (Step 9) but defaulted from localStorage
//     before that route exists
//
// Data shapes:
//   user = {
//     userId    : number,
//     fullName  : string,
//     email     : string,
//     role      : 'User' | 'Admin',
//     createdAt : string (ISO date)
//   } | null
//
//   preferences = {
//     theme        : 'Light' | 'Dark' | 'Sepia',   (mirrors DB User_Preferences)
//     arabicScript : 'Uthmanic' | 'Naskh'           (mirrors DB User_Preferences)
//   }
//
// Usage in any component:
//   const { user, setUser, logout, isAuthenticated, preferences, setPreferences } = useApp();
//
// IMPORTANT: AppContext does NOT call the backend directly.
//   Login.jsx / Signup.jsx set the token + user in localStorage
//   and call setUser() after a successful API response.
//   This context just provides a single source of truth for that
//   state across the entire component tree.
// =============================================================

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';

// ── Constants ─────────────────────────────────────────────────
const USER_STORAGE_KEY  = 'ud_user';
const TOKEN_STORAGE_KEY = 'ud_token';

const DEFAULT_PREFERENCES = {
  theme:        'Light',
  arabicScript: 'Uthmanic',
};

// ── Context creation ──────────────────────────────────────────
const AppContext = createContext(null);

// ── Helper: safely parse JSON from localStorage ───────────────
const safeParseJSON = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    // Corrupted data — treat as empty
    localStorage.removeItem(key);
    return null;
  }
};

// ── Provider component ────────────────────────────────────────
export const AppProvider = ({ children }) => {

  // Hydrate user from localStorage on first render.
  // If no user is stored (or token is missing), start as null.
  const [user, setUserState] = useState(() => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    const savedUser = safeParseJSON(USER_STORAGE_KEY);
    // Only trust the stored user if there is also a token present
    return token && savedUser ? savedUser : null;
  });

  // Preferences live separately. They'll be overwritten by the
  // DB response in Step 9 (Profile page). Until then, they
  // are read from localStorage (set when user last changed them).
  const [preferences, setPreferencesState] = useState(() => {
    const saved = safeParseJSON('ud_preferences');
    return saved ? { ...DEFAULT_PREFERENCES, ...saved } : DEFAULT_PREFERENCES;
  });

  // ── setUser: called by Login.jsx / Signup.jsx after API success ──
  // Stores the user object in both state and localStorage.
  const setUser = useCallback((newUser) => {
    if (newUser) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
    setUserState(newUser);
  }, []);

  // ── setPreferences: called by Profile page or after DB fetch ──
  // Merges with current preferences (partial updates allowed).
  const setPreferences = useCallback((updates) => {
    setPreferencesState((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem('ud_preferences', JSON.stringify(next));
      return next;
    });
  }, []);

  // ── logout: clears all auth state ──────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    // NOTE: We do NOT clear 'ud_preferences' or 'ud_theme' on logout
    // so the user's visual preferences are remembered next visit.
    setUserState(null);
  }, []);

  // ── Convenience derived values ──────────────────────────────
  const isAuthenticated = user !== null;
  const isAdmin         = user?.role === 'Admin';

  // ── Auth token getter (for Axios headers in future steps) ──
  const getToken = useCallback(() => {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  }, []);

  // ── Sync user state if localStorage changes in another tab ──
  // This handles the edge case where the user logs out in Tab A
  // and Tab B should also reflect that change.
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === TOKEN_STORAGE_KEY && !e.newValue) {
        // Token was removed in another tab → log out this tab too
        setUserState(null);
      }
      if (e.key === USER_STORAGE_KEY && e.newValue) {
        setUserState(safeParseJSON(USER_STORAGE_KEY));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const value = {
    // User identity
    user,             // The user object (see shape above) or null
    setUser,          // (user: object | null) => void
    logout,           // () => void — clears storage + resets state
    isAuthenticated,  // boolean — true if a user is logged in
    isAdmin,          // boolean — true if role === 'Admin'
    getToken,         // () => string | null — JWT for API calls

    // User preferences (theme, script)
    preferences,      // { theme, arabicScript }
    setPreferences,   // (updates: Partial<preferences>) => void
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// ── Custom hook ───────────────────────────────────────────────
/**
 * useApp()
 * Must be called inside a component wrapped by <AppProvider>.
 * Returns the full AppContext value object.
 */
export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('[useApp] Must be used inside <AppProvider>. Check your App.jsx wrapping.');
  }
  return ctx;
};

export default AppContext;
