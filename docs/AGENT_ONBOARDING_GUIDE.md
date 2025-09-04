# 🚀 Agent Onboarding Guide
## Fast-Track Setup for Helix Hub Instructions Tab

*Last Updated: September 4, 2025*

---

## 🎯 Quick Start (5 Minutes)

### Current Architecture Status
- ✅ **Unified API Endpoint**: `server/routes/instructions.js` proxies to VNet functions
- ✅ **Environment Logic**: `src/app/App.tsx` uses `REACT_APP_USE_LOCAL_DATA=false` for production data  
- ✅ **Documentation**: Comprehensive guides in `/docs` folder
- ⚠️ **Database**: 45 records with 30 test/noise records identified for cleanup

### Essential Context
1. **Luke Test Record**: `HLX-27367-94842` is the health indicator - NEVER delete
2. **Production Data**: 7 meaningful example records (HLX-10001 to HLX-10008 series)
3. **Test Noise**: 30 records with "Final test", "Placeholder", or empty data

---

## 📊 Current Database State

```
Total Records: 45
├── Production Examples: 7 (HLX-10001-10001 to HLX-10008-10008)
├── Luke Test Health Check: 1 (HLX-27367-94842) ⚠️ PRESERVE
├── Test Records to Clean: 30
│   ├── Final Test Records: 13 ("Final test: ensure DB InstructionRef stored")
│   ├── Placeholder Records: 6 ("Placeholder deal capture (phased out)")
│   ├── Simple Test Records: 3 (PaymentProduct = "test")
│   └── Empty Records: 8 (NULL names, no PaymentProduct)
└── Other Records: 7
```

---

## ⚡ Quick Actions

### 1. Check System Health
```bash
# Verify unified endpoint is working
curl http://localhost:8080/api/instructions
```

### 2. Database Access (MSSQL Extension)
1. Open Command Palette: `Ctrl+Shift+P`
2. Search: "MSSQL: Connect"
3. Server: `instructions.database.windows.net`
4. Quick health check: `SELECT COUNT(*) FROM Instructions`

### 3. Environment Variables Check
```bash
# Should be FALSE for production data
echo $REACT_APP_USE_LOCAL_DATA
```

---

## 🛠 Common Tasks

### Database Cleanup (Pending Execution)
```sql
-- Safe cleanup query (preserves Luke Test)
DELETE FROM Instructions 
WHERE (
    PaymentProduct LIKE '%Final test%'
    OR PaymentProduct LIKE '%Placeholder%' 
    OR PaymentProduct = 'test'
    OR (FirstName IS NULL AND LastName IS NULL AND PaymentProduct IS NULL)
    OR InstructionRef LIKE '%test%'
    OR InstructionRef = '27367-20200'
) AND InstructionRef != 'HLX-27367-94842';
```

### Verify Luke Test Record
```sql
SELECT * FROM Instructions 
WHERE InstructionRef = 'HLX-27367-94842';
-- Should show: Luke Test, proof-of-id-complete, paid status
```

### Production Examples Query
```sql
SELECT InstructionRef, FirstName, LastName, PaymentProduct, Stage 
FROM Instructions 
WHERE InstructionRef LIKE 'HLX-10%'
ORDER BY InstructionRef;
-- Should show: Emma Example, Alice Anderson, Bob Bennett, etc.
```

---

## 📁 Key Files & Locations

### Server Architecture
- **`server/routes/instructions.js`**: Unified endpoint with VNet proxy
- **`server/server.js`**: Express server on port 8080

### Frontend
- **`src/app/App.tsx`**: Environment-driven data source logic
- **`src/components/InstructionsTab/`**: React components

### Database Scripts
- **`scripts/cleanup-test-instructions.js`**: Automated cleanup analysis
- **`decoupled-functions/fetchInstructionData/`**: VNet function handler

### Documentation
- **`docs/UNIFIED_INSTRUCTIONS_ENDPOINT.md`**: API specification
- **`docs/MIGRATION_GUIDE_UNIFIED_INSTRUCTIONS.md`**: Implementation details
- **`docs/ARCHITECTURE_ANALYSIS.md`**: System overview

---

## 🎯 Priority Actions for New Agents

### High Priority (Do First)
1. **Verify Luke Test Record**: Ensure `HLX-27367-94842` is preserved
2. **Database Cleanup**: Execute safe cleanup to remove 30 test records
3. **Health Check**: Confirm unified endpoint returns clean data

### Medium Priority
1. **Performance Optimization**: Monitor query performance with cleaner dataset
2. **User Training**: Update training materials with clean examples
3. **Documentation**: Update screenshots and examples

### Low Priority
1. **Create Training Dataset**: Design pristine dataset for future deployments
2. **Automated Cleanup**: Schedule periodic cleanup of test data
3. **Data Governance**: Implement controls to prevent test data accumulation

---

## 🔍 Troubleshooting

### "Patchy" Instructions Loading
- **Root Cause**: N+1 query problem resolved with unified endpoint
- **Solution**: Unified endpoint already implemented
- **Verification**: Check network tab for single `/api/instructions` call

### Luke Test Not Visible  
- **Root Cause**: Environment variable override
- **Solution**: `REACT_APP_USE_LOCAL_DATA=false` already set
- **Verification**: Luke Test should appear in UI

### Database Connection Issues
- **MSSQL Extension**: Use `instructions.database.windows.net` 
- **Node.js Scripts**: Check connection string in `decoupled-functions/sqlClient.js`
- **VNet Functions**: Verify Azure function app connectivity

---

## 📈 Success Metrics

### Before Cleanup (Current State)
- 45 total records
- 30 test/noise records (67% noise)
- Patchy loading experience

### After Cleanup (Target State)  
- 15 meaningful records
- 1 preserved Luke Test health indicator
- Clean, fast loading experience
- Professional demo-ready data

### Future State (Ideal)
- Pristine training dataset
- Automated cleanup processes
- Zero test data accumulation
- Production-ready examples only

---

## 🚨 Critical Warnings

### NEVER DELETE
- **HLX-27367-94842**: Luke Test health indicator
- **HLX-10001 to HLX-10008**: Production example data

### SAFE TO DELETE
- Records with "Final test: ensure DB InstructionRef stored"
- Records with "Placeholder deal capture (phased out)"  
- Records with PaymentProduct = "test" (EXCEPT Luke Test)
- Records with NULL names and no PaymentProduct
- Malformed InstructionRef patterns

### BACKUP FIRST
Always backup database before executing DELETE statements.

---

## 📞 Quick References

- **Server Port**: 8080 (Express with unified endpoint)
- **Database**: `instructions.database.windows.net`
- **Luke Test ID**: `HLX-27367-94842`
- **Environment Override**: `REACT_APP_USE_LOCAL_DATA=false`
- **Health Check**: `GET http://localhost:8080/api/instructions`

---

*This guide enables new agents to understand the current state and take immediate action without extensive exploration. The next agent should focus on executing the database cleanup and monitoring the improved user experience.*
