# Local Risk & Compliance Data

This dataset helps developers test the risk and compliance views without calling external services.
It pairs with the Tiller response generator to provide realistic status information.

## Files
- `src/localData/localTillerResponses.json` – Tiller style responses used by the parser.
- `src/localData/localInstructionData.json` – base instruction records the responses reference.

Use `npm run generate:tiller` whenever instruction refs change to refresh the sample data.# Tiller Integration Overview

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

## Local Test Data

Run `npm run generate:tiller` to create `src/localData/localTillerResponses.json`.
This file contains sample responses used when developing the risk and compliance
features without making real API calls. Each record mirrors the structure of a
Tiller result so the parser behaves the same in a local environment.
