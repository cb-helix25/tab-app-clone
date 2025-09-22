# Attendance and Annual Leave Stabilization — 2025-09-22

This document records the end-to-end changes applied to stabilize attendance and annual leave flows, correct UI mappings, and harden production startup.

## Summary
- Centralized resilient MSSQL pool + retry for attendance queries.
- Annual leave mapped to 'away' consistently (server + UI), filters fixed.
- Inline CORS middleware (allowlist) to avoid runtime crash when `cors` package missing.
- Attendance client calls switched to same-origin `/api/...` (staging/prod), fixing 404s from `helix-keys-proxy` + double `/api`.

## Backend (Express)

### Resilient DB helper
- File: `server/utils/db.js` (new)
- Exports: `sql`, `getPool`, `withRequest(connStr, fn, retries=2)`
- Retries transient errors: ECONNCLOSED, ETIMEOUT, ESOCKET, ELOGIN (exponential backoff)
- Drops stale pools on error; auto re-establishes.

### Attendance routes
- File: `server/routes/attendance.js`
- Refactored key queries to `withRequest`:
  - Current/future/user leave lookups
  - Team + attendance retrieval
- On leave override sets `Status: 'away'` and flags `IsOnLeave`.

### Route registration and CORS
- File: `server/server.js`
- Attendance registered before function proxies: `app.use('/api/attendance', attendanceRouter)`
- Inline CORS allowlist:
  - Dev: allow localhost:3000 / 127.0.0.1
  - Prod: `ALLOWED_ORIGINS` CSV; sets Vary: Origin; handles OPTIONS
- Deferred Key Vault client (`getKvClient()`) to avoid IMDS probe on boot.

### Static asset caching
- Long-lived cache for js/css/images; no-cache for html.

## Frontend (React)

### Weekly view mapping and filters
- File: `src/tabs/home/WeeklyAttendanceView.tsx`
- Annual leave displays as 'away'; filters and chip click-disable updated.

### Attendance API calls (staging/prod)
- File: `src/tabs/home/Home.tsx`
  - Annual leave fetch → `POST /api/attendance/getAnnualLeave`
- File: `src/CustomForms/AnnualLeaveForm.tsx`
  - Submit → `POST /api/attendance/annual-leave`
- File: `src/CustomForms/AnnualLeaveApprovals.tsx`
  - Approve/Reject → `POST /api/attendance/updateAnnualLeave`
- Rationale: prevent 404s from `https://helix-keys-proxy.azurewebsites.net/api/api/...` and ensure same-origin hits Express app.

### Dev proxy
- File: `src/setupProxy.js`
- Attendance already proxied to Express (8080). No change required for dev.

## Validation
- Health: `GET /health` → 200
- Attendance data load: `POST /api/attendance/getAnnualLeave` → 200 in staging
- Annual leave submit/approve: `POST /api/attendance/annual-leave`, `POST /api/attendance/updateAnnualLeave` → 200
- UI: Weekly chips show 'away' for A/L; away days unclickable; tooltip indicates on leave
- Resilience: fewer first-load SQL ECONNCLOSED due to pooled retry helper

## Known follow-ups
- Complete migration of any remaining direct `sql.connect` usage to `withRequest`.
- Address deprecation logs: replace any `Buffer()` usage with `Buffer.from` / `Buffer.alloc` (source not yet traced here).
- Optionally standardize all attendance client calls on relative `/api` for consistency.

## Affected files
- New: `server/utils/db.js`
- Changed:
  - `server/routes/attendance.js`
  - `server/server.js`
  - `src/tabs/home/WeeklyAttendanceView.tsx`
  - `src/tabs/home/Home.tsx`
  - `src/CustomForms/AnnualLeaveForm.tsx`
  - `src/CustomForms/AnnualLeaveApprovals.tsx`
- Unchanged but relevant: `src/setupProxy.js`

## Environment
- Node 18/20 supported
- CORS allowlist via `ALLOWED_ORIGINS` in production
- SQL connection strings for core/project data in env
- Key Vault URL optional; defaults to `https://helix-keys.vault.azure.net/`

