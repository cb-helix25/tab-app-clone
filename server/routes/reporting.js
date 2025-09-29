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
  poidData: fetchPoidData,
  wipClioCurrentWeek: fetchWipClioCurrentWeek,
};

router.get('/management-datasets', async (req, res) => {
  const connectionString = process.env.SQL_CONNECTION_STRING;
  if (!connectionString) {
    return res.status(500).json({ error: 'SQL connection string not configured' });
  }

  // Debug: Log connection string format (without sensitive data)
  console.log('SQL_CONNECTION_STRING format check:', {
    hasValue: !!connectionString,
    length: connectionString.length,
    startsWithBrace: connectionString.startsWith('{'),
    containsSemicolon: connectionString.includes(';'),
    containsServer: connectionString.toLowerCase().includes('server'),
    sample: connectionString.substring(0, 50) + '...'
  });

  const datasetsParam = typeof req.query.datasets === 'string'
    ? req.query.datasets.split(',').map((name) => name.trim()).filter(Boolean)
    : null;
  const requestedDatasets = (datasetsParam && datasetsParam.length > 0)
    ? datasetsParam.filter((name) => Object.prototype.hasOwnProperty.call(datasetFetchers, name))
    : DEFAULT_DATASETS;
  const entraId = typeof req.query.entraId === 'string' && req.query.entraId.trim().length > 0
    ? req.query.entraId.trim()
    : null;
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
      responsePayload[datasetKey] = await fetcher({ connectionString, entraId });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Reporting dataset fetch failed for ${datasetKey}:`, message);
      errors[datasetKey] = message;
      responsePayload[datasetKey] = null;
    }
  }));

  // Join: Merge Clio current-week into payload for frontend consumption
  try {
    if (responsePayload.wipClioCurrentWeek && typeof responsePayload.wipClioCurrentWeek === 'object') {
      // Expose a stable alias used by the frontend tiles
      responsePayload.wipCurrentAndLastWeek = {
        current_week: responsePayload.wipClioCurrentWeek.current_week || { daily_data: {} },
        last_week: responsePayload.wipClioCurrentWeek.last_week || { daily_data: {} },
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
  // Fetch team-wide current week activities (no user filtering)
  const startedAt = Date.now();
  try {
    const accessToken = await getClioAccessToken();
    
    // Calculate current week date range (Monday to today)
    const now = new Date();
    const weekStart = new Date(now);
    const day = weekStart.getDay();
    const diff = day === 0 ? -6 : 1 - day; // Adjust when day is Sunday
    weekStart.setDate(weekStart.getDate() + diff);
    weekStart.setHours(0, 1, 0, 0); // Start at 00:01 on Monday
    
    const startDate = formatDateTimeForClio(weekStart);
    const endDate = formatDateTimeForClio(now);
    
    // Fetch ALL team activities from Clio API (no user filtering)
    const activities = await fetchAllClioActivities(startDate, endDate, accessToken);
    
    // Convert to WIP format matching Azure Function structure
    return convertClioActivitiesToWIP(activities);
  } catch (error) {
    console.error('Failed to fetch team WIP from Clio:', error.message);
    return null;
  } finally {
    const ms = Date.now() - startedAt;
    if (ms > 2000) {
      console.warn(`Team-wide Clio API call slow: ${ms}ms`);
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

async function fetchAllClioActivities(startDate, endDate, accessToken) {
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
    
    const url = `${activitiesUrl}?${params.toString()}`;
    console.log(`Fetching team Clio activities: ${url}`);
    
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
  
  console.log(`Fetched ${allActivities.length} team activities from Clio for current week`);
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
