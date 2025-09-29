const express = require('express');
const { withRequest } = require('../utils/db');

const router = express.Router();

// Get all team data (shared pool + retry via withRequest)
router.get('/', async (_req, res) => {
  const connectionString = process.env.SQL_CONNECTION_STRING;
  if (!connectionString) {
    return res.status(500).json({ error: 'SQL_CONNECTION_STRING not configured' });
  }

  try {
    console.log('\ud83d\udd0d Fetching team data from SQL...');
    const rows = await withRequest(connectionString, async (request) => {
      const result = await request.query(`
        SELECT 
          [Created Date],
          [Created Time], 
          [Full Name],
          [Last],
          [First],
          [Nickname],
          [Initials],
          [Email],
          [Entra ID],
          [Clio ID],
          [Rate],
          [Role],
          [AOW],
          [holiday_entitlement],
          [status]
        FROM [dbo].[team]
        ORDER BY [Full Name]
      `);
      return Array.isArray(result.recordset) ? result.recordset : [];
    }, 2);

    console.log(`\u2705 Retrieved ${rows.length} team members from database`);
    const active = rows.filter((m) => String(m.status || '').toLowerCase() === 'active').length;
    const inactive = rows.filter((m) => String(m.status || '').toLowerCase() === 'inactive').length;
    console.log(`\ud83d\udcca Active: ${active}, Inactive: ${inactive}`);
    return res.json(rows);
  } catch (error) {
    console.error('\u274c Team data fetch error:', error);
    // For flows that can tolerate missing team data, degrade gracefully with empty array
    return res.status(200).json([]);
  }
});

module.exports = router;