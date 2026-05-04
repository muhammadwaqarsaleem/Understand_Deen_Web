/**
 * backend/routes/quran.js
 *
 * Quran API routes — serves Surah list and per-Surah Ayat.
 *
 * WHY A SEPARATE ROUTE FILE?
 *   Following the existing pattern (auth.js, home.js), each domain
 *   gets its own router file. server.js mounts it at /api/quran.
 *   This keeps concerns separated and makes the codebase navigable.
 *
 * ENDPOINTS:
 *   GET /api/quran/surahs          → 114-Surah index list
 *   GET /api/quran/surah/:number   → All Ayat for one Surah
 *
 * AUTH:
 *   Both routes require a valid JWT (Authorization: Bearer <token>).
 *   The requireAuth middleware validates it before any DB work begins.
 */

const express  = require('express');
const router   = express.Router();
const sql      = require('mssql/msnodesqlv8');
const jwt      = require('jsonwebtoken');
const { getPool } = require('../db');   // Singleton pool — never open a new connection

// ─────────────────────────────────────────────────────────────────────────────
// JWT AUTH MIDDLEWARE
// ─────────────────────────────────────────────────────────────────────────────
/**
 * requireAuth
 *
 * Extracts the Bearer token from the Authorization header and verifies
 * it against JWT_SECRET from .env. If valid, attaches the decoded payload
 * (userId, email, role) to req.user so downstream handlers can use it.
 *
 * WHY HERE AND NOT IN server.js?
 *   We could add this globally, but some routes (e.g. /api/home/daily-zikr)
 *   may intentionally be public. Applying auth per-router keeps it explicit
 *   and avoids silent breakage if a public endpoint is added later.
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  // Header must exist and follow the "Bearer <token>" convention
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { userId, email, role, iat, exp }
    next();
  } catch (err) {
    // jwt.verify throws TokenExpiredError, JsonWebTokenError, etc.
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/quran/surahs
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Returns a list of all 114 Surahs, ordered by Surah number.
 *
 * THE FIX: Instead of scanning 6,236 rows with an expensive SELECT DISTINCT,
 * we simply grab the 114 rows where AyahNoSurah = 1. Every Surah has a Verse 1,
 * and this returns exactly the 114 metadata rows we need instantly.
 */
router.get('/surahs', requireAuth, async (req, res) => {
  try {
    const pool = await getPool();

    const result = await pool.request().query(`
      SELECT 
        SurahNo,
        SurahNameEn,
        SurahNameAr,
        SurahNameRoman,
        TotalAyahSurah,
        PlaceOfRevelation
      FROM  Quran_Ayats
      WHERE AyahNoSurah = 1
      ORDER BY SurahNo
    `);

    res.json({ surahs: result.recordset });

  } catch (err) {
    console.error('[GET /api/quran/surahs] DB error:', err.message);
    res.status(500).json({ error: 'Failed to fetch Surah list.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/quran/surah/:number
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Returns all Ayat for a single Surah, plus the Surah header metadata.
 *
 * WHY TWO QUERIES instead of one JOIN?
 *   Query 1 (TOP 1) fetches the Surah header once cleanly.
 *   Query 2 fetches all Ayat. Combining them into one query forces the
 *   backend to loop and extract header data from the first row — fragile
 *   and harder to read. Two small queries on an indexed column is fine.
 *
 * PARAMETERIZED QUERY (@number):
 *   We NEVER interpolate user input into SQL strings. sql.TinyInt ensures
 *   the value is cast to TINYINT before it reaches the DB — preventing
 *   SQL injection even if the parseInt above somehow fails.
 *
 * IsSajdahAyah NORMALIZATION:
 *   The StateSummary notes this column is BIT DEFAULT 0 in the v3 schema.
 *   mssql returns BIT as JS boolean (true/false). We still guard for
 *   legacy string variants ('Yes', '1') in case an older import is still
 *   live on a different machine.
 */
router.get('/surah/:number', requireAuth, async (req, res) => {
  // Parse and validate the Surah number before any DB call
  const surahNo = parseInt(req.params.number, 10);

  if (isNaN(surahNo) || surahNo < 1 || surahNo > 114) {
    return res.status(400).json({
      error: 'Invalid Surah number. Must be an integer between 1 and 114.'
    });
  }

  try {
    const pool = await getPool();

    // ── Query 1: Surah header (metadata for the top card in the UI) ──────
    const headerResult = await pool.request()
      .input('number', sql.TinyInt, surahNo)
      .query(`
        SELECT TOP 1
          SurahNo,
          SurahNameEn,
          SurahNameAr,
          SurahNameRoman,
          TotalAyahSurah,
          PlaceOfRevelation
        FROM  Quran_Ayats
        WHERE SurahNo = @number
        ORDER BY AyahNoSurah
      `);

    if (headerResult.recordset.length === 0) {
      return res.status(404).json({ error: `Surah ${surahNo} not found in database.` });
    }

    // ── Query 2: All Ayat for this Surah ─────────────────────────────────
    // ORDER BY AyahNoSurah guarantees verse order 1→N regardless of
    // insertion order during the CSV import.
    const ayatResult = await pool.request()
      .input('number', sql.TinyInt, surahNo)
      .query(`
        SELECT
          AyatID,
          AyahNoSurah,
          AyahAr,
          AyahEn,
          JuzNo,
          IsSajdahAyah
        FROM  Quran_Ayats
        WHERE SurahNo = @number
        ORDER BY AyahNoSurah
      `);

    // Normalize IsSajdahAyah → boolean for clean frontend consumption
    const ayat = ayatResult.recordset.map(row => ({
      ...row,
      isSajdah:
        row.IsSajdahAyah === true  ||   // mssql BIT → JS true
        row.IsSajdahAyah === 1     ||   // mssql BIT → number 1 (some drivers)
        row.IsSajdahAyah === 'Yes' ||   // legacy NVARCHAR import
        row.IsSajdahAyah === '1'        // legacy NVARCHAR import
    }));

    res.json({
      surah: headerResult.recordset[0],
      ayat
    });

  } catch (err) {
    console.error(`[GET /api/quran/surah/${surahNo}] DB error:`, err.message);
    res.status(500).json({ error: 'Failed to fetch Surah.' });
  }
});

module.exports = router;