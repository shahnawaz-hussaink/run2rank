const express = require('express');
const { getDatabase } = require('../db/database');
const parseSupabaseQuery = require('../middleware/query-parser');

const router = express.Router();

// Get leaderboard (monthly stats)
router.get('/', parseSupabaseQuery, (req, res, next) => {
  try {
    const db = getDatabase();
    const { whereClause, orderClause, params } = req.parsedQuery;

    const query = `SELECT * FROM monthly_stats ${whereClause} ${orderClause}`;
    const stats = db.prepare(query).all(...params);

    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// Get leaderboard for specific pincode and month (alternative endpoint)
router.get('/:pincode/:yearMonth', (req, res, next) => {
  try {
    const db = getDatabase();
    const { pincode, yearMonth } = req.params;

    // Get monthly stats
    const stats = db.prepare(`
      SELECT 
        ms.user_id,
        ms.total_distance_meters,
        ms.total_runs,
        p.username,
        p.avatar_url
      FROM monthly_stats ms
      LEFT JOIN profiles p ON ms.user_id = p.user_id
      WHERE ms.pincode = ? AND ms.year_month = ?
      ORDER BY ms.total_distance_meters DESC
    `).all(pincode, yearMonth);

    // Add rank
    const leaderboard = stats.map((entry, index) => ({
      user_id: entry.user_id,
      username: entry.username || 'Anonymous',
      avatar_url: entry.avatar_url,
      total_distance_meters: entry.total_distance_meters,
      total_runs: entry.total_runs,
      rank: index + 1
    }));

    res.json(leaderboard);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
