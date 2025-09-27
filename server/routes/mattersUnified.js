const express = require('express');
const sql = require('mssql');

const router = express.Router();

// Simple in-memory cache for the unified payload
let unifiedCache = {
  data: null,
  ts: 0,
};

const UNIFIED_CACHE_TTL_MS = Number(process.env.UNIFIED_MATTERS_TTL_MS || 2 * 60 * 1000); // 2 minutes default

// Direct DB helpers
async function withPool(connectionString, fn) {
  let pool;
  try {
    pool = await new sql.ConnectionPool(connectionString).connect();
    return await fn(pool);
  } finally {
    if (pool) {
      try { await pool.close(); } catch { /* ignore */ }
    }
  }
}

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

  try {
    // Explicit, separate DB connection strings
    const legacyConn = process.env.SQL_CONNECTION_STRING_LEGACY || process.env.SQL_CONNECTION_STRING; // helix-core-data (legacy schema)
    const vnetConn = process.env.SQL_CONNECTION_STRING_VNET || process.env.INSTRUCTIONS_SQL_CONNECTION_STRING; // instructions DB (new schema)

    if (!legacyConn || !vnetConn) {
      return res.status(500).json({ error: 'Missing DB connection strings', details: 'Require SQL_CONNECTION_STRING[_LEGACY] and SQL_CONNECTION_STRING_VNET or INSTRUCTIONS_SQL_CONNECTION_STRING' });
    }

    const fullName = req.query.fullName ? String(req.query.fullName) : '';
    const norm = normalizeName(fullName);

    const [legacyAll, vnetAll] = await Promise.all([
      // Legacy: return ALL matters (no filter) from helix-core-data
      withPool(legacyConn, async (pool) => {
        const q = 'SELECT * FROM matters';
        const r = await pool.request().query(q);
        return Array.isArray(r.recordset) ? r.recordset : [];
      }),
      // VNet/new: optional server-side filter by name
      withPool(vnetConn, async (pool) => {
        if (!norm) {
          const r = await pool.request().query('SELECT * FROM Matters');
          return Array.isArray(r.recordset) ? r.recordset : [];
        }
        const reqSql = pool.request();
        reqSql.input('name', sql.VarChar(200), norm);
        reqSql.input('nameLike', sql.VarChar(210), `%${norm}%`);
        const q = `
          SELECT * FROM Matters
          WHERE (
            LOWER(ResponsibleSolicitor) = @name OR LOWER(OriginatingSolicitor) = @name
            OR LOWER(ResponsibleSolicitor) LIKE @nameLike OR LOWER(OriginatingSolicitor) LIKE @nameLike
          )`;
        const r = await reqSql.query(q);
        return Array.isArray(r.recordset) ? r.recordset : [];
      })
    ]);

    const payload = {
      legacyAllCount: Array.isArray(legacyAll) ? legacyAll.length : 0,
      vnetAllCount: Array.isArray(vnetAll) ? vnetAll.length : 0,
      legacyAll,
      vnetAll,
      cached: false,
      ttlMs: UNIFIED_CACHE_TTL_MS,
    };

    unifiedCache = { data: payload, ts: now };
    return res.json(payload);
  } catch (err) {
    console.error('❌ /api/matters-unified failed:', err);
    return res.status(500).json({ error: 'Failed to fetch unified matters', details: String(err && err.message || err) });
  }
});

module.exports = router;
