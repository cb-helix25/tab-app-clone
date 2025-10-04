const express = require('express');
const { withRequest, sql } = require('../utils/db');
const router = express.Router();

// Route: GET /api/enquiries-unified
// Direct database connections to fetch enquiries from BOTH database sources
router.get('/', async (req, res) => {
  try {
  // Unified enquiries route called

    // Parse query parameters for filtering and pagination
    const limit = Math.min(parseInt(req.query.limit, 10) || 1000, 2500); // Default 1000, max 2500
    const email = (req.query.email || '').trim().toLowerCase();
    const initials = (req.query.initials || '').trim().toLowerCase();
    const includeTeamInbox = String(req.query.includeTeamInbox || 'true').toLowerCase() === 'true';
    const fetchAll = String(req.query.fetchAll || 'false').toLowerCase() === 'true';
    const dateFrom = req.query.dateFrom || '';
    const dateTo = req.query.dateTo || '';

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
      // Build WHERE clause dynamically
      const filters = [];
      
      // Date range filtering
      if (dateFrom) {
        request.input('dateFrom', sql.DateTime2, new Date(dateFrom));
        filters.push('Date_Created >= @dateFrom');
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        request.input('dateTo', sql.DateTime2, endDate);
        filters.push('Date_Created <= @dateTo');
      }

      // User filtering (unless fetchAll is true)
      if (!fetchAll && (email || initials)) {
        const pocConditions = [];
        
        if (email) {
          request.input('userEmail', sql.VarChar(255), email);
          pocConditions.push("LOWER(LTRIM(RTRIM(Point_of_Contact))) = @userEmail");
        }
        
        if (initials) {
          request.input('userInitials', sql.VarChar(50), initials.replace(/\./g, ''));
          pocConditions.push(
            "LOWER(REPLACE(REPLACE(LTRIM(RTRIM(Point_of_Contact)), ' ', ''), '.', '')) = @userInitials"
          );
        }

        if (includeTeamInbox) {
          pocConditions.push("LOWER(LTRIM(RTRIM(Point_of_Contact))) IN ('team@helix-law.com', 'team', 'team inbox')");
        }

        if (pocConditions.length > 0) {
          filters.push(`(${pocConditions.join(' OR ')})`);
        }
      }

      request.input('limit', sql.Int, limit);
      
      const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

      console.log(`📊 Enquiries query: limit=${limit}, filters=${filters.length}, fetchAll=${fetchAll}`);

      const result = await request.query(`
        SELECT TOP (@limit)
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
        ${whereClause}
        ORDER BY Date_Created DESC
      `);
      console.log(`✅ Retrieved ${result.recordset?.length || 0} enquiries from main DB`);
      return Array.isArray(result.recordset) ? result.recordset : [];
      return Array.isArray(result.recordset) ? result.recordset : [];
    });

    // Instructions database query - now enabled for cross-reference analysis
    let instructionsEnquiries = [];
    
    try {
      instructionsEnquiries = await withRequest(instructionsConnectionString, async (request) => {
        // Simple query to get all instructions enquiries for cross-reference
        const result = await request.query(`
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
            'instructions' as db_source
          FROM enquiries
          ORDER BY datetime DESC
        `);
        console.log(`✅ Retrieved ${result.recordset?.length || 0} enquiries from instructions DB`);
        return Array.isArray(result.recordset) ? result.recordset : [];
      });
    } catch (instructionsError) {
      console.warn('⚠️ Instructions DB unavailable, proceeding with main DB only:', instructionsError.message);
      instructionsEnquiries = [];
    }

    // Cross-reference analysis: match enquiries between databases
    const crossReferenceMap = new Map(); // key: main enquiry ID, value: match info
    
    mainEnquiries.forEach(mainEnq => {
      const matches = instructionsEnquiries.filter(instEnq => {
        // Match criteria: email exact match (highest priority)
        if (mainEnq.email && instEnq.email && 
            mainEnq.email.toLowerCase().trim() === instEnq.email.toLowerCase().trim()) {
          return true;
        }
        
        // Secondary match: name similarity + date proximity
        const mainFullName = `${mainEnq.first || ''} ${mainEnq.last || ''}`.trim().toLowerCase();
        const instFullName = `${instEnq.first || ''} ${instEnq.last || ''}`.trim().toLowerCase();
        
        if (mainFullName && instFullName && mainFullName === instFullName) {
          // Check date proximity (within 7 days)
          const mainDate = new Date(mainEnq.datetime);
          const instDate = new Date(instEnq.datetime);
          const daysDiff = Math.abs(mainDate - instDate) / (1000 * 60 * 60 * 24);
          
          if (daysDiff <= 7) {
            return true;
          }
        }
        
        return false;
      });
      
      let migrationStatus = 'not-migrated';
      let matchScore = 0;
      let matchedEnquiry = null;
      
      if (matches.length > 0) {
        // Take the best match (first one for now)
        matchedEnquiry = matches[0];
        
        // Calculate match quality
        if (mainEnq.email && matchedEnquiry.email && 
            mainEnq.email.toLowerCase().trim() === matchedEnquiry.email.toLowerCase().trim()) {
          matchScore = 100; // Perfect email match
          migrationStatus = 'migrated';
        } else {
          matchScore = 70; // Name + date match
          migrationStatus = 'partial';
        }
      }
      
      crossReferenceMap.set(mainEnq.ID, {
        migrationStatus,
        matchScore,
        instructionsId: matchedEnquiry?.id || null,
        matchedData: matchedEnquiry
      });
      
      // Add migration metadata to the main enquiry object
      mainEnq.migrationStatus = migrationStatus;
      mainEnq.matchScore = matchScore;
      mainEnq.instructionsId = matchedEnquiry?.id || null;
    });

    // Mark instructions enquiries that don't have main counterparts
    instructionsEnquiries.forEach(instEnq => {
      const hasMainCounterpart = Array.from(crossReferenceMap.values())
        .some(ref => ref.instructionsId === instEnq.id);
      
      if (!hasMainCounterpart) {
        instEnq.migrationStatus = 'instructions-only';
        instEnq.matchScore = 0;
        instEnq.mainId = null;
      }
    });

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
    
    // Calculate migration statistics
    const migrationStats = {
      total: mainEnquiries.length,
      migrated: 0,
      partial: 0,
      notMigrated: 0,
      instructionsOnly: instructionsEnquiries.filter(e => e.migrationStatus === 'instructions-only').length
    };
    
    mainEnquiries.forEach(enq => {
      switch (enq.migrationStatus) {
        case 'migrated':
          migrationStats.migrated++;
          break;
        case 'partial':
          migrationStats.partial++;
          break;
        case 'not-migrated':
          migrationStats.notMigrated++;
          break;
      }
    });
    
    const migrationRate = migrationStats.total > 0 
      ? ((migrationStats.migrated / migrationStats.total) * 100).toFixed(1)
      : '0.0';
    
    const responsePayload = {
      enquiries: uniqueEnquiries,
      count: uniqueEnquiries.length,
      sources: {
        main: mainEnquiries.length,
        instructions: instructionsEnquiries.length,
        unique: uniqueEnquiries.length
      },
      migration: {
        ...migrationStats,
        migrationRate: `${migrationRate}%`,
        crossReferenceMap: Object.fromEntries(crossReferenceMap)
      }
    };
    
    const payloadSize = JSON.stringify(responsePayload).length;
    const payloadMB = (payloadSize / 1024 / 1024).toFixed(2);
    console.log(`📦 Response: ${uniqueEnquiries.length} enquiries, ${payloadMB}MB payload`);
    
    // Return data in expected format
    res.json(responsePayload);
    
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
