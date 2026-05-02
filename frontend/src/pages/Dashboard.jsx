// =============================================================
// pages/Dashboard.jsx
// Protected page — only accessible with a valid JWT
// Acts as the central hub / dummy profile page for Deliverable 2
// =============================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// ---- Icon components (inline SVG, no library needed) ----
const ModuleCard = ({ icon, title, description, tag, comingSoon = false }) => (
  <div className={`relative rounded-2xl border p-5 transition-all duration-200 ${comingSoon ? 'border-stone-200 bg-white/60 opacity-70' : 'border-stone-200 bg-white hover:border-deen-300 hover:shadow-md hover:-translate-y-0.5 cursor-pointer'}`}>
    {comingSoon && (
      <span className="absolute top-3 right-3 text-[10px] font-body font-medium text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">
        Coming Soon
      </span>
    )}
    <div className="text-3xl mb-3">{icon}</div>
    <h3 className="font-display text-stone-800 text-lg font-semibold mb-1">{title}</h3>
    <p className="text-stone-500 text-sm font-body leading-relaxed">{description}</p>
    {tag && (
      <span className="inline-block mt-3 text-xs font-body font-medium text-deen-700 bg-deen-50 border border-deen-200 px-2.5 py-1 rounded-full">
        {tag}
      </span>
    )}
  </div>
);

const StatBadge = ({ value, label }) => (
  <div className="text-center px-4 py-3 rounded-xl bg-white border border-stone-200">
    <p className="font-display text-deen-800 text-2xl font-semibold">{value}</p>
    <p className="text-stone-500 text-xs font-body mt-0.5">{label}</p>
  </div>
);

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Retrieve user from localStorage (set during login/signup)
    const stored = localStorage.getItem('ud_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        // Malformed data — log out
        handleLogout();
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('ud_token');
    localStorage.removeItem('ud_user');
    navigate('/login', { replace: true });
  };

  // Greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Format join date
  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const modules = [
    {
      icon: '📖',
      title: 'Quran',
      description: 'Browse all 114 Surahs with Arabic text, English translation, and verse-by-verse navigation.',
      tag: 'Full Arabic & English',
    },
    {
      icon: '📜',
      title: 'Ahadith',
      description: 'Search authenticated Hadith with International Numbering for academic citations.',
      tag: 'Verified References',
    },
    {
      icon: '⚖️',
      title: 'Comparative Fiqh',
      description: 'Compare rulings across all 4 Madhabs side by side, with full source evidence.',
      tag: '4 Madhabs',
    },
    {
      icon: '✅',
      title: 'Habit Tracker',
      description: 'Track daily prayers and Azkar with 1-tap logging. Celebrate streaks, never punish breaks.',
      tag: 'Guilt-Free Design',
    },
    {
      icon: '🌱',
      title: 'Fresh Muslims',
      description: 'A safe, simplified space with only universally agreed-upon Islamic fundamentals.',
      tag: 'Safe Space Mode',
      comingSoon: true,
    },
    {
      icon: '🔖',
      title: 'My Bookmarks',
      description: 'All your saved Ayat, Hadith, and Fiqh rulings in one organized personal library.',
      comingSoon: true,
    },
  ];

  return (
    <div className="min-h-screen bg-parchment-50 font-body">

      {/* ======================================================
          NAVBAR
          ====================================================== */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-deen-800 flex items-center justify-center text-white text-sm">
              ☽
            </div>
            <span className="font-display text-deen-900 text-lg font-semibold tracking-wide">
              Understand Deen
            </span>
          </div>

          {/* User menu */}
          <div className="flex items-center gap-3">
            {user?.role === 'Admin' && (
              <span className="text-xs font-body font-semibold text-gold-700 bg-gold-100 border border-gold-300 px-2.5 py-1 rounded-full">
                Admin
              </span>
            )}
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-stone-800 leading-none">{user?.fullName}</p>
              <p className="text-xs text-stone-400 mt-0.5">{user?.email}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-deen-800 flex items-center justify-center text-white font-display text-sm font-semibold">
              {user?.fullName ? user.fullName[0].toUpperCase() : '?'}
            </div>
            <button
              onClick={handleLogout}
              className="ml-1 text-sm font-body font-medium text-stone-500 hover:text-red-600 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-red-50"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">

        {/* ======================================================
            WELCOME HERO SECTION
            ====================================================== */}
        <div className="rounded-2xl islamic-pattern p-8 mb-8 relative overflow-hidden animate-fade-in-up">
          <div className="relative z-10">
            <p className="font-arabic text-white/60 text-xl mb-3" dir="rtl">
              اَلسَّلَامُ عَلَيْكُمْ
            </p>
            <h1 className="font-display text-white text-3xl md:text-4xl font-semibold mb-2">
              {getGreeting()}, {user?.fullName?.split(' ')[0] || 'Friend'}.
            </h1>
            <p className="text-white/65 font-body text-sm md:text-base max-w-lg">
              Your personal Islamic knowledge hub. Explore the modules below — more features are being built to complete your experience.
            </p>
          </div>
          <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full border border-white/[0.08] pointer-events-none" />
          <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full border border-white/[0.08] pointer-events-none" />
        </div>

        {/* ======================================================
            ACCOUNT STATS STRIP
            ====================================================== */}
        <div className="grid grid-cols-3 sm:grid-cols-3 gap-3 mb-8 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <StatBadge value={user?.role || 'User'} label="Account Role" />
          <StatBadge value="0"                    label="Bookmarks" />
          <StatBadge value={formatDate(user?.createdAt)} label="Member Since" />
        </div>

        {/* ======================================================
            PROFILE CARD
            ====================================================== */}
        <section className="mb-8 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
          <h2 className="font-display text-stone-800 text-2xl font-semibold mb-4">
            Your Profile
          </h2>
          <div className="bg-white rounded-2xl border border-stone-200 p-6">
            <div className="flex items-start gap-5">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-2xl bg-deen-800 flex items-center justify-center text-white font-display text-2xl font-semibold shrink-0">
                {user?.fullName ? user.fullName[0].toUpperCase() : '?'}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-stone-900 text-xl font-semibold truncate">
                  {user?.fullName || '—'}
                </h3>
                <p className="text-stone-500 text-sm font-body mt-0.5 truncate">{user?.email || '—'}</p>

                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="text-xs font-body font-medium text-deen-700 bg-deen-50 border border-deen-200 px-2.5 py-1 rounded-full">
                    {user?.role || 'User'}
                  </span>
                  <span className="text-xs font-body font-medium text-stone-500 bg-stone-100 border border-stone-200 px-2.5 py-1 rounded-full">
                    Member since {formatDate(user?.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================
            MODULES GRID
            ====================================================== */}
        <section className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-stone-800 text-2xl font-semibold">
              Explore Modules
            </h2>
            <span className="text-xs font-body text-stone-400">
              Deliverable 2 — More coming next sprint
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {modules.map((mod) => (
              <ModuleCard key={mod.title} {...mod} />
            ))}
          </div>
        </section>

        {/* ======================================================
            FOOTER NOTE
            ====================================================== */}
        <p className="text-center text-stone-400 text-xs font-body mt-12 pb-6">
          Understand Deen · BCS-6A University Project · Deliverable 2 Complete ✓
        </p>

      </main>
    </div>
  );
}
