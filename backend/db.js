// =============================================================
// db.js — Data Access Layer
// MS SQL Server connection via Windows Authentication (msnodesqlv8)
// =============================================================
// ARCHITECTURAL NOTE: We use a connection pool (not a new connection
// per request) for scalability. The pool is lazily initialized on
// first request and reused across all subsequent calls.
//
// WHY connectionString INSTEAD OF config object?
// The structured config object (server/database/driver fields) relies
// on mssql internally resolving the correct ODBC driver name on your
// machine, which can fail if the expected name isn't registered.
// A raw connectionString bypasses that lookup entirely and hands the
// ODBC string directly to the Windows Driver Manager — far more
// reliable on local development machines.
//
// DRIVER CHOICE — {SQL Server} vs {ODBC Driver 17 for SQL Server}:
// {SQL Server} is the legacy driver that ships built-in with every
// Windows OS. It requires zero installation and works on SQL Server
// 2005–2019. If you have ODBC Driver 17 or 18 installed and visible
// in your "ODBC Data Sources (64-bit)" > Drivers tab, you can swap
// the driver name there for a small performance/TLS improvement.
// For a local university project, {SQL Server} is perfectly fine.
// =============================================================

const sql = require('mssql/msnodesqlv8');

// ---- Read optional overrides from .env ----
// DB_SERVER  : your SQL Server instance name
//              Use 'localhost'             → for default instance
//              Use 'localhost\\SQLEXPRESS' → for named instance (double backslash)
// DB_NAME    : target database name
const DB_SERVER = process.env.DB_SERVER || 'localhost';
const DB_NAME   = process.env.DB_NAME   || 'UnderstandDeenDB';

// =============================================================
// Connection configuration
// Using a raw ODBC connectionString for maximum compatibility.
// Trusted_Connection=yes → Windows Authentication (no user/password).
// =============================================================
const dbConfig = {
  // The connectionString hands the ODBC parameters directly to the
  // Windows Driver Manager, skipping mssql's internal driver resolution.
  connectionString:
    `Driver={SQL Server};` +
    `Server=${DB_SERVER};` +
    `Database=${DB_NAME};` +
    `Trusted_Connection=yes;`,

  // msnodesqlv8 must still be declared here so mssql knows which
  // Node.js native binding to load when executing the connection.
  driver: 'msnodesqlv8',

  requestTimeout: 60000, // <--- ADD THIS LINE (60 seconds)

  options: {
    trustServerCertificate: true, // Accept self-signed cert on local dev instances
  },

  pool: {
    max:               10,    // Maximum concurrent connections in the pool
    min:               2,     // Keep 2 connections warm at all times
    idleTimeoutMillis: 600000, // Release a connection after 10 minutes of inactivity
  },
};

// =============================================================
// Singleton pool — created once, reused across all requests.
// This avoids the overhead of opening a new TCP connection to
// SQL Server on every API call.
// =============================================================
let pool = null;

/**
 * Returns the active SQL connection pool.
 * Creates it on the very first call; all subsequent calls return
 * the same cached instance (lazy initialization pattern).
 *
 * @returns {Promise<sql.ConnectionPool>}
 * @throws  Will throw and log if the connection cannot be established.
 */
const getPool = async () => {
  // Return the existing pool if it is alive and connected
  if (pool && pool.connected) {
    return pool;
  }

  try {
    pool = await sql.connect(dbConfig);
    console.log('[DB] Connected to UnderstandDeenDB via Windows Authentication.');
    return pool;
  } catch (err) {
    console.error('[DB] Connection failed:', err.message);
    // Re-throw so the calling route can return a 500 to the client
    // rather than silently hanging.
    throw err;
  }
};

/**
 * Gracefully closes the connection pool.
 * Called automatically on SIGTERM / SIGINT in server.js so active
 * queries are allowed to finish before the process exits.
 */
const closePool = async () => {
  if (pool) {
    await pool.close();
    pool = null;
    console.log('[DB] Connection pool closed.');
  }
};

module.exports = { sql, getPool, closePool };