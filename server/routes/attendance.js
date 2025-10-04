const express = require('express');
const { sql, withRequest } = require('../utils/db');
const axios = require('axios');
const { DefaultAzureCredential } = require('@azure/identity');
const { SecretClient } = require('@azure/keyvault-secrets');
const router = express.Router();

const TRANSIENT_SQL_CODES = new Set(['ESOCKET', 'ECONNCLOSED', 'ECONNRESET', 'ETIMEDOUT', 'ETIMEOUT']);
const DEFAULT_ATTENDANCE_RETRIES = Number(process.env.SQL_ATTENDANCE_MAX_RETRIES || 4);

const isTransientSqlError = (error) => {
  const code = error?.code || error?.originalError?.code || error?.cause?.code;
  if (code && TRANSIENT_SQL_CODES.has(String(code))) {
    return true;
  }
  const message = error?.message || error?.originalError?.message || '';
  return typeof message === 'string' && /ECONNRESET|ECONNCLOSED|ETIMEOUT|ETIMEDOUT/i.test(message);
};

const attendanceQuery = (connectionString, executor, retries = DEFAULT_ATTENDANCE_RETRIES) =>
  withRequest(connectionString, executor, retries);

// Test route
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Attendance router is working!' });
});

// Debug route to inspect team table schema
router.get('/debug-team-schema', async (req, res) => {
  try {
    // Get column information for both team and attendance tables
  const teamSchemaResult = await attendanceQuery(process.env.SQL_CONNECTION_STRING, (req) =>
      req.query(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'team'
        ORDER BY ORDINAL_POSITION
      `)
    );
    
  const attendanceSchemaResult = await attendanceQuery(process.env.SQL_CONNECTION_STRING, (req) =>
      req.query(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Attendance'
        ORDER BY ORDINAL_POSITION
      `)
    );

    res.json({
      success: true,
      team_columns: teamSchemaResult.recordset,
      attendance_columns: attendanceSchemaResult.recordset
    });

  } catch (error) {
    console.error('Error inspecting schemas:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// (getSqlPassword is defined later for all routes; keep a single definition to avoid confusion)

// Helper function to check annual leave
async function checkAnnualLeave() {
  try {
    const password = await getSqlPassword();
    if (!password) {
      console.warn('Could not retrieve SQL password for annual leave check');
      return new Set();
    }

    // Connection to helix-project-data for annual leave
    const projectDataConnStr = `Server=tcp:helix-database-server.database.windows.net,1433;Initial Catalog=helix-project-data;Persist Security Info=False;User ID=helix-database-server;Password=${password};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;`;

    // Get people currently on approved annual leave
    const today = new Date().toISOString().split('T')[0];
  const leaveResult = await attendanceQuery(projectDataConnStr, (req, sql) =>
      req.input('today', sql.Date, today)
        .query(`
        SELECT fe AS person
        FROM annualLeave 
        WHERE status = 'booked'
        AND @today BETWEEN start_date AND end_date
      `)
    );
    
    // Create a set of people currently on leave
    const peopleOnLeave = new Set();
    leaveResult.recordset.forEach(row => {
      peopleOnLeave.add(row.person);
    });
    
    return peopleOnLeave;
    
  } catch (error) {
    console.error('Error checking annual leave:', error);
    return new Set(); // Return empty set on error
  }
}

// Get attendance data for team with annual leave integration
// Support both GET and POST for flexibility
const getAttendanceHandler = async (req, res) => {
  try {
    
    // Get current attendance data from the correct attendance table
  const result = await attendanceQuery(process.env.SQL_CONNECTION_STRING, (req) => req.query(`
      WITH LatestAttendance AS (
        SELECT 
          [First_Name] AS First,
          [Level],
          [Week_Start],
          [Week_End],
          [ISO_Week] AS iso,
          [Attendance_Days] AS Status,
          ROW_NUMBER() OVER (
            PARTITION BY [First_Name], [ISO_Week] 
            ORDER BY [Confirmed_At] DESC
          ) as rn
        FROM [dbo].[attendance]
        WHERE [Week_Start] <= CAST(GETDATE() AS DATE) 
          AND [Week_End] >= CAST(GETDATE() AS DATE)
      )
      SELECT First, Level, Week_Start, Week_End, iso, Status
      FROM LatestAttendance
      WHERE rn = 1
      ORDER BY First
    `));

    // Get team roster data from the correct team table
  const teamResult = await attendanceQuery(process.env.SQL_CONNECTION_STRING, (req) => req.query(`
      SELECT 
        [First],
        [Initials],
        [Entra ID],
        [Nickname]
      FROM [dbo].[team]
      WHERE [status] <> 'inactive'
      ORDER BY [First]
    `));

    // Check who's on annual leave
    const peopleOnLeave = await checkAnnualLeave();
    
    // Transform attendance results to include leave status
    const attendanceWithLeave = result.recordset.map(record => {
      // Find initials from team data for this person
      const teamMember = teamResult.recordset.find(t => t.First === record.First);
      const initials = teamMember?.Initials || '';
      const isOnLeave = peopleOnLeave.has(initials);
      
      return {
        First: record.First,
        Initials: initials,
        Status: isOnLeave ? 'away' : record.Status, // Override status if on leave
        Level: record.Level,
        IsOnLeave: isOnLeave ? 1 : 0,
        Week_Start: record.Week_Start,
        Week_End: record.Week_End,
        iso: record.iso
      };
    });

    // Transform team data to match expected format
    const teamData = teamResult.recordset.map(record => ({
      First: record.First,
      Initials: record.Initials,
      'Entra ID': record['Entra ID'],
      Nickname: record.Nickname || record.First,
      // Add leave status for team members
      IsOnLeave: peopleOnLeave.has(record.Initials) ? 1 : 0,
      // Add status from attendance if available
      Status: (() => {
        const attendanceRecord = attendanceWithLeave.find(a => a.Initials === record.Initials);
        return attendanceRecord?.Status || '';
      })()
    }));

    res.json({
      success: true,
      attendance: attendanceWithLeave,
      team: teamData
    });

  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

router.post('/getAttendance', getAttendanceHandler);
router.get('/getAttendance', getAttendanceHandler);

// Removed duplicate older '/getAnnualLeave' route that omitted hearing fields; the enhanced version remains below

// Update attendance data
router.post('/updateAttendance', async (req, res) => {
  try {
    const { initials, weekStart, attendanceDays } = req.body;
    
    if (!initials || !weekStart || !attendanceDays) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: initials, weekStart, attendanceDays'
      });
    }
    
    // Calculate week end date
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const weekEndStr = weekEnd.toISOString().split('T')[0];
    
    // Calculate ISO week number
    const getISOWeek = (date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
      const week1 = new Date(d.getFullYear(), 0, 4);
      return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
    };
    
    const isoWeek = getISOWeek(new Date(weekStart));

    // Get user's full name from team data (or use existing if available)
  const teamResult = await attendanceQuery(process.env.SQL_CONNECTION_STRING, (req, sql) =>
      req.input('initials', sql.VarChar(10), initials)
        .query(`SELECT First FROM [dbo].[team] WHERE Initials = @initials`)
    );
    
    const firstName = teamResult.recordset[0]?.First || 'Unknown';

    // Get or generate Entry_ID - check if record exists first
    let entryId;
  const existingResult = await attendanceQuery(process.env.SQL_CONNECTION_STRING, (req, sql) =>
      req.input('initials', sql.VarChar(10), initials)
        .input('weekStart', sql.Date, weekStart)
        .query(`
          SELECT Entry_ID FROM Attendance 
          WHERE Initials = @initials AND Week_Start = @weekStart
        `)
    );
    
    if (existingResult.recordset.length > 0) {
      entryId = existingResult.recordset[0].Entry_ID;
    } else {
      // Generate new Entry_ID - get next available ID
  const nextIdResult = await attendanceQuery(process.env.SQL_CONNECTION_STRING, (req) =>
        req.query(`SELECT ISNULL(MAX(Entry_ID), 0) + 1 AS NextId FROM Attendance`)
      );
      entryId = nextIdResult.recordset[0].NextId;
    }

    // Upsert the attendance record with Entry_ID
  const result = await attendanceQuery(process.env.SQL_CONNECTION_STRING, (req, sql) =>
      req.input('entryId', sql.Int, entryId)
        .input('firstName', sql.VarChar(100), firstName)
        .input('initials', sql.VarChar(10), initials)
        .input('weekStart', sql.Date, weekStart)
        .input('weekEnd', sql.Date, weekEndStr)
        .input('isoWeek', sql.Int, isoWeek)
        // Use MAX to accommodate any pattern length safely
        .input('attendanceDays', sql.VarChar(sql.MAX), attendanceDays)
        .query(`
          MERGE Attendance AS target
          USING (VALUES (@entryId, @firstName, @initials, @weekStart, @weekEnd, @isoWeek, @attendanceDays, GETDATE()))
            AS source (Entry_ID, First_Name, Initials, Week_Start, Week_End, ISO_Week, Attendance_Days, Confirmed_At)
          ON (target.Initials = source.Initials AND target.Week_Start = source.Week_Start)
          WHEN MATCHED THEN
            UPDATE SET 
              Entry_ID = source.Entry_ID,
              First_Name = source.First_Name,
              Attendance_Days = source.Attendance_Days,
              Confirmed_At = source.Confirmed_At
          WHEN NOT MATCHED THEN
            INSERT (Entry_ID, First_Name, Initials, Week_Start, Week_End, ISO_Week, Attendance_Days, Confirmed_At)
            VALUES (source.Entry_ID, source.First_Name, source.Initials, source.Week_Start, source.Week_End, source.ISO_Week, source.Attendance_Days, source.Confirmed_At);
        `)
    );

    // Get the updated record
  const updatedResult = await attendanceQuery(process.env.SQL_CONNECTION_STRING, (req, sql) =>
      req.input('initials', sql.VarChar(10), initials)
        .input('weekStart', sql.Date, weekStart)
        .query(`
          SELECT 
            Attendance_ID,
            Entry_ID,
            First_Name,
            Initials,
            '' as Level,
            Week_Start,
            Week_End,
            ISO_Week,
            Attendance_Days,
            Confirmed_At
          FROM Attendance
          WHERE Initials = @initials AND Week_Start = @weekStart
        `)
    );

    res.json({
      success: true,
      message: 'Attendance updated successfully',
      record: updatedResult.recordset[0]
    });

  } catch (error) {
    console.error('Error updating attendance:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ===== ANNUAL LEAVE ROUTES =====

// Helper function to get SQL password from Key Vault with simple in-memory cache
let cachedSqlPassword = null;
let sqlPasswordExpiry = 0; // epoch ms
let sqlPasswordPromise = null; // de-dup concurrent fetches
async function getSqlPassword() {
  // Allow local override via env for dev
  const envPwd = process.env.SQL_DATABASESERVER_PASSWORD || process.env.SQL_DB_PASSWORD || process.env.SQL_PASSWORD;
  if (envPwd && !cachedSqlPassword) {
    cachedSqlPassword = envPwd;
    sqlPasswordExpiry = Date.now() + 60 * 60 * 1000; // 1h TTL
  }

  const now = Date.now();
  if (cachedSqlPassword && now < sqlPasswordExpiry) return cachedSqlPassword;
  if (sqlPasswordPromise) return sqlPasswordPromise;

  sqlPasswordPromise = (async () => {
    try {
      const kvUri = "https://helix-keys.vault.azure.net/";
      const secretClient = new SecretClient(kvUri, new DefaultAzureCredential());
      const secret = await secretClient.getSecret("sql-databaseserver-password");
      cachedSqlPassword = secret.value;
      sqlPasswordExpiry = Date.now() + 60 * 60 * 1000; // 1 hour cache
      return cachedSqlPassword;
    } catch (error) {
      console.error('Error getting SQL password from Key Vault:', error);
      // Keep any existing cached value if present; otherwise null
      return cachedSqlPassword;
    } finally {
      sqlPasswordPromise = null;
    }
  })();

  return sqlPasswordPromise;
}

// Helper function to get Clio secrets from Key Vault
async function getClioSecrets() {
  try {
    const kvUri = "https://helix-keys.vault.azure.net/";
    const secretClient = new SecretClient(kvUri, new DefaultAzureCredential());
    
    const [clientIdSecret, clientSecretObj, refreshTokenSecret] = await Promise.all([
      secretClient.getSecret("clio-calendars-clientid"),
      secretClient.getSecret("clio-calendars-secret"),
      secretClient.getSecret("clio-calendars-refreshtoken")
    ]);

    return {
      clientId: clientIdSecret.value || "",
      clientSecret: clientSecretObj.value || "",
      refreshToken: refreshTokenSecret.value || ""
    };
  } catch (error) {
    console.error('Error getting Clio secrets from Key Vault:', error);
    return null;
  }
}

// Helper function to get Clio access token
async function getClioAccessToken(clioSecrets) {
  const tokenUrl = "https://eu.app.clio.com/oauth/token";

  const data = {
    client_id: clioSecrets.clientId,
    client_secret: clioSecrets.clientSecret,
    grant_type: "refresh_token",
    refresh_token: clioSecrets.refreshToken
  };

  try {
    const response = await axios.post(tokenUrl, new URLSearchParams(data).toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    return response.data.access_token;
  } catch (error) {
    console.error('Error obtaining Clio access token:', error);
    return null;
  }
}

// GET /api/attendance/annual-leave - Get all annual leave data
router.post('/getAnnualLeave', async (req, res) => {
  try {
    const { userInitials } = req.body;
    const password = await getSqlPassword();

    if (!password) {
      return res.status(500).json({ success: false, error: 'Could not retrieve database credentials' });
    }

    const projectDataConnStr = `Server=tcp:helix-database-server.database.windows.net,1433;Initial Catalog=helix-project-data;Persist Security Info=False;User ID=helix-database-server;Password=${password};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;`;
    const coreDataConnStr = `Server=tcp:helix-database-server.database.windows.net,1433;Initial Catalog=helix-core-data;Persist Security Info=False;User ID=helix-database-server;Password=${password};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;`;

    const today = new Date().toISOString().split('T')[0];

    // Queries using pooled connections (no global sql.connect)
    const [currentLeaveResult, futureLeaveResult, allLeaveResult, teamResult] = await Promise.all([
      attendanceQuery(projectDataConnStr, (reqSql, s) =>
        reqSql.input('today', s.Date, today).query(`
          SELECT 
            request_id,
            fe AS person,
            start_date,
            end_date,
            reason,
            status,
            days_taken,
            leave_type,
            rejection_notes,
            hearing_confirmation,
            hearing_details
          FROM [dbo].[annualLeave]
          WHERE status = 'booked'
            AND @today BETWEEN start_date AND end_date
          ORDER BY fe
        `)
      ),
  attendanceQuery(projectDataConnStr, (reqSql, s) =>
        reqSql.input('today', s.Date, today).query(`
          SELECT 
            request_id,
            fe AS person,
            start_date,
            end_date,
            reason,
            status,
            days_taken,
            leave_type,
            rejection_notes,
            hearing_confirmation,
            hearing_details
          FROM [dbo].[annualLeave]
          WHERE start_date > @today
            AND status IN ('requested', 'approved', 'booked')
          ORDER BY start_date, fe
        `)
      ),
  attendanceQuery(projectDataConnStr, (reqSql) =>
        reqSql.query(`
          SELECT 
            request_id,
            fe AS person,
            start_date,
            end_date,
            reason,
            status,
            days_taken,
            leave_type,
            rejection_notes,
            hearing_confirmation,
            hearing_details
          FROM [dbo].[annualLeave]
          ORDER BY start_date DESC
        `)
      ),
  attendanceQuery(coreDataConnStr, (reqSql) =>
        reqSql.query(`
          SELECT Initials, AOW, holiday_entitlement 
          FROM [dbo].[team]
          WHERE status = 'Active'
        `)
      )
    ]);

    // Calculate user-specific totals if userInitials provided
    let userDetails = { leaveEntries: [], totals: { standard: 0, unpaid: 0, sale: 0, rejected: 0 } };

    if (userInitials) {
      const fiscalStart = getFiscalYearStart(new Date());
      const fiscalStartStr = fiscalStart.toISOString().split('T')[0];
      const fiscalEndStr = new Date(fiscalStart.getFullYear() + 1, 2, 31).toISOString().split('T')[0];

  const userLeaveResult = await attendanceQuery(projectDataConnStr, (reqSql, s) =>
        reqSql
          .input('initials', s.VarChar(10), userInitials)
          .input('fiscalStart', s.Date, fiscalStartStr)
          .input('fiscalEnd', s.Date, fiscalEndStr)
          .query(`
            SELECT 
              request_id,
              fe AS person,
              start_date,
              end_date,
              reason,
              status,
              days_taken,
              leave_type,
              rejection_notes,
              hearing_confirmation,
              hearing_details
            FROM [dbo].[annualLeave]
            WHERE fe = @initials
              AND start_date >= @fiscalStart 
              AND end_date <= @fiscalEnd
            ORDER BY start_date DESC
          `)
      );

      userDetails.leaveEntries = userLeaveResult.recordset;
      userDetails.leaveEntries.forEach(entry => {
        const days = entry.days_taken || 0;
        if (entry.status === 'rejected') {
          userDetails.totals.rejected += days;
        } else if (entry.leave_type === 'standard') {
          userDetails.totals.standard += days;
        } else if (entry.leave_type === 'purchase') {
          userDetails.totals.unpaid += days; // Maps to 'unpaid' in totals
        } else if (entry.leave_type === 'sale') {
          userDetails.totals.sale += days;
        }
      });
    }

    res.json({
      success: true,
      annual_leave: currentLeaveResult.recordset,
      future_leave: futureLeaveResult.recordset,
      user_details: userDetails,
      all_data: allLeaveResult.recordset,
      team: teamResult.recordset
    });

  } catch (error) {
    console.error('Error fetching annual leave:', error);
    const emptyUserDetails = { leaveEntries: [], totals: { standard: 0, unpaid: 0, sale: 0, rejected: 0 } };
    const fallbackPayload = {
      success: false,
      error: 'Failed to fetch annual leave data',
      annual_leave: [],
      future_leave: [],
      user_details: emptyUserDetails,
      all_data: [],
      team: []
    };

    if (isTransientSqlError(error)) {
      return res.status(200).json({ ...fallbackPayload, transient: true });
    }

    res.status(500).json(fallbackPayload);
  }
});

// POST /api/attendance/annual-leave - Insert new annual leave request
router.post('/annual-leave', async (req, res) => {
  try {
    const { fe, dateRanges, reason, days_taken, leave_type, hearing_confirmation, hearing_details } = req.body;

    // Validate required fields
    if (!fe || !Array.isArray(dateRanges) || dateRanges.length === 0 || !leave_type) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: fe, dateRanges, or leave_type"
      });
    }

    const password = await getSqlPassword();
    if (!password) {
      return res.status(500).json({
        success: false,
        error: 'Could not retrieve database credentials'
      });
    }

    const projectDataConnStr = `Server=tcp:helix-database-server.database.windows.net,1433;Initial Catalog=helix-project-data;Persist Security Info=False;User ID=helix-database-server;Password=${password};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;`;

    const insertedIds = [];
    
    // Insert each date range as a separate record
    for (const range of dateRanges) {
      const start = new Date(range.start_date);
      const end = new Date(range.end_date);
      const computedDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
  const result = await attendanceQuery(projectDataConnStr, (req, sql) =>
        req.input('fe', sql.VarChar(50), fe)
          .input('start_date', sql.Date, range.start_date)
          .input('end_date', sql.Date, range.end_date)
          .input('reason', sql.NVarChar(sql.MAX), reason || "No reason provided.")
          .input('status', sql.VarChar(50), "requested")
          .input('days_taken', sql.Float, computedDays)
          .input('leave_type', sql.VarChar(50), leave_type)
          .input('hearing_confirmation', sql.Bit, hearing_confirmation?.toLowerCase() === "yes" ? 1 : 0)
          .input('hearing_details', sql.NVarChar(sql.MAX), hearing_details || "")
          .query(`
            INSERT INTO [dbo].[annualLeave] 
              ([fe], [start_date], [end_date], [reason], [status], [days_taken], [leave_type], [hearing_confirmation], [hearing_details])
            VALUES 
              (@fe, @start_date, @end_date, @reason, @status, @days_taken, @leave_type, @hearing_confirmation, @hearing_details);
            SELECT SCOPE_IDENTITY() AS InsertedId;
          `)
      );
      
      insertedIds.push(result.recordset[0].InsertedId);
    }

    res.status(201).json({
      success: true,
      message: "Annual leave entries created successfully.",
      insertedIds
    });

  } catch (error) {
    console.error('Error inserting annual leave:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to insert annual leave request'
    });
  }
});

// PUT /api/attendance/annual-leave/:id - Update annual leave status
router.post('/updateAnnualLeave', async (req, res) => {
  try {
    const { id, newStatus, rejection_notes } = req.body;

    if (!id || !newStatus) {
      return res.status(400).json({
        success: false,
        error: "Missing 'id' or 'newStatus' in request body."
      });
    }

    // Validate status
    const allowedStatuses = ['requested', 'approved', 'booked', 'rejected', 'acknowledged', 'discarded'];
    if (!allowedStatuses.includes(newStatus.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: `Invalid 'newStatus'. Allowed statuses are: ${allowedStatuses.join(', ')}.`
      });
    }

    const password = await getSqlPassword();
    if (!password) {
      return res.status(500).json({
        success: false,
        error: 'Could not retrieve database credentials'
      });
    }

    const projectDataConnStr = `Server=tcp:helix-database-server.database.windows.net,1433;Initial Catalog=helix-project-data;Persist Security Info=False;User ID=helix-database-server;Password=${password};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;`;

    // Update the record
  const updateResult = await attendanceQuery(projectDataConnStr, (req, sql) =>
      req.input('id', sql.Int, parseInt(id, 10))
        .input('newStatus', sql.VarChar(50), newStatus)
        .input('rejectionNotes', sql.NVarChar(sql.MAX), rejection_notes || "")
        .query(`
          UPDATE [dbo].[annualLeave]
             SET [status] = @newStatus,
                 [rejection_notes] = CASE 
                                       WHEN @newStatus = 'rejected' AND (@rejectionNotes IS NOT NULL AND @rejectionNotes <> '')
                                       THEN @rejectionNotes 
                                       ELSE [rejection_notes] 
                                     END
           WHERE [request_id] = @id;
        `)
    );

    if (updateResult.rowsAffected[0] === 0) {
      return res.status(404).json({
        success: false,
        error: `No record found with ID ${id}, or the status transition is invalid.`
      });
    }

    // If newStatus is 'booked', create Clio calendar entry
    if (newStatus.toLowerCase() === 'booked') {
      try {
        // Fetch the leave record details
  const leaveResult = await attendanceQuery(projectDataConnStr, (req, sql) =>
          req.input('id', sql.Int, parseInt(id, 10))
            .query(`
              SELECT fe, start_date, end_date, ClioEntryId
              FROM [dbo].[annualLeave]
              WHERE request_id = @id
            `)
        );

        const leaveRecord = leaveResult.recordset[0];
        
        if (leaveRecord && !leaveRecord.ClioEntryId) {
          // Get Clio secrets and create calendar entry
          const clioSecrets = await getClioSecrets();
          if (clioSecrets) {
            const accessToken = await getClioAccessToken(clioSecrets);
            if (accessToken) {
              const clioEntryId = await createClioCalendarEntry(
                accessToken,
                leaveRecord.fe,
                leaveRecord.start_date,
                leaveRecord.end_date
              );

              // Update the SQL record with the Clio entry ID
              if (clioEntryId) {
                await attendanceQuery(projectDataConnStr, (req, sql) =>
                  req.input('id', sql.Int, parseInt(id, 10))
                    .input('clioEntryId', sql.Int, clioEntryId)
                    .query(`
                      UPDATE [dbo].[annualLeave]
                         SET [ClioEntryId] = @clioEntryId
                       WHERE [request_id] = @id;
                    `)
                );
              }
            }
          }
        }
      } catch (clioError) {
        console.error('Error creating Clio calendar entry:', clioError);
        // Continue with the response even if Clio fails
      }
    }

    res.json({
      success: true,
      message: `Annual leave ID ${id} updated to status '${newStatus}'.`
    });

  } catch (error) {
    console.error('Error updating annual leave:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update annual leave status'
    });
  }
});

// GET /api/attendance/annual-leave-all - Get all annual leave data for reporting
router.get('/annual-leave-all', async (req, res) => {
  try {
    const password = await getSqlPassword();
    
    if (!password) {
      return res.status(500).json({
        success: false,
        error: 'Could not retrieve database credentials'
      });
    }

    const projectDataConnStr = `Server=tcp:helix-database-server.database.windows.net,1433;Initial Catalog=helix-project-data;Persist Security Info=False;User ID=helix-database-server;Password=${password};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;`;
    
  const result = await attendanceQuery(projectDataConnStr, (req) =>
      req.query(`
        SELECT 
          request_id,
          fe AS person,
          start_date,
          end_date,
          reason,
          status,
          days_taken,
          leave_type,
          rejection_notes,
          hearing_confirmation,
          hearing_details
        FROM annualLeave 
        ORDER BY start_date DESC
      `)
    );

    res.json({
      success: true,
      all_data: result.recordset
    });

  } catch (error) {
    console.error('Error fetching all annual leave:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch annual leave data'
    });
  }
});

// Helper function to create Clio calendar entry
async function createClioCalendarEntry(accessToken, fe, startDate, endDate) {
  const calendarUrl = "https://eu.app.clio.com/api/v4/calendar_entries.json";
  const calendarId = 152290;

  const summary = `${fe} A/L`;
  
  const startDateObject = new Date(startDate);
  const endDateObject = new Date(endDate);
  endDateObject.setUTCDate(endDateObject.getUTCDate() + 1); // Make end_at exclusive

  const data = {
    data: {
      all_day: true,
      calendar_owner: { id: calendarId },
      start_at: startDateObject.toISOString(),
      end_at: endDateObject.toISOString(),
      summary: summary,
      send_email_notification: false
    }
  };

  try {
    const response = await axios.post(calendarUrl, data, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      }
    });

    if (response.status === 201) {
      return parseInt(response.data.data.id, 10);
    }
    return null;
  } catch (error) {
    console.error('Error creating Clio calendar entry:', error);
    return null;
  }
}

// Helper function to get fiscal year start
function getFiscalYearStart(date) {
  const year = date.getFullYear();
  const aprilFirst = new Date(year, 3, 1); // April 1st
  return date >= aprilFirst ? aprilFirst : new Date(year - 1, 3, 1);
}

module.exports = router;