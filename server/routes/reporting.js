const express = require('express');
const { withRequest } = require('../utils/db');
const { DefaultAzureCredential } = require('@azure/identity');
const { SecretClient } = require('@azure/keyvault-secrets');
const fetch = require('node-fetch');

const router = express.Router();

const DEFAULT_DATASETS = ['userData', 'teamData', 'enquiries', 'allMatters', 'wip', 'recoveredFees', 'poidData', 'wipClioCurrentWeek'];
const CACHE_TTL_MS = Number(process.env.REPORTING_DATASET_TTL_MS || 2 * 60 * 1000);
const cache = new Map();

const datasetFetchers = {
  userData: fetchUserData,
  teamData: fetchTeamData,
  enquiries: fetchEnquiries,
  allMatters: fetchAllMatters,
  wip: fetchWip,
  recoveredFees: fetchRecoveredFees,
  recoveredFeesSummary: fetchRecoveredFeesSummary,
  poidData: fetchPoidData,
  wipClioCurrentWeek: fetchWipClioCurrentWeek,
  wipDbLastWeek: fetchWipDbLastWeek,
};

router.get('/management-datasets', async (req, res) => {
  const connectionString = process.env.SQL_CONNECTION_STRING;
  if (!connectionString) {
    return res.status(500).json({ error: 'SQL connection string not configured' });
  }

  const datasetsParam = typeof req.query.datasets === 'string'
    ? req.query.datasets.split(',').map((name) => name.trim()).filter(Boolean)
    : null;
  const requestedDatasets = (datasetsParam && datasetsParam.length > 0)
    ? datasetsParam.filter((name) => Object.prototype.hasOwnProperty.call(datasetFetchers, name))
    : DEFAULT_DATASETS;
  const entraId = typeof req.query.entraId === 'string' && req.query.entraId.trim().length > 0
    ? req.query.entraId.trim()
    : null;
  const clioIdCandidate = typeof req.query.clioId === 'string'
    ? Number.parseInt(req.query.clioId, 10)
    : null;
  const clioId = Number.isNaN(clioIdCandidate ?? NaN) ? null : clioIdCandidate;
  const bypassCache = String(req.query.bypassCache || '').toLowerCase() === 'true';

  const cacheKey = `${entraId || 'anon'}|${requestedDatasets.join(',')}`;
  const cachedEntry = cache.get(cacheKey);
  if (!bypassCache && cachedEntry && cachedEntry.expires > Date.now()) {
    return res.json(cachedEntry.data);
  }

  const responsePayload = {};
  const errors = {};

  await Promise.all(requestedDatasets.map(async (datasetKey) => {
    const fetcher = datasetFetchers[datasetKey];
    if (!fetcher) {
      return;
    }
    try {
  responsePayload[datasetKey] = await fetcher({ connectionString, entraId, clioId });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Reporting dataset fetch failed for ${datasetKey}:`, message);
      errors[datasetKey] = message;
      responsePayload[datasetKey] = null;
    }
  }));

  // Join: Merge Clio current-week into payload for frontend consumption
  try {
    const clioActivities = Array.isArray(responsePayload.wipClioCurrentWeek)
      ? responsePayload.wipClioCurrentWeek
      : null;
    // Prefer lightweight last-week dataset when present; fallback to full wip if explicitly requested
    const dbWipActivities = Array.isArray(responsePayload.wipDbLastWeek)
      ? responsePayload.wipDbLastWeek
      : (Array.isArray(responsePayload.wip) ? responsePayload.wip : null);

    if (clioActivities || dbWipActivities) {
      // Compute current and last week bounds
      const { start: currentStart, end: currentEnd } = getCurrentWeekBounds();
      const lastWeekStart = new Date(currentStart);
      lastWeekStart.setDate(currentStart.getDate() - 7);
      lastWeekStart.setHours(0, 0, 0, 0);
      const lastWeekEnd = new Date(currentEnd);
      lastWeekEnd.setDate(currentEnd.getDate() - 7);
      lastWeekEnd.setHours(23, 59, 59, 999);

      // Aggregate
      const currentWeekDaily = clioActivities
        ? aggregateDailyData(clioActivities, currentStart, currentEnd)
        : {};
      const lastWeekDaily = dbWipActivities
        ? aggregateDailyData(dbWipActivities, lastWeekStart, lastWeekEnd)
        : {};

      responsePayload.wipCurrentAndLastWeek = {
        current_week: { daily_data: currentWeekDaily },
        last_week: { daily_data: lastWeekDaily },
      };
    }
  } catch (e) {
    console.error('Failed to merge current-week WIP from Clio', e);
  }

  if (Object.keys(errors).length > 0) {
    responsePayload.errors = errors;
  }

  cache.set(cacheKey, { data: responsePayload, expires: Date.now() + CACHE_TTL_MS });

  return res.json(responsePayload);
});

module.exports = router;

async function fetchUserData({ connectionString, entraId }) {
  if (!entraId) {
    return null;
  }
  return withRequest(connectionString, async (request, sqlClient) => {
    request.input('entraId', sqlClient.NVarChar, entraId);
    const result = await request.query(`
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
        [Rate],
        [Role],
        [AOW],
        [holiday_entitlement],
        [status]
      FROM [dbo].[team]
      WHERE [Entra ID] = @entraId
    `);
    return Array.isArray(result.recordset) ? result.recordset : [];
  });
}

async function fetchTeamData({ connectionString }) {
  return withRequest(connectionString, async (request) => {
    const result = await request.query(`
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
        [Rate],
        [Role],
        [AOW],
        [holiday_entitlement],
        [status]
      FROM [dbo].[team]
      ORDER BY [Full Name]
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
      SELECT *
      FROM [dbo].[enquiries]
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
  // IMPORTANT: Exclude current week; current week comes from Clio function and is merged by this route
  const { from, to } = getLast24MonthsExcludingCurrentWeek();
  return withRequest(connectionString, async (request, sqlClient) => {
    request.input('dateFrom', sqlClient.Date, formatDateOnly(from));
    request.input('dateTo', sqlClient.Date, formatDateOnly(to));
    const result = await request.query(`
      SELECT 
        id,
        date,
        CONVERT(VARCHAR(10), created_at_date, 120) + 'T' + CONVERT(VARCHAR(8), created_at_time, 108) AS created_at,
        CONVERT(VARCHAR(10), updated_at_date, 120) + 'T' + CONVERT(VARCHAR(8), updated_at_time, 108) AS updated_at,
        type,
        matter_id,
        matter_display_number,
        quantity_in_hours,
        note,
        total,
        price,
        expense_category,
        activity_description_id,
        activity_description_name,
        user_id,
        bill_id,
        billed
      FROM [dbo].[wip]
      WHERE created_at_date BETWEEN @dateFrom AND @dateTo
      ORDER BY created_at_date DESC
    `);
    if (!Array.isArray(result.recordset)) {
      return [];
    }
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

// Lightweight: fetch only last week's WIP from DB (as activity-like rows)
async function fetchWipDbLastWeek({ connectionString }) {
  const { start, end } = getCurrentWeekBounds();
  const lastWeekStart = new Date(start);
  lastWeekStart.setDate(start.getDate() - 7);
  lastWeekStart.setHours(0, 0, 0, 0);
  const lastWeekEnd = new Date(end);
  lastWeekEnd.setDate(end.getDate() - 7);
  lastWeekEnd.setHours(23, 59, 59, 999);

  return withRequest(connectionString, async (request, sqlClient) => {
    request.input('dateFrom', sqlClient.Date, formatDateOnly(lastWeekStart));
    request.input('dateTo', sqlClient.Date, formatDateOnly(lastWeekEnd));
    const result = await request.query(`
      SELECT 
        id,
        date,
        CONVERT(VARCHAR(10), created_at_date, 120) + 'T' + CONVERT(VARCHAR(8), created_at_time, 108) AS created_at,
        CONVERT(VARCHAR(10), updated_at_date, 120) + 'T' + CONVERT(VARCHAR(8), updated_at_time, 108) AS updated_at,
        type,
        matter_id,
        matter_display_number,
        quantity_in_hours,
        note,
        total,
        price,
        expense_category,
        activity_description_id,
        activity_description_name,
        user_id,
        bill_id,
        billed
      FROM [dbo].[wip]
      WHERE created_at_date BETWEEN @dateFrom AND @dateTo
    `);
    if (!Array.isArray(result.recordset)) {
      return [];
    }
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

// --- Direct Clio API Integration (replaced Azure Function call) ---
const credential = new DefaultAzureCredential();
const vaultUrl = process.env.KEY_VAULT_URL || 'https://helix-keys.vault.azure.net/';
const kvClient = new SecretClient(vaultUrl, credential);

async function getClioCredentialsCached() {
  const cacheKey = 'clio:credentials';
  const cached = cache.get(cacheKey);
  if (cached && cached.expires > Date.now()) return cached.data;
  
  const [refreshTokenSecret, clientSecret, clientIdSecret] = await Promise.all([
    kvClient.getSecret('clio-pbi-refreshtoken'),
    kvClient.getSecret('clio-pbi-secret'),
    kvClient.getSecret('clio-pbi-clientid'),
  ]);
  
  const credentials = {
    refreshToken: refreshTokenSecret.value,
    clientSecret: clientSecret.value,
    clientId: clientIdSecret.value,
  };
  
  cache.set(cacheKey, { data: credentials, expires: Date.now() + 60 * 60 * 1000 }); // 1h TTL
  return credentials;
}

async function getClioAccessToken() {
  const cacheKey = 'clio:accessToken';
  const cached = cache.get(cacheKey);
  if (cached && cached.expires > Date.now()) return cached.data;
  
  const { clientId, clientSecret, refreshToken } = await getClioCredentialsCached();
  
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });
  
  const response = await fetch(`https://eu.app.clio.com/oauth/token?${params.toString()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to obtain Clio access token: ${response.status}`);
  }
  
  const tokenData = await response.json();
  const accessToken = tokenData.access_token;
  
  // Cache with 30min TTL (tokens usually valid for 1h)
  cache.set(cacheKey, { data: accessToken, expires: Date.now() + 30 * 60 * 1000 });
  return accessToken;
}

async function fetchWipClioCurrentWeek({ connectionString, entraId }) {
  // Fetch user-specific current week activities and return structured daily data
  const startedAt = Date.now();
  try {
    const accessToken = await getClioAccessToken();
    
    // Get user's Clio ID if entraId is provided
    let userClioId = null;
    if (entraId && connectionString) {
      try {
        const userData = await withRequest(connectionString, async (request, sqlClient) => {
          request.input('entraId', sqlClient.NVarChar, entraId);
          const result = await request.query(`
            SELECT [Clio ID] FROM [dbo].[team] WHERE [Entra ID] = @entraId
          `);
          return Array.isArray(result.recordset) ? result.recordset : [];
        });
        userClioId = userData?.[0]?.['Clio ID'] || null;
        if (userClioId) {
          console.log(`Found Clio ID ${userClioId} for Entra ID ${entraId}`);
        } else {
          console.warn(`No Clio ID found for Entra ID ${entraId}`);
        }
      } catch (dbError) {
        console.warn('Failed to lookup user Clio ID:', dbError.message);
      }
    }
    
    // Calculate current week date range (Monday to today)
    const now = new Date();
    const weekStart = new Date(now);
    const day = weekStart.getDay();
    const diff = day === 0 ? -6 : 1 - day; // Adjust when day is Sunday
    weekStart.setDate(weekStart.getDate() + diff);
    weekStart.setHours(0, 1, 0, 0); // Start at 00:01 on Monday
    
    const startDate = formatDateTimeForClio(weekStart);
    const endDate = formatDateTimeForClio(now);
    
    // Fetch activities from Clio API
    // Pass userClioId to filter at API level (more efficient than post-filtering)
    let activities = await fetchAllClioActivities(startDate, endDate, accessToken, userClioId);
    
    // Log the results
    if (userClioId) {
      console.log(`Fetched ${activities.length} activities for user ${userClioId}`);
    } else {
      console.log(`Fetched ${activities.length} team-wide activities (no user filter)`);
    }
    
    // Calculate date bounds
    const { start: currentStart, end: currentEnd } = getCurrentWeekBounds();
    const lastWeekStart = new Date(currentStart);
    lastWeekStart.setDate(currentStart.getDate() - 7);
    lastWeekStart.setHours(0, 0, 0, 0);
    const lastWeekEnd = new Date(currentEnd);
    lastWeekEnd.setDate(currentEnd.getDate() - 7);
    lastWeekEnd.setHours(23, 59, 59, 999);
    
    // Convert to WIP format
    const wipActivities = convertClioActivitiesToWIP(activities);
    
    // If this is a user-specific request (entraId provided), aggregate into daily_data
    // If team-wide (no entraId), return raw activities to preserve user_id breakdown
    if (userClioId) {
      // User-specific: aggregate by day for TimeMetricsV2 component
      const currentWeekDaily = aggregateDailyData(wipActivities, currentStart, currentEnd);
      const lastWeekDaily = {};
      
      console.log(`Returning aggregated daily data for user ${userClioId}`);
      
      return {
        current_week: { daily_data: currentWeekDaily },
        last_week: { daily_data: lastWeekDaily },
      };
    } else {
      // Team-wide: return activities array with user_id preserved
      const currentWeekActivities = wipActivities.filter(a => {
        const key = toDayKey(a.date || a.created_at || a.updated_at);
        return key && isDateInRange(key, currentStart, currentEnd);
      });
      
      console.log(`Returning ${currentWeekActivities.length} WIP activities with user breakdown`);
      
      return {
        current_week: { activities: currentWeekActivities },
        last_week: { activities: [] },
      };
    }
  } catch (error) {
    console.error('Failed to fetch user WIP from Clio:', error.message);
    return {
      current_week: { daily_data: {} },
      last_week: { daily_data: {} },
    };
  } finally {
    const ms = Date.now() - startedAt;
    // Only warn if extremely slow (>30s)
    if (ms > 30000) {
      console.warn(`User-specific Clio API call slow: ${ms}ms`);
    }
  }
}

function formatDateTimeForClio(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

async function fetchAllClioActivities(startDate, endDate, accessToken, userId = null) {
  let allActivities = [];
  let offset = 0;
  const limit = 200;
  const fields = "id,date,created_at,updated_at,type,matter,quantity_in_hours,note,total,price,expense_category,activity_description,user,bill,billed";
  
  const activitiesUrl = 'https://eu.app.clio.com/api/v4/activities.json';
  
  while (true) {
    const params = new URLSearchParams({
      created_since: startDate,
      created_before: endDate,
      fields: fields,
      limit: limit.toString(),
      offset: offset.toString(),
    });
    
    // Add user_id filter if provided (for user-specific requests)
    if (userId) {
      params.set('user_id', userId.toString());
    }
    
    const url = `${activitiesUrl}?${params.toString()}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch team activities from Clio: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    if (data.data && Array.isArray(data.data)) {
      allActivities = allActivities.concat(data.data);
    }
    
    // Check for pagination
    if (!data.meta?.paging?.next || data.data.length < limit) {
      break;
    }
    offset += limit;
  }
  
  // Success - return activities data without verbose logging
  return allActivities;
}

function convertClioActivitiesToWIP(activities) {
  if (!Array.isArray(activities)) return [];
  
  return activities.map(activity => {
    // Round up quantity_in_hours to one decimal place (matching Azure Function)
    const quantity = activity.quantity_in_hours !== undefined 
      ? Math.ceil(activity.quantity_in_hours * 10) / 10 
      : undefined;
    
    return {
      id: activity.id || 0,
      date: activity.date || undefined,
      created_at: activity.created_at || undefined,
      updated_at: activity.updated_at || undefined,
      type: activity.type || undefined,
      matter: activity.matter || undefined,
      quantity_in_hours: quantity,
      note: activity.note || undefined,
      total: activity.total || undefined,
      price: activity.price || undefined,
      expense_category: activity.expense_category || null,
      activity_description: activity.activity_description || undefined,
      user: activity.user || undefined,
      bill: activity.bill || undefined,
      billed: activity.billed || undefined,
    };
  });
}

// Helper functions for date handling and ranges

async function fetchRecoveredFees({ connectionString }) {
  const { from, to } = getLast24MonthsRange();
  return withRequest(connectionString, async (request, sqlClient) => {
    request.input('dateFrom', sqlClient.Date, formatDateOnly(from));
    request.input('dateTo', sqlClient.Date, formatDateOnly(to));
    const result = await request.query(`
      SELECT 
        matter_id,
        bill_id,
        contact_id,
        id,
        date,
        created_at,
        kind,
        type,
        activity_type,
        description,
        sub_total,
        tax,
        secondary_tax,
        user_id,
        user_name,
        payment_allocated,
        CONVERT(VARCHAR(10), payment_date, 120) AS payment_date
      FROM [dbo].[collectedTime]
      WHERE payment_date BETWEEN @dateFrom AND @dateTo
      ORDER BY payment_date DESC
    `);
    if (!Array.isArray(result.recordset)) {
      return [];
    }
    return result.recordset.map((row) => {
      if (row.payment_allocated != null) {
        const value = Number(row.payment_allocated);
        if (!Number.isNaN(value)) {
          row.payment_allocated = value;
        }
      }
      return row;
    });
  });
}

async function fetchRecoveredFeesSummary({ connectionString, entraId, clioId }) {
  let effectiveClioId = typeof clioId === 'number' ? clioId : null;

  if (!effectiveClioId && entraId && connectionString) {
    try {
      const userData = await withRequest(connectionString, async (request, sqlClient) => {
        request.input('entraId', sqlClient.NVarChar, entraId);
        const result = await request.query(`
          SELECT [Clio ID]
          FROM [dbo].[team]
          WHERE [Entra ID] = @entraId
        `);
        return Array.isArray(result.recordset) ? result.recordset : [];
      });
      const resolved = userData?.[0]?.['Clio ID'];
      if (resolved != null) {
        const parsed = Number(resolved);
        if (!Number.isNaN(parsed)) {
          effectiveClioId = parsed;
        }
      }
    } catch (lookupError) {
      console.warn('Failed to resolve Clio ID for recovered fees summary:', lookupError.message);
    }
  }

  if (!effectiveClioId) {
    return {
      currentMonthTotal: 0,
      previousMonthTotal: 0,
    };
  }

  const now = new Date();
  const currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  currentStart.setHours(0, 0, 0, 0);
  currentEnd.setHours(23, 59, 59, 999);

  const previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  previousStart.setHours(0, 0, 0, 0);
  previousEnd.setHours(23, 59, 59, 999);

  return withRequest(connectionString, async (request, sqlClient) => {
    request.input('userId', sqlClient.Int, effectiveClioId);
    request.input('prevStart', sqlClient.Date, formatDateOnly(previousStart));
    request.input('prevEnd', sqlClient.Date, formatDateOnly(previousEnd));
    request.input('currentStart', sqlClient.Date, formatDateOnly(currentStart));
    request.input('currentEnd', sqlClient.Date, formatDateOnly(currentEnd));

    const result = await request.query(`
      SELECT
        SUM(CASE WHEN payment_date BETWEEN @currentStart AND @currentEnd THEN payment_allocated ELSE 0 END) AS current_total,
        SUM(CASE WHEN payment_date BETWEEN @prevStart AND @prevEnd THEN payment_allocated ELSE 0 END) AS prev_total
      FROM [dbo].[collectedTime]
      WHERE payment_date BETWEEN @prevStart AND @currentEnd
        AND user_id = @userId
    `);

    const record = Array.isArray(result.recordset) && result.recordset.length > 0
      ? result.recordset[0]
      : { current_total: 0, prev_total: 0 };

    const currentTotal = Number(record.current_total) || 0;
    const previousTotal = Number(record.prev_total) || 0;

    return {
      currentMonthTotal: currentTotal,
      previousMonthTotal: previousTotal,
    };
  });
}

async function fetchPoidData({ connectionString }) {
  const { from, to } = getLast24MonthsRange();
  return withRequest(connectionString, async (request, sqlClient) => {
    request.input('dateFrom', sqlClient.Date, formatDateOnly(from));
    request.input('dateTo', sqlClient.Date, formatDateOnly(to));
    const result = await request.query(`
      SELECT 
        poid_id,
        type,
        terms_acceptance,
        submission_url,
        CONVERT(VARCHAR(10), submission_date, 120) AS submission_date,
        id_docs_folder,
        acid,
        card_id,
        poc,
        nationality_iso,
        nationality,
        gender,
        first,
        last,
        prefix,
        date_of_birth,
        best_number,
        email,
        passport_number,
        drivers_license_number,
        house_building_number,
        street,
        city,
        county,
        post_code,
        country,
        country_code,
        company_name,
        company_number,
        company_house_building_number,
        company_street,
        company_city,
        company_county,
        company_post_code,
        company_country,
        company_country_code,
        stage,
        check_result,
        check_id,
        additional_id_submission_id,
        additional_id_submission_url,
        additional_id_submission_date,
        client_id,
        related_client_id,
        matter_id,
        risk_assessor,
        risk_assessment_date
      FROM [dbo].[poid]
      WHERE submission_date BETWEEN @dateFrom AND @dateTo
      ORDER BY submission_date DESC
    `);
    return Array.isArray(result.recordset) ? result.recordset : [];
  });
}

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

// Monday 00:00:00 to Sunday 23:59:59.999 of current week
function getCurrentWeekBounds() {
  const now = new Date();
  const current = new Date(now);
  current.setHours(0, 0, 0, 0);
  const day = current.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const start = new Date(current);
  start.setDate(current.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function enumerateDateKeys(from, to) {
  const keys = [];
  const d = new Date(from);
  d.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(0, 0, 0, 0);
  while (d <= end) {
    keys.push(formatDateOnly(d));
    d.setDate(d.getDate() + 1);
  }
  return keys;
}

// --- Local helpers to normalize and aggregate WIP entries into daily totals ---
function toDayKey(input) {
  if (typeof input !== 'string') {
    const d = new Date(input);
    if (!isNaN(d.getTime())) return formatDateOnly(d);
    return '';
  }
  const m = input.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  const d = new Date(input);
  if (!isNaN(d.getTime())) return formatDateOnly(d);
  return '';
}

function parseDateOnlyLocal(s) {
  const m = typeof s === 'string' && s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) {
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    d.setHours(0, 0, 0, 0);
    return d;
  }
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    d.setHours(0, 0, 0, 0);
    return d;
  }
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

function isDateInRange(dateStr, startDate, endDate) {
  const date = parseDateOnlyLocal(dateStr);
  return date >= startDate && date <= endDate;
}

function aggregateDailyData(activities, rangeStart, rangeEnd) {
  const daily = {};
  for (const a of activities) {
    const rawDate = a.date || a.created_at || a.updated_at;
    const key = toDayKey(rawDate);
    if (!key) continue;
    if (!isDateInRange(key, rangeStart, rangeEnd)) continue;
    if (!daily[key]) daily[key] = { total_hours: 0, total_amount: 0 };
    const hours = typeof a.quantity_in_hours === 'number'
      ? a.quantity_in_hours
      : Number(a.quantity_in_hours);
    const amount = typeof a.total === 'number' ? a.total : Number(a.total);
    if (!Number.isNaN(hours)) daily[key].total_hours += hours;
    if (!Number.isNaN(amount)) daily[key].total_amount += amount;
  }
  return daily;
}
