const express = require('express');
const { getDatabase } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const parseSupabaseQuery = require('../middleware/query-parser');

const router = express.Router();

// Get profiles (supports Supabase-style queries)
router.get('/', parseSupabaseQuery, (req, res, next) => {
  try {
    const db = getDatabase();
    const { whereClause, orderClause, params } = req.parsedQuery;

    const query = `SELECT * FROM profiles ${whereClause} ${orderClause}`;
    const profiles = db.prepare(query).all(...params);

    res.json(profiles);
  } catch (error) {
    next(error);
  }
});

// Update profile
router.put('/', authenticateToken, parseSupabaseQuery, (req, res, next) => {
  try {
    const db = getDatabase();
    const updates = req.body;
    const { params } = req.parsedQuery;

    // Get user_id from query params
    const userId = params[0]; // Assuming first param is user_id from ?user_id=eq.xxx

    if (!userId) {
      return res.status(400).json({ error: 'user_id required in query params' });
    }

    // Verify user owns this profile
    if (req.user.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Build update query
    const allowedFields = ['username', 'avatar_url', 'pincode'];
    const updateFields = [];
    const updateValues = [];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = ?`);
        updateValues.push(value);
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updateValues.push(userId);

    const query = `UPDATE profiles SET ${updateFields.join(', ')} WHERE user_id = ?`;
    db.prepare(query).run(...updateValues);

    // Return updated profile
    const updated = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(userId);
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Get single profile (alternative endpoint)
router.get('/:userId', (req, res, next) => {
  try {
    const db = getDatabase();
    const { userId } = req.params;

    const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(userId);

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json(profile);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
