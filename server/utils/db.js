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

    // Configure pool and timeouts explicitly for stability on Azure App Service
    const requestTimeoutMs = Number(process.env.SQL_REQUEST_TIMEOUT_MS || 300000);
    const connectionTimeoutMs = Number(process.env.SQL_CONNECTION_TIMEOUT_MS || 30000);
    const acquireTimeoutMs = Number(process.env.SQL_POOL_ACQUIRE_TIMEOUT_MS || 20000);
    const idleTimeoutMs = Number(process.env.SQL_POOL_IDLE_TIMEOUT_MS || 30000);
    const maxPool = Number(process.env.SQL_POOL_MAX || 10);
    const minPool = Number(process.env.SQL_POOL_MIN || 0);

    // Parse connection string to handle both formats
    let poolConfig;
    
    // Check if it looks like a connection string (contains semicolons) or structured config
    if (connStr.includes(';') || (connStr.includes('=') && !connStr.startsWith('{'))) {
      // Traditional connection string format (Server=...; Database=...; etc.)
      // Parse connection string into individual properties for mssql v11+ compatibility
      const connParams = {};
      connStr.split(';').forEach(part => {
        const [key, ...valueParts] = part.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          const keyLower = key.trim().toLowerCase();
          if (keyLower === 'server') {
            // Handle SQL Server connection string format: tcp:server.name,port
            let serverValue = value;
            if (serverValue.startsWith('tcp:')) {
              serverValue = serverValue.substring(4);
            }
            // Extract server name and port
            const [serverName, port] = serverValue.split(',');
            connParams.server = serverName;
            if (port) connParams.port = parseInt(port, 10);
          }
          else if (keyLower === 'initial catalog' || keyLower === 'database') connParams.database = value;
          else if (keyLower === 'user id' || keyLower === 'uid') connParams.user = value;
          else if (keyLower === 'password' || keyLower === 'pwd') connParams.password = value;
          else if (keyLower === 'encrypt') connParams.encrypt = value.toLowerCase() === 'true';
          else if (keyLower === 'trustservercertificate') connParams.trustServerCertificate = value.toLowerCase() === 'true';
        }
      });
      
      poolConfig = {
        server: connParams.server,
        port: connParams.port || 1433,
        database: connParams.database,
        user: connParams.user,
        password: connParams.password,
        options: {
          encrypt: connParams.encrypt !== false, // default to true for Azure SQL
          trustServerCertificate: connParams.trustServerCertificate || false,
          requestTimeout: requestTimeoutMs,
          connectionTimeout: connectionTimeoutMs,
          enableArithAbort: true,
        },
        pool: {
          max: Number.isFinite(maxPool) ? maxPool : 10,
          min: Number.isFinite(minPool) ? minPool : 0,
          idleTimeoutMillis: Number.isFinite(idleTimeoutMs) ? idleTimeoutMs : 30000,
          acquireTimeoutMillis: Number.isFinite(acquireTimeoutMs) ? acquireTimeoutMs : 20000,
          createTimeoutMillis: Number.isFinite(connectionTimeoutMs) ? connectionTimeoutMs : 30000,
          destroyTimeoutMillis: 5000,
        },
      };
    } else if (connStr.startsWith('{')) {
      // JSON-like config format
      try {
        const config = JSON.parse(connStr);
        if (!config.server) {
          throw new Error('JSON config must include "server" property');
        }
        poolConfig = {
          ...config,
          options: {
            encrypt: true,
            trustServerCertificate: false,
            requestTimeout: requestTimeoutMs,
            connectionTimeout: connectionTimeoutMs,
            enableArithAbort: true,
            ...config.options,
          },
          pool: {
            max: Number.isFinite(maxPool) ? maxPool : 10,
            min: Number.isFinite(minPool) ? minPool : 0,
            idleTimeoutMillis: Number.isFinite(idleTimeoutMs) ? idleTimeoutMs : 30000,
            acquireTimeoutMillis: Number.isFinite(acquireTimeoutMs) ? acquireTimeoutMs : 20000,
            createTimeoutMillis: Number.isFinite(connectionTimeoutMs) ? connectionTimeoutMs : 30000,
            destroyTimeoutMillis: 5000,
            ...config.pool,
          },
        };
      } catch (parseErr) {
        throw new Error(`Invalid JSON connection config. Error: ${parseErr.message}`);
      }
    } else {
      // Fallback: create a basic config assuming it's a server name or simple format
      // This helps with local development
      poolConfig = {
        server: connStr,
        database: process.env.SQL_DATABASE || 'master',
        options: {
          encrypt: true,
          trustServerCertificate: true, // for local development
          requestTimeout: requestTimeoutMs,
          connectionTimeout: connectionTimeoutMs,
          enableArithAbort: true,
        },
        pool: {
          max: Number.isFinite(maxPool) ? maxPool : 10,
          min: Number.isFinite(minPool) ? minPool : 0,
          idleTimeoutMillis: Number.isFinite(idleTimeoutMs) ? idleTimeoutMs : 30000,
          acquireTimeoutMillis: Number.isFinite(acquireTimeoutMs) ? acquireTimeoutMs : 20000,
          createTimeoutMillis: Number.isFinite(connectionTimeoutMs) ? connectionTimeoutMs : 30000,
          destroyTimeoutMillis: 5000,
        },
      };
      
      // Add authentication if available
      if (process.env.SQL_USER && process.env.SQL_PASSWORD) {
        poolConfig.user = process.env.SQL_USER;
        poolConfig.password = process.env.SQL_PASSWORD;
      }
    }

    const pool = new sql.ConnectionPool(poolConfig);
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
  const configuredTimeout = Number(process.env.SQL_REQUEST_TIMEOUT_MS || 300000);
  const requestTimeout = Number.isFinite(configuredTimeout) && configuredTimeout > 0
    ? configuredTimeout
    : 300000;
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const pool = await getPool(connStr);
      const request = new sql.Request(pool);
      request.requestTimeout = requestTimeout;
      return await fn(request, sql);
    } catch (err) {
      lastErr = err;
      const code = err?.code || err?.originalError?.code || err?.cause?.code;
      // Include ECONNRESET and ETIMEDOUT as transient as seen on Azure SQL over ARR/iisnode
      const transientCodes = new Set(["ECONNCLOSED", "ETIMEOUT", "ETIMEDOUT", "ESOCKET", "ELOGIN", "ECONNRESET"]);
      const retryable = transientCodes.has(String(code));
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
