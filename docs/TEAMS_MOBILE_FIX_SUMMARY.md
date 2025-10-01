# Teams Mobile ECONNRESET Fix - Implementation Summary

## Problem Identified
Production Teams mobile app users experiencing intermittent `ECONNRESET` errors while browser users work fine.

### Error Pattern
```
Connection lost - write ECONNRESET
at mssql\lib\tedious\connection-pool.js:85:17
```

Multiple simultaneous failures across:
- Enquiries data fetch
- Matters queries  
- Team data
- Attendance records
- Reporting datasets

## Root Cause Analysis

### 1. **Concurrency Bottleneck** (Primary)
- **Issue:** Only 6 concurrent SQL requests allowed
- **Impact:** Teams mobile makes 10+ parallel API calls on page load
- **Result:** Requests queue up, waiting connections timeout

### 2. **No Queue Protection**
- **Issue:** Requests waited indefinitely for available connection
- **Impact:** Cascade failures as queue grows unbounded
- **Result:** All subsequent requests eventually timeout

### 3. **Long Timeouts**
- **Issue:** 300s (5 minute) request timeout
- **Impact:** Mobile clients drop connection long before timeout
- **Result:** Server holds dead connections, blocking pool

### 4. **No Health Monitoring**
- **Issue:** Stale connections not detected until used
- **Impact:** Attempts to use broken connections fail
- **Result:** ECONNRESET on first query attempt

### 5. **Mobile Network Instability**
- **Issue:** Teams mobile network more unreliable than browser
- **Impact:** Connections drop during long-running queries
- **Result:** Higher error rate on mobile platforms

## Solution Implemented

### Code Changes (`server/utils/db.js`)

#### 1. Increased Concurrency Limits ✅
```javascript
// Before: maxConcurrentRequests = 6
// After: maxConcurrentRequests = 25
SQL_MAX_CONCURRENT_REQUESTS=25 (default)
```

#### 2. Added Queue Timeout Protection ✅
```javascript
// 30-second timeout for waiting in queue
SQL_QUEUE_TIMEOUT_MS=30000 (default)

// Rejects with clear error instead of hanging
throw new Error(`Request queue timeout after 30s...`)
```

#### 3. Reduced Timeouts for Mobile ✅
```javascript
// Request timeout: 300s → 60s
SQL_REQUEST_TIMEOUT_MS=60000

// Connection timeout: 30s → 15s  
SQL_CONNECTION_TIMEOUT_MS=15000

// Pool acquire: 20s → 10s
SQL_POOL_ACQUIRE_TIMEOUT_MS=10000

// Idle timeout: 60s → 30s
SQL_POOL_IDLE_TIMEOUT_MS=30000
```

#### 4. Periodic Health Checks ✅
```javascript
// Every 2 minutes, validate all pools
setInterval(async () => {
  for (const [connStr, pool] of pools.entries()) {
    // Check connected status
    // Run SELECT 1 test query
    // Remove if failed
  }
}, 120000);
```

#### 5. Enhanced Connection Validation ✅
```javascript
// On pool creation:
await pool.connect();
// NEW: Validate with actual query
await testRequest.query("SELECT 1 AS test");
// Only return if validation passes
```

#### 6. Improved Retry Logic ✅
```javascript
// Before: Retry without validation
// After:
if (!pool.connected) {
  pools.delete(connStr);
  throw new Error("Pool connection lost");
}

// Added transient error codes:
"EPIPE", "ENOTFOUND", "ECONNRESET"

// Exponential backoff with jitter
const backoffMs = 100 * Math.pow(2, attempt) + Math.random() * 100;
```

#### 7. Monitoring & Metrics ✅
```javascript
// Logs every 60 seconds:
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

### Configuration Files Created

1. **`.env.production.example`** - Production environment template
2. **`docs/TEAMS_MOBILE_ECONNRESET_FIX.md`** - Full technical documentation
3. **`docs/AZURE_CONFIG_QUICK_REFERENCE.md`** - Quick setup guide
4. **`deploy-connection-fix.ps1`** - Automated deployment script

## Deployment Instructions

### Option 1: Automated Deployment (Recommended)
```powershell
# From project root
.\deploy-connection-fix.ps1
```

### Option 2: Manual Deployment

#### Step 1: Deploy Code
```powershell
npm run build
.\build-and-deploy.ps1
```

#### Step 2: Configure Azure App Service
In Azure Portal → App Service → Configuration:

```
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

#### Step 3: Restart App Service
```bash
az webapp restart --name link-hub-v1 --resource-group <your-rg>
```

## Verification Steps

### 1. Monitor Application Logs
```bash
az webapp log tail --name link-hub-v1 --resource-group <your-rg>
```

**Look for:**
- ✅ "SQL Connection Metrics" appearing every minute
- ✅ `queuedRequests: 0` or very low numbers
- ✅ `errorRate` under 1%
- ✅ `totalQueueTimeouts: 0`

### 2. Test Teams Mobile App
- Open app on iOS/Android Teams
- Navigate through all pages
- Watch for ECONNRESET errors (should be gone)
- Verify page loads complete quickly

### 3. Check Performance
- Dashboard should load < 3 seconds
- No visible delays fetching data
- No error messages in UI

## Expected Outcomes

### Before Fix
```
❌ 6 concurrent requests limit
❌ Queue grows unbounded  
❌ 300s timeouts (too long)
❌ ECONNRESET errors frequent
❌ Mobile users affected heavily
```

### After Fix
```
✅ 25 concurrent requests
✅ 30s queue timeout protection
✅ 60s request timeouts (mobile-friendly)
✅ Health checks every 2 minutes
✅ Connection validation before use
✅ Monitoring metrics visible
```

### Metrics Targets
- **Error Rate:** < 1% (from ~5-10%)
- **Queue Timeouts:** 0 (from frequent)
- **Queued Requests:** < 5 at peak
- **Response Time:** < 3s per page load

## Troubleshooting

### If ECONNRESET Still Occurs

**Check 1: Environment Variables Set?**
```bash
az webapp config appsettings list --name link-hub-v1 --resource-group <rg> | grep SQL_
```

**Check 2: Database Performance**
- Azure Portal → SQL Database → Performance
- Look for CPU/DTU saturation
- Check for slow queries

**Check 3: Increase Limits Further**
```
SQL_MAX_CONCURRENT_REQUESTS=50
SQL_POOL_MAX=50
SQL_QUEUE_TIMEOUT_MS=45000
```

**Check 4: Network Issues**
- App Service → Networking
- Verify SQL Server firewall allows App Service
- Check for NSG rules blocking traffic

## Performance Tuning

### Low Traffic (< 100 users)
```
SQL_MAX_CONCURRENT_REQUESTS=15
SQL_POOL_MAX=15
```

### Medium Traffic (100-500 users) - **Default**
```
SQL_MAX_CONCURRENT_REQUESTS=25
SQL_POOL_MAX=25
```

### High Traffic (500+ users)
```
SQL_MAX_CONCURRENT_REQUESTS=50
SQL_POOL_MAX=50
```

## Architecture Impact

### Connection Flow (After Fix)
```
User Request
    ↓
Request Counter++ (metrics)
    ↓
acquireRequestSlot()
    ├─ < 25 active? → Proceed
    └─ >= 25 active? → Queue (30s timeout)
        ↓
    getPool(connStr)
        ├─ Pool exists & connected? → Reuse
        └─ Create new pool → Validate with SELECT 1
            ↓
        withRequest(fn)
            ├─ Validate pool.connected
            ├─ Execute query
            ├─ Retry on transient errors (ECONNRESET, etc.)
            └─ Return result
                ↓
    releaseRequestSlot()
        ↓
    Process next queued request
```

### Health Check Cycle
```
Every 2 minutes:
    For each pool:
        → Check .connected status
        → Run SELECT 1 (5s timeout)
        → Success? Keep pool
        → Failed? Close & remove pool
```

## Files Changed

### Modified
- `server/utils/db.js` - Core database connection logic

### Created
- `.env.production.example` - Configuration template
- `docs/TEAMS_MOBILE_ECONNRESET_FIX.md` - Full documentation
- `docs/AZURE_CONFIG_QUICK_REFERENCE.md` - Quick reference
- `deploy-connection-fix.ps1` - Deployment automation
- `docs/TEAMS_MOBILE_FIX_SUMMARY.md` - This summary

## Rollback Plan

If critical issues occur:

### Immediate Rollback
```bash
# Increase limits to emergency high-concurrency mode
az webapp config appsettings set \
  --name link-hub-v1 \
  --resource-group <rg> \
  --settings \
    SQL_MAX_CONCURRENT_REQUESTS=100 \
    SQL_POOL_MAX=100 \
    SQL_QUEUE_TIMEOUT_MS=60000

az webapp restart --name link-hub-v1 --resource-group <rg>
```

### Full Rollback (if code issues)
```powershell
# Revert to previous deployment
git revert HEAD
npm run build
.\build-and-deploy.ps1
```

## Success Criteria

### ✅ Fix Successful When:
1. ECONNRESET errors eliminated or < 0.1% rate
2. Teams mobile users report no issues
3. Page load times < 3 seconds
4. Queue timeouts remain at 0
5. Error rate < 1% in metrics logs

### ⚠️ Needs Further Tuning When:
1. Queue timeouts increasing
2. Error rate > 1%
3. Queued requests consistently > 10
4. User complaints continue

### 🚨 Immediate Action Required When:
1. Error rate > 5%
2. App becomes unresponsive
3. Database CPU/DTU maxed out
4. Metrics show activePools growing unbounded

## Next Steps

1. ✅ Deploy changes to production
2. ✅ Configure environment variables
3. ⏱️ Monitor for 24 hours
4. 📊 Review metrics logs
5. 📱 Get user feedback from Teams mobile users
6. 🔧 Tune limits if needed
7. 📝 Document final production values

## Support

**For issues, collect:**
- Recent log entries with "SQL Connection Metrics"
- Screenshot of error from Teams mobile
- Current environment variable values
- Database performance graphs
- Timestamp of issue occurrence (UTC)

**Contact:** Check application logs first, then escalate with above info

---

## Quick Reference

**View Logs:**
```bash
az webapp log tail --name link-hub-v1 --resource-group <rg>
```

**Update Config:**
```bash
az webapp config appsettings set --name link-hub-v1 --resource-group <rg> --settings "KEY=value"
```

**Restart App:**
```bash
az webapp restart --name link-hub-v1 --resource-group <rg>
```

**Check Status:**
```bash
az webapp show --name link-hub-v1 --resource-group <rg> --query state
```

---

*Last Updated: October 1, 2025*
*Fix Version: 1.0*
