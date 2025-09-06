const express = require('express');
const sql = require('mssql');
const router = express.Router();

// Route: GET /api/enquiries-unified
// Direct database connections to fetch enquiries from BOTH database sources
router.get('/', async (req, res) => {
  try {
    console.log('🔵 UNIFIED ENQUIRIES ROUTE CALLED - Direct DB Connections');
    console.log('🔍 Query parameters:', req.query);

    // Connection strings for both databases
    const mainConnectionString = process.env.SQL_CONNECTION_STRING; // helix-core-data
    const instructionsConnectionString = process.env.INSTRUCTIONS_SQL_CONNECTION_STRING; // instructions DB

    if (!mainConnectionString || !instructionsConnectionString) {
      console.error('❌ Required connection strings not found in environment');
      return res.status(500).json({
        enquiries: [],
        count: 0,
        error: 'Database configuration missing'
      });
    }

    console.log('🔗 Connecting to both databases...');
    
    // Create connection pools for both databases
    const mainPool = new sql.ConnectionPool(mainConnectionString);
    const instructionsPool = new sql.ConnectionPool(instructionsConnectionString);
    
    // Connect to both databases in parallel
    await Promise.all([
      mainPool.connect(),
      instructionsPool.connect()
    ]);
    
    console.log('✅ Connected to both databases, querying enquiries tables');
    
    // Query main enquiries table (helix-core-data)
    const mainEnquiriesQuery = `
      SELECT 
        id,
        datetime,
        stage,
        claim,
        poc,
        pitch,
        aow,
        tow,
        moc,
        rep,
        first,
        last,
        email,
        phone,
        value,
        notes,
        rank,
        rating,
        acid,
        card_id,
        source,
        url,
        contact_referrer,
        company_referrer,
        gclid,
        'main' as db_source
      FROM enquiries
      ORDER BY datetime DESC
    `;

    // Query instructions database for any additional enquiry data
    // Note: This might be a different table structure - adjust as needed
    const instructionsEnquiriesQuery = `
      SELECT 
        ProspectId as acid,
        FirstName as first,
        LastName as last,
        Email as email,
        Phone,
        SubmissionDate as datetime,
        Stage,
        Notes,
        'instructions' as db_source
      FROM dbo.Instructions
      WHERE ProspectId IS NOT NULL
      ORDER BY SubmissionDate DESC
    `;

    // Execute both queries in parallel
    const [mainResult, instructionsResult] = await Promise.all([
      mainPool.request().query(mainEnquiriesQuery),
      instructionsPool.request().query(instructionsEnquiriesQuery).catch(err => {
        console.warn('⚠️ Instructions enquiries query failed (non-blocking):', err.message);
        return { recordset: [] }; // Return empty result if this query fails
      })
    ]);
    
    console.log(`✅ Main DB: ${mainResult.recordset.length} enquiries`);
    console.log(`✅ Instructions DB: ${instructionsResult.recordset.length} enquiries`);
    
    // Merge results from both databases
    const allEnquiries = [
      ...mainResult.recordset,
      ...instructionsResult.recordset
    ];

    // Remove duplicates based on acid (ProspectId)
    const uniqueEnquiries = [];
    const seenAcids = new Set();
    
    for (const enquiry of allEnquiries) {
      if (enquiry.acid && !seenAcids.has(enquiry.acid)) {
        seenAcids.add(enquiry.acid);
        uniqueEnquiries.push(enquiry);
      } else if (!enquiry.acid) {
        // Include enquiries without acid (they can't be duplicates)
        uniqueEnquiries.push(enquiry);
      }
    }

    console.log(`✅ Unified result: ${uniqueEnquiries.length} unique enquiries from both databases`);
    
    // Return data in expected format
    res.json({
      enquiries: uniqueEnquiries,
      count: uniqueEnquiries.length,
      sources: {
        main: mainResult.recordset.length,
        instructions: instructionsResult.recordset.length,
        unique: uniqueEnquiries.length
      }
    });
    
    // Close both connections
    await Promise.all([
      mainPool.close(),
      instructionsPool.close()
    ]);
    
  } catch (err) {
    console.warn('❌ Error fetching unified enquiries from databases:', err.message);
    console.error('Full error:', err);
    // Return empty data instead of 500 error - don't block app
    res.status(200).json({ 
      enquiries: [], 
      count: 0, 
      error: 'Databases temporarily unavailable',
      sources: {
        main: 0,
        instructions: 0,
        unique: 0
      }
    });
  }
});

module.exports = router;
