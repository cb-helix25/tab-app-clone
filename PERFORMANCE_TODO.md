# App Load Performance — Urgent TODO

Last updated: 2025-09-21

Focus: Faster first byte and first render with minimal, safe edits shipped between other work.

## Server (startup/TTFB)
- [ ] Defer Key Vault client creation to route-time (avoid IMDS on boot)
  - Files: `server/server.js`, `server/index.js`
  - Action: Move `new DefaultAzureCredential()` and `new SecretClient(...)` inside `/api/keys*` handlers only.
- [ ] Add compression and strong static cache headers
  - Files: `server/server.js`, `server/index.js`
  - Action: Add `compression()`; for `express.static(...)` set `immutable` long-cache for hashed JS/CSS and `no-cache` for HTML; keep ETag.
- [ ] Reduce boot logging overhead in production
  - Files: `server/server.js`, `server/index.js`
  - Action: Gate `morgan('dev')` and opLog middleware behind `NODE_ENV !== 'production'`.
- [ ] Remove duplicate route registration
  - Files: `server/server.js`
  - Action: Deduplicate `app.use('/api/pitch-team', ...)`.
- [ ] Lazy-require heavy/rare routers
  - Files: `server/server.js`, `server/index.js`
  - Action: `app.use('/api/xxx', (req,res,next)=> require('./routes/xxx')(req,res,next))` for low-traffic routes.

## Frontend (critical path)
- [ ] Keep Home/Data out of initial bundle
  - File: `src/index.tsx`
  - Action: Remove static imports of `Data` and `getLiveLocalEnquiries`; use dynamic import only when route/fallback executes.
- [ ] Guard local JSON with dynamic import (prod shouldn’t bundle samples)
  - Files: `src/index.tsx`
  - Action: Load `localUserData.json`, `localEnquiries.json`, `localMatters.json`, `team-sql-data.json` via `import()` only when `REACT_APP_USE_LOCAL_DATA === 'true'`.
- [ ] Defer Fluent UI icon initialization
  - File: `src/index.tsx`
  - Action: Call `initializeIcons()` in `requestIdleCallback` or first `useEffect`.
- [ ] Fetch minimal data first, defer the rest
  - Files: `src/index.tsx`, `src/app/App.tsx`
  - Action: Load only Enquiries for first screen; fetch Matters/Team after first paint (idle/low-priority effect).
- [ ] Single-source enquiries; fallback only on failure
  - File: `src/index.tsx`
  - Action: Choose NEW vs LEGACY once; only hit the other on error (avoid dual fetch by default).

## Caching/Network
- [ ] Extend localStorage cache with versioned keys for team/matters
  - File: `src/index.tsx`
  - Action: Include a `vN-` prefix in keys; cache team data and normalized matters per user/date range.
- [ ] Cancel in-flight requests on user/tab switch
  - Files: `src/index.tsx`, `src/app/App.tsx`
  - Action: Use `AbortController` in fetch helpers and cleanup effects.

## Build/Delivery
- [ ] Verify lazy-split tabs; keep shared utils small
  - Files: `src/tabs/**`, shared utils under `src/utils/**`
  - Action: Ensure large tabs remain lazy; avoid importing tab internals from shared modules.
- [ ] Serve hashed assets with long cache; HTML no-cache
  - Files: `server/server.js`, `server/index.js`
  - Action: Static headers per above; confirm hashed filenames in `build/`.

## API Payloads (optional quick wins)
- [ ] Add lightweight “summary” mode for initial views
  - Files: `server/routes/instructions.js`, `server/routes/enquiries*.js`
  - Action: Support `?summary=true` to return minimal fields; fetch details on demand.

---
Suggested order (small wins first): dedupe route, disable prod logging, add compression/static headers, defer Key Vault, remove static frontend imports, guard local JSON, single-source enquiries.
