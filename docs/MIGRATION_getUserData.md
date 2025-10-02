# getUserData Migration - Azure Function to Express Route

**Date**: October 1, 2025  
**Migration Type**: API Consolidation  
**Status**: ✅ Complete - Ready for Testing

---

## 🎯 **What Changed**

Migrated `getUserData` from direct Azure Function call to Express server route.

### Before:
```typescript
// BEFORE: Bypassed Express server
fetch(`${proxyBaseUrl}/${REACT_APP_GET_USER_DATA_PATH}?code=${REACT_APP_GET_USER_DATA_CODE}`, {
  method: 'POST',
  body: JSON.stringify({ userObjectId })
})
// Direct call to Azure Function on port 7072
```

### After:
```typescript
// AFTER: Goes through Express server
fetch('/api/user-data', {
  method: 'POST',
  body: JSON.stringify({ userObjectId })
})
// Handled by Express route with better error handling and connection pooling
```

---

## 📁 **Files Modified**

### Created:
1. ✅ `server/routes/userData.js` - New Express route handler

### Modified:
1. ✅ `server/server.js` - Registered `/api/user-data` route
2. ✅ `src/index.tsx` - Updated `fetchUserData()` to use Express route
3. ✅ `src/app/functionality/FeContext.tsx` - Updated `fetchUserData()` to use Express route

### Unchanged (Azure Function still exists but not used):
- ❌ `api/src/functions/getUserData.ts` - Can be removed in future cleanup

---

## ✅ **Benefits of Migration**

### 1. **Consistent Architecture**
- All API calls now go through Express server
- Single point of monitoring and logging
- Easier to debug and troubleshoot

### 2. **Better Error Handling**
- Graceful degradation (returns `[]` instead of crashing)
- Detailed error logging with emojis for quick scanning
- Appropriate HTTP status codes (503 for busy, 504 for timeout)

### 3. **Connection Pooling**
- Uses shared connection pool via `server/utils/db.js`
- Automatic retry on transient errors (2 retries)
- Health checks and automatic pool cleanup
- Queue management to prevent database overload

### 4. **Teams Reliability**
- Consistent timeout handling (5 seconds)
- Better CORS support
- No direct function URL dependencies
- Centralized caching strategy

### 5. **Security**
- No function keys exposed in frontend
- Parameterized SQL queries (prevents injection)
- Centralized authentication/authorization
- Better secret management

---

## 🔍 **Technical Details**

### Express Route Implementation

**File**: `server/routes/userData.js`

```javascript
// POST /api/user-data
// Body: { userObjectId: string }
// Returns: Array of user records

Features:
- ✅ Input validation (400 if missing userObjectId)
- ✅ Parameterized SQL query (prevents injection)
- ✅ Connection retry logic (2 retries on transient errors)
- ✅ Graceful degradation (empty array if user not found)
- ✅ Detailed error logging with emoji indicators
- ✅ Appropriate HTTP status codes
- ✅ Performance timing logs
```

### SQL Query

```sql
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
WHERE [Entra ID] = @userObjectId
```

**Database**: `helix-core-data`  
**Table**: `team`  
**Key Field**: `Entra ID` (Azure AD Object ID)

---

## 🧪 **Testing Checklist**

### Local Development
- [ ] Start server: `npm run dev` (port 8080)
- [ ] Start Teams app: `npm run dev-tab:teamsfx` (port 53000)
- [ ] Test browser: Open app, verify user data loads
- [ ] Check console: Look for `✅ [userData] Found X user record(s)`
- [ ] Test invalid ID: Should return empty array `[]`
- [ ] Test network tab: Verify `/api/user-data` is called (not direct function URL)

### Teams Desktop App
- [ ] Open app in Teams desktop
- [ ] Verify user data loads on first screen
- [ ] Check loading time (should be < 3 seconds)
- [ ] Test with slow network (throttle to 3G)
- [ ] Verify no console errors

### Teams Mobile App
- [ ] Test on iOS Teams app
- [ ] Test on Android Teams app
- [ ] Verify user data loads correctly
- [ ] Test background/foreground switching

### Error Scenarios
- [ ] Database unavailable: Should show 503 error
- [ ] Timeout: Should show 504 error after 5 seconds
- [ ] Invalid userObjectId: Should show 400 error
- [ ] User not found: Should return empty array `[]`

---

## 📊 **Performance Expectations**

### Before Migration:
- **Typical Response**: 200-500ms
- **Teams Reliability**: Mixed (direct calls could bypass CORS)
- **Error Handling**: Basic (crashes on unexpected errors)
- **Monitoring**: Limited (no centralized logging)

### After Migration:
- **Typical Response**: 200-500ms (same or better with pooling)
- **Teams Reliability**: High (consistent routing through Express)
- **Error Handling**: Comprehensive (graceful degradation)
- **Monitoring**: Full (detailed logs with timing and status)

---

## 🚨 **Rollback Plan**

If issues occur, revert these changes:

### 1. Revert `src/index.tsx`
```typescript
// Change back to:
const response = await fetch(
  `${proxyBaseUrl}/${process.env.REACT_APP_GET_USER_DATA_PATH}?code=${process.env.REACT_APP_GET_USER_DATA_CODE}`,
  { method: "POST", ... }
);
```

### 2. Revert `src/app/functionality/FeContext.tsx`
```typescript
// Change back to:
const response = await fetch(getUserDataUrl, {
  method: 'POST',
  ...
});
// And restore dependency: }, [getUserDataUrl]);
```

### 3. Remove route from `server/server.js`
```javascript
// Comment out or remove:
// const userDataRouter = require('./routes/userData');
// app.use('/api/user-data', userDataRouter);
```

### 4. Delete `server/routes/userData.js`

---

## 📈 **Monitoring**

### Server Logs to Watch For:

#### Success:
```
✅ [userData] Found 1 user record(s) in 234ms
```

#### Not Found (Non-Critical):
```
⚠️ [userData] No user found for Entra ID: abc123... (156ms)
```

#### Database Busy:
```
❌ [userData] Database error after 5234ms:
  message: 'Request queue timeout after 30000ms'
  code: undefined
```

#### Timeout:
```
❌ [userData] Database error after 5000ms:
  message: 'Database request timeout'
  code: 'ETIMEDOUT'
```

### Metrics to Track:
- Average response time (should be 200-500ms)
- Error rate (should be < 1%)
- 503/504 errors (database busy/timeout - should be rare)
- Empty array returns (user not found - may indicate data issues)

---

## 🎓 **For Future Agents**

### When to Use This Pattern:
✅ **DO** migrate Azure Functions to Express routes when:
- Function is called directly from frontend (bypasses Express)
- Function does simple database queries
- Function needs better error handling
- Function needs connection pooling
- Consistency with other routes is important

❌ **DON'T** migrate when:
- Function runs on a timer or queue trigger
- Function needs to access VNet-only resources
- Function does heavy computation (better in isolated function)
- Function is already proxied through Express

### Migration Template:
1. Create `server/routes/{name}.js` following `userData.js` pattern
2. Use `withRequest()` for database queries
3. Add detailed error logging with emojis
4. Register route in `server/server.js`
5. Update frontend to use `/api/{name}` instead of `proxyBaseUrl`
6. Test thoroughly in Teams and browser
7. Monitor for errors after deployment
8. Mark old Azure Function for removal

---

## 📞 **Related Documentation**

- **API Architecture Audit**: `docs/API_ARCHITECTURE_AUDIT.md`
- **Performance Optimizations**: `docs/PERFORMANCE_OPTIMIZATIONS.md`
- **Database Utilities**: `server/utils/db.js`
- **Connection Pooling**: See `getPool()` and `withRequest()` in db.js

---

## 🔗 **Dependencies**

### Express Route Depends On:
- `server/utils/db.js` - Database connection pooling
- `SQL_CONNECTION_STRING` environment variable
- `helix-core-data` database, `team` table

### Frontend Depends On:
- Server running on port 8080 (local) or Azure App Service (production)
- `/api/user-data` route available
- Valid Entra ID (Azure AD Object ID) from Teams context

---

## ✨ **Success Criteria**

Migration is successful when:
1. ✅ User data loads on app start
2. ✅ No console errors in browser or Teams
3. ✅ Server logs show `✅ [userData]` success messages
4. ✅ Response time < 1 second
5. ✅ No 500 errors in production
6. ✅ Teams mobile works correctly
7. ✅ Error handling works (empty array for missing users)

---

## 📝 **Next Steps**

After successful deployment and testing:

1. **Monitor for 1 week** - Watch error logs and performance
2. **Clean up Azure Function** - Remove `api/src/functions/getUserData.ts`
3. **Remove env variables** - Clean up unused `REACT_APP_GET_USER_DATA_*` from `.env`
4. **Update other functions** - Apply same pattern to remaining direct function calls
5. **Document lessons learned** - Update this file with any issues encountered

---

**Status**: Ready for deployment and testing 🚀
