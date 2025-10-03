const express = require('express');
const { withRequest } = require('../utils/db');
const router = express.Router();

/**
 * GET /api/transactions
 * Fetch all transactions from helix-core-data database
 * Migrated from Azure Function to fix cold start issues with connection pooling
 */
router.get('/', async (req, res) => {
  const connectionString = process.env.SQL_CONNECTION_STRING;

  if (!connectionString) {
    console.error('[Transactions Route] SQL_CONNECTION_STRING environment variable is not set');
    return res.status(500).json({ error: 'Database configuration error' });
  }

  try {
    const result = await withRequest(connectionString, async (request) => {
      const query = `
        SELECT *
        FROM transactions
        ORDER BY transaction_date DESC
      `;
      return await request.query(query);
    });

    // Return the recordset
    res.json(result.recordset);
  } catch (error) {
    console.error('[Transactions Route] Error fetching transactions:', error);
    // Don't leak error details to browser
    res.status(500).json({ 
      error: 'Failed to fetch transactions'
    });
  }
});

module.exports = router;
