# Tiller Integration Overview

This note summarises how the application uses shared parsing logic for Tiller responses and where API calls are made.

## Components
- **src/agents/tillerParser.ts** – Interprets raw Tiller responses in the instructions app. It converts the `checkTypeId`, `result`, and `status` fields into an actionable object defined as `ActionType`.
- **pitch backend `tillerApi.js`** – Located in the separate `instruct-pitch` repository (synced as a submodule once initialised). Responsible for calling the Tiller API and returning the raw response JSON.

The instructions app consumes `tillerApi.js` via backend utilities and then passes the JSON into `tillerParser.ts` for interpretation.

## Status Tracking
1. **API Call** – `tillerApi.js` performs the external request and logs request/response identifiers for auditing.
2. **Parsing** – `tillerParser.ts` maps the response into an `ActionType`. Unknown combinations fall back to a logging action.
3. **Outcome** – The returned `ActionType` dictates whether to notify a team, log an error, or proceed with automated decision logic.

Keep this document updated as new fields or processing steps emerge.