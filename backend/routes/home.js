// =============================================================
// backend/routes/home.js — Home Page API Routes
// Understand Deen
// =============================================================
// Endpoints:
//   GET /api/home/daily-zikr
//     Returns a deterministic Hadith for today's date.
//     Uses day-of-year modulo to always return the same Hadith
//     for a given calendar date (consistent across users/sessions).
//     Falls back to a hardcoded Zikr if the Ahadith table is empty.
//
// Security: JWT auth middleware is intentionally NOT applied here
//   for now — the Home page Zikr card is visible to all logged-in
//   users and doesn't expose sensitive per-user data.
//   When a proper auth middleware is added in Step 10, slot it in
//   here: router.get('/daily-zikr', authMiddleware, async ...)
// =============================================================

const express        = require('express');
const { sql, getPool } = require('../db');

const router = express.Router();

// ── Fallback Zikr (shown when Ahadith table is empty) ─────────
// This guarantees the Home page always renders something
// meaningful even before the Hadith database is seeded.
const FALLBACK_ZIKR = {
  hadithId:          null,
  arabicText:        'سُبْحَانَ اللهِ وَبِحَمْدِهِ',
  text:              'SubhanAllahi wa bihamdih',
  translation:       'Glory be to Allah and praise be to Him.',
  source:            'Daily Remembrance',
  internationalNumber: null,
  isFallback:        true,  // flag so frontend can style it differently if needed
};

// =============================================================
// GET /api/home/daily-zikr
// =============================================================
// Algorithm:
//   1. Count total Hadiths in the Ahadith table.
//   2. If zero → return the hardcoded fallback immediately.
//   3. Otherwise: compute index = (day_of_year % total_count) + 1
//      This maps each calendar day to a consistent HadithID.
//      Note: HadithID values may not be perfectly contiguous if
//      rows have been deleted, so we use OFFSET/FETCH instead
//      of WHERE HadithID = N to avoid "no rows" edge cases.
// =============================================================
router.get('/daily-zikr', async (req, res) => {
  try {
    const pool = await getPool();

    // Step 1: Get total count
    const countResult = await pool.request()
      .query('SELECT COUNT(*) AS Total FROM Ahadith');

    const total = countResult.recordset[0]?.Total ?? 0;

    // Step 2: Return fallback if table is empty
    if (total === 0) {
      return res.status(200).json(FALLBACK_ZIKR);
    }

    // Step 3: Compute deterministic row offset for today
    // DATEPART(dayofyear, GETDATE()) gives 1–366.
    // We subtract 1 before modulo so day 1 maps to offset 0 (first row).
    const offsetResult = await pool.request()
      .query(`SELECT (DATEPART(dayofyear, GETDATE()) - 1) % ${total} AS RowOffset`);

    const rowOffset = offsetResult.recordset[0]?.RowOffset ?? 0;

    // Step 4: Fetch the Hadith at that offset
    // OFFSET/FETCH is safer than WHERE HadithID = N because it works
    // even if IDs have gaps (e.g., after row deletions).
    const hadithResult = await pool.request()
      .query(`
        SELECT
          HadithID,
          InternationalNumber,
          BookName,
          EnglishTranslation
        FROM Ahadith
        ORDER BY HadithID
        OFFSET ${rowOffset} ROWS
        FETCH NEXT 1 ROWS ONLY
      `);

    const hadith = hadithResult.recordset[0];

    // Guard: if somehow still no row (shouldn't happen), use fallback
    if (!hadith) {
      return res.status(200).json(FALLBACK_ZIKR);
    }

    // Return shaped response
    return res.status(200).json({
      hadithId:            hadith.HadithID,
      arabicText:          null,          // Ahadith table has no Arabic column yet
      text:                hadith.EnglishTranslation,
      translation:         hadith.EnglishTranslation,
      source:              hadith.BookName,
      internationalNumber: hadith.InternationalNumber,
      isFallback:          false,
    });

  } catch (err) {
    console.error('[HOME] /daily-zikr error:', err.message);

    // On DB error, return the fallback so the UI doesn't break
    return res.status(200).json({
      ...FALLBACK_ZIKR,
      _error: 'DB unavailable — showing fallback', // dev hint only
    });
  }
});

module.exports = router;
