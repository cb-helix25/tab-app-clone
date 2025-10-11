const express = require('express');
const { withRequest, sql } = require('../utils/db');
const { cacheUnified, generateCacheKey, CACHE_CONFIG } = require('../utils/redisClient');
const router = express.Router();

// Route: GET /api/enquiries-unified
// Direct database connections to fetch enquiries from BOTH database sources
router.get('/', async (req, res) => {
  try {
    console.log('📊 Unified enquiries route called');

    // Parse query parameters for filtering and pagination
    const limit = Math.min(parseInt(req.query.limit, 10) || 1000, 2500); // Default 1000, max 2500
    const email = (req.query.email || '').trim().toLowerCase();
    const initials = (req.query.initials || '').trim().toLowerCase();
    const includeTeamInbox = String(req.query.includeTeamInbox || 'true').toLowerCase() === 'true';
    const fetchAll = String(req.query.fetchAll || 'false').toLowerCase() === 'true';
    const dateFrom = req.query.dateFrom || '';
    const dateTo = req.query.dateTo || '';
    const bypassCache = String(req.query.bypassCache || 'false').toLowerCase() === 'true';

    // Generate cache key based on query parameters
    const cacheParams = [
      limit,
      email,
      initials,
      includeTeamInbox,
      fetchAll,
      dateFrom,
      dateTo
    ].filter(p => p !== '' && p !== null && p !== undefined);

    const cacheKey = generateCacheKey(
      CACHE_CONFIG.PREFIXES.UNIFIED,
      'enquiries',
      ...cacheParams
    );

    // Use Redis cache wrapper if not bypassed
    if (!bypassCache) {
      const result = await cacheUnified([cacheKey], async () => {
        return await performUnifiedEnquiriesQuery(req.query);
      });
      return res.json(result);
    }

    // Bypass cache - direct query
    const result = await performUnifiedEnquiriesQuery(req.query);
    res.json({ ...result, cached: false });

  } catch (error) {
    console.error('❌ Error in enquiries-unified route:', error);
    // Return a tolerant 200 with warnings to avoid blocking the UI
    res.status(200).json({
      enquiries: [],
      count: 0,
      sources: { main: 0, instructions: 0, unique: 0 },
      warnings: [{ source: 'unified', message: error?.message || 'Unknown error' }],
      migration: { total: 0, migrated: 0, partial: 0, notMigrated: 0, instructionsOnly: 0, migrationRate: '0.0%', crossReferenceMap: {} }
    });
  }
});

/**
 * Perform the actual unified enquiries query (extracted for caching)
 */
async function performUnifiedEnquiriesQuery(queryParams) {
  console.log('🔍 Performing fresh unified enquiries query');

  const limit = Math.min(parseInt(queryParams.limit, 10) || 1000, 2500);
  const email = (queryParams.email || '').trim().toLowerCase();
  const initials = (queryParams.initials || '').trim().toLowerCase();
  const includeTeamInbox = String(queryParams.includeTeamInbox || 'true').toLowerCase() === 'true';
  const fetchAll = String(queryParams.fetchAll || 'false').toLowerCase() === 'true';
  const dateFrom = queryParams.dateFrom || '';
  const dateTo = queryParams.dateTo || '';

  // Connection strings for both databases
  const mainConnectionString = process.env.SQL_CONNECTION_STRING; // helix-core-data
  const instructionsConnectionString = process.env.INSTRUCTIONS_SQL_CONNECTION_STRING; // instructions DB

  if (!mainConnectionString || !instructionsConnectionString) {
    console.error('❌ Required connection strings not found in environment');
    throw new Error('Database configuration missing');
  }

  // Collect warnings and debug info
  const warnings = [];

  // Main DB query
  let mainEnquiries = [];
  let mainWhereClause = '';
  try {
    const result = await withRequest(mainConnectionString, async (request) => {
      const filters = [];

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
          pocConditions.push("LOWER(REPLACE(REPLACE(LTRIM(RTRIM(Point_of_Contact)), ' ', ''), '.', '')) = @userInitials");
        }
        if (includeTeamInbox) {
          pocConditions.push("LOWER(LTRIM(RTRIM(Point_of_Contact))) IN ('team@helix-law.com', 'team', 'team inbox')");
        }
        if (pocConditions.length > 0) filters.push(`(${pocConditions.join(' OR ')})`);
      }

      request.input('limit', sql.Int, limit);
      mainWhereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

      return await request.query(`
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
          NULL as uid,
          NULL as displayNumber,
          NULL as postcode,
          Initial_first_call_notes,
          Initial_first_call_notes as notes,
          NULL as convertDate,
          'main' as source,
          'not-checked' as migrationStatus
        FROM enquiries
        ${mainWhereClause}
        ORDER BY Date_Created DESC
      `);
    });
    mainEnquiries = Array.isArray(result.recordset) ? result.recordset : [];
  } catch (err) {
    console.error('❌ Main DB enquiries query failed:', err?.message || err);
    warnings.push({ source: 'main', message: err?.message || String(err) });
    mainEnquiries = [];
  }

  // Instructions DB query
  let instructionsEnquiries = [];
  let instWhereClause = '';
  try {
    const result = await withRequest(instructionsConnectionString, async (request) => {
      const filters = [];
      if (dateFrom) {
        request.input('dateFrom', sql.DateTime2, new Date(dateFrom));
        filters.push('datetime >= @dateFrom');
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        request.input('dateTo', sql.DateTime2, endDate);
        filters.push('datetime <= @dateTo');
      }
      if (!fetchAll && (email || initials)) {
        const pocConditions = [];
        if (email) {
          request.input('userEmail', sql.VarChar(255), email);
          pocConditions.push("LOWER(LTRIM(RTRIM(poc))) = @userEmail");
        }
        if (initials) {
          request.input('userInitials', sql.VarChar(50), initials.replace(/\./g, ''));
          pocConditions.push("LOWER(REPLACE(REPLACE(LTRIM(RTRIM(poc)), ' ', ''), '.', '')) = @userInitials");
        }
        if (includeTeamInbox) {
          pocConditions.push("LOWER(LTRIM(RTRIM(poc))) IN ('team@helix-law.com', 'team', 'team inbox')");
        }
        if (pocConditions.length > 0) filters.push(`(${pocConditions.join(' OR ')})`);
      }
      request.input('limit', sql.Int, limit);
      instWhereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

      return await request.query(`
        SELECT TOP (@limit)
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
          NULL as uid,
          NULL as displayNumber,
          NULL as postcode,
          notes,
          NULL as convertDate,
          'instructions' as source,
          'not-checked' as migrationStatus
        FROM dbo.enquiries
        ${instWhereClause}
        ORDER BY datetime DESC
      `);
    });
    instructionsEnquiries = Array.isArray(result.recordset) ? result.recordset : [];
  } catch (err) {
    console.error('❌ Instructions DB enquiries query failed:', err?.message || err);
    warnings.push({ source: 'instructions', message: err?.message || String(err) });
    instructionsEnquiries = [];
  }

  // Cross-reference and merge
  const crossReferenceMap = new Map();
  // by uid
  mainEnquiries.forEach(mainEnq => {
    if (mainEnq.uid || mainEnq.Unique_ID) {
      const uid = mainEnq.uid || mainEnq.Unique_ID;
      const match = instructionsEnquiries.find(inst => inst.uid === uid || inst.uid === String(uid));
      if (match) {
        crossReferenceMap.set(mainEnq.id, match.id);
        mainEnq.migrationStatus = 'migrated';
        match.migrationStatus = 'migrated';
      }
    }
  });
  // by email/phone
  mainEnquiries.forEach(mainEnq => {
    if (mainEnq.migrationStatus === 'not-checked' && (mainEnq.email || mainEnq.phone)) {
      const match = instructionsEnquiries.find(inst => inst.migrationStatus === 'not-checked' && (
        (mainEnq.email && inst.email && mainEnq.email.toLowerCase() === inst.email.toLowerCase()) ||
        (mainEnq.phone && inst.phone && mainEnq.phone === inst.phone)
      ));
      if (match) {
        crossReferenceMap.set(mainEnq.id, match.id);
        mainEnq.migrationStatus = 'partial';
        match.migrationStatus = 'partial';
      }
    }
  });

  const allEnquiries = [...mainEnquiries, ...instructionsEnquiries];
  const uniqueEnquiries = [];
  const seenIds = new Set();
  for (const enquiry of allEnquiries) {
    const enquiryId = enquiry.id || enquiry.acid; // keep acid fallback for legacy rows
    if (enquiryId && !seenIds.has(enquiryId)) {
      seenIds.add(enquiryId);
      uniqueEnquiries.push(enquiry);
    } else if (!enquiryId) {
      uniqueEnquiries.push(enquiry);
    }
  }

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
    warnings,
    debug: {
      mainWhereClause,
      instWhereClause
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

  return responsePayload;
}

// (removed corrupted duplicate POST /update route)

// Route: POST /api/enquiries-unified/update
// Update enquiry fields in the main database
router.post('/update', async (req, res) => {
  const { ID, ...updates } = req.body;

  if (!ID) return res.status(400).json({ error: 'Enquiry ID is required' });
  if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'No updates provided' });

  try {
    const mainConnectionString = process.env.SQL_CONNECTION_STRING;
    if (!mainConnectionString) {
      console.error('❌ Main connection string not found in environment');
      return res.status(500).json({ error: 'Database configuration missing' });
    }

    const checkMainQuery = `SELECT COUNT(*) as count FROM enquiries WHERE ID = @id`;
    const mainResult = await withRequest(mainConnectionString, async (request) => {
      request.input('id', sql.VarChar(50), ID);
      return await request.query(checkMainQuery);
    });
    const mainCount = mainResult.recordset[0]?.count || 0;
    if (mainCount === 0) return res.status(404).json({ error: 'Enquiry not found' });

    await withRequest(mainConnectionString, async (request) => {
      const setClause = [];
      request.input('id', sql.VarChar(50), ID);

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
        await request.query(updateQuery);
      }
    });

    res.status(200).json({
      success: true,
      message: 'Enquiry updated successfully',
      enquiryId: ID,
      updatedTables: { main: true }
    });

  } catch (error) {
    console.error('❌ Error updating enquiry:', error);
    res.status(500).json({ error: 'Failed to update enquiry', details: error?.message || 'Unknown error' });
  }
});

module.exports = router;
