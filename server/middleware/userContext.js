/**
 * User Context Middleware
 * Enriches requests with user information and logs user sessions/actions
 */

const { withRequest } = require('../utils/db');

// In-memory cache for user lookups (refresh every 15 minutes)
const userCache = new Map();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

/**
 * Look up user details from database by Entra ID
 */
async function getUserByEntraId(entraId) {
  if (!entraId) return null;

  // Check cache first
  const cached = userCache.get(entraId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.user;
  }

  try {
    const connectionString = process.env.SQL_CONNECTION_STRING;
    if (!connectionString) return null;

    const result = await withRequest(connectionString, async (request, sqlClient) => {
      request.input('entraId', sqlClient.NVarChar, entraId);
      const queryResult = await request.query(`
        SELECT 
          [Entra ID] as entraId,
          [Full Name] as fullName,
          [Initials] as initials,
          [Email] as email,
          [Clio ID] as clioId,
          [Role] as role
        FROM [dbo].[team]
        WHERE [Entra ID] = @entraId
      `);
      return queryResult.recordset[0] || null;
    });

    // Cache the result
    if (result) {
      userCache.set(entraId, {
        user: result,
        timestamp: Date.now()
      });
    }

    return result;
  } catch (error) {
    console.error('[UserContext] Failed to lookup user:', error.message);
    return null;
  }
}

/**
 * Look up user details by email or initials
 */
async function getUserByEmailOrInitials(email, initials) {
  if (!email && !initials) return null;

  try {
    const connectionString = process.env.SQL_CONNECTION_STRING;
    if (!connectionString) return null;

    const result = await withRequest(connectionString, async (request, sqlClient) => {
      let query = `
        SELECT 
          [Entra ID] as entraId,
          [Full Name] as fullName,
          [Initials] as initials,
          [Email] as email,
          [Clio ID] as clioId,
          [Role] as role
        FROM [dbo].[team]
        WHERE 1=1
      `;

      if (email) {
        request.input('email', sqlClient.VarChar(255), email.toLowerCase());
        query += ` AND LOWER([Email]) = @email`;
      }

      if (initials) {
        request.input('initials', sqlClient.VarChar(10), initials.toUpperCase());
        query += ` AND UPPER([Initials]) = @initials`;
      }

      const queryResult = await request.query(query);
      return queryResult.recordset[0] || null;
    });

    // Cache by entraId if found
    if (result && result.entraId) {
      userCache.set(result.entraId, {
        user: result,
        timestamp: Date.now()
      });
    }

    return result;
  } catch (error) {
    console.error('[UserContext] Failed to lookup user by email/initials:', error.message);
    return null;
  }
}

/**
 * Middleware to add user context to requests and log user actions
 */
async function userContextMiddleware(req, res, next) {
  const startTime = Date.now();
  
  // Extract user identifiers from query/body
  const entraId = req.query.entraId || req.body?.entraId;
  const email = req.query.email || req.body?.email;
  const initials = req.query.initials || req.body?.initials;
  const fullName = req.query.fullName || req.body?.fullName;

  // Try to get user details
  let user = null;
  if (entraId) {
    user = await getUserByEntraId(entraId);
  } else if (email || initials) {
    user = await getUserByEmailOrInitials(email, initials);
  }

  // Attach user to request for use in routes
  req.user = user;

  // Generate request ID for tracking
  req.requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Log session initiation with user context
  const userDisplay = user 
    ? `${user.fullName} (${user.initials}) <${user.email}>`
    : email 
      ? `${email}${initials ? ` [${initials}]` : ''} (unauthenticated)`
      : fullName
        ? `${fullName} (unauthenticated)`
        : 'Anonymous';

  console.log(`
┌─────────────────────────────────────────────────────────────
│ 🔐 REQUEST [${req.requestId}]
│ User: ${userDisplay}
│ Action: ${req.method} ${req.path}
│ IP: ${req.ip || req.connection.remoteAddress}
│ User-Agent: ${req.headers['user-agent']?.substring(0, 60)}...
${entraId ? `│ Entra ID: ${entraId}` : ''}
${user?.clioId ? `│ Clio ID: ${user.clioId}` : ''}
${user?.role ? `│ Role: ${user.role}` : ''}
└─────────────────────────────────────────────────────────────`);

  // Log response when finished
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - startTime;
    const statusSymbol = res.statusCode < 300 ? '✅' : res.statusCode < 400 ? '⚠️' : '❌';
    
    console.log(`${statusSymbol} RESPONSE [${req.requestId}] ${res.statusCode} | ${duration}ms | User: ${user?.initials || email || 'Anonymous'}`);
    
    // Log slow requests
    if (duration > 3000) {
      console.warn(`⏱️  SLOW REQUEST [${req.requestId}] took ${duration}ms for ${req.method} ${req.path}`);
    }

    return originalSend.call(this, data);
  };

  next();
}

module.exports = {
  userContextMiddleware,
  getUserByEntraId,
  getUserByEmailOrInitials
};
