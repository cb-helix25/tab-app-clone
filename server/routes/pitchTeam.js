const express = require('express');
const router = express.Router();

// Simple in-memory cache
let cache = null;
let cacheTs = 0;
const CACHE_MS = 5 * 60 * 1000; // 5 minutes

async function fetchTeamData() {
  const now = Date.now();
  if (cache && now - cacheTs < CACHE_MS) return cache;

  try {
    const axios = require('axios');
    const code = process.env.REACT_APP_GET_TEAM_DATA_CODE;
    if (!code) throw new Error('REACT_APP_GET_TEAM_DATA_CODE missing');

    const resp = await axios.get(
      'https://helix-hub-api.azurewebsites.net/api/getTeamData',
      { params: { code } }
    );
    if (!Array.isArray(resp.data)) throw new Error('Invalid response');
    cache = resp.data;
    cacheTs = now;
    return cache;
  } catch (err) {
    // Fallback to static file
    // eslint-disable-next-line no-console
    console.warn('[pitchTeam] Falling back to static data:', err.message);
    cache = require('../../data/team-sql-data.json');
    cacheTs = now;
    return cache;
  }
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
