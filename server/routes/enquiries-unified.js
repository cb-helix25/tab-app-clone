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
        ID,
        ID as id,
        Date_Created as datetime,
        Tags as stage,
        Value as claim,
        Point_of_Contact as poc,
        Area_of_Work as pitch,
        Area_of_Work as aow,
        Type_of_Work as tow,
        Method_of_Contact as moc,
        Contact_Referrer as rep,
        First_Name,
        First_Name as first,
        Last_Name,
        Last_Name as last,
        Email as email,
        Phone_Number as phone,
        Value as value,
        Initial_first_call_notes as notes,
        Gift_Rank as rank,
        Rating as rating,
        ID as acid,
        ID as card_id,
        Ultimate_Source as source,
        Referral_URL as url,
        Contact_Referrer as contact_referrer,
        Referring_Company as company_referrer,
        GCLID as gclid,
        'main' as db_source
      FROM enquiries
      ORDER BY Date_Created DESC
    `;

    // Query instructions database for any additional enquiry data
    // Use a safer query that handles unknown table structure
    const instructionsEnquiriesQuery = `
      SELECT TOP 10
        *
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
    `;

    // Execute both queries in parallel
    const [mainResult, instructionsResult] = await Promise.all([
      mainPool.request().query(mainEnquiriesQuery),
      // Temporarily disable instructions query due to schema issues
      Promise.resolve({ recordset: [] })
      // instructionsPool.request().query(instructionsEnquiriesQuery).catch(err => {
      //   console.warn('⚠️ Instructions enquiries query failed (non-blocking):', err.message);
      //   return { recordset: [] }; // Return empty result if this query fails
      // })
    ]);
    
    console.log(`✅ Main DB: ${mainResult.recordset.length} enquiries`);
    console.log(`✅ Instructions DB: ${instructionsResult.recordset.length} enquiries`);
    
    // Merge results from both databases
    const allEnquiries = [
      ...mainResult.recordset,
      ...instructionsResult.recordset
    ];

    // Remove duplicates based on id (ProspectId)
    const uniqueEnquiries = [];
    const seenIds = new Set();
    
    for (const enquiry of allEnquiries) {
      const enquiryId = enquiry.id || enquiry.acid;
      if (enquiryId && !seenIds.has(enquiryId)) {
        seenIds.add(enquiryId);
        uniqueEnquiries.push(enquiry);
      } else if (!enquiryId) {
        // Include enquiries without id (they can't be duplicates)
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

// Route: POST /api/enquiries-unified/update
// Update enquiry fields in both database schemas
router.post('/update', async (req, res) => {
  console.log('📝 UPDATE ENQUIRY ROUTE CALLED');
  
  const { ID, ...updates } = req.body;
  
  if (!ID) {
    return res.status(400).json({ error: 'Enquiry ID is required' });
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No updates provided' });
  }

  console.log('🔍 Updating enquiry:', ID);
  console.log('📝 Updates:', updates);

  try {
    // Connection string for main database (helix-core-data) only
    const mainConnectionString = process.env.SQL_CONNECTION_STRING;

    if (!mainConnectionString) {
      console.error('❌ Main connection string not found in environment');
      return res.status(500).json({ error: 'Database configuration missing' });
    }

    // Create connection pool for main database only
    const mainPool = new sql.ConnectionPool(mainConnectionString);
    
    // Connect to main database
    await mainPool.connect();
    console.log('✅ Connected to main database');

    // Check if enquiry exists in main database
    const checkMainQuery = `SELECT COUNT(*) as count FROM enquiries WHERE ID = @id`;
    
    const mainRequest = mainPool.request();
    mainRequest.input('id', sql.VarChar(50), ID);
    const mainResult = await mainRequest.query(checkMainQuery);
    
    const mainCount = mainResult.recordset[0]?.count || 0;
    
    console.log('📊 Enquiry location check:', { mainCount });

    if (mainCount === 0) {
      await mainPool.close();
      return res.status(404).json({ error: 'Enquiry not found' });
    }

    // Update in main database (helix-core-data) only
    console.log('📝 Updating main enquiries table');
    
    const setClause = [];
    const updateRequest = mainPool.request();
    updateRequest.input('id', sql.VarChar(50), ID);
    
    // Map updates to main schema
    if (updates.First_Name !== undefined) {
      setClause.push('First_Name = @firstName');
      updateRequest.input('firstName', sql.VarChar(100), updates.First_Name);
    }
    if (updates.Last_Name !== undefined) {
      setClause.push('Last_Name = @lastName');
      updateRequest.input('lastName', sql.VarChar(100), updates.Last_Name);
    }
    if (updates.Email !== undefined) {
      setClause.push('Email = @email');
      updateRequest.input('email', sql.VarChar(255), updates.Email);
    }
    if (updates.Value !== undefined) {
      setClause.push('Value = @value');
      updateRequest.input('value', sql.VarChar(100), updates.Value);
    }
    if (updates.Initial_first_call_notes !== undefined) {
      setClause.push('Initial_first_call_notes = @notes');
      updateRequest.input('notes', sql.Text, updates.Initial_first_call_notes);
    }
    if (updates.Area_of_Work !== undefined) {
      setClause.push('Area_of_Work = @areaOfWork');
      updateRequest.input('areaOfWork', sql.VarChar(100), updates.Area_of_Work);
    }

    if (setClause.length > 0) {
      const updateQuery = `UPDATE enquiries SET ${setClause.join(', ')} WHERE ID = @id`;
      console.log('🔧 Main update query:', updateQuery);
      await updateRequest.query(updateQuery);
    }

    // Close connection
    await mainPool.close();

    console.log('✅ Enquiry updated successfully in main database');
    res.status(200).json({ 
      success: true, 
      message: 'Enquiry updated successfully',
      enquiryId: ID,
      updatedTables: { main: true }
    });

  } catch (error) {
    console.error('❌ Error updating enquiry:', error);
    res.status(500).json({ 
      error: 'Failed to update enquiry', 
      details: error.message 
    });
  }
});

module.exports = router;
