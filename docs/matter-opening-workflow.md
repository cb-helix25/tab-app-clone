# Matter Opening Workflow

The Matter Opening flow is executed by an ordered pipeline defined in `src/tabs/instructions/MatterOpening/processingActions.ts` and presented in the UI workbench (`FlatMatterOpening.tsx`). It replaces older one‑shot flows like `importInstructionData`.

## High-level Steps
1. Retrieve/refresh tokens for integrations (ActiveCampaign, Clio, Asana)
2. Update Opponent and Solicitor details: `POST /api/opponents`
3. Record the Matter Request: `POST /api/matter-requests`
4. Sync Clio Contacts: `POST /api/clio-contacts` (captures `clioContactIds` and optional `clioCompanyId`)
5. Trigger NetDocuments workspace (placeholder step)
6. Open Clio Matter: `POST /api/clio-matters` (captures `matterId`)
7. Generate Draft CCL: `POST /api/ccl`

Client/Matter IDs are surfaced to the UI via callbacks:
- `registerClientIdCallback(cb)` for the primary person contact ID
- `registerMatterIdCallback(cb)` for the Clio matter ID

## Instruction Synchronisation
Instruction records are synchronized as part of these discrete steps rather than a single `importInstructionData` call. Where legacy processes exist, they should be considered deprecated and replaced with the pipeline steps above.

## Multiple Clients & Gating
- Gating uses the UI’s `pendingClientType` so Continue unlocks once a valid selection is made.
- Multiple Individuals supports a mix of POIDs and direct entry; duplicates are deduped by ID and case-insensitive names.

For the processing UI details and diagnostics, see `docs/matter-opening-workbench.md`.