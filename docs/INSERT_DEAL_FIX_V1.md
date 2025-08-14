# INSERT_DEAL_FIX_V1

Short, authoritative record of the changes made while diagnosing and fixing the `insertDeal` / Pitch Builder draft flow.

## Checklist (requirements)
- [x] Normalize `prospectId` so values like `P-100` become numeric for upstream deal-capture.
- [x] Return structured validation errors from `insertDeal` (JSON with `missing` + `received`).
- [x] Ensure frontend provides a non-empty description when inserting a deal (fall back to a short plaintext derived from the editor body).
- [x] Ensure `instructionRef` is built as `HLX-<prospectId>-<passcode>` and returned in the `insertDeal` response.
- [x] Use instructions URL format `https://instruct.helix-law.com/pitch/<passcode>` in outgoing emails/payloads.
- [x] Remove the ephemeral "nugget" comment from runtime code and keep a searchable note in docs.

## Files changed (high level)
- `api/src/functions/insertDeal.ts` — validation, normalization, passcode generation, `instructionRef` construction, structured JSON error responses, instructions URL wiring.
- `api/src/functions/sendEmail.ts` — verified while testing; unchanged behavior but used to validate email sending (Graph 202 observed).
- `src/tabs/enquiries/PitchBuilder.tsx` — added a fallback for `initialScopeDescription`, added sender guard before calling `sendEmail` from the Draft flow.
- `docs/INSERT_DEAL_FIX_V1.md` — (this file) documentation of the fix.

## What I changed in `insertDeal.ts` (concise story)
- Input parsing and validation now returns clear 400 responses with JSON: `{ error, missing: string[], received: Record<string,boolean> }` when required fields are missing.
- Added `normalizeId(raw)` to strip non-digits from `prospectId` values (so `P-27367` -> `27367`) before sending to upstream.
- Generate or accept a `passcode` (5-digit fallback) and create `instructionRef` as `HLX-<prospectId>-<passcode>`.
- Build `instructionsUrl` using `process.env.DEAL_INSTRUCTIONS_URL || 'https://instruct.helix-law.com/pitch'` and append the `passcode` as a path segment.
- Forward a normalized payload to the upstream deal-capture endpoint and return a 200 JSON including `{ passcode, instructionRef, instructionsUrl }` on success.

## What I changed in `PitchBuilder.tsx` (concise story)
- When `serviceDescription` is empty, `insertDealIfNeeded()` now derives a short plaintext fallback from the editor `body` (strip HTML, truncate) to satisfy the backend requirement.
- `handleDraftEmail` will now abort early if `user_email` (sender) is missing to avoid sending an email without a sender and to avoid masking `insertDeal` failures.

## Tests performed (local dev host)
- Start the Function host (local) and confirm `/api/insertDeal` and `/api/sendEmail` are mounted.
- POST test payloads used (examples):
  - Missing description => `400` with JSON: `missing: ['serviceDescription|initialScopeDescription']`, plus a `received` map.
  - Normalized `prospectId` (`P-27367`) + non-empty description => `200` with JSON: `{ passcode: '10302', instructionRef: 'HLX-27367-10302', instructionsUrl: 'https://instruct.helix-law.com/pitch/10302' }` (values illustrative).
  - sendEmail direct POST => Graph returned `202 Accepted` and function returned "Email sent successfully." log.

## Reproduce locally (quick)
From the workspace root run a small Node one-liner (PowerShell):

```powershell
node -e "const http=require('http'); const payload={initialScopeDescription:'Automated test: deal-capture run',amount:0,areaOfWork:'Commercial',prospectId:'P-27367',pitchedBy:'LZ',isMultiClient:false,leadClientEmail:'client@example.com'}; const data=JSON.stringify(payload); const opts={hostname:'127.0.0.1',port:7071,path:'/api/insertDeal',method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(data)}}; const req=http.request(opts,res=>{let b='';res.on('data',c=>b+=c);res.on('end',()=>{console.log('STATUS',res.statusCode); try{console.log(JSON.parse(b))}catch(e){console.log(b)} });}); req.on('error',e=>console.error('ERR',e.message)); req.write(data); req.end();"
```

Adjust `prospectId` (eg. `P-100`) and `initialScopeDescription` to reproduce both error and success paths.

## Notes / Caveats
- The upstream deal-capture API expects a numeric `prospectId` and an `instructionRef` following the required format; normalization is done at the function boundary.
- The instructions URL base is configurable via `DEAL_INSTRUCTIONS_URL` (env). If unset, the default is `https://instruct.helix-law.com/pitch`.
- Tests run locally used dev Key Vault/local secrets for Graph credentials; ensure secrets are present in `local.settings.json` or Key Vault when running integration tests.

## Next recommended steps
1. Run the browser-based Pitch Builder Draft flow (reload the frontend dev server so `PitchBuilder.tsx` changes are loaded) and confirm a deal is created and the draft email still sends. Collect the exact failing request (if any) from DevTools network tab to reproduce any remaining edge cases.
2. Add unit tests for `normalizeId()` and for `insertDeal` handler's validation logic (happy path + missing description).
3. Optionally revert or rename this doc if you prefer a shorter changelog; keep the nugget token in docs only.

## Nugget (searchable note)
INSERT_DEAL_FIX_V1 — search this token in docs to find the full record of the change.

---
Document generated: 2025-08-14

INSERT_DEAL_FIX_V1

Summary
-------
This document records the recent small, local fixes to the `insertDeal` flow (API + frontend) that were made to stop Draft email attempts from failing with a 400 and to ensure the downstream Instructions service receives a usable `InstructionRef`.

Change highlights
-----------------
- Ensure `insertDeal` accepts frontend payloads by:
  - Normalising prospect IDs (strip non-digits; upstream expects numeric ProspectId).
  - Returning structured JSON for validation failures and errors (helps debugging from UI).
  - Generating a 5-digit passcode when not supplied.
  - Building and sending `instructionRef` to upstream in the format: `HLX-<prospectId>-<passcode>`.
  - Returning `instructionRef`, `passcode` and `instructionsUrl` in the 200 response.
- Frontend (`PitchBuilder`) changes:
  - `insertDealIfNeeded()` now ensures a non-empty `initialScopeDescription` (falls back to a short plain-text excerpt of the editor body or a default string) so upstream validation doesn't fail.
  - `handleDraftEmail()` will now early-fail if the sender email is not available (prevents a 400 from sendEmail that masked the real insertDeal issue).

Files changed
-------------
- `api/src/functions/insertDeal.ts` — (API) validation + normalization + instructionRef/passcode + structured responses + test email hook.
- `src/tabs/enquiries/PitchBuilder.tsx` — (Frontend) fallback `initialScopeDescription`, email sender guard.

Why these changes
------------------
- Root causes:
  - Frontend sometimes sent an empty description (serviceDescription/initialScopeDescription) — upstream rejects it.
  - Prospect IDs were non-numeric (e.g. `P-100`) and caused upstream validation failures.
  - The UI previously sent some requests that caused `sendEmail` to 400 because the sender address was missing; this made debugging harder.
- Fixes align with the goal: make Draft action reliably create the deal (with a passcode and instruction ref) and then draft/send the email.

How to test locally (quick)
---------------------------
1) Start the Functions host and frontend dev server (normal local dev flow).
2) Direct call (bypasses proxy):

PowerShell example:

```powershell
$body = @{
  initialScopeDescription = 'Test service'
  amount = 0
  areaOfWork = 'commercial'
  prospectId = '27367'
  pitchedBy = 'LZ'
  isMultiClient = $false
  leadClientEmail = 'lukaszzemanek11@gmail.com'
} | ConvertTo-Json -Compress

Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:7071/api/insertDeal' -Body $body -ContentType 'application/json' | ConvertTo-Json -Depth 5
```

Expected response (200) includes:
- `passcode` (string)
- `instructionRef` like `HLX-27367-<passcode>`
- `instructionsUrl` pointing to the instructions app (e.g. https://instruct.helix-law.com/pitch/<passcode>)

3) In the Pitch Builder UI, click Draft — it should no longer return a 400; check the Network tab for the POST to the insert path and the 200 JSON response.

Developer notes / small gotchas
------------------------------
- The Functions host needs to be restarted or will auto-reload if watch is enabled; if you still see old behaviour, restart the `Start backend`/`Watch backend` tasks.
- KeyVault is used to fetch secrets when required (only in some code paths). Local dev may use environment variables instead.
- The `instructionRef` is intentionally built using the normalized numeric ProspectId to match the downstream system's expectation.

Files to inspect when debugging later
------------------------------------
- `api/src/functions/insertDeal.ts` — main handler and payload sent to upstream.
- `src/tabs/enquiries/PitchBuilder.tsx` — `insertDealIfNeeded()` and `handleDraftEmail()`.
- `docs/INSERT_DEAL_FIX_V1.md` — this file (index point).

Nugget for next LLM
-------------------
NUGGET: INSERT_DEAL_FIX_V1 — See `docs/INSERT_DEAL_FIX_V1.md` for context; the `insertDeal` handler now populates `instructionRef` as `HLX-<prospectId>-<passcode>` and returns it in the 200 response.

Recommended next steps
----------------------
- Add a unit test for `normalizeId` plus an integration test for `insertDeal` happy path (mock upstream) — quick wins to avoid regressions.
- Consider adding an explicit `instructionRef` field to the frontend payload if/when the client should control it.

Change log
----------
- 2025-08-14: Fixes applied to ensure Draft flow and instructionRef format; nugget placed in docs.

Contact
-------
If anything unexpected appears in logs, capture the full request payload (DevTools Network) and the Functions host logs around `insertDeal received body:` and paste them into the ticket or the PR description.
