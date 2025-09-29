const express = require('express');
const { withRequest } = require('../utils/db');

const router = express.Router();

const DEFAULT_DATASETS = ['userData', 'teamData', 'enquiries', 'allMatters', 'wip', 'recoveredFees', 'poidData'];
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
