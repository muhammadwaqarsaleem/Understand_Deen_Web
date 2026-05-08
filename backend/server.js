// =============================================================
// server.js — Express Application Entry Point
// Understand Deen API
// =============================================================
// REGISTERED ROUTES (current after Step 5):
//   /api/auth   → routes/auth.js   (signup, login)
//   /api/home   → routes/home.js   (daily-zikr)
//   /api/quran  → routes/quran.js  (surahs list, per-Surah Ayat)
//   /api/hadith → routes/hadith.js (books, chapters, Ahadith)     ← Step 5 NEW
//
// FUTURE ROUTES (Steps 6–9):
//   /api/newmuslim → routes/newmuslim.js (Step 6)
//   /api/fiqh      → routes/fiqh.js      (Step 7)
//   /api/habits    → routes/habits.js    (Step 8)
//   /api/preferences→ routes/preferences.js (Step 9)
//   /api/bookmarks → routes/bookmarks.js (Step 10)
// =============================================================

require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const { closePool } = require('./db');

// ── Route imports ─────────────────────────────────────────────
const authRoutes   = require('./routes/auth');
const homeRoutes   = require('./routes/home'); 
const quranRoutes  = require('./routes/quran'); 
const hadithRoutes = require('./routes/hadith'); // ← Step 5 Added Here

const app  = express();
const PORT = process.env.PORT || 5000;

// =============================================================
// Global Middleware
// =============================================================

// CORS: allow only our Vite dev server origin
app.use(cors({
  origin:      process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true, // Kept this! Crucial for Auth.
}));

// Parse JSON request bodies
app.use(express.json());

// =============================================================
// Route Registration
// =============================================================
app.use('/api/auth', authRoutes);
app.use('/api/home', homeRoutes); 
app.use('/api/quran', quranRoutes); 
app.use('/api/hadith', hadithRoutes); // ← Step 5 Added Here

// Health check — quick way to verify the server is live
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status:  'ok',
    message: 'Understand Deen API is running.',
    time:    new Date().toISOString(),
  });
});

// 404 handler — catches any unregistered route
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

// =============================================================
// Start Server
// =============================================================
const server = app.listen(PORT, () => {
  console.log(`[Server] Understand Deen API running on http://localhost:${PORT}`);
  console.log(`[Server] CORS origin: ${process.env.CLIENT_ORIGIN || 'http://localhost:5173'}`);
});

// =============================================================
// Graceful Shutdown — drain DB pool before process exits
// =============================================================
const shutdown = async (signal) => {
  console.log(`\n[Server] ${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    await closePool(); // Kept this! Crucial for preventing DB locking.
    console.log('[Server] Shutdown complete.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

module.exports = app;