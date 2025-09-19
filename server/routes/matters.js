const express = require('express');
const sql = require('mssql');
const { getSecret } = require('../utils/getSecret');

const router = express.Router();

// Database connection configuration
let dbConfig = null;

async function getDbConfig() {
  if (dbConfig) return dbConfig;
  
  // Use the INSTRUCTIONS_SQL_CONNECTION_STRING from .env
  const connectionString = process.env.INSTRUCTIONS_SQL_CONNECTION_STRING;
  if (!connectionString) {
    throw new Error('INSTRUCTIONS_SQL_CONNECTION_STRING not found in environment');
  }
  
  // Parse connection string into config object
  const params = new URLSearchParams(connectionString.split(';').join('&'));
  const server = params.get('Server').replace('tcp:', '').split(',')[0];
  const database = params.get('Initial Catalog');
  const user = params.get('User ID');
  const password = params.get('Password');
  
  dbConfig = {
    server,
    database, 
    user,
    password,
    options: {
      encrypt: true,
      trustServerCertificate: false,
      enableArithAbort: true
    }
  };
  
  return dbConfig;
}

// Database connection pool
let pool;

// Initialize database connection
async function initializeDatabase() {
    if (!pool) {
        const config = await getDbConfig();
        pool = new sql.ConnectionPool(config);
        await pool.connect();
    }
    return pool;
}

/**
 * Get matter details from our database by instruction reference
 */
router.get('/details/:instructionRef', async (req, res) => {
    try {
        const { instructionRef } = req.params;
        
        // Initialize database connection
        await initializeDatabase();
        
        // Query matter details from database
        const result = await pool.request()
            .input('instructionRef', instructionRef)
            .query(`
                SELECT MatterID, InstructionRef, Status, OpenDate, OpenTime, CloseDate,
                       ClientID, RelatedClientID, DisplayNumber, ClientName, ClientType,
                       Description, PracticeArea, ApproxValue, ResponsibleSolicitor,
                       OriginatingSolicitor, SupervisingPartner, Source, Referrer,
                       method_of_contact, OpponentID, OpponentSolicitorID
                FROM Matters 
                WHERE InstructionRef = @instructionRef
            `);
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'No matter found for this instruction' });
        }
        
        // Return the first matter (there should typically be only one per instruction)
        const matter = result.recordset[0];
        
        // Format dates for display
        if (matter.OpenDate) {
            matter.FormattedOpenDate = new Date(matter.OpenDate).toLocaleDateString('en-GB');
        }
        if (matter.CloseDate) {
            matter.FormattedCloseDate = new Date(matter.CloseDate).toLocaleDateString('en-GB');
        }
        if (matter.OpenTime) {
            // Format time from SQL time format
            const timeStr = matter.OpenTime.toString();
            matter.FormattedOpenTime = timeStr.substring(0, 5); // HH:MM format
        }
        
        res.json(matter);
        
    } catch (error) {
        console.error('Error fetching matter details:', error);
        res.status(500).json({ error: 'Failed to fetch matter details' });
    }
});

router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const initials = (process.env.CLIO_USER_INITIALS || 'lz').toLowerCase();
        const cid = await getSecret(`${initials}-clio-v1-clientid`);
        const cs = await getSecret(`${initials}-clio-v1-clientsecret`);
        const rt = await getSecret(`${initials}-clio-v1-refreshtoken`);
        // Use the EU endpoint by default to match credentials
        const clioBase = process.env.CLIO_BASE || 'https://eu.app.clio.com';
        const tokenUrl = `${clioBase}/oauth/token?client_id=${cid}&client_secret=${cs}&grant_type=refresh_token&refresh_token=${rt}`;
        const tr = await fetch(tokenUrl, { method: 'POST' });
        if (!tr.ok) throw new Error(await tr.text());
        const { access_token } = await tr.json();
        const clioApiBase = process.env.CLIO_API_BASE || `${clioBase}/api/v4`;
        const resp = await fetch(`${clioApiBase}/matters/${id}`, {
            headers: { Authorization: `Bearer ${access_token}` }
        });
        if (!resp.ok) throw new Error(await resp.text());
        const data = await resp.json();
        res.json({ display_number: data?.data?.display_number || '' });
    } catch (err) {
        console.error('Matter proxy failed', err);
        res.status(500).json({ error: 'Failed to fetch matter' });
    }
});

module.exports = router;