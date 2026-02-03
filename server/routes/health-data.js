const express = require('express');
const { getDatabase } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const parseSupabaseQuery = require('../middleware/query-parser');

const router = express.Router();

// Get health data (supports Supabase-style queries)
router.get('/', parseSupabaseQuery, (req, res, next) => {
  try {
    const db = getDatabase();
    const { whereClause, params } = req.parsedQuery;

    const query = `SELECT * FROM health_data ${whereClause}`;
    const result = db.prepare(query).get(...params);

    res.json(result || null);
  } catch (error) {
    next(error);
  }
});

// Create health data
router.post('/', authenticateToken, (req, res, next) => {
  try {
    const db = getDatabase();
    const userId = req.user.userId;
    const {
      height_cm,
      weight_kg,
      age,
      gender,
      activity_level,
      daily_steps_goal,
      daily_calories_goal
    } = req.body;

    // Check if already exists
    const existing = db.prepare('SELECT id FROM health_data WHERE user_id = ?').get(userId);
    
    if (existing) {
      return res.status(400).json({ error: 'Health data already exists, use PUT to update' });
    }

    db.prepare(`
      INSERT INTO health_data (
        user_id,
        height_cm,
        weight_kg,
        age,
        gender,
        activity_level,
        daily_steps_goal,
        daily_calories_goal
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      height_cm || null,
      weight_kg || null,
      age || null,
      gender || null,
      activity_level || null,
      daily_steps_goal || 10000,
      daily_calories_goal || null
    );

    // Get the created record (with calculated BMI/BMR from trigger)
    const created = db.prepare('SELECT * FROM health_data WHERE user_id = ?').get(userId);
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

// Update health data
router.put('/', authenticateToken, parseSupabaseQuery, (req, res, next) => {
  try {
    const db = getDatabase();
    const { params } = req.parsedQuery;
    const userId = params[0]; // From ?user_id=eq.xxx

    if (!userId) {
      return res.status(400).json({ error: 'user_id required in query params' });
    }

    // Verify user owns this data
    if (req.user.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updates = req.body;

    // Check if exists
    const existing = db.prepare('SELECT id FROM health_data WHERE user_id = ?').get(userId);

    if (!existing) {
      // Create if doesn't exist (upsert behavior)
      db.prepare(`
        INSERT INTO health_data (
          user_id,
          height_cm,
          weight_kg,
          age,
          gender,
          activity_level,
          daily_steps_goal,
          daily_calories_goal
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        userId,
        updates.height_cm || null,
        updates.weight_kg || null,
        updates.age || null,
        updates.gender || null,
        updates.activity_level || null,
        updates.daily_steps_goal || 10000,
        updates.daily_calories_goal || null
      );
    } else {
      // Update existing
      const allowedFields = [
        'height_cm', 'weight_kg', 'age', 'gender', 
        'activity_level', 'daily_steps_goal', 'daily_calories_goal'
      ];
      const updateFields = [];
      const updateValues = [];

      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key)) {
          updateFields.push(`${key} = ?`);
          updateValues.push(value);
        }
      }

      if (updateFields.length > 0) {
        updateValues.push(userId);
        const query = `UPDATE health_data SET ${updateFields.join(', ')} WHERE user_id = ?`;
        db.prepare(query).run(...updateValues);
      }
    }

    // Return updated record
    const updated = db.prepare('SELECT * FROM health_data WHERE user_id = ?').get(userId);
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
