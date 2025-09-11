# Production Fix: fetchEnquiriesData Authentication

## Issue
The "All" mode in Enquiries Claimed tab was failing with 401 Unauthorized errors because the frontend was calling the Azure Function directly without authentication.

## Root Cause
The frontend was incorrectly calling the Azure Function directly:
```
https://instructions-vnet-functions.azurewebsites.net/api/fetchEnquiriesData
```
Instead of using the proper unified server route that handles authentication.

## Fix Applied
Updated the frontend code in:
- `src/tabs/enquiries/Enquiries.tsx`
- `src/index.tsx`

Both now use the correct unified routes:
- Local dev: `/api/enquiries-unified`
- Production: `/api/enquiries-combined`

The `/api/enquiries-combined` server route already handles:
- Authentication with Azure Functions using Key Vault secrets
- Fetching from both legacy and new data sources
- Proper error handling and CORS

## Result
✅ No additional environment variables needed
✅ Frontend uses existing server proxy routes
✅ Authentication handled server-side where it belongs
✅ Unified data from both sources
