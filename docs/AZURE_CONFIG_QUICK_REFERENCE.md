# Azure App Service Configuration Guide
## Teams Mobile ECONNRESET Fix

### Quick Setup (Azure Portal)

#### 1. Navigate to App Service
1. Open Azure Portal
2. Go to **App Services**
3. Select `link-hub-v1`
4. Go to **Configuration** → **Application settings**

#### 2. Add Environment Variables
Click **+ New application setting** for each:

| Name | Value | Description |
|------|-------|-------------|
| `SQL_MAX_CONCURRENT_REQUESTS` | `25` | Max parallel SQL requests |
| `SQL_POOL_MAX` | `25` | Max connections in pool |
| `SQL_POOL_MIN` | `2` | Min idle connections |
| `SQL_REQUEST_TIMEOUT_MS` | `60000` | Query timeout (60s) |
| `SQL_CONNECTION_TIMEOUT_MS` | `15000` | Connect timeout (15s) |
| `SQL_POOL_ACQUIRE_TIMEOUT_MS` | `10000` | Pool acquire timeout (10s) |
| `SQL_POOL_IDLE_TIMEOUT_MS` | `30000` | Idle connection timeout (30s) |
| `SQL_QUEUE_TIMEOUT_MS` | `30000` | Request queue timeout (30s) |
| `SQL_HEALTH_CHECK_INTERVAL_MS` | `120000` | Health check interval (2min) |

#### 3. Save Configuration
1. Click **Save** at the top
2. Click **Continue** on the warning dialog
3. App Service will restart automatically

### Alternative: Azure CLI

```bash
# Set all variables at once
az webapp config appsettings set \
  --name link-hub-v1 \
  --resource-group <your-resource-group> \
  --settings \
    SQL_MAX_CONCURRENT_REQUESTS=25 \
    SQL_POOL_MAX=25 \
    SQL_POOL_MIN=2 \
    SQL_REQUEST_TIMEOUT_MS=60000 \
    SQL_CONNECTION_TIMEOUT_MS=15000 \
    SQL_POOL_ACQUIRE_TIMEOUT_MS=10000 \
    SQL_POOL_IDLE_TIMEOUT_MS=30000 \
    SQL_QUEUE_TIMEOUT_MS=30000 \
    SQL_HEALTH_CHECK_INTERVAL_MS=120000

# Restart app service
az webapp restart --name link-hub-v1 --resource-group <your-resource-group>
```

### Monitoring After Deployment

#### View Application Logs
**Azure Portal:**
1. Go to **Monitoring** → **Log stream**
2. Look for "SQL Connection Metrics" entries

**Azure CLI:**
```bash
az webapp log tail --name link-hub-v1 --resource-group <your-resource-group>
```

#### Healthy Metrics Example
```
SQL Connection Metrics: {
  activePools: 2,
  activeRequests: 8,
  queuedRequests: 0,        ← Should stay low
  totalRequests: 1250,
  totalErrors: 3,
  totalQueueTimeouts: 0,    ← Should stay at 0
  errorRate: '0.24%'        ← Should be < 1%
}
```

#### Problem Indicators
⚠️ **If you see:**
- `queuedRequests` consistently > 10
- `errorRate` > 5%
- Increasing `totalQueueTimeouts`

**Action:** Increase concurrency further:
```
SQL_MAX_CONCURRENT_REQUESTS=50
SQL_POOL_MAX=50
SQL_QUEUE_TIMEOUT_MS=45000
```

### Troubleshooting

#### Still seeing ECONNRESET?

**Check 1: Verify environment variables**
```bash
az webapp config appsettings list --name link-hub-v1 --resource-group <your-rg> | grep SQL_
```

**Check 2: Database performance**
- Go to Azure SQL Database → **Performance**
- Check DTU/CPU usage
- Look for long-running queries

**Check 3: Network connectivity**
- App Service → **Networking**
- Verify outbound connections to SQL Server allowed
- Check firewall rules on SQL Server

**Check 4: Application Insights**
- Go to **Application Insights**
- Query for failed requests:
```kusto
requests
| where success == false
| where resultCode == 500
| order by timestamp desc
| take 100
```

### Rollback

If issues persist, revert to higher limits:

**Emergency High-Concurrency Mode:**
```
SQL_MAX_CONCURRENT_REQUESTS=100
SQL_POOL_MAX=100
SQL_QUEUE_TIMEOUT_MS=60000
```

### Performance Tuning

#### For Low Traffic (< 100 concurrent users)
```
SQL_MAX_CONCURRENT_REQUESTS=15
SQL_POOL_MAX=15
```

#### For Medium Traffic (100-500 concurrent users)
```
SQL_MAX_CONCURRENT_REQUESTS=25  ← Default
SQL_POOL_MAX=25
```

#### For High Traffic (500+ concurrent users)
```
SQL_MAX_CONCURRENT_REQUESTS=50
SQL_POOL_MAX=50
```

### Cost Optimization

These settings don't directly affect Azure costs, but:

**Higher `SQL_POOL_MIN`:**
- ✅ Faster response times
- ❌ More idle connections (minimal cost)

**Higher `SQL_POOL_MAX`:**
- ✅ Handles traffic spikes
- ⚠️ May hit Azure SQL connection limits

**Recommended:** Keep defaults unless monitoring shows issues

### Related Documentation
- [Full Fix Documentation](./TEAMS_MOBILE_ECONNRESET_FIX.md)
- [Azure SQL Best Practices](https://learn.microsoft.com/azure/azure-sql/database/develop-overview)
- [App Service Configuration](https://learn.microsoft.com/azure/app-service/configure-common)

### Support Checklist

When reporting issues, include:
- [ ] Recent log entries with "SQL Connection Metrics"
- [ ] Screenshot of error in Teams mobile
- [ ] Current environment variable values
- [ ] Database DTU/CPU usage graph
- [ ] Number of concurrent users during issue
- [ ] Time of occurrence (UTC)

### Quick Test

After configuration:
1. ✅ Open app in Teams mobile
2. ✅ Navigate to Dashboard
3. ✅ Check Management page loads
4. ✅ Verify no ECONNRESET in logs
5. ✅ Confirm load times < 3 seconds
