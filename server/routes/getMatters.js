const express = require('express');
const sql = require('mssql');
const { DefaultAzureCredential } = require('@azure/identity');
const { SecretClient } = require('@azure/keyvault-secrets');

// Cache resolved SQL connection string to avoid repeated KV calls
let cachedSqlConn = null;
let cachedSqlConnError = null;

// Resolve SQL connection string with fallbacks:
// 1) process.env.SQL_CONNECTION_STRING
// 2) Azure Key Vault: try common secret names in order
async function resolveSqlConnectionString() {
    if (cachedSqlConn) return cachedSqlConn;
    if (cachedSqlConnError) throw cachedSqlConnError;

    // Env first
    const envConn = process.env.SQL_CONNECTION_STRING;
    if (envConn && envConn.trim()) {
        cachedSqlConn = envConn.trim();
        return cachedSqlConn;
    }

    // Try Key Vault
    try {
        const vaultUrl = process.env.KEY_VAULT_URL || 'https://helix-keys.vault.azure.net/';
        const credential = new DefaultAzureCredential();
        const client = new SecretClient(vaultUrl, credential);

        const candidateNames = [
            'SQL_CONNECTION_STRING',
            'sql-connection-string',
            'helix-core-data-connection-string'
        ];

        for (const name of candidateNames) {
            try {
                const secret = await client.getSecret(name);
                if (secret?.value) {
                    cachedSqlConn = secret.value;
                    return cachedSqlConn;
                }
            } catch (innerErr) {
                // try next
            }
        }

        throw new Error('No SQL connection string found in env or Key Vault');
    } catch (err) {
        cachedSqlConnError = err;
        throw err;
    }
}

const router = express.Router();

// Helper function to fetch matters from database
async function fetchMattersFromDb() {
    const conn = await resolveSqlConnectionString();
    console.log('🔗 Using SQL connection for getMatters (length hidden)');

    let pool;
    try {
        // Use a dedicated connection pool for this request to ensure correct DB context
        pool = await new sql.ConnectionPool(conn).connect();
        const result = await pool.request().query('SELECT * FROM [dbo].[Matters]');
        
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

