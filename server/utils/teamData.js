const sql = require('mssql');

let cache = null;
let cacheTs = 0;
const CACHE_MS = 5 * 60 * 1000; // 5 minutes

const DEFAULT_TEAM_QUERY = `
  SELECT
    [Created Date],
    [Created Time],
    [Full Name],
    [Last],
    [First],
    [Nickname],
    [Initials],
    [Email],
    [Entra ID],
    [Clio ID],
    TRY_CAST([Rate] AS float) AS [Rate],
    [Role],
    [AOW],
    [status],
    TRY_CAST([holiday_entitlement] AS float) AS [holiday_entitlement]
  FROM dbo.team
  WHERE [Initials] IS NOT NULL AND LEN([Initials]) > 0
`;

async function fetchFromDb() {
  const conn = process.env.TEAM_SQL_CONNECTION_STRING || process.env.SQL_CONNECTION_STRING;
  const query = process.env.TEAM_SQL_QUERY || DEFAULT_TEAM_QUERY;
  
  if (!conn) {
    throw new Error('No SQL connection string found in TEAM_SQL_CONNECTION_STRING or SQL_CONNECTION_STRING');
  }
  
  // eslint-disable-next-line no-console
  console.log('[teamData] Fetching team data directly from SQL database');
  
  let pool;
  try {
    pool = await sql.connect(conn);
    const result = await pool.request().query(query);
    
    if (!result.recordset || !Array.isArray(result.recordset)) {
      throw new Error('Query returned no valid recordset');
    }
    
    // eslint-disable-next-line no-console
    console.log(`[teamData] Successfully fetched ${result.recordset.length} team records from database`);
    return result.recordset;
    
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[teamData] Database query failed:', error.message);
    throw new Error(`Database query failed: ${error.message}`);
  } finally {
    if (pool) {
      try {
        await pool.close();
      } catch (closeError) {
        // eslint-disable-next-line no-console
        console.warn('[teamData] Error closing database pool:', closeError.message);
      }
    }
  }
}

async function getTeamData() {
  const now = Date.now();
  if (cache && now - cacheTs < CACHE_MS) return cache;

  // Fetch directly from database - no fallbacks
  const dbData = await fetchFromDb();
  cache = dbData;
  cacheTs = now;
  return cache;
}

module.exports = { getTeamData };

// Allow running this file directly for a quick sanity check
if (require.main === module) {
  // eslint-disable-next-line no-console
  getTeamData()
    .then((d) => {
      const count = Array.isArray(d) ? d.length : 0;
      console.log(`[teamData] items: ${count}`);
      process.exit(0);
    })
    .catch((e) => {
      console.error('[teamData] error:', e && e.message ? e.message : e);
      process.exit(1);
    });
}
