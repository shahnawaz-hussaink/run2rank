const express = require('express');
const { getDatabase } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const parseSupabaseQuery = require('../middleware/query-parser');

const router = express.Router();

// Get nearby users (user presence)
router.get('/', parseSupabaseQuery, (req, res, next) => {
  try {
    const db = getDatabase();
    const { whereClause, params } = req.parsedQuery;

    const query = `
      SELECT 
        up.*,
        p.username
      FROM user_presence up
      LEFT JOIN profiles p ON up.user_id = p.user_id
      ${whereClause}
    `;
    
    const presence = db.prepare(query).all(...params);

    res.json(presence);
  } catch (error) {
    next(error);
  }
});

// Create/Update presence (upsert)
router.post('/', authenticateToken, (req, res, next) => {
  try {
    const db = getDatabase();
    const userId = req.user.userId;
    const { pincode, latitude, longitude, is_running } = req.body;

    if (!pincode || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if exists
    const existing = db.prepare('SELECT id FROM user_presence WHERE user_id = ?').get(userId);

    if (existing) {
      // Update
      db.prepare(`
        UPDATE user_presence 
        SET pincode = ?, 
            latitude = ?, 
            longitude = ?, 
            last_seen = datetime('now'),
            is_running = ?
        WHERE user_id = ?
      `).run(pincode, latitude, longitude, is_running ? 1 : 0, userId);
    } else {
      // Insert
      db.prepare(`
        INSERT INTO user_presence (user_id, pincode, latitude, longitude, is_running)
        VALUES (?, ?, ?, ?, ?)
      `).run(userId, pincode, latitude, longitude, is_running ? 1 : 0);
    }

    const updated = db.prepare('SELECT * FROM user_presence WHERE user_id = ?').get(userId);
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Update presence
router.put('/', authenticateToken, parseSupabaseQuery, (req, res, next) => {
  try {
    const db = getDatabase();
    const { params } = req.parsedQuery;
    const userId = params[0]; // From ?user_id=eq.xxx

    if (!userId) {
      return res.status(400).json({ error: 'user_id required in query params' });
    }

    // Verify user owns this presence
    if (req.user.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { pincode, latitude, longitude, is_running } = req.body;

    db.prepare(`
      UPDATE user_presence 
      SET pincode = ?, 
          latitude = ?, 
          longitude = ?, 
          last_seen = datetime('now'),
          is_running = ?
      WHERE user_id = ?
    `).run(pincode, latitude, longitude, is_running ? 1 : 0, userId);

    const updated = db.prepare('SELECT * FROM user_presence WHERE user_id = ?').get(userId);
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Delete presence
router.delete('/', authenticateToken, parseSupabaseQuery, (req, res, next) => {
  try {
    const db = getDatabase();
    const { params } = req.parsedQuery;
    const userId = params[0]; // From ?user_id=eq.xxx

    if (!userId) {
      return res.status(400).json({ error: 'user_id required in query params' });
    }

    // Verify user owns this presence
    if (req.user.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    db.prepare('DELETE FROM user_presence WHERE user_id = ?').run(userId);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Cleanup stale presence (run periodically or on request)
router.post('/cleanup', (req, res, next) => {
  try {
    const db = getDatabase();
    
    // Delete presence records older than 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const result = db.prepare('DELETE FROM user_presence WHERE last_seen < ?').run(fiveMinutesAgo);

    res.json({ deleted: result.changes });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
