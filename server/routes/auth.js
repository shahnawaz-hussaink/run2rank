const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { getDatabase } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const signupValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
];

// Sign Up
router.post('/signup', signupValidation, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { email, password } = req.body;
    const db = getDatabase();

    // Check if user already exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const result = db.prepare(
      'INSERT INTO users (email, password_hash) VALUES (?, ?)'
    ).run(email, passwordHash);

    const userId = db.prepare('SELECT id FROM users WHERE email = ?').get(email).id;

    // Create profile for the user
    db.prepare(
      'INSERT INTO profiles (user_id, pincode) VALUES (?, ?)'
    ).run(userId, '');

    // Generate tokens
    const accessToken = jwt.sign(
      { userId, email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXPIRY || '24h' }
    );

    const refreshToken = jwt.sign(
      { userId, email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
    );

    res.json({
      user: { id: userId, email },
      session: {
        access_token: accessToken,
        refresh_token: refreshToken,
        user: { id: userId, email }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Sign In
router.post('/login', loginValidation, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { email, password } = req.body;
    const db = getDatabase();

    // Find user
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXPIRY || '24h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
    );

    res.json({
      user: { id: user.id, email: user.email },
      session: {
        access_token: accessToken,
        refresh_token: refreshToken,
        user: { id: user.id, email: user.email }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get Session
router.get('/session', authenticateToken, (req, res) => {
  const db = getDatabase();
  const user = db.prepare('SELECT id, email FROM users WHERE id = ?').get(req.user.userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    user: { id: user.id, email: user.email }
  });
});

// Logout (client-side token removal, no server action needed)
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// Refresh Token
router.post('/refresh', async (req, res, next) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    jwt.verify(refresh_token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid refresh token' });
      }

      const accessToken = jwt.sign(
        { userId: user.userId, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_ACCESS_EXPIRY || '24h' }
      );

      res.json({ access_token: accessToken });
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
