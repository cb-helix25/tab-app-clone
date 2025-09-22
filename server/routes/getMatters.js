const express = require('express');
const sql = require('mssql');

const router = express.Router();

// Helper function to fetch matters from database
async function fetchMattersFromDb() {
    const conn = process.env.SQL_CONNECTION_STRING;
    
    if (!conn) {
        throw new Error('No SQL connection string found in SQL_CONNECTION_STRING');
    }
    
    console.log('� Fetching matters directly from helix-core-data database');
    
    let pool;
    try {
        pool = await sql.connect(conn);
        const result = await pool.request().query('SELECT * FROM Matters');
        
        if (!result.recordset || !Array.isArray(result.recordset)) {
            throw new Error('Query returned no valid recordset');
        }
        
        console.log(`✅ Successfully fetched ${result.recordset.length} matters from database`);
        return result.recordset;
    } catch (error) {
        console.error('❌ Database query failed:', error.message);
        throw new Error(`Database query failed: ${error.message}`);
    } finally {
        if (pool) {
            try {
                await pool.close();
            } catch (closeError) {
                console.warn('⚠️ Error closing database pool:', closeError.message);
            }
        }
    }
}

// Route: GET /api/getMatters
router.get('/', async (req, res) => {
    try {
        console.log('🔍 GET /api/getMatters called');
        const matters = await fetchMattersFromDb();
        res.json({ matters, count: matters.length });
    } catch (err) {
        console.error('❌ Error fetching matters:', err.message);
        res.status(500).json({ 
            error: 'Failed to fetch matters from database', 
            details: err.message 
        });
    }
});

// Route: POST /api/getMatters
router.post('/', async (req, res) => {
    const { fullName, limit } = req.body || {};
    
    try {
        console.log('🔍 POST /api/getMatters called for:', fullName);
        const matters = await fetchMattersFromDb();
        
        // Filter by fullName if provided (optional filtering logic)
        let filteredMatters = matters;
        if (fullName) {
            // You can add filtering logic here if needed
            console.log(`📊 Retrieved ${matters.length} total matters (filtering not implemented)`);
        }
        
        // Apply limit if provided
        if (limit && limit > 0) {
            filteredMatters = filteredMatters.slice(0, limit);
        }
        
        res.json({ matters: filteredMatters, count: filteredMatters.length });
    } catch (err) {
        console.error('❌ Error fetching matters:', err.message);
        res.status(500).json({ 
            error: 'Failed to fetch matters from database', 
            details: err.message 
        });
    }
});

module.exports = router;

