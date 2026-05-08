/**
 * backend/routes/hadith.js
 *
 * Hadith API routes — serves the Kutub al-Sittah (Six Authenticated Books).
 *
 * SCHEMA NOTES (v3 — finalized after full import):
 * • BookName      VARCHAR(100)   — protected by CHECK constraint
 * • ChapterTitleEn/Ar NVARCHAR(MAX) — upgraded from 500 during import
 * • Grade         NVARCHAR(300)  — expanded for verbose Tirmidhi gradings
 * • EnglishText   NVARCHAR(MAX)  — NULLABLE (some rows missing translations)
 * • ArabicText    NVARCHAR(MAX)  — NULLABLE
 *
 * ENDPOINTS:
 * GET /api/hadith/books               → 6-book index with Hadith counts
 * GET /api/hadith/chapters/:book      → All chapters for a given book
 * GET /api/hadith/chapter/:book/:ch   → All Ahadith in a specific chapter
 *
 * URL ENCODING:
 * Book names contain spaces and special chars (e.g., "Jami` at-Tirmidhi").
 * The frontend must call encodeURIComponent(bookName) when building URLs.
 * Express automatically decodes req.params before we use them — safe.
 *
 * AUTH:
 * All three endpoints are protected by requireAuth (Bearer JWT).
 * This is identical to the pattern in routes/quran.js.
 */

const express = require('express');
const router  = express.Router();
const sql     = require('mssql/msnodesqlv8');
const jwt     = require('jsonwebtoken');
const { getPool } = require('../db');

// ─────────────────────────────────────────────────────────────────────────────
// JWT AUTH MIDDLEWARE (identical pattern to quran.js — kept local per convention)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * requireAuth
 * Verifies the Bearer token and attaches the decoded payload to req.user.
 * Returns 401 if the token is missing, malformed, or expired.
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { userId, email, role, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/hadith/books
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Returns all distinct books in the Ahadith table with their Hadith counts.
 */
router.get('/books', requireAuth, async (req, res) => {
  try {
    const pool = await getPool();

    const result = await pool.request().query(`
      SELECT
        BookName,
        COUNT(*) AS HadithCount
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
// GET /api/hadith/chapters/:book
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Returns all chapters for a given book, with per-chapter Hadith counts.
 *
 * THE NVARCHAR(MAX) MEMORY TRAP & CORRELATED SUBQUERY OPTIMIZATION:
 * Grouping or sorting massive LOB (Large Object) data like NVARCHAR(MAX) 
 * causes SQL Server to buffer gigabytes of data into TempDB, leading to 
 * severe timeouts on books with 7000+ rows (e.g., Sahih al-Bukhari).
 * * Solution:
 * 1. An inner query quickly groups and counts ONLY the integer ChapterNumbers.
 * 2. The outer query uses Correlated Subqueries to fetch the heavy NVARCHAR
 * text strictly for the resulting distinct chapters (e.g., ~97 times 
 * instead of dragging 7,275 text blocks through a sorting algorithm).
 *
 * @param :book  — URL-encoded book name (decoded by Express automatically)
 */
router.get('/chapters/:book', requireAuth, async (req, res) => {
  const bookName = req.params.book; 

  if (!bookName || bookName.trim() === '') {
    return res.status(400).json({ error: 'Book name is required.' });
  }

  try {
    const pool = await getPool();

    const result = await pool.request()
      .input('book', sql.VarChar(100), bookName)
      .query(`
        SELECT 
            c.ChapterNumber,
            c.HadithCount,
            (SELECT TOP 1 ChapterTitleEn FROM Ahadith a WHERE a.BookName = @book AND a.ChapterNumber = c.ChapterNumber) AS ChapterTitleEn,
            (SELECT TOP 1 ChapterTitleAr FROM Ahadith a WHERE a.BookName = @book AND a.ChapterNumber = c.ChapterNumber) AS ChapterTitleAr
        FROM (
            SELECT ChapterNumber, COUNT(*) AS HadithCount
            FROM Ahadith
            WHERE BookName = @book AND ChapterNumber IS NOT NULL
            GROUP BY ChapterNumber
        ) c
        ORDER BY c.ChapterNumber;
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: `No chapters found for book: "${bookName}"` });
    }

    res.json({
      bookName,
      chapters: result.recordset
    });

  } catch (err) {
    console.error('[GET /api/hadith/chapters/:book] DB error:', err.message);
    res.status(500).json({ error: 'Failed to fetch chapter list.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/hadith/chapter/:book/:chapter
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Returns all Ahadith in a specific chapter of a given book.
 *
 * @param :book     — URL-encoded book name
 * @param :chapter  — Integer chapter number (1-based)
 */
router.get('/chapter/:book/:chapter', requireAuth, async (req, res) => {
  const bookName  = req.params.book;
  const chapterNo = parseInt(req.params.chapter, 10);

  if (isNaN(chapterNo) || chapterNo < 1) {
    return res.status(400).json({
      error: 'Invalid chapter number. Must be a positive integer.'
    });
  }

  try {
    const pool = await getPool();

    // ── Query 1: Chapter header (one representative row) ─────────────────
    const headerResult = await pool.request()
      .input('book',    sql.VarChar(100), bookName)
      .input('chapter', sql.SmallInt,     chapterNo)
      .query(`
        SELECT TOP 1
          ChapterTitleEn,
          ChapterTitleAr
        FROM  Ahadith
        WHERE BookName      = @book
          AND ChapterNumber = @chapter
      `);

    if (headerResult.recordset.length === 0) {
      return res.status(404).json({
        error: `Chapter ${chapterNo} not found in "${bookName}".`
      });
    }

    // ── Query 2: All Ahadith in this chapter ─────────────────────────────
    const hadithResult = await pool.request()
      .input('book',    sql.VarChar(100), bookName)
      .input('chapter', sql.SmallInt,     chapterNo)
      .query(`
        SELECT
          HadithID,
          ArabicText,
          EnglishText,
          Grade,
          Reference,
          InBookReference
        FROM  Ahadith
        WHERE BookName      = @book
          AND ChapterNumber = @chapter
        ORDER BY HadithID
      `);

    const { ChapterTitleEn, ChapterTitleAr } = headerResult.recordset[0];

    res.json({
      bookName,
      chapterNumber  : chapterNo,
      chapterTitleEn : ChapterTitleEn || null,
      chapterTitleAr : ChapterTitleAr || null,
      ahadith        : hadithResult.recordset
    });

  } catch (err) {
    console.error(`[GET /api/hadith/chapter/${req.params.book}/${req.params.chapter}] DB error:`, err.message);
    res.status(500).json({ error: 'Failed to fetch Ahadith.' });
  }
});

module.exports = router;