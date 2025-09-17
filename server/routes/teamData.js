const express = require('express');
const sql = require('mssql');
const router = express.Router();

// Get all team data
router.get('/', async (req, res) => {
  try {
    console.log('🔍 Fetching team data from SQL...');
    
    // Connect to the database using the same connection string as other routes
    const connectionString = process.env.SQL_CONNECTION_STRING;
    if (!connectionString) {
      throw new Error('SQL_CONNECTION_STRING not found in environment');
    }
    
    const pool = new sql.ConnectionPool(connectionString);
    await pool.connect();
    
    // Query team table for all members with all fields
    const result = await pool.request().query(`
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
    
    await pool.close();
    
    const teamData = result.recordset;
    console.log(`✅ Retrieved ${teamData.length} team members from database`);
    console.log(`📊 Active: ${teamData.filter(m => m.status?.toLowerCase() === 'active').length}, Inactive: ${teamData.filter(m => m.status?.toLowerCase() === 'inactive').length}`);
    
    res.json(teamData);
    
  } catch (error) {
    console.error('❌ Team data fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch team data',
      details: error.message 
    });
  }
});

module.exports = router;