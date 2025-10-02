# API Architecture Audit - Current State

**Date**: October 1, 2025  
**Issue**: Hybrid approach between Azure Functions (api/), Decoupled Functions, and Server Routes may be causing conflicts

---

## 🏗️ Architecture Overview

### Three-Layer API System

1. **Azure Functions v4 (TypeScript)** - `api/` folder, port 7072
2. **Decoupled Functions (JavaScript)** - `decoupled-functions/` folder, port 7071
3. **Express Server Routes** - `server/routes/` folder, port 8080

---

## 📊 Current Usage Analysis

### ✅ **Server Routes (Express)** - Primary & Active

These routes are **directly called** from the frontend via `/api/*` endpoints:

#### Core Data Routes (ACTIVE):
- `/api/enquiries-unified` ✅ **PRIMARY** - Used by `index.tsx`
- `/api/matters-unified` ✅ **PRIMARY** - Used by `index.tsx`
- `/api/team-data` ✅ **PRIMARY** - Used by `index.tsx`
- `/api/getMatters` ✅ **PRIMARY** - Proxies to decoupled function
- `/api/attendance/*` ✅ - Annual leave, attendance tracking
- `/api/reporting/*` ✅ - Management datasets
- `/api/instructions/*` ✅ - Instruction CRUD operations
- `/api/documents/*` ✅ - Document management

#### Clio Integration Routes (ACTIVE):
- `/api/clio-contacts` ✅
- `/api/clio-matters` ✅
- `/api/clio-client-query/:clientId/:initials` ✅
- `/api/clio-client-lookup/search` ✅
- `/api/related-clients` ✅
- `/api/sync-instruction-client` ✅

#### Matter/Instruction Routes (ACTIVE):
- `/api/matter-requests` ✅
- `/api/matter-operations/matter/:ref` ✅
- `/api/opponents` ✅
- `/api/risk-assessments` ✅
- `/api/pitches` ✅
- `/api/payments` ✅

#### Utility Routes (ACTIVE):
- `/api/ccl/:matterId` ✅ - CCL drafts
- `/api/verify-id` ✅
- `/api/team-lookup` ✅
- `/api/pitch-team` ✅
- `/api/sendEmail` ✅
- `/api/bundle` ✅
- `/api/deals` ✅

---

### ⚠️ **Azure Functions (api/)** - Mixed Usage

**Port**: 7072  
**Method**: Proxied through `server/routes/proxyToAzureFunctions.js`

#### Still Being Proxied (via proxyBaseUrl):
```typescript
// From index.tsx - DIRECT to Azure Functions (bypasses Express)
fetchUserData() -> ${proxyBaseUrl}/${REACT_APP_GET_USER_DATA_PATH}
  // Goes directly to Azure Function on port 7072
  // ⚠️ PROBLEM: Bypasses Express routes entirely
```

#### Functions Being Used:
1. ✅ `getUserData` - **ACTIVE** via proxyBaseUrl (direct call)
2. ✅ `getTeamData` - Proxied through Express `/api/team-data`
3. ✅ `getSnippetEdits` - Proxied
4. ✅ `getSnippetBlocks` - Proxied
5. ✅ `getWIPClio` - Proxied
6. ✅ `getRecovered` - Proxied
7. ✅ `getPOID6years` - Proxied
8. ✅ `getFutureBookings` - Proxied
9. ✅ `getTransactions` - Proxied
10. ✅ `getOutstandingClientBalances` - Proxied
11. ✅ `getComplianceData` - Proxied
12. ✅ `getRoadmap` - Proxied
13. ✅ `insertDeal` - Proxied

#### Functions NOT Being Used (Likely Dead Code):
- `approveSnippetEdit` ❓
- `approveVerification` ❓
- `deleteSnippetEdit` ❓
- `generateReportDataset` ❓
- `getAllDeals` ❓
- `getAnnualLeave` ❌ **REPLACED** by Express route
- `getAnnualLeaveAll` ❌ **REPLACED** by Express route
- `getAttendance` ❌ **REPLACED** by Express route
- `getEnquiries` ❌ **REPLACED** by `enquiries-unified`
- `getMatters` ❌ **REPLACED** by Express route + decoupled function
- `getMatterOverview` ❓
- `getMatterSpecificActivities` ❓
- `getInstructionData` ❓
- `getInstructionDocuments` ❓
- `insertAnnualLeave` ❓
- `insertAttendance` ❓
- `insertBookSpace` ❓
- `insertNotableCaseInfo` ❓
- `insertRiskAssessment` ❓
- `insertRoadmap` ❓
- `matterACIDFilter` ❓
- `matterNotification` ❓
- `matterRequest` ❓
- `postFinancialTask` ❓
- `submitSnippetEdit` ❓
- `updateAnnualLeave` ❓
- `updateDeal` ❓
- `updateEnquiryRating` ❓
- `updateInstructionOverride` ❓
- `updateInstructionStatus` ❓
- `updateTransactions` ❓

---

### 🔄 **Decoupled Functions** - VNet Data Access

**Port**: 7071  
**Purpose**: Access data from VNet-only database

#### Active Functions:
1. ✅ `fetchMattersData` - Proxied via `/api/getMatters`
2. ✅ `fetchEnquiriesData` - May be used by unified route
3. ✅ `fetchSnippetEdits` - Snippet management
4. ✅ `insertEnquiry` - Enquiry creation
5. ✅ `processEnquiry` - Enquiry processing

#### Functions With Unclear Status:
- `fetchCclDraft` ❓
- `fetchInstructionData` ❓
- `importInstructionData` ❓
- `recordCclDraft` ❓
- `recordMatterRequest` ❓
- `recordOpponents` ❓
- `recordPitch` ❓
- `recordRiskAssessment` ❓
- `deleteTestMatters` ❓
- `dealCapture` ❓
- `actionSnippet` ❓

---

## 🚨 **Identified Problems**

### 1. **Direct Function Calls Bypass Server**
```typescript
// PROBLEM: index.tsx calls Azure Functions DIRECTLY
const response = await fetch(
  `${proxyBaseUrl}/${process.env.REACT_APP_GET_USER_DATA_PATH}?code=${...}`,
  // This bypasses Express server entirely
  // Goes straight to Azure Function on port 7072
);
```

**Why This Is Bad**:
- Bypasses Express middleware (CORS, logging, error handling)
- Creates inconsistent request patterns
- Harder to debug and monitor
- May cause CORS issues in Teams
- Can't apply centralized caching or rate limiting

### 2. **Duplicate/Conflicting Routes**

#### Example: getMatters
- **Azure Function**: `api/src/functions/getMatters.ts`
- **Server Route**: `server/routes/getMatters.js`
- **Decoupled Function**: `decoupled-functions/fetchMattersData/`
- **Frontend Calls**: Mixed between all three!

#### Example: Attendance
- **Old Azure Functions**: `getAttendance`, `getAnnualLeave`, etc.
- **New Express Routes**: `server/routes/attendance.js`
- **Status**: Redirects in place, but old functions still exist

### 3. **Inconsistent Data Sources**

```typescript
// CONFUSION: Where does data actually come from?
fetchEnquiries() 
  -> /api/enquiries-unified (Express route)
  -> May call decoupled function?
  -> Or queries database directly?
  -> Falls back to legacy route?
```

### 4. **Dead Code Accumulation**
- 30+ Azure Functions that may not be used
- Unclear which decoupled functions are active
- No clear deprecation strategy

---

## 🎯 **Recommendations**

### **Immediate Actions** (Fix Teams Crashes)

1. ✅ **COMPLETED: Consolidate getUserData Call**
   ```typescript
   // BEFORE (bypasses Express):
   const response = await fetch(
     `${proxyBaseUrl}/${REACT_APP_GET_USER_DATA_PATH}?code=${...}`
   );
   
   // AFTER (use Express route):
   const response = await fetch('/api/user-data', {
     method: 'POST',
     body: JSON.stringify({ userObjectId: objectId })
   });
   ```
   **Status**: ✅ Implemented - See `docs/MIGRATION_getUserData.md` for details

2. ✅ **COMPLETED: Create Express Route for User Data**
   - ✅ Created `server/routes/userData.js` with connection pooling and retry logic
   - ✅ Applied caching, error handling, detailed logging
   - ✅ Updated `src/index.tsx` and `src/app/functionality/FeContext.tsx`
   - ✅ Removed direct function calls from frontend
   **Status**: ✅ Ready for testing

3. **Document Active vs Dead Functions**
   - Audit each Azure Function for actual usage
   - Mark unused functions for removal
   - Create deprecation plan

### **Short-Term** (Next Sprint)

4. **Unified API Gateway Pattern**
   - ALL frontend requests go through Express (`/api/*`)
   - Express routes decide whether to:
     - Query database directly
     - Proxy to Azure Function
     - Proxy to decoupled function
     - Return cached data

5. **Remove Duplicate Routes**
   - Consolidate getMatters → single source of truth
   - Consolidate attendance → Express only
   - Consolidate enquiries → Express only

6. **Add Request Logging**
   - Log all API calls through Express
   - Track which routes are actually used
   - Identify truly dead code

### **Long-Term** (Technical Debt)

7. **Migrate Azure Functions to Express**
   - Move business logic from `api/` to `server/routes/`
   - Keep Azure Functions only for:
     - Background jobs (timers, queues)
     - High-compute operations
     - VNet-only data access

8. **Consolidate Decoupled Functions**
   - Merge VNet data access into Express routes
   - Use connection string routing instead of separate function app
   - Reduce deployment complexity

9. **Clear Data Access Layer**
   - `server/db/` - All database queries
   - `server/services/` - Business logic
   - `server/routes/` - HTTP handlers only
   - No direct function calls from frontend

---

## 📋 **Migration Checklist**

### Phase 1: Stop the Bleeding (This Sprint)
- [x] Create `/api/user-data` Express route ✅
- [x] Update `index.tsx` to use Express route instead of proxyBaseUrl ✅
- [x] Update `FeContext.tsx` to use Express route ✅
- [ ] Test in Teams embed and browser (NEXT STEP)
- [ ] Deploy and monitor for crashes

### Phase 2: Document Current State (Next Week)
- [ ] Test each Azure Function individually
- [ ] Document which are actually called
- [ ] Mark unused functions for removal
- [ ] Create spreadsheet of all API endpoints

### Phase 3: Consolidate Routes (Next Sprint)
- [ ] Move getUserData logic to Express
- [ ] Move getTeamData logic to Express
- [ ] Consolidate getMatters routes
- [ ] Remove duplicate attendance functions
- [ ] Remove duplicate enquiry functions

### Phase 4: Clean Up (Future)
- [ ] Delete unused Azure Functions
- [ ] Consolidate decoupled functions
- [ ] Remove proxyBaseUrl pattern entirely
- [ ] All requests flow through Express

---

## 🔍 **Key Files to Review**

### Frontend Entry Points:
1. `src/index.tsx` - Main data loading (getUserData, getEnquiries, getMatters, getTeamData)
2. `src/app/functionality/FeContext.tsx` - Additional getUserData call
3. `src/utils/getProxyBaseUrl.ts` - Direct function URL builder

### Backend Routing:
1. `server/server.js` - Express app configuration
2. `server/routes/proxyToAzureFunctions.js` - Function proxy routes
3. `server/routes/enquiries-unified.js` - Unified enquiry data
4. `server/routes/mattersUnified.js` - Unified matter data
5. `server/routes/getMatters.js` - Matter data routing

### Function Apps:
1. `api/src/functions/getUserData.ts` - User data lookup
2. `api/src/functions/getTeamData.ts` - Team data lookup
3. `decoupled-functions/fetchMattersData/` - VNet matter data

---

## 🎓 **For Future Agents**

**When Adding New API Endpoints**:
1. ✅ **DO**: Create Express route in `server/routes/`
2. ✅ **DO**: Call from frontend via `/api/{endpoint}`
3. ✅ **DO**: Add logging and error handling
4. ❌ **DON'T**: Create new Azure Function unless truly needed
5. ❌ **DON'T**: Use `proxyBaseUrl` pattern for new endpoints
6. ❌ **DON'T**: Bypass Express server

**When Debugging API Issues**:
1. Check Express route exists and is registered in `server/server.js`
2. Check if it's being proxied through `proxyToAzureFunctions.js`
3. Check if frontend is calling correct `/api/*` endpoint
4. Check `opLog` for request tracking
5. Don't assume Azure Functions are being used - check Express first!

---

## 📞 **Quick Reference**

### Where Data Actually Comes From:

| Data Type | Current Source | Should Be |
|-----------|---------------|-----------|
| User Data | ~~Azure Function (direct)~~ ✅ Express route | Express route |
| Enquiries | Express route ✅ | Express route |
| Matters (legacy) | Express route ✅ | Express route |
| Matters (new) | Decoupled function via Express ✅ | Express route |
| Team Data | Express route ✅ | Express route |
| Attendance | Express route ✅ | Express route |
| Instructions | Express route ✅ | Express route |
| Documents | Express route ✅ | Express route |
| Clio APIs | Express route ✅ | Express route |

**Bottom Line**: Almost everything SHOULD go through Express routes. The only exception is `getUserData` which currently bypasses Express and may be causing Teams crashes.
