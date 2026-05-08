/**
 * frontend/src/pages/NewMuslim.jsx
 *
 * New Muslim Guided Progress Tracker — mounted at /new-muslim inside AppLayout.
 *
 * ── PAGE ARCHITECTURE ────────────────────────────────────────────────────────
 *
 * Unlike Quran.jsx and Hadith.jsx, this page does NOT use a split-pane
 * layout with height: calc(100vh - 64px). It is a standard scrollable page
 * because all 8 section cards must be visible in a grid — there is no
 * "master list + detail reader" pattern here.
 *
 * AppLayout already handles the outer scroll context. This page renders
 * inside that flow naturally.
 *
 * ── DATA FLOW ────────────────────────────────────────────────────────────────
 *
 * 1. On mount: fetch GET /api/newmuslim/progress → array of DB rows.
 * 2. Build progressMap: { [sectionName]: { isCompleted, lastToggled } }
 * for O(1) lookup when rendering each SectionCard.
 * 3. Pass each SectionCard its `section` (from local SECTIONS constant)
 * and its `progress` (from progressMap — null if no DB row yet).
 *
 * ── OPTIMISTIC TOGGLE ────────────────────────────────────────────────────────
 *
 * When a user taps a card, we:
 * 1. Save the current progress array as `prevProgress` (revert snapshot).
 * 2. Immediately flip IsCompleted in local state (UI feels instant).
 * 3. POST to the backend.
 * 4a. On success: sync local state with authoritative server response.
 * 4b. On error: restore prevProgress (silent revert — card flips back).
 *
 * WHY OPTIMISTIC?
 * The DB operation is fast (index lookup + BIT update), so errors are
 * rare. Optimistic UX feels immediate — no spinner delay for a tap.
 * The revert is a safety net, not the expected path.
 *
 * ── LOCAL SECTIONS CONSTANT ──────────────────────────────────────────────────
 *
 * We mirror SECTION_METADATA from routes/newmuslim.js here as a local
 * constant. This saves one API call and makes the page load faster.
 * If section content ever changes, update BOTH files.
 * The `name` field MUST match the DB SectionName exactly (VARCHAR(100)).
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useApp } from '../context/AppContext.jsx';
import ProgressHeader from '../components/newmuslim/ProgressHeader.jsx';
import SectionCard    from '../components/newmuslim/SectionCard.jsx';

// ── Local Sections Constant (mirrors backend SECTION_METADATA) ───────────────
/**
 * SECTIONS
 * Frontend copy of the 8 Islamic fundamentals metadata.
 * The `name` field is the exact DB VARCHAR(100) key used in NewMuslim_Progress.
 * Order here determines card grid order — matches the canonical learning path.
 */
const SECTIONS = [
  {
    name        : 'Declaration of Faith (Shahada)',
    emoji       : '☝️',
    title       : 'Declaration of Faith',
    subtitle    : 'Shahada — الشَّهَادَة',
    description : 'The Shahada — "There is no god but Allah, and Muhammad ﷺ is His messenger" — is the first and most fundamental pillar of Islam. Uttering it with sincere belief and understanding is the gateway into the faith. It encapsulates Tawheed (monotheism) and acceptance of Prophethood, the twin foundations upon which all other Islamic practice rests.'
  },
  {
    name        : 'The Five Daily Prayers (Salah)',
    emoji       : '🕌',
    title       : 'The Five Daily Prayers',
    subtitle    : 'Salah — الصَّلَاة',
    description : 'Salah is performed five times daily (Fajr, Dhuhr, Asr, Maghrib, Isha) and is the most consistent act of worship in Islam — the Prophet ﷺ described it as "the pillar of the religion." Each prayer requires ritual purity (Wudu) and involves recitation of Quranic verses while facing the Qiblah in Mecca. It is a direct, recurring conversation between the servant and Allah.'
  },
  {
    name        : 'Obligatory Charity (Zakah)',
    emoji       : '💛',
    title       : 'Obligatory Charity',
    subtitle    : 'Zakah — الزَّكَاة',
    description : 'Zakah is an annual obligation of 2.5% of accumulated wealth above the Nisab (minimum threshold), distributed to eight categories of recipients defined in the Quran (9:60). It purifies one\'s wealth and cultivates generosity, simultaneously reducing economic inequality within the Muslim community. Zakah only applies to those whose wealth has remained above the Nisab for a complete lunar year.'
  },
  {
    name        : 'Fasting in Ramadan (Sawm)',
    emoji       : '🌙',
    title       : 'Fasting in Ramadan',
    subtitle    : 'Sawm — الصَّوْم',
    description : 'Muslims fast from dawn (Fajr) to sunset throughout Ramadan — the month in which the Quran was first revealed — abstaining from food, drink, and marital relations. Fasting is a practice of spiritual discipline, gratitude, and empathy for those who are hungry year-round. Within Ramadan, the odd nights of the last ten days conceal Laylat al-Qadr (Night of Power), described in the Quran as "better than a thousand months."'
  },
  {
    name        : 'Pilgrimage to Mecca (Hajj)',
    emoji       : '🕋',
    title       : 'Pilgrimage to Mecca',
    subtitle    : 'Hajj — الحَجّ',
    description : 'Hajj is obligatory once in a lifetime for every Muslim who is physically and financially able, performed during Dhul Hijjah, the final month of the Islamic calendar. Its rituals — Tawaf, Sa\'i, standing at Arafat, and the symbolic stoning of Shaytan — commemorate the trials of Prophet Ibrahim (AS) and his family. Hajj is Islam\'s greatest equalizer, uniting millions in identical white garments regardless of nationality, race, or social status.'
  },
  {
    name        : 'Islamic Beliefs (Aqeedah)',
    emoji       : '📖',
    title       : 'Islamic Beliefs',
    subtitle    : 'Aqeedah — العَقِيدَة',
    description : 'Aqeedah (Islamic creed) encompasses the six pillars of Iman: belief in Allah, His angels, His revealed books, His messengers, the Day of Judgment, and divine decree (Qadr — both its good and its harm). Understanding Aqeedah is foundational because outward acts of worship are only accepted when built upon sound belief. The study of Aqeedah equips Muslims to recognize and avoid theological innovations (Bid\'ah) and deviations in faith.'
  },
  {
    name        : 'Halal & Haram Basics',
    emoji       : '✅',
    title       : 'Halal & Haram Basics',
    subtitle    : 'الحَلَال وَالحَرَام',
    description : 'Islam provides a comprehensive ethical framework distinguishing what is permissible (Halal) from what is prohibited (Haram) in food, drink, business dealings, and daily conduct. Key dietary prohibitions include pork, blood, carrion, and intoxicants, while all other foods are permissible by default unless explicitly prohibited. Understanding these fundamentals allows new Muslims to navigate modern life — restaurants, finance, relationships — in alignment with Islamic principles.'
  },
  {
    name        : 'Purification & Cleanliness (Taharah)',
    emoji       : '💧',
    title       : 'Purification & Cleanliness',
    subtitle    : 'Taharah — الطَّهَارَة',
    description : 'Taharah (ritual purity) is a prerequisite for core acts of worship: Salah, touching the Quran, and Tawaf all require it. It includes Wudu (minor ablution before prayer), Ghusl (full body washing after major impurity), and Tayammum (dry ablution with clean earth when water is unavailable). The Prophet ﷺ said: "Cleanliness is half of faith" (Sahih Muslim 223), emphasizing that physical purity reflects and cultivates spiritual purity.'
  },
];

// ─────────────────────────────────────────────────────────────────────────────
const NewMuslim = () => {
  const { getToken } = useApp();

  // ── State ─────────────────────────────────────────────────────────────────
  const [progress, setProgress] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  // ── Fetch Progress on Mount ───────────────────────────────────────────────
  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const { data } = await axios.get('/api/newmuslim/progress', {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        setProgress(data.progress);
      } catch (err) {
        console.error('[NewMuslim] Fetch error:', err.message);
        setError('Could not load your progress. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Derived Data ──────────────────────────────────────────────────────────
  const progressMap = {};
  progress.forEach(p => { progressMap[p.sectionName] = p; });

  const completedCount = progress.filter(p => p.isCompleted).length;

  // ── Optimistic Toggle Handler ─────────────────────────────────────────────
  const handleToggle = async (sectionName) => {
    const prevProgress = progress; // Snapshot for revert

    // ── Step 1: Optimistic update ─────────────────────────────────────────
    const existingRow = progress.find(p => p.sectionName === sectionName);

    if (existingRow) {
      setProgress(prev => prev.map(p =>
        p.sectionName === sectionName
          ? { ...p, isCompleted: !p.isCompleted, lastToggled: new Date().toISOString() }
          : p
      ));
    } else {
      setProgress(prev => [
        ...prev,
        {
          sectionName,
          isCompleted : true,
          lastToggled : new Date().toISOString(),
        }
      ]);
    }

    // ── Step 2: POST to backend ───────────────────────────────────────────
    try {
      const { data } = await axios.post(
        '/api/newmuslim/progress/toggle',
        { sectionName },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );

      setProgress(prev => {
        const rowInState = prev.find(p => p.sectionName === sectionName);
        if (rowInState) {
          return prev.map(p =>
            p.sectionName === sectionName ? { ...p, ...data } : p
          );
        }
        return [...prev, data];
      });

    } catch (err) {
      console.error('[NewMuslim] Toggle error:', err.message);
      setProgress(prevProgress);
    }
  };

  // ── Loading State ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-5xl mx-auto animate-fade-in">
        {/* Header skeleton */}
        <div
          className="rounded-2xl mb-6 animate-pulse"
          style={{ backgroundColor: 'var(--bg-card)', height: '160px' }}
        />
        {/* Card grid skeleton — 8 cards, 2-col on md */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="deen-card animate-pulse"
              style={{ height: '180px', backgroundColor: 'var(--bg-card)' }}
            />
          ))}
        </div>
      </div>
    );
  }

  // ── Error State ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="p-4 md:p-8 max-w-5xl mx-auto flex items-center justify-center min-h-64">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{error}</p>
      </div>
    );
  }

  // ── Main Render ───────────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto animate-fade-in">

      {/* ── Page Heading ────────────────────────────────────────────────── */}
      <div className="mb-2">
        <p
          className="arabic-text arabic-text-xl"
          style={{ color: 'var(--accent-primary)' }}
        >
          دليل المسلم الجديد
        </p>
        <h1
          className="text-2xl font-bold mt-1"
          style={{
            color      : 'var(--text-primary)',
            fontFamily : 'Cormorant Garamond, serif',
          }}
        >
          New Muslim Guide
        </h1>
        <p
          className="text-sm mt-1"
          style={{ color: 'var(--text-muted)' }}
        >
          Eight Islamic fundamentals to guide you on your journey. Tap any card to mark it as completed.
        </p>
      </div>

      {/* ── Progress Header ──────────────────────────────────────────────── */}
      <ProgressHeader
        completed={completedCount}
        total={SECTIONS.length}
      />

      {/* ── Section Cards Grid ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SECTIONS.map((section, i) => (
          <div
            key={section.name}
            className={`animate-fade-in-up ${
              i === 0 ? 'delay-75'  :
              i === 1 ? 'delay-100' :
              i === 2 ? 'delay-150' :
              i === 3 ? 'delay-200' :
              i === 4 ? 'delay-300' :
              i === 5 ? 'delay-400' :
              i === 6 ? 'delay-500' : ''
            }`}
          >
            <SectionCard
              section={section}
              progress={progressMap[section.name] || null}
              onToggle={handleToggle}
            />
          </div>
        ))}
      </div>

      {/* ── Completion celebration message ────────────────────────────────── */}
      {completedCount === SECTIONS.length && (
        <div
          className="mt-6 rounded-2xl p-6 text-center animate-fade-in-up"
          style={{
            backgroundColor : 'var(--accent-light)',
            border          : '2px solid var(--accent-primary)',
          }}
        >
          <p
            className="arabic-text arabic-text-xl mb-2"
            style={{ color: 'var(--accent-primary)' }}
          >
            ﴿ إِنَّ مَعَ الْعُسْرِ يُسْرًا ﴾
          </p>
          <p className="font-bold text-base" style={{ color: 'var(--text-primary)', fontFamily: 'Cormorant Garamond, serif' }}>
            "Indeed, with hardship comes ease." — Al-Inshirah 94:6
          </p>
          <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
            You have completed all 8 Islamic fundamentals. May Allah keep you firm on this path. 🤲
          </p>
        </div>
      )}
    </div>
  );
};

export default NewMuslim;