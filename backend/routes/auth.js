// =============================================================
// routes/auth.js — Authentication Routes (Business Logic Layer)
// POST /api/auth/signup
// POST /api/auth/login
// =============================================================

const express = require('express');
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const { sql, getPool } = require('../db');

const router = express.Router();

const SALT_ROUNDS  = 12; // bcrypt cost factor: 12 is production-safe (~250ms/hash)
const JWT_SECRET   = process.env.JWT_SECRET   || 'understand_deen_fallback_secret';
const JWT_EXPIRES  = process.env.JWT_EXPIRES_IN || '7d';

// -----------------------------------------------------------------
// Helper: build a clean JWT payload (never include sensitive fields)
// -----------------------------------------------------------------
const buildTokenPayload = (user) => ({
  userId: user.userId || user.UserID,
  email:  user.email  || user.Email,
  role:   user.role   || user.Role,
});

// =================================================================
// POST /api/auth/signup
// Creates a new user account with bcrypt-hashed password
// =================================================================
router.post('/signup', async (req, res) => {
  const { fullName, email, password } = req.body;

  // ---- Layer 1: Backend Input Validation ----
  // (Frontend validates too, but we NEVER trust client-side alone)

  const errors = [];

  if (!fullName || fullName.trim().length < 2) {
    errors.push('Full name must be at least 2 characters.');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    errors.push('A valid email address is required.');
  }

  // Password rules: min 8 chars, at least 1 uppercase, 1 number
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
  if (!password || !passwordRegex.test(password)) {
    errors.push('Password must be at least 8 characters, include one uppercase letter and one number.');
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: errors[0], errors });
  }

  try {

    // Added to resolve email exists issue:
    const pool = await getPool();

    // ---- NEW: Pre-Check for Duplicate Email ----
    // This bypasses the ODBC driver's error-swallowing bug and is much faster!
    const emailCheck = await pool.request()
      .input('CheckEmail', sql.VarChar(150), email.toLowerCase())
      .query('SELECT UserID FROM Users WHERE Email = @CheckEmail');

    if (emailCheck.recordset.length > 0) {
      return res.status(409).json({ 
        message: 'An account with this email already exists. Please log in.' 
      });
    }

    // Back to original flow
    // ---- Layer 2: Hash Password (bcrypt, 12 rounds) ----
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);    

    // ---- Layer 3: Call Stored Procedure ----
    // const pool = await getPool();
    const result = await pool.request()
      .input('FullName',     sql.NVarChar(100), fullName.trim())
      .input('Email',        sql.VarChar(150),  email.toLowerCase())
      .input('PasswordHash', sql.VarChar(255),  passwordHash)
      .input('Role',         sql.VarChar(20),   'User')
      .execute('sp_RegisterUser');

    const newUserID = result.recordset?.[0]?.NewUserID;

    // ---- Layer 4: Issue JWT (auto-login after signup) ----
    const payload = buildTokenPayload({
      userId: newUserID,
      email:  email.toLowerCase(),
      role:   'User',
    });
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });

    return res.status(201).json({
      message: 'Account created successfully. Welcome to Understand Deen!',
      token,
      user: {
        userId:   newUserID,
        fullName: fullName.trim(),
        email:    email.toLowerCase(),
        role:     'User',
      },
    });

  } catch (err) {
    // ---- Handle Known SP Errors ----
    if (err.message?.includes('EMAIL_ALREADY_EXISTS')) {
      return res.status(409).json({
        message: 'An account with this email already exists. Please log in.',
      });
    }
    if (err.message?.includes('INVALID_EMAIL_FORMAT')) {
      return res.status(400).json({ message: 'Invalid email format.' });
    }

    console.error('[AUTH] Signup error:', err.message);
    return res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

// =================================================================
// POST /api/auth/login
// Verifies credentials and issues a JWT
// =================================================================
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // ---- Layer 1: Input Validation ----
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    // ---- Layer 2: Fetch user record via SP ----
    const pool = await getPool();
    const result = await pool.request()
      .input('Email', sql.VarChar(150), email.toLowerCase())
      .execute('sp_LoginUser');

    const user = result.recordset?.[0];

    // ---- Layer 3: Check user existence ----
    // We use a generic "Invalid credentials" message intentionally.
    // Telling the user "email not found" vs "wrong password" is a
    // security vulnerability (user enumeration attack).
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // ---- Layer 4: Verify password with bcrypt ----
    const isPasswordValid = await bcrypt.compare(password, user.PasswordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // ---- Layer 5: Issue JWT ----
    const payload = buildTokenPayload(user);
    const token   = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });

    return res.status(200).json({
      message: 'Login successful.',
      token,
      user: {
        userId:    user.UserID,
        fullName:  user.FullName,
        email:     user.Email,
        role:      user.Role,
        createdAt: user.CreatedAt,
      },
    });

  } catch (err) {
    console.error('[AUTH] Login error:', err.message);
    return res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

module.exports = router;
