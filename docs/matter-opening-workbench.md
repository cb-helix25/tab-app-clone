# Matter Opening Workbench

This document describes the professional “monitoring workbench” experience used during Matter Opening: the processing UI, diagnostics, branding, and the endpoints executed under the hood.

## Overview
- Location: `src/tabs/instructions/MatterOpening/FlatMatterOpening.tsx`
- Pipeline definition: `src/tabs/instructions/MatterOpening/processingActions.ts`
- Purpose: Provide a compact, on‑brand, low‑noise processing summary with admin diagnostics on demand.

## Processing Summary
- Displays overall percent and completed count (Done of Total).
- Compact per‑operation icon grid shows each action’s status:
  - success: green state
  - error: red state
  - pending: neutral
- Progress bar uses a subtle green gradient: `linear-gradient(135deg, #49B670 0%, #15803d 100%)`.

## Admin Diagnostics (gated)
- Admins and local dev can toggle detailed backend phases for each operation:
  - Phases: Sent, Responded, Succeeded, Error.
  - On failures only: payload/response snippets are revealed (summarized and truncated).
- Implementation uses an operation observer exposed from `processingActions.ts`:
  - `registerOperationObserver(cb)` and `setCurrentActionIndex(i)`.
  - Requests use `instrumentedFetch(label, url, options, payloadForSummary?)` to emit phases.
  - Summarization avoids leaking secrets and truncates long values.

## Support Integration
- Support Request UI is embedded inside the Processing Summary header (no separate header icons).
- Includes Category and Message, with a single “Send Support Request” action.

## Branding & UI
- Header color for “Matter Opening Workbench”: brand blue `#3690CE`.
- Card backgrounds: light gradient `linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)`.
- Shadows: light `0 4px 6px rgba(0, 0, 0, 0.07)`; elevated in workbench mode.
- Buttons: rounded 6–12px, subtle hover lift.

## Operation Icons (examples)
- ActiveCampaign: `assets/activecampaign.svg` (token retrieval/refresh)
- Clio: `assets/clio.svg` (contact/matter steps)
- Asana: `assets/asana.svg` (token refresh)
- CCL: `assets/ccl.svg` (draft generation)
- NetDocuments: `assets/netdocuments.svg` (workspace trigger)
- Helix mark: `assets/dark blue mark.svg` (internal “Databases Updated” placeholders)

## Execution Flow (key steps)
The pipeline is defined in `processingActions.ts` as an ordered array. Representative steps:
1) Retrieve/refresh tokens (ActiveCampaign, Clio, Asana)
2) Opponent details updated: `POST /api/opponents`
3) Matter request recorded: `POST /api/matter-requests`
4) Clio contact sync: `POST /api/clio-contacts` (captures `clioContactIds`/`clioCompanyId`)
5) NetDocuments workspace triggered (placeholder)
6) Clio matter opened: `POST /api/clio-matters` (captures `matterId`)
7) Draft CCL generated: `POST /api/ccl` (via `generateDraftCclAction`)

Callbacks:
- `registerClientIdCallback(cb)` is invoked with the Clio Person contact ID when available.
- `registerMatterIdCallback(cb)` is invoked with the Clio Matter ID when opened.

## Gating & Client Type
- Continue gating uses `pendingClientType` (UI selection) so Continue unlocks immediately when a valid choice + selection is made.
- On Continue, the committed `clientType` is set from `pendingClientType` before advancing.
- Multiple Individuals allow POID + direct-entry combinations; duplicates are deduped by ID and case-insensitive names.

## Security & Logging
- Secrets are retrieved via `/api/keys/*` and never logged.
- `instrumentedFetch` emits summaries only; payloads and responses are truncated, and detailed bodies are revealed only on error.

## Known Placeholders
- “Contact Created/Updated” and “Databases Updated” steps are placeholders marked done; replace with concrete implementations when available.

## Troubleshooting
- If phases don’t appear, ensure `registerOperationObserver` is called and `setCurrentActionIndex` updates on each step.
- If icons are missing, verify asset imports in `processingActions.ts` and that each `ProcessingStep` maps `icon`.
