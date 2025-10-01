const express = require('express');
const { withRequest, sql } = require('../utils/db');
const router = express.Router();

// Route: GET /api/enquiries-unified
// Direct database connections to fetch enquiries from BOTH database sources
router.get('/', async (req, res) => {
  try {
  // Unified enquiries route called

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

  // Connecting to databases
    
    // Sequential database queries to avoid overwhelming connections
    const mainEnquiries = await withRequest(mainConnectionString, async (request) => {
      const result = await request.query(`
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
      `);
      return Array.isArray(result.recordset) ? result.recordset : [];
    });

    // Instructions database query (currently disabled due to connection issues)
    const instructionsEnquiries = []; // Empty for now to prevent timeout issues
    
    // TODO: Enable instructions query when database connection is stable
    // const instructionsEnquiries = await withRequest(instructionsConnectionString, async (request) => {
    //   // Instructions query would go here
    //   return [];
    // });

    // Merge results from both databases
    const allEnquiries = [
      ...mainEnquiries,
      ...instructionsEnquiries
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

  // Unified result prepared
    
    // Return data in expected format
    res.json({
      enquiries: uniqueEnquiries,
      count: uniqueEnquiries.length,
      sources: {
        main: mainEnquiries.length,
        instructions: instructionsEnquiries.length,
        unique: uniqueEnquiries.length
      }
    });
    
    // Connection cleanup handled automatically by withRequest utility
    
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
  const { ID, ...updates } = req.body;
  
  if (!ID) {
    return res.status(400).json({ error: 'Enquiry ID is required' });
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No updates provided' });
  }

  try {
    // Connection string for main database (helix-core-data) only
    const mainConnectionString = process.env.SQL_CONNECTION_STRING;

    if (!mainConnectionString) {
      console.error('❌ Main connection string not found in environment');
      return res.status(500).json({ error: 'Database configuration missing' });
    }

    // Check if enquiry exists in main database using withRequest utility
    const checkMainQuery = `SELECT COUNT(*) as count FROM enquiries WHERE ID = @id`;
    
    const mainResult = await withRequest(mainConnectionString, async (request) => {
      request.input('id', sql.VarChar(50), ID);
      return await request.query(checkMainQuery);
    });
    
    const mainCount = mainResult.recordset[0]?.count || 0;
    

    if (mainCount === 0) {
      return res.status(404).json({ error: 'Enquiry not found' });
    }

    // Update in main database (helix-core-data) only
    
    const updateResult = await withRequest(mainConnectionString, async (request) => {
      const setClause = [];
      request.input('id', sql.VarChar(50), ID);
      
      // Map updates to main schema
      if (updates.First_Name !== undefined) {
        setClause.push('First_Name = @firstName');
        request.input('firstName', sql.VarChar(100), updates.First_Name);
      }
      if (updates.Last_Name !== undefined) {
        setClause.push('Last_Name = @lastName');
        request.input('lastName', sql.VarChar(100), updates.Last_Name);
      }
      if (updates.Email !== undefined) {
        setClause.push('Email = @email');
        request.input('email', sql.VarChar(255), updates.Email);
      }
      if (updates.Value !== undefined) {
        setClause.push('Value = @value');
        request.input('value', sql.VarChar(100), updates.Value);
      }
      if (updates.Initial_first_call_notes !== undefined) {
        setClause.push('Initial_first_call_notes = @notes');
        request.input('notes', sql.Text, updates.Initial_first_call_notes);
      }
      if (updates.Area_of_Work !== undefined) {
        setClause.push('Area_of_Work = @areaOfWork');
        request.input('areaOfWork', sql.VarChar(100), updates.Area_of_Work);
      }

      if (setClause.length > 0) {
        const updateQuery = `UPDATE enquiries SET ${setClause.join(', ')} WHERE ID = @id`;
        return await request.query(updateQuery);
      }
      return null;
    });

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
