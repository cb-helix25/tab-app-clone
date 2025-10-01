# Teams Mobile Connection Reset Fix

## Problem
Users experiencing `ECONNRESET` errors in Teams mobile app specifically, while browser users work fine.

**Root Causes:**
1. **Too low concurrent request limit** (6) causing request queue buildup
2. **No queue timeout** - requests waited indefinitely
3. **Long timeouts** (300s) inappropriate for mobile clients
4. **No connection health checks** - stale connections not detected
5. **Teams mobile network instability** - stricter timeout requirements

## Error Pattern
```
Connection lost - write ECONNRESET
at C:\home\site\wwwroot\node_modules\mssql\lib\tedious\connection-pool.js:85:17
```

Multiple database operations failing simultaneously:
- `enquiries-unified`
- `matters-unified`
- `team-data`
- `attendance`
- `reporting/management-datasets`

## Solution Applied

### 1. Increased Concurrency (Critical)
**Before:** `SQL_MAX_CONCURRENT_REQUESTS = 6`
**After:** `SQL_MAX_CONCURRENT_REQUESTS = 25`

Teams mobile makes many parallel API calls on page load. 6 concurrent requests was causing severe queueing.

### 2. Added Queue Timeout Protection
**Before:** Requests waited indefinitely in queue
**After:** 30-second queue timeout with clear error message

Prevents cascade failures from requests piling up forever.

### 3. Reduced Timeouts for Mobile Clients
```
SQL_REQUEST_TIMEOUT_MS: 300000 → 60000 (60s)
SQL_CONNECTION_TIMEOUT_MS: 30000 → 15000 (15s)
SQL_POOL_ACQUIRE_TIMEOUT_MS: 20000 → 10000 (10s)
SQL_POOL_IDLE_TIMEOUT_MS: 60000 → 30000 (30s)
```

Mobile clients need faster failures to retry rather than waiting 5 minutes.

### 4. Connection Health Monitoring
Added automatic health checks every 2 minutes:
- Validates pool connections are still alive
- Removes stale/dead connections proactively
- Prevents using broken connections

### 5. Enhanced Retry Logic
- Validates pool connection before use
- Better error logging for diagnostics
- Exponential backoff with jitter
- Added `EPIPE` and `ENOTFOUND` to transient error codes

### 6. Connection Validation on Connect
New pools now:
1. Connect to database
2. Run `SELECT 1` health check
3. Only mark as ready if validation passes

Prevents returning "connected" but non-functional pools.

### 7. Monitoring Metrics
Logs every 60 seconds:
- Active pools
- Active/queued requests
- Total requests/errors
- Queue timeout count
- Error rate percentage

## Configuration

### Production Settings (Azure App Service)
Add to App Service Configuration / Environment Variables:

```bash
SQL_MAX_CONCURRENT_REQUESTS=25
SQL_POOL_MAX=25
SQL_POOL_MIN=2
SQL_REQUEST_TIMEOUT_MS=60000
SQL_CONNECTION_TIMEOUT_MS=15000
SQL_POOL_ACQUIRE_TIMEOUT_MS=10000
SQL_POOL_IDLE_TIMEOUT_MS=30000
SQL_QUEUE_TIMEOUT_MS=30000
SQL_HEALTH_CHECK_INTERVAL_MS=120000
```

### If Still Experiencing Issues
For higher load, increase further:
```bash
SQL_MAX_CONCURRENT_REQUESTS=50
SQL_POOL_MAX=50
SQL_QUEUE_TIMEOUT_MS=45000
```

## Deployment

### 1. Deploy Changes
```powershell
# Build and deploy to Azure
.\build-and-deploy.ps1
```

### 2. Configure App Service
In Azure Portal → App Service → Configuration → Application Settings:
- Add environment variables from above
- Restart the app service

### 3. Monitor Logs
```bash
# Watch application logs
az webapp log tail --name link-hub-v1 --resource-group <your-rg>
```

Look for:
- "SQL Connection Metrics" log entries
- Queue timeout messages
- Error rates

## Verification

### Check Metrics
Logs will show every minute:
```
SQL Connection Metrics: {
  activePools: 2,
  activeRequests: 8,
  queuedRequests: 0,
  totalRequests: 1250,
  totalErrors: 3,
  totalQueueTimeouts: 0,
  errorRate: '0.24%'
}
```

**Healthy indicators:**
- `queuedRequests` stays low (< 5)
- `errorRate` < 1%
- `totalQueueTimeouts` stays at 0

**Problem indicators:**
- `queuedRequests` consistently high (> 10)
- `errorRate` > 5%
- Increasing `totalQueueTimeouts`

### Test in Teams Mobile
1. Open app in Teams mobile (iOS/Android)
2. Navigate through all main sections
3. Watch for ECONNRESET errors
4. Check load times are reasonable

## Why Teams Mobile Was Affected More

1. **Parallel requests:** Teams app makes many simultaneous API calls on load
2. **Network instability:** Mobile networks more prone to connection drops
3. **Stricter timeouts:** Teams client has shorter timeouts than browsers
4. **Connection reuse:** Browser keeps connections alive; mobile often reconnects
5. **Background mode:** App suspension/resume can break connections

## Technical Details

### Connection Pool Architecture
```
User Request → acquireRequestSlot() → Queue or Proceed
                      ↓
              getPool(connStr) → Create or Reuse Pool
                      ↓
              withRequest() → Execute Query
                      ↓
              releaseRequestSlot() → Process Queue
```

### Queue Protection
```
Request arrives → Check active count
  ├─ < 25: Proceed immediately
  └─ >= 25: Add to queue with 30s timeout
              ├─ Slot available: Proceed
              └─ Timeout: Reject with error
```

### Health Check Cycle
```
Every 2 minutes:
  For each pool:
    ├─ Check .connected status
    ├─ Run SELECT 1 test query (5s timeout)
    ├─ Success: Keep pool
    └─ Failure: Close and remove pool
```

## Rollback Plan

If issues persist, temporarily increase limits:

```bash
# Emergency high-concurrency mode
SQL_MAX_CONCURRENT_REQUESTS=100
SQL_POOL_MAX=100
SQL_QUEUE_TIMEOUT_MS=60000
```

Then investigate if:
1. Database DTU/CPU is saturated
2. Specific slow queries causing backlog
3. Network issues between App Service and SQL Server

## Related Files
- `server/utils/db.js` - Main database connection module
- `.env.production.example` - Configuration template
- `docs/TEAMS_MOBILE_ECONNRESET_FIX.md` - This document

## References
- [Azure SQL Connection Best Practices](https://learn.microsoft.com/azure/azure-sql/database/develop-overview)
- [mssql Node.js Driver Configuration](https://www.npmjs.com/package/mssql#configuration-1)
- [Teams Mobile Client Behavior](https://learn.microsoft.com/microsoftteams/platform/tabs/how-to/access-teams-context)
