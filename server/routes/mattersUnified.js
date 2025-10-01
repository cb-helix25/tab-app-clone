const express = require('express');
const { withRequest, sql } = require('../utils/db');

const router = express.Router();

// Simple in-memory cache for the unified payload
let unifiedCache = {
  data: null,
  ts: 0,
};

const UNIFIED_CACHE_TTL_MS = Number(process.env.UNIFIED_MATTERS_TTL_MS || 2 * 60 * 1000); // 2 minutes default

// Request throttling to prevent database overload
let activeRequests = 0;
const MAX_CONCURRENT_REQUESTS = 3; // Allow up to 3 concurrent requests

function normalizeName(name) {
  if (!name) return '';
  const n = String(name).trim().toLowerCase();
  if (n.includes(',')) {
    const [last, first] = n.split(',').map(p => p.trim());
    if (first && last) return `${first} ${last}`;
  }
  return n.replace(/\s+/g, ' ');
}

/**
 * GET /api/matters-unified
 * Returns both legacy (all) and VNet (all) matters in a single payload.
 * Optional query params:
 *  - fullName: forwarded to VNet route for server-side filtering (legacy returns all)
 *  - bypassCache=true to force refresh
 */
router.get('/', async (req, res) => {
  const now = Date.now();
  const bypassCache = String(req.query.bypassCache || '').toLowerCase() === 'true';
  
  if (!bypassCache && unifiedCache.data && (now - unifiedCache.ts) < UNIFIED_CACHE_TTL_MS) {
    return res.json({ ...unifiedCache.data, cached: true });
  }

  // Check request throttling
  if (activeRequests >= MAX_CONCURRENT_REQUESTS) {
    return res.status(429).json({ 
      error: 'Too many concurrent requests', 
      details: 'Please try again in a moment',
      cached: unifiedCache.data ? true : false,
      ...(unifiedCache.data && { ...unifiedCache.data })
    });
  }

  try {
    activeRequests++;
    
    // Explicit, separate DB connection strings
    const legacyConn = process.env.SQL_CONNECTION_STRING_LEGACY || process.env.SQL_CONNECTION_STRING; // helix-core-data (legacy schema)
    const vnetConn = process.env.SQL_CONNECTION_STRING_VNET || process.env.INSTRUCTIONS_SQL_CONNECTION_STRING; // instructions DB (new schema)

    if (!legacyConn || !vnetConn) {
      return res.status(500).json({ error: 'Missing DB connection strings', details: 'Require SQL_CONNECTION_STRING[_LEGACY] and SQL_CONNECTION_STRING_VNET or INSTRUCTIONS_SQL_CONNECTION_STRING' });
    }

    const fullName = req.query.fullName ? String(req.query.fullName) : '';
    const norm = normalizeName(fullName);

    // Sequential requests to avoid overwhelming the database
    let legacyAll = [];
    let legacyError = null;
    try {
      legacyAll = await withRequest(legacyConn, async (request) => {
        const q = 'SELECT * FROM matters';
        const r = await request.query(q);
        return Array.isArray(r.recordset) ? r.recordset : [];
      });
    } catch (err) {
      legacyAll = [];
      legacyError = err;
      console.error('❌ Legacy matters query failed:', err?.message || err);
    }

    // VNet/new: Handle instructions DB timeouts gracefully
    let vnetAll = [];
    let vnetError = null;
    try {
      vnetAll = await withRequest(vnetConn, async (request) => {
        if (!norm) {
          const r = await request.query('SELECT * FROM Matters');
          return Array.isArray(r.recordset) ? r.recordset : [];
        }
        request.input('name', sql.VarChar(200), norm);
        request.input('nameLike', sql.VarChar(210), `%${norm}%`);
        const q = `
          SELECT * FROM Matters
          WHERE (
            LOWER(ResponsibleSolicitor) = @name OR LOWER(OriginatingSolicitor) = @name
            OR LOWER(ResponsibleSolicitor) LIKE @nameLike OR LOWER(OriginatingSolicitor) LIKE @nameLike
          )`;
        const r = await request.query(q);
        return Array.isArray(r.recordset) ? r.recordset : [];
      });
    } catch (vnetError) {
      // VNet database unavailable - continue with legacy data only
      console.error('⚠️ VNet matters query fallback:', vnetError?.message || vnetError);
      vnetAll = []; // Fallback to empty array
    }

    const responsePayload = {
      legacyAllCount: Array.isArray(legacyAll) ? legacyAll.length : 0,
      vnetAllCount: Array.isArray(vnetAll) ? vnetAll.length : 0,
      legacyAll,
      vnetAll,
      cached: false,
      ttlMs: UNIFIED_CACHE_TTL_MS,
      errors: {},
    };

    if (legacyError) {
      responsePayload.errors.legacy = legacyError?.message || String(legacyError);
    }
    if (vnetError) {
      responsePayload.errors.vnet = vnetError?.message || String(vnetError);
    }

    if (!legacyAll.length && !vnetAll.length && (legacyError || vnetError)) {
      if (unifiedCache.data) {
        return res.status(200).json({
          ...unifiedCache.data,
          cached: true,
          stale: true,
          errors: {
            ...(unifiedCache.data.errors || {}),
            ...(responsePayload.errors || {}),
          },
        });
      }
      const consolidatedError = legacyError || vnetError;
      return res.status(502).json({
        error: 'Failed to fetch unified matters',
        details: consolidatedError?.message || String(consolidatedError),
      });
    }

    unifiedCache = { data: responsePayload, ts: now };
    return res.json(responsePayload);
  } catch (err) {
    console.error('❌ /api/matters-unified failed:', err);
    
    // Handle throttling errors with 429 status
    if (err.message.includes('Too many concurrent')) {
      return res.status(429).json({ 
        error: 'Too many concurrent requests', 
        details: 'Please try again in a moment',
        cached: unifiedCache.data ? true : false,
        ...(unifiedCache.data && { ...unifiedCache.data })
      });
    }
    if (unifiedCache.data) {
      return res.status(200).json({
        ...unifiedCache.data,
        cached: true,
        stale: true,
        errors: {
          ...(unifiedCache.data.errors || {}),
          runtime: err?.message || String(err),
        },
      });
    }
    
    return res.status(500).json({ error: 'Failed to fetch unified matters', details: String(err && err.message || err) });
  } finally {
    activeRequests--;
  }
});

module.exports = router;
