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
  const userId = params.get('User ID');
  const password = params.get('Password');
  
  dbConfig = {
    server: server,
    database: database,
    user: userId,
    password: password,
    options: {
      encrypt: true,
      trustServerCertificate: false,
      enableArithAbort: true
    }
  };
  
  return dbConfig;
}

// GET /api/instruction-details/:instructionRef - Get instruction details for an instruction
router.get('/:instructionRef', async (req, res) => {
    try {
        const { instructionRef } = req.params;
        
        if (!instructionRef) {
            return res.status(400).json({ error: 'Instruction reference is required' });
        }

        // Get database configuration
        const config = await getDbConfig();
        
        // Connect to database
        const pool = await sql.connect(config);
        
        // Query Instructions table for this instruction
        const result = await pool.request()
            .input('instructionRef', sql.NVarChar, instructionRef)
            .query(`
                SELECT 
                    InstructionRef,
                    Stage,
                    ClientType,
                    HelixContact,
                    ConsentGiven,
                    InternalStatus,
                    SubmissionDate,
                    SubmissionTime,
                    LastUpdated,
                    ClientId,
                    RelatedClientId,
                    MatterId,
                    Title,
                    FirstName,
                    LastName,
                    Nationality,
                    NationalityAlpha2,
                    DOB,
                    Gender,
                    Phone,
                    Email,
                    PassportNumber,
                    DriversLicenseNumber,
                    IdType,
                    HouseNumber,
                    Street,
                    City,
                    County,
                    Postcode,
                    Country,
                    CountryCode,
                    CompanyName,
                    CompanyNumber,
                    CompanyHouseNumber,
                    CompanyStreet,
                    CompanyCity,
                    CompanyCounty,
                    CompanyPostcode,
                    CompanyCountry,
                    CompanyCountryCode,
                    Notes
                FROM Instructions 
                WHERE InstructionRef = @instructionRef
            `);

        await pool.close();

        // Format the results
        const instructions = result.recordset.map(instruction => ({
            ...instruction,
            // Format dates for display
            SubmissionDate: instruction.SubmissionDate ? instruction.SubmissionDate.toISOString().split('T')[0] : null,
            LastUpdated: instruction.LastUpdated ? instruction.LastUpdated.toISOString() : null,
            DOB: instruction.DOB ? instruction.DOB.toISOString().split('T')[0] : null,
            // Format time
            SubmissionTime: instruction.SubmissionTime ? instruction.SubmissionTime.toString() : null
        }));

        res.json({
            success: true,
            instructionRef,
            instructions,
            count: instructions.length
        });

    } catch (error) {
        console.error('Error fetching instruction details:', error);
        res.status(500).json({ 
            error: 'Failed to fetch instruction details',
            details: error.message 
        });
    }
});

module.exports = router;