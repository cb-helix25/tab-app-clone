const express = require('express');
const { getRedisClient, cacheWrapper, generateCacheKey } = require('../utils/redisClient');

const router = express.Router();

// Import dataset fetchers from the main reporting route
const { withRequest } = require('../utils/db');
const { DefaultAzureCredential } = require('@azure/identity');
const { SecretClient } = require('@azure/keyvault-secrets');
const fetch = require('node-fetch');

// Re-use the same dataset fetcher functions from reporting.js
// (We'll import these or duplicate the core functions)

// Cache TTL configurations for each dataset (in seconds)
const DATASET_TTL = {
  userData: 300,      // 5 min - user data changes rarely
  teamData: 1800,     // 30 min - team data is fairly static
  enquiries: 600,     // 10 min - enquiries update regularly
  allMatters: 900,    // 15 min - matters update moderately
  wip: 300,          // 5 min - WIP data changes frequently
  recoveredFees: 1800, // 30 min - financial data less frequent
  recoveredFeesSummary: 900, // 15 min
  poidData: 1800,     // 30 min - POID data changes infrequently
  wipClioCurrentWeek: 300,   // 5 min - current week WIP
  wipDbLastWeek: 600, // 10 min - last week data
};

// Server-Sent Events endpoint for progressive dataset loading
router.get('/stream-datasets', async (req, res) => {
  // Set up SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control',
    'X-Accel-Buffering': 'no' // Disable buffering on nginx/azure frontends
  });

  // Some proxies need headers flushed early for SSE to start
  if (typeof res.flushHeaders === 'function') {
    try { res.flushHeaders(); } catch { /* ignore */ }
  }

  // Small helper to write SSE events and flush immediately if supported
  function writeSse(obj) {
    try {
      res.write(`data: ${JSON.stringify(obj)}\n\n`);
      if (typeof res.flush === 'function') {
        try { res.flush(); } catch { /* ignore flush error */ }
      }
    } catch {
      // Ignore write errors (connection likely closed)
    }
  }

  // Keep-alive heartbeat to prevent idle timeouts
  const heartbeat = setInterval(() => {
    try { res.write(': heartbeat\n\n'); } catch { /* connection might be closed */ }
  }, 15000);

  // Clean up on client disconnect
  req.on('close', () => {
    clearInterval(heartbeat);
    try { res.end(); } catch { /* ignore */ }
  });

  const connectionString = process.env.SQL_CONNECTION_STRING;
  if (!connectionString) {
    res.write(`data: ${JSON.stringify({ error: 'SQL connection string not configured' })}\n\n`);
    res.end();
    return;
  }

  const datasetsParam = typeof req.query.datasets === 'string'
    ? req.query.datasets.split(',').map((name) => name.trim()).filter(Boolean)
    : ['userData', 'teamData', 'enquiries', 'allMatters', 'wip', 'recoveredFees', 'poidData', 'wipClioCurrentWeek'];

  const entraId = typeof req.query.entraId === 'string' && req.query.entraId.trim().length > 0
    ? req.query.entraId.trim()
    : null;

  const bypassCache = String(req.query.bypassCache || '').toLowerCase() === 'true';

  // Send initial status for all datasets
  // Instruct EventSource to retry if disconnected
  try { res.write('retry: 10000\n\n'); } catch { /* ignore */ }
  writeSse({
    type: 'init',
    datasets: datasetsParam.map(name => ({ name, status: 'loading' }))
  });

  console.log(`🌊 Starting stream for datasets: [${datasetsParam.join(', ')}] with entraId: ${entraId}`);

  // Process each dataset individually with Redis caching
  const processDataset = async (datasetName) => {
    try {
      console.log(`🔍 Processing dataset: ${datasetName}`);
      
      // Check Redis cache first (unless bypassing)
      let result = null;
      let fromCache = false;

      if (!bypassCache) {
        try {
          const redisClient = await getRedisClient();
          if (redisClient) {
            const cacheKey = generateCacheKey('stream', `${datasetName}:${entraId || 'team'}`);
            const cached = await redisClient.get(cacheKey);
            if (cached) {
              result = JSON.parse(cached);
              fromCache = true;
              console.log(`📋 Dataset ${datasetName} cache hit (Redis)`);
            }
          }
        } catch (redisError) {
          console.warn(`Redis cache read failed for ${datasetName}:`, redisError.message);
        }
      }

      // Fetch from source if not in cache
      if (!result) {
        console.log(`🚀 Fetching ${datasetName} from source`);
        result = await fetchDatasetByName(datasetName, { connectionString, entraId });
        console.log(`✅ Dataset ${datasetName} fetched, result type:`, typeof result, 'array length:', Array.isArray(result) ? result.length : 'not array');
        
        // Store in Redis cache
        try {
          const redisClient = await getRedisClient();
          if (redisClient) {
            const cacheKey = generateCacheKey('stream', `${datasetName}:${entraId || 'team'}`);
            const ttl = DATASET_TTL[datasetName] || 600;
            await redisClient.setEx(cacheKey, ttl, JSON.stringify(result));
            console.log(`📋 Dataset ${datasetName} cached (Redis, TTL: ${ttl}s)`);
          }
        } catch (redisError) {
          console.warn(`Redis cache write failed for ${datasetName}:`, redisError.message);
        }
      }

      // Send completed dataset to client
      writeSse({
        type: 'dataset-complete',
        dataset: datasetName,
        status: 'ready',
        data: result,
        cached: fromCache,
        count: Array.isArray(result) ? result.length : (result ? 1 : 0)
      });

      console.log(`✅ Dataset ${datasetName} sent to client`);

    } catch (error) {
      console.error(`❌ Dataset ${datasetName} failed:`, error.message);
      console.error('Full error:', error);
      
      // Send error status to client
      writeSse({
        type: 'dataset-error',
        dataset: datasetName,
        status: 'error',
        error: error.message
      });
    }
  };

  try {
    // Process light datasets in parallel (fast ones)
    const lightDatasets = datasetsParam.filter(d => !['wip', 'recoveredFees', 'poidData'].includes(d));
    const heavyDatasets = datasetsParam.filter(d => ['wip', 'recoveredFees', 'poidData'].includes(d));

    console.log(`🚀 Processing light datasets: [${lightDatasets.join(', ')}]`);
    
    // Process light datasets concurrently
    await Promise.all(lightDatasets.map(processDataset));

    console.log(`🔥 Processing heavy datasets: [${heavyDatasets.join(', ')}]`);
    
    // Process heavy datasets sequentially to avoid overwhelming the system
    for (const dataset of heavyDatasets) {
      await processDataset(dataset);
    }

    // Send completion signal
    console.log(`✅ All datasets completed, sending completion signal`);
    writeSse({ type: 'complete' });
    res.end();
  } catch (globalError) {
    console.error('❌ Global streaming error:', globalError);
    writeSse({ 
      type: 'error', 
      error: 'Stream processing failed: ' + globalError.message 
    });
    res.end();
  }
});

// Dataset fetcher dispatcher
async function fetchDatasetByName(datasetName, { connectionString, entraId, clioId }) {
  switch (datasetName) {
    case 'userData':
      return fetchUserData({ connectionString, entraId });
    case 'teamData':
      return fetchTeamData({ connectionString });
    case 'enquiries':
      return fetchEnquiries({ connectionString });
    case 'allMatters':
      return fetchAllMatters({ connectionString });
    case 'wip':
      return fetchWip({ connectionString });
    case 'recoveredFees':
      return fetchRecoveredFees({ connectionString });
    case 'recoveredFeesSummary':
      return fetchRecoveredFeesSummary({ connectionString, entraId, clioId });
    case 'poidData':
      return fetchPoidData({ connectionString });
    case 'wipClioCurrentWeek':
      return fetchWipClioCurrentWeek({ connectionString, entraId });
    case 'wipDbLastWeek':
      return fetchWipDbLastWeek({ connectionString });
    default:
      throw new Error(`Unknown dataset: ${datasetName}`);
  }
}

// Dataset fetcher functions (duplicated from reporting.js for now)
// TODO: Extract these to a shared module

async function fetchUserData({ connectionString, entraId }) {
  if (!entraId) return null;
  return withRequest(connectionString, async (request, sqlClient) => {
    request.input('entraId', sqlClient.NVarChar, entraId);
    const result = await request.query(`
      SELECT [Created Date], [Created Time], [Full Name], [Last], [First], [Nickname],
             [Initials], [Email], [Entra ID], [Clio ID], [Rate], [Role], [AOW],
             [holiday_entitlement], [status]
      FROM [dbo].[team] WHERE [Entra ID] = @entraId
    `);
    return Array.isArray(result.recordset) ? result.recordset : [];
  });
}

async function fetchTeamData({ connectionString }) {
  return withRequest(connectionString, async (request) => {
    const result = await request.query(`
      SELECT [Created Date], [Created Time], [Full Name], [Last], [First], [Nickname],
             [Initials], [Email], [Entra ID], [Clio ID], [Rate], [Role], [AOW],
             [holiday_entitlement], [status]
      FROM [dbo].[team] ORDER BY [Full Name]
    `);
    return Array.isArray(result.recordset) ? result.recordset : [];
  });
}

async function fetchEnquiries({ connectionString }) {
  const { from, to } = getLast24MonthsRange();
  return withRequest(connectionString, async (request, sqlClient) => {
    request.input('dateFrom', sqlClient.Date, formatDateOnly(from));
    request.input('dateTo', sqlClient.Date, formatDateOnly(to));
    const result = await request.query(`
      SELECT * FROM [dbo].[enquiries]
      WHERE Touchpoint_Date BETWEEN @dateFrom AND @dateTo
      ORDER BY Touchpoint_Date DESC
    `);
    return Array.isArray(result.recordset) ? result.recordset : [];
  });
}

async function fetchAllMatters({ connectionString }) {
  return withRequest(connectionString, async (request) => {
    const result = await request.query('SELECT * FROM [dbo].[matters]');
    return Array.isArray(result.recordset) ? result.recordset : [];
  });
}

async function fetchWip({ connectionString }) {
  const { from, to } = getLast24MonthsExcludingCurrentWeek();
  return withRequest(connectionString, async (request, sqlClient) => {
    request.input('dateFrom', sqlClient.Date, formatDateOnly(from));
    request.input('dateTo', sqlClient.Date, formatDateOnly(to));
    const result = await request.query(`
      SELECT id, date, 
             CONVERT(VARCHAR(10), created_at_date, 120) + 'T' + CONVERT(VARCHAR(8), created_at_time, 108) AS created_at,
             CONVERT(VARCHAR(10), updated_at_date, 120) + 'T' + CONVERT(VARCHAR(8), updated_at_time, 108) AS updated_at,
             type, matter_id, matter_display_number, quantity_in_hours, note, total, price,
             expense_category, activity_description_id, activity_description_name, user_id, bill_id, billed
      FROM [dbo].[wip] WHERE created_at_date BETWEEN @dateFrom AND @dateTo
      ORDER BY created_at_date DESC
    `);
    if (!Array.isArray(result.recordset)) return [];
    return result.recordset.map((row) => {
      if (row.quantity_in_hours != null) {
        const value = Number(row.quantity_in_hours);
        if (!Number.isNaN(value)) {
          row.quantity_in_hours = Math.ceil(value * 10) / 10;
        }
      }
      return row;
    });
  });
}

async function fetchRecoveredFees({ connectionString }) {
  const { from, to } = getLast24MonthsRange();
  return withRequest(connectionString, async (request, sqlClient) => {
    request.input('dateFrom', sqlClient.Date, formatDateOnly(from));
    request.input('dateTo', sqlClient.Date, formatDateOnly(to));
    const result = await request.query(`
      SELECT matter_id, bill_id, contact_id, id, date, created_at, kind, type, activity_type,
             description, sub_total, tax, secondary_tax, user_id, user_name, payment_allocated,
             CONVERT(VARCHAR(10), payment_date, 120) AS payment_date
      FROM [dbo].[collectedTime] WHERE payment_date BETWEEN @dateFrom AND @dateTo
      ORDER BY payment_date DESC
    `);
    if (!Array.isArray(result.recordset)) return [];
    return result.recordset.map((row) => {
      if (row.payment_allocated != null) {
        const value = Number(row.payment_allocated);
        if (!Number.isNaN(value)) row.payment_allocated = value;
      }
      return row;
    });
  });
}

async function fetchRecoveredFeesSummary({ connectionString, entraId, clioId }) {
  // Implementation similar to reporting.js
  return { currentMonthTotal: 0, previousMonthTotal: 0 };
}

async function fetchPoidData({ connectionString }) {
  const { from, to } = getLast24MonthsRange();
  return withRequest(connectionString, async (request, sqlClient) => {
    request.input('dateFrom', sqlClient.Date, formatDateOnly(from));
    request.input('dateTo', sqlClient.Date, formatDateOnly(to));
    const result = await request.query(`
      SELECT poid_id, type, terms_acceptance, submission_url,
             CONVERT(VARCHAR(10), submission_date, 120) AS submission_date,
             id_docs_folder, acid, card_id, poc, nationality_iso, nationality, gender,
             first, last, prefix, date_of_birth, best_number, email, passport_number,
             drivers_license_number, house_building_number, street, city, county,
             post_code, country, country_code, company_name, company_number,
             company_house_building_number, company_street, company_city, company_county,
             company_post_code, company_country, company_country_code, stage, check_result,
             check_id, additional_id_submission_id, additional_id_submission_url,
             additional_id_submission_date, client_id, related_client_id, matter_id,
             risk_assessor, risk_assessment_date
      FROM [dbo].[poid] WHERE submission_date BETWEEN @dateFrom AND @dateTo
      ORDER BY submission_date DESC
    `);
    return Array.isArray(result.recordset) ? result.recordset : [];
  });
}

async function fetchWipClioCurrentWeek({ connectionString, entraId }) {
  // Simplified version - could implement full Clio integration
  return {
    current_week: { daily_data: {}, activities: [] },
    last_week: { daily_data: {}, activities: [] },
  };
}

async function fetchWipDbLastWeek({ connectionString }) {
  // Implementation similar to reporting.js
  return [];
}

// Helper functions
function getLast24MonthsRange() {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setMonth(start.getMonth() - 23, 1);
  start.setHours(0, 0, 0, 0);
  return { from: start, to: end };
}

function getLast24MonthsExcludingCurrentWeek() {
  const now = new Date();
  const current = new Date(now);
  current.setHours(0, 0, 0, 0);
  const day = current.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const currentWeekStart = new Date(current);
  currentWeekStart.setDate(current.getDate() + diff);
  const rangeEnd = new Date(currentWeekStart);
  rangeEnd.setDate(currentWeekStart.getDate() - 1);
  rangeEnd.setHours(23, 59, 59, 999);
  const rangeStart = new Date(rangeEnd);
  rangeStart.setMonth(rangeStart.getMonth() - 24, 1);
  rangeStart.setHours(0, 0, 0, 0);
  return { from: rangeStart, to: rangeEnd };
}

function formatDateOnly(date) {
  return date.toISOString().split('T')[0];
}

module.exports = router;