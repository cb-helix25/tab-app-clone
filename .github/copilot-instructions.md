# Copilot custom instructions for this workspace

## Project context
- Stack: React 18 + TypeScript (strict), Azure Functions (Node 18/20, @azure/functions v4), TeamsFx, Fluent UI, Jest.
- Structure: Frontend in `src/`; Azure Functions in `api/src/functions`; `decoupled-functions` project; local Azurite.

## Data schema policy (Matters)
- Primary: Use NEW schema → snake_case (`matter_id`, `display_number`) or uppercase (`MatterID`).
- Legacy: `"Display Number"`, `"Unique ID"` are DEPRECATED. Do not add new uses.
- Normalisation: Route all changes via `src/utils/matterNormalization.ts`. If touching raw shapes, add tests + update docs.
- Data source: Prefer `vnet_direct`.
- Goal: Consolidate on new schema and remove legacy.

## General guidelines
- TypeScript-first; no `any`. Use `unknown` + narrow.
- Keep functions small, pure; avoid hidden I/O.
- Return typed results; never throw plain strings.
- All exported functions and complex types require JSDoc.
- Security: parameterised SQL; never log secrets; use `DefaultAzureCredential` + Key Vault for prod.
- Keep diffs focused; no unrelated refactors.

## React/TypeScript
- Functional components + hooks; React 18 patterns.
- Enable `react-jsx` and strict TS.
- New UI: use `@fluentui/react-components` (v9). Keep v8 for existing code.
- Co-locate component-specific types and tests.

## Azure Functions (Node)
- Use v4 model: `app.http(...)` with separate typed handler.
- Always handle CORS + OPTIONS.
- Read config from env; fallback to Key Vault in prod. No hardcoded secrets.
- Error handling: 4xx for validation; 5xx for server errors.

## Testing
- Jest + Testing Library for React.
- Integration tests for Functions where possible.
- Cover happy path + ≥1 edge case per public function.

## Performance & DX
- Avoid O(n²) on large lists.
- Memoise expensive selectors.
- Maintain CRA/react-scripts compatibility.
