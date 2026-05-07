/**
 * backend/routes/hadith.js — Step 5
 *
 * ENDPOINTS:
 *   GET /api/hadith/books                         → 6 Kutub al-Sittah with counts
 *   GET /api/hadith/chapters?book=...             → Chapter index for one book
 *   GET /api/hadith/hadiths?book=...&chapter=...&search=...&page=1&limit=20
 *
 * AUTH: All routes require a valid JWT Bearer token.
 *
 * SEARCH: Uses LIKE '%keyword%' on EnglishText. Sufficient for this dataset.
 *         For production, replace with SQL Server CONTAINS() full-text search.
 *
 * PAGINATION: OFFSET/FETCH (SQL Server 2012+).
 *   COUNT(*) OVER () returns the total-before-pagination because window
 *   functions execute at SELECT time, before OFFSET/FETCH is applied.
 */

const express     = require('express');
const router      = express.Router();
const sql         = require('mssql/msnodesqlv8');
const jwt         = require('jsonwebtoken');
const { getPool } = require('../db');

// ─────────────────────────────────────────────────────────────────────────────
// JWT AUTH MIDDLEWARE — same pattern as quran.js
// ─────────────────────────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided.' });
  }
  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/hadith/books
// ─────────────────────────────────────────────────────────────────────────────
router.get('/books', requireAuth, async (req, res) => {
  try {
    const pool   = await getPool();
    const result = await pool.request().query(`
      SELECT
        BookName,
        COUNT(*)                      AS HadithCount,
        COUNT(DISTINCT ChapterNumber) AS ChapterCount
      FROM  Ahadith
      GROUP BY BookName
      ORDER BY BookName
    `);
    res.json({ books: result.recordset });
  } catch (err) {
    console.error('[GET /api/hadith/books] DB error:', err.message);
    res.status(500).json({ error: 'Failed to fetch book list.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/hadith/chapters?book=...
// ─────────────────────────────────────────────────────────────────────────────
router.get('/chapters', requireAuth, async (req, res) => {
  const { book } = req.query;
  if (!book || !book.trim()) {
    return res.status(400).json({ error: 'book query parameter is required.' });
  }
  try {
    const pool   = await getPool();
    const result = await pool.request()
      .input('book', sql.VarChar(100), book.trim())
      .query(`
        SELECT
          ChapterNumber,
          MAX(ChapterTitleEn) AS ChapterTitleEn,
          MAX(ChapterTitleAr) AS ChapterTitleAr,
          COUNT(*)             AS HadithCount
        FROM  Ahadith
        WHERE BookName      = @book
          AND ChapterNumber IS NOT NULL
        GROUP BY ChapterNumber
        ORDER BY ChapterNumber
      `);
    res.json({ chapters: result.recordset });
  } catch (err) {
    console.error('[GET /api/hadith/chapters] DB error:', err.message);
    res.status(500).json({ error: 'Failed to fetch chapter list.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/hadith/hadiths?book=...&chapter=...&search=...&page=1&limit=20
// ─────────────────────────────────────────────────────────────────────────────
router.get('/hadiths', requireAuth, async (req, res) => {
  const { book, chapter, search } = req.query;
  const page  = Math.max(1, parseInt(req.query.page,  10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));

  if (!book || !book.trim()) {
    return res.status(400).json({ error: 'book query parameter is required.' });
  }

  const offset     = (page - 1) * limit;
  const hasChapter = chapter !== undefined && !isNaN(parseInt(chapter, 10));

  // Strip SQL wildcard chars so the user cannot craft a slow pattern like '%_[a-z]%'.
  // @search is still bound via .input() — this is defensive input cleaning only.
  const rawSearch = (search || '').trim().replace(/[%_[\]]/g, '');
  const hasSearch = rawSearch.length > 0;

  try {
    const pool    = await getPool();
    const request = pool.request()
      .input('book',   sql.VarChar(100), book.trim())
      .input('offset', sql.Int,          offset)
      .input('limit',  sql.Int,          limit);

    // extraWhere is built from hardcoded strings only — never raw user input.
    // All user values are bound through .input() above.
    let extraWhere = '';

    if (hasChapter) {
      request.input('chapter', sql.SmallInt, parseInt(chapter, 10));
      extraWhere += ' AND ChapterNumber = @chapter';
    }
    if (hasSearch) {
      request.input('search', sql.NVarChar(200), rawSearch);
      extraWhere += " AND EnglishText LIKE '%' + @search + '%'";
    }

    const result = await request.query(`
      SELECT
        HadithID,
        BookName,
        ChapterNumber,
        ChapterTitleEn,
        ArabicText,
        EnglishText,
        Grade,
        Reference,
        InBookReference,
        COUNT(*) OVER () AS TotalCount
      FROM  Ahadith
      WHERE BookName = @book
        ${extraWhere}
      ORDER BY HadithID
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `);

    const total = result.recordset.length > 0 ? result.recordset[0].TotalCount : 0;

    res.json({
      hadiths:    result.recordset,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });

  } catch (err) {
    console.error('[GET /api/hadith/hadiths] DB error:', err.message);
    res.status(500).json({ error: 'Failed to fetch hadiths.' });
  }
});

module.exports = router;
