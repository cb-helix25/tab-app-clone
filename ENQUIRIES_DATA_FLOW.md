# Enquiries Data Flow Documentation

> **Last Updated:** August 6, 2025  
> **Status:** Current implementation after CORS fixes and data flow debugging

## 🎯 Overview

The enquiries system fetches data from **TWO sources** and combines them:
1. **NEW Data Source** (via Express server on port 8080)
2. **LEGACY Data Source** (via Azure Functions on port 7071)

Both sources are active and contributing data to the final enquiries list.

---

## 📊 Current Data Flow

### Step 1: NEW Enquiries (Express Server)
**Route:** `/api/enquiries` → `localhost:8080/api/enquiries`
- **Source:** Decoupled Azure Function via Express proxy
- **Count:** ~29 enquiries (as of last debug)
- **Filtering:** By user initials OR email OR unclaimed status
- **Status:** ✅ **WORKING** (CORS fixed)

### Step 2: LEGACY Enquiries (Azure Functions)
**Route:** `localhost:7071/api/getEnquiries`
- **Source:** Legacy Azure Function endpoint
- **Count:** ~6,221 total → ~824 after filtering
- **Filtering:** By user email (primarily)
- **Status:** ✅ **WORKING**

### Step 3: Data Combination
```typescript
// Final result: NEW + LEGACY combined
enquiries = [...newEnquiries, ...legacyEnquiries];
// Example: 15 NEW + 824 LEGACY = 839 total
```

### Step 4: Area of Work (AOW) Filtering
- **Before AOW filtering:** 839 enquiries
- **After AOW filtering:** 627 enquiries (for Luke's areas)
- **Logic:** Filters unclaimed enquiries by user's areas of work

---

## 🔧 Access Control Logic

### User Types & Access Levels

#### **Operations Users** (Luke - "Operations" in AOW)
- ✅ **Full access** to ALL unclaimed enquiries
- ✅ All claimed enquiries (own + others)
- ✅ All NEW + LEGACY data

#### **Practice Area Users** (Alex - specific areas in AOW)
- ⚠️ **Limited access** to unclaimed enquiries in their areas only
- ✅ All claimed enquiries (own + others)
- ✅ All NEW + LEGACY data (filtered by area for unclaimed)

### Filtering Rules

```typescript
// 1. NEW Data Filtering (per user)
const filteredNewEnquiries = rawNewEnquiries.filter(enq => {
  const pocInitials = (enq.Point_of_Contact || enq.poc || '').toUpperCase();
  const pocEmail = (enq.Point_of_Contact || enq.poc || '').toLowerCase();
  
  const matchesInitials = pocInitials === userInitialsUpper;
  const matchesEmail = pocEmail === userEmail;
  const isUnclaimed = ['team@helix-law.com'].includes(pocEmail) || pocInitials === 'TEAM';
  
  return matchesInitials || matchesEmail || isUnclaimed;
});

// 2. AOW Filtering (for unclaimed only)
const hasFullAccess = userAreas.some(a => a.includes('operations') || a.includes('tech'));
if (!hasFullAccess) {
  // Filter unclaimed enquiries by user's areas
  // Keep all claimed enquiries regardless of area
}
```

---

## 🚨 Critical Understanding Points

### ❓ "Are NEW enquiries showing in UI?"
**YES** - NEW enquiries ARE being fetched, filtered, and included in the final dataset.
- NEW: 15 enquiries (after filtering)
- LEGACY: 824 enquiries (after filtering)  
- **TOTAL: 839 → 627 (after AOW filtering)**

### ❓ "Which data source is for claimed vs unclaimed?"
**BOTH sources contain BOTH claimed and unclaimed enquiries.**
- The distinction is made by the `Point_of_Contact` field:
  - **Claimed:** `Point_of_Contact = user email or initials`
  - **Unclaimed:** `Point_of_Contact = "team@helix-law.com" or "TEAM"`

### ❓ "Why do we have two data sources?"
- **NEW:** Modern decoupled function architecture
- **LEGACY:** Existing production data that can't be migrated yet
- **Strategy:** Gradual migration while maintaining data continuity

---

## 🔍 Debug Information

### Current Console Output Pattern
```
🚀 FETCHENQUIRIES CALLED WITH:
   📧 email: lz@helix-law.com
   👤 userInitials: LZ
   🏢 userAow: Commercial, Construction, Property

✅ NEW enquiries response OK, processing data...
📦 Raw NEW data count: 29
✅ Successfully fetched and filtered NEW enquiries data: 15

✅ LEGACY enquiries response OK, processing data...
📦 Raw LEGACY data count: 6221
✅ Successfully fetched and filtered LEGACY enquiries data: 824

🎯 FINAL ENQUIRIES SUMMARY:
   Total before AOW filtering: 839
   Total after AOW filtering: 627
```

---

## 🛠️ Recent Fixes Applied

### 1. CORS Issues (Fixed ✅)
- **Problem:** Frontend couldn't call backend APIs
- **Solution:** Added `cors` middleware to Express server
- **Result:** `/api/enquiries` calls now successful

### 2. Error Handling (Fixed ✅)
- **Problem:** Failed `fetchMatters` call was breaking entire data fetch
- **Solution:** Separated API calls with individual error handling
- **Result:** Enquiries load even if other APIs fail

### 3. Data Flow Debugging (Added ✅)
- **Enhancement:** Comprehensive console logging
- **Benefit:** Can trace data from API → filtering → UI

---

## 📋 TODO / Future Considerations

### Data Source Migration
- [ ] Eventually migrate all LEGACY data to NEW source
- [ ] Maintain backward compatibility during transition
- [ ] Consider data deduplication strategies

### Performance Optimization
- [ ] Cache frequently accessed data
- [ ] Optimize filtering logic
- [ ] Consider pagination for large datasets

### Documentation Maintenance
- [ ] Update this document when data sources change
- [ ] Document any new filtering rules
- [ ] Maintain troubleshooting guides

---

## 🆘 Troubleshooting Quick Reference

### "No enquiries showing"
1. Check console for CORS errors
2. Verify both NEW and LEGACY API calls succeed
3. Check AOW filtering logic
4. Verify user's areas of work configuration

### "Wrong enquiries showing"
1. Check user's initials/email in filtering
2. Verify Point_of_Contact field values
3. Check AOW access level (Operations vs Practice Area)

### "API calls failing"
1. Ensure Express server is running (port 8080)
2. Ensure Azure Functions are running (port 7071)
3. Check CORS configuration
4. Verify environment variables

---

*This document should be updated whenever the enquiries data flow changes.*
