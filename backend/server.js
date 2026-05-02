// =============================================================
// server.js — Express Application Entry Point
// Understand Deen API
// =============================================================

require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const { closePool } = require('./db');
const authRoutes = require('./routes/auth');

const app  = express();
const PORT = process.env.PORT || 5000;

// =============================================================
// Middleware
// =============================================================

// CORS: Allow only our React frontend origin
app.use(cors({
  origin:      process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

// Parse JSON request bodies
app.use(express.json());

// =============================================================
// Routes
// =============================================================

// Authentication (signup / login)
app.use('/api/auth', authRoutes);

// Health check — useful for testing the server is alive
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status:  'ok',
    message: 'Understand Deen API is running.',
    time:    new Date().toISOString(),
  });
});

// 404 handler for unknown routes
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
// Graceful Shutdown — close DB pool before exiting
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
