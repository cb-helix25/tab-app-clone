const express = require('express');
const router = express.Router();
const { getTeamData } = require('../utils/teamData');

// Simple in-memory cache for route responses
let cache = null;
let cacheTs = 0;
const CACHE_MS = 5 * 60 * 1000; // 5 minutes

async function fetchTeamData() {
  const now = Date.now();
  if (cache && now - cacheTs < CACHE_MS) return cache;
  const data = await getTeamData(); // DB-first, then API, then static JSON
  cache = data;
  cacheTs = now;
  return cache;
}

// GET /api/pitch-team
router.get('/', async (_req, res) => {
  try {
    const data = await fetchTeamData();
    res.json(data);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[pitchTeam] Error:', e);
    res.status(500).json({ error: 'Failed to retrieve team data' });
  }
});

module.exports = router;
