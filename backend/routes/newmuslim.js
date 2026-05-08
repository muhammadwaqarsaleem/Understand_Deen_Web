/**
 * backend/routes/newmuslim.js
 *
 * New Muslim Guided Progress Tracker API.
 *
 * This module is intentionally self-contained: the 8 Islamic fundamentals
 * are defined here as a constant (SECTION_METADATA) rather than stored in
 * the DB. These sections are permanent curriculum — they will never change
 * at runtime, so a DB table would add complexity with zero benefit.
 *
 * ENDPOINTS:
 *   GET  /api/newmuslim/sections          → Static section metadata (no DB)
 *   GET  /api/newmuslim/progress          → This user's completion rows
 *   POST /api/newmuslim/progress/toggle   → Upsert / flip IsCompleted for a section
 *
 * UPSERT PATTERN (two-step SELECT → INSERT or UPDATE):
 *   We avoid SQL Server's MERGE statement because it has known race-condition
 *   edge cases and requires more boilerplate. The two-step approach is safer
 *   for a single-user-per-request auth model like ours:
 *     Step 1: SELECT the row.
 *     Step 2a: Row exists → UPDATE, flip IsCompleted.
 *     Step 2b: Row missing → INSERT with IsCompleted = 1 (first toggle = complete).
 *   The UNIQUE constraint on (UserID, SectionName) guarantees consistency.
 *
 * AUTH:
 *   All routes require a valid JWT. userId is extracted from req.user.userId
 *   (set by requireAuth from the decoded JWT payload: { userId, email, role }).
 */

const express = require('express');
const router  = express.Router();
const sql     = require('mssql/msnodesqlv8');
const jwt     = require('jsonwebtoken');
const { getPool } = require('../db');

// ─────────────────────────────────────────────────────────────────────────────
// SECTION METADATA — 8 Islamic Fundamentals
// ─────────────────────────────────────────────────────────────────────────────
/**
 * SECTION_METADATA
 *
 * The canonical list of 8 Islamic fundamentals for new Muslims.
 * The `name` field is the SectionName stored in the DB — it MUST match
 * the UNIQUE constraint key exactly (case-sensitive VARCHAR(100)).
 *
 * This same structure is mirrored as a local constant in NewMuslim.jsx
 * so the frontend doesn't need an extra API call just for static text.
 * If section content ever changes, update BOTH files.
 */
const SECTION_METADATA = [
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
    description : 'Hajj is obligatory once in a lifetime for every Muslim who is physically and financially able, performed during Dhul Hijjah, the final month of the Islamic calendar. Its rituals — Tawaf, Sa\'i, standing at Arafat, and the symbolic stoning of Shaytan — commemorate the trials of Prophet Ibrahim (AS) and his family. Hajj is Islam\'s greatest equalizer, uniting millions of Muslims in identical white garments regardless of nationality, race, or social status.'
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
    description : 'Islam provides a comprehensive ethical framework distinguishing what is permissible (Halal) from what is prohibited (Haram) in food, drink, business dealings, and daily conduct. Key dietary prohibitions include pork, blood, carrion, and intoxicants, while all other foods are permissible by default (Halal) unless explicitly prohibited. Understanding these fundamentals allows new Muslims to navigate modern life — restaurants, finance, relationships — in alignment with Islamic principles.'
  },
  {
    name        : 'Purification & Cleanliness (Taharah)',
    emoji       : '💧',
    title       : 'Purification & Cleanliness',
    subtitle    : 'Taharah — الطَّهَارَة',
    description : 'Taharah (ritual purity) is a prerequisite for core acts of worship: Salah, touching the Quran, and Tawaf all require it. It includes Wudu (minor ablution before prayer), Ghusl (full body washing after major impurity), and Tayammum (dry ablution with clean earth when water is unavailable or harmful). The Prophet ﷺ said: "Cleanliness is half of faith" (Sahih Muslim 223), emphasizing that physical purity reflects and cultivates spiritual purity.'
  },
];

// A Set for O(1) validation of incoming sectionName from POST requests
const VALID_SECTION_NAMES = new Set(SECTION_METADATA.map(s => s.name));

// ─────────────────────────────────────────────────────────────────────────────
// JWT AUTH MIDDLEWARE
// ─────────────────────────────────────────────────────────────────────────────
/**
 * requireAuth
 * Identical pattern to quran.js and hadith.js. Decodes the Bearer token
 * and attaches { userId, email, role } to req.user.
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/newmuslim/sections
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Returns the full static metadata for all 8 sections.
 * No DB query. Auth still required to prevent unauthenticated scraping.
 *
 * The frontend mirrors SECTION_METADATA as a local constant to avoid
 * an extra network round-trip on page load. This endpoint exists as a
 * source-of-truth reference and for potential future clients (mobile apps).
 */
router.get('/sections', requireAuth, (req, res) => {
  res.json({ sections: SECTION_METADATA });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/newmuslim/progress
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Fetches all progress rows for the authenticated user.
 *
 * WHY RETURN EMPTY ARRAY ON FIRST VISIT (no error)?
 *   A user who has never interacted with this page has zero rows in
 *   NewMuslim_Progress. This is not an error — it just means every section
 *   defaults to IsCompleted = false on the frontend. Returning [] lets the
 *   frontend render all 8 cards correctly in their uncompleted state.
 *
 * IsCompleted normalization:
 *   mssql returns SQL BIT as JS boolean (true/false). We normalize to ensure
 *   consistent behavior regardless of driver version.
 */
router.get('/progress', requireAuth, async (req, res) => {
  const userId = req.user.userId;

  try {
    const pool = await getPool();

    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT
          SectionName,
          IsCompleted,
          LastToggled
        FROM  NewMuslim_Progress
        WHERE UserID = @userId
      `);

    // Normalize IsCompleted to boolean for clean frontend consumption
    const progress = result.recordset.map(row => ({
      sectionName  : row.SectionName,
      isCompleted  : row.IsCompleted === true || row.IsCompleted === 1,
      lastToggled  : row.LastToggled ? row.LastToggled.toISOString() : null,
    }));

    res.json({ progress });

  } catch (err) {
    console.error('[GET /api/newmuslim/progress] DB error:', err.message);
    res.status(500).json({ error: 'Failed to fetch progress.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/newmuslim/progress/toggle
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Upserts a progress row for a single section, flipping IsCompleted.
 *
 * REQUEST BODY: { sectionName: string }
 *
 * LOGIC:
 *   1. Validate sectionName against VALID_SECTION_NAMES (prevents arbitrary
 *      strings being written into the DB, even with a valid JWT).
 *   2. SELECT the existing row.
 *   3a. Row exists → UPDATE: flip IsCompleted (1→0, 0→1), set LastToggled.
 *   3b. Row missing → INSERT: IsCompleted = 1 (first tap = complete),
 *      LastToggled = GETDATE().
 *   4. SELECT the row again and return it for UI state sync.
 *
 * RESPONSE: { sectionName, isCompleted, lastToggled }
 *
 * WHY NOT SQL SERVER MERGE?
 *   MERGE has documented race-condition edge cases in high-concurrency
 *   environments and is more verbose for simple upserts. Our users are
 *   authenticated individuals toggling personal rows — a two-step
 *   SELECT+UPDATE/INSERT is clearer, safer, and easier to debug.
 */
router.post('/progress/toggle', requireAuth, async (req, res) => {
  const userId      = req.user.userId;
  const { sectionName } = req.body;

  // ── Validation ────────────────────────────────────────────────────────────
  if (!sectionName || typeof sectionName !== 'string') {
    return res.status(400).json({ error: 'sectionName is required.' });
  }

  if (!VALID_SECTION_NAMES.has(sectionName)) {
    return res.status(400).json({
      error: `"${sectionName}" is not a valid section name.`
    });
  }

  try {
    const pool = await getPool();

    // ── Step 1: Check if a row already exists ─────────────────────────────
    const existingResult = await pool.request()
      .input('userId',      sql.Int,         userId)
      .input('sectionName', sql.VarChar(100), sectionName)
      .query(`
        SELECT ProgressID, IsCompleted
        FROM   NewMuslim_Progress
        WHERE  UserID      = @userId
          AND  SectionName = @sectionName
      `);

    const existing = existingResult.recordset[0];

    if (existing) {
      // ── Step 2a: Row exists → flip IsCompleted ───────────────────────────
      // CASE expression: if currently 1, set to 0; if 0, set to 1.
      await pool.request()
        .input('userId',      sql.Int,         userId)
        .input('sectionName', sql.VarChar(100), sectionName)
        .query(`
          UPDATE NewMuslim_Progress
          SET    IsCompleted = CASE WHEN IsCompleted = 1 THEN 0 ELSE 1 END,
                 LastToggled = GETDATE()
          WHERE  UserID      = @userId
            AND  SectionName = @sectionName
        `);
    } else {
      // ── Step 2b: No row yet → INSERT with IsCompleted = 1 ───────────────
      // First tap on a section always marks it complete (positive UX framing).
      await pool.request()
        .input('userId',      sql.Int,         userId)
        .input('sectionName', sql.VarChar(100), sectionName)
        .query(`
          INSERT INTO NewMuslim_Progress (UserID, SectionName, IsCompleted, LastToggled)
          VALUES (@userId, @sectionName, 1, GETDATE())
        `);
    }

    // ── Step 3: Fetch and return the authoritative updated row ────────────
    const updatedResult = await pool.request()
      .input('userId',      sql.Int,         userId)
      .input('sectionName', sql.VarChar(100), sectionName)
      .query(`
        SELECT SectionName, IsCompleted, LastToggled
        FROM   NewMuslim_Progress
        WHERE  UserID      = @userId
          AND  SectionName = @sectionName
      `);

    const row = updatedResult.recordset[0];

    res.json({
      sectionName : row.SectionName,
      isCompleted : row.IsCompleted === true || row.IsCompleted === 1,
      lastToggled : row.LastToggled ? row.LastToggled.toISOString() : null,
    });

  } catch (err) {
    console.error('[POST /api/newmuslim/progress/toggle] DB error:', err.message);
    res.status(500).json({ error: 'Failed to toggle progress.' });
  }
});

module.exports = router;