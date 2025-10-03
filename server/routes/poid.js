/**
 * POID (Proof of ID) Routes
 * Handles POID records from the helix-core-data database
 */

const express = require('express');
const router = express.Router();
const { withRequest } = require('../utils/db');

/**
 * GET /api/poid-6years
 * Returns all POID entries submitted within the last 6 years
 */
router.get('/6years', async (req, res) => {
  const userDisplay = req.user ? `${req.user.initials} (${req.user.fullName})` : 'Unknown user';
  
  try {
    // Get connection string from environment (helix-core-data database)
    const connectionString = process.env.SQL_CONNECTION_STRING;
    if (!connectionString) {
      console.error(`[POID][${req.requestId}] SQL_CONNECTION_STRING not configured | User: ${userDisplay}`);
      return res.status(500).json({ error: 'Database configuration missing' });
    }

    // Calculate threshold date: today minus 6 years
    const today = new Date();
    const thresholdDate = new Date(today);
    thresholdDate.setFullYear(today.getFullYear() - 6);
    const formattedThresholdDate = thresholdDate.toISOString().split('T')[0];

    console.log(`[POID][${req.requestId}] User ${userDisplay} fetching POID entries since ${formattedThresholdDate}`);

    const result = await withRequest(
      connectionString,
      async (request) => {
        const query = `
          SELECT * FROM poid
          WHERE submission_date >= @ThresholdDate
          ORDER BY submission_date DESC
        `;
        
        request.input('ThresholdDate', formattedThresholdDate);
        return await request.query(query);
      }
    );

    console.log(`[POID][${req.requestId}] Retrieved ${result.recordset.length} POID entries for user ${req.user?.initials || 'Unknown'}`);
    res.json(result.recordset);
  } catch (error) {
    console.error(`[POID][${req.requestId}] Error for user ${req.user?.initials || 'Unknown'}:`, error);
    // Don't leak error details to browser
    res.status(500).json({ 
      error: 'Error retrieving POID entries'
    });
  }
});

module.exports = router;
