# Redis Security Configuration Guide

## Overview
This guide configures Azure Redis Cache with Microsoft Entra ID authentication for maximum security, eliminating the need for access keys.

## Security Benefits
- ✅ **No stored passwords** - Uses Azure managed identity
- ✅ **Automatic token refresh** - Handled by Azure SDK
- ✅ **Audit trail** - All access logged in Azure AD
- ✅ **Role-based access** - Granular permission control
- ✅ **Zero secrets management** - No keys to rotate

## Configuration Steps

### 1. Enable Microsoft Entra ID on Redis Cache

Wait for Redis cache creation to complete, then run:

```bash
# Check if Redis is ready
az redis show --name helix-cache-redis --resource-group Main --query "provisioningState"

# Enable Entra ID authentication (when ready)
az redis identity assign --name helix-cache-redis --resource-group Main --system-assigned

# Configure Entra ID access
az redis access-policy-assignment create \
  --resource-group Main \
  --cache-name helix-cache-redis \
  --access-policy-name "Data Owner" \
  --object-id $(az ad signed-in-user show --query id -o tsv) \
  --object-id-alias "CurrentUser"
```

### 2. Environment Variables

Add these to your Azure App Service Configuration or local .env:

**For Entra ID Authentication (Recommended):**
```bash
REDIS_HOST=helix-cache-redis.redis.cache.windows.net
REDIS_PORT=6380
REDIS_USE_ENTRA_AUTH=true
REDIS_USER=default
```

**For Access Key Authentication (Fallback):**
```bash
REDIS_HOST=helix-cache-redis.redis.cache.windows.net
REDIS_PORT=6380
REDIS_PASSWORD=<access-key-from-azure>
REDIS_USE_ENTRA_AUTH=false
```

### 3. Azure App Service Configuration

If deploying to Azure App Service, enable managed identity:

```bash
# Enable system-assigned managed identity for your App Service
az webapp identity assign --name <your-app-service-name> --resource-group <your-resource-group>

# Grant the App Service access to Redis
az redis access-policy-assignment create \
  --resource-group Main \
  --cache-name helix-cache-redis \
  --access-policy-name "Data Contributor" \
  --object-id <app-service-managed-identity-id> \
  --object-id-alias "AppService"
```

## Security Implementation Details

### Authentication Flow
1. **Local Development**: Uses Azure CLI credentials or Visual Studio credentials
2. **Azure App Service**: Uses system-assigned managed identity
3. **Token Management**: Automatic refresh every ~1 hour by Azure SDK
4. **Fallback**: Access key authentication if Entra ID fails

### Access Policies Available
- **Data Owner**: Full read/write access (for administrators)
- **Data Contributor**: Read/write access (for applications)
- **Data Reader**: Read-only access (for monitoring)

### Code Implementation
The Redis client automatically handles:
- Token acquisition from Azure AD
- Token refresh before expiration
- Fallback to access key authentication
- Connection retry logic with exponential backoff

## Testing Authentication

```javascript
// Test Redis connection
const { initRedisClient } = require('./server/utils/redisClient');

async function testRedis() {
  const client = await initRedisClient();
  if (client) {
    console.log('✅ Redis authentication successful');
    await client.set('test:auth', 'success');
    const result = await client.get('test:auth');
    console.log('✅ Redis operations working:', result);
  } else {
    console.log('❌ Redis authentication failed');
  }
}
```

## Migration Strategy

1. **Phase 1**: Deploy with both auth methods enabled (current)
2. **Phase 2**: Enable Entra ID on Redis cache
3. **Phase 3**: Update environment variables to use Entra ID
4. **Phase 4**: Disable access key authentication (recommended)

## Monitoring

Monitor Redis authentication in Azure:
- **Azure Monitor**: Connection metrics and errors
- **Azure AD Logs**: Sign-in events for managed identity
- **Application Insights**: Redis operation performance

## Troubleshooting

Common issues and solutions:
- **Token acquisition fails**: Check managed identity permissions
- **Connection timeouts**: Verify firewall rules and VNet configuration
- **Authentication errors**: Ensure correct access policy assignments

## Security Best Practices

1. **Use Entra ID authentication** for all production workloads
2. **Disable access keys** once Entra ID is working
3. **Use least privilege** access policies (Data Contributor vs Data Owner)
4. **Monitor access logs** regularly
5. **Enable diagnostic logging** for audit trails