"use strict";

const sql = require("mssql");

// Connection pools keyed by connection string
const pools = new Map();
const connecting = new Map();

/**
 * Get (or create) a shared ConnectionPool for a given connection string.
 * Ensures only one connect() attempt per connStr at a time.
 */
async function getPool(connStr) {
  if (!connStr || typeof connStr !== "string") {
    throw new Error("getPool: invalid connection string");
  }

  const existing = pools.get(connStr);
  if (existing && existing.connected) return existing;

  if (connecting.has(connStr)) return await connecting.get(connStr);

  const connectPromise = (async () => {
    // Close any half-open pool before reconnecting
    if (existing) {
      try { await existing.close(); } catch (_) { /* ignore */ }
    }

    const pool = new sql.ConnectionPool(connStr);
    // If the pool errors, drop it so next call will recreate
    pool.on("error", () => {
      pools.delete(connStr);
    });

    await pool.connect();
    pools.set(connStr, pool);
    connecting.delete(connStr);
    return pool;
  })();

  connecting.set(connStr, connectPromise);
  return await connectPromise;
}

/**
 * Execute a function with an sql.Request created from a shared pool.
 * Retries on transient connection errors by recreating the pool.
 */
async function withRequest(connStr, fn, retries = 2) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const pool = await getPool(connStr);
      const request = new sql.Request(pool);
      return await fn(request, sql);
    } catch (err) {
      lastErr = err;
      const code = err?.code || err?.originalError?.code;
      const retryable = ["ECONNCLOSED", "ETIMEOUT", "ESOCKET", "ELOGIN"].includes(String(code));
      if (!retryable || attempt === retries) throw err;

      // Recreate pool then backoff
      pools.delete(connStr);
      const backoffMs = 200 * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, backoffMs));
    }
  }
  throw lastErr;
}

module.exports = { sql, getPool, withRequest };
