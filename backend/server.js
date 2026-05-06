// =============================================================
// server.js — Express Application Entry Point
// Understand Deen API
// =============================================================
// Route registry:
//   /api/auth  → routes/auth.js   (login, signup)
//   /api/home  → routes/home.js   (daily-zikr)       ← Step 3
//   /api/quran → routes/quran.js  (surahs, ayat)     ← Step 4
//
// Future routes to add here as steps are completed:
//   /api/hadith     → routes/hadith.js     (Step 5)
//   /api/newmuslim  → routes/newmuslim.js  (Step 6)
//   /api/fiqh       → routes/fiqh.js       (Step 7)
//   /api/habits     → routes/habits.js     (Step 8)
//   /api/preferences→ routes/preferences.js(Step 9)
//   /api/bookmarks  → routes/bookmarks.js  (Step 10)
// =============================================================

require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const { closePool } = require('./db');

// ── Route imports ─────────────────────────────────────────────
const authRoutes   = require('./routes/auth');
const homeRoutes   = require('./routes/home');
const quranRoutes  = require('./routes/quran');  // ← Step 4
const hadithRoutes = require('./routes/hadith'); // ← Step 5

const app  = express();
const PORT = process.env.PORT || 5000;

// =============================================================
// Global Middleware
// =============================================================

// CORS: allow only our Vite dev server origin
app.use(cors({
  origin:      process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

// Parse JSON request bodies
app.use(express.json());

// =============================================================
// Route Registration
// =============================================================
app.use('/api/auth',   authRoutes);
app.use('/api/home',   homeRoutes);
app.use('/api/quran',  quranRoutes);  // ← Step 4
app.use('/api/hadith', hadithRoutes); // ← Step 5

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
});

// =============================================================
// Graceful Shutdown — drain DB pool before process exits
// =============================================================
const shutdown = async (signal) => {
  console.log(`\n[Server] ${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    await closePool();
    console.log('[Server] Shutdown complete.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

module.exports = app;