const express = require('express');
const { getDatabase } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const parseSupabaseQuery = require('../middleware/query-parser');

const router = express.Router();

// Get runs (supports Supabase-style queries)
router.get('/', parseSupabaseQuery, (req, res, next) => {
  try {
    const db = getDatabase();
    const { whereClause, orderClause, params } = req.parsedQuery;

    const query = `SELECT * FROM runs ${whereClause} ${orderClause}`;
    const runs = db.prepare(query).all(...params);

    // Parse JSON fields
    const parsedRuns = runs.map(run => ({
      ...run,
      path_coordinates: JSON.parse(run.path_coordinates || '[]'),
      territory_polygon: JSON.parse(run.territory_polygon || '[]'),
      is_valid: run.is_valid === 1
    }));

    res.json(parsedRuns);
  } catch (error) {
    next(error);
  }
});

// Create new run
router.post('/', authenticateToken, (req, res, next) => {
  try {
    const db = getDatabase();
    const {
      pincode,
      distance_meters,
      duration_seconds,
      path_coordinates,
      territory_polygon,
      started_at,
      ended_at,
      is_valid
    } = req.body;

    const userId = req.user.userId;

    // Validate required fields
    if (!pincode || distance_meters === undefined || duration_seconds === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Convert coordinates to JSON strings
    const pathJson = JSON.stringify(path_coordinates || []);
    const territoryJson = JSON.stringify(territory_polygon || []);

    const result = db.prepare(`
      INSERT INTO runs (
        user_id, 
        pincode, 
        distance_meters, 
        duration_seconds, 
        path_coordinates, 
        territory_polygon, 
        started_at, 
        ended_at, 
        is_valid
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      pincode,
      distance_meters,
      duration_seconds,
      pathJson,
      territoryJson,
      started_at,
      ended_at || null,
      is_valid !== false ? 1 : 0
    );

    // Get the created run
    const run = db.prepare('SELECT * FROM runs WHERE id = (SELECT id FROM runs ORDER BY created_at DESC LIMIT 1)').get();

    res.status(201).json({
      ...run,
      path_coordinates: JSON.parse(run.path_coordinates),
      territory_polygon: JSON.parse(run.territory_polygon),
      is_valid: run.is_valid === 1
    });
  } catch (error) {
    next(error);
  }
});

// Get territories for a pincode
router.get('/territories/:pincode', (req, res, next) => {
  try {
    const db = getDatabase();
    const { pincode } = req.params;

    // Get runs with territories
    const runs = db.prepare(`
      SELECT 
        r.id as run_id,
        r.user_id,
        r.pincode,
        r.territory_polygon,
        r.distance_meters,
        r.started_at,
        p.username
      FROM runs r
      LEFT JOIN profiles p ON r.user_id = p.user_id
      WHERE r.pincode = ? 
        AND r.is_valid = 1 
        AND r.territory_polygon != '[]'
      ORDER BY r.started_at DESC
    `).all(pincode);

    // Get unique territories per user (latest only)
    const userTerritories = new Map();
    runs.forEach(run => {
      if (!userTerritories.has(run.user_id)) {
        userTerritories.set(run.user_id, run);
      }
    });

    const territories = Array.from(userTerritories.values()).map(run => ({
      run_id: run.run_id,
      user_id: run.user_id,
      pincode: run.pincode,
      territory_polygon: JSON.parse(run.territory_polygon),
      distance_meters: run.distance_meters,
      started_at: run.started_at,
      username: run.username || 'Runner'
    }));

    res.json(territories);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
