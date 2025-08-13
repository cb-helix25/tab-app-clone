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

### UI micro-patterns from recent iterations
- Sticky action/navigation bars: keep a subtle bottom border for separation
	- Dark: `1px solid rgba(255,255,255,0.08)`
	- Light: `1px solid rgba(0,0,0,0.06)`
- Notes pin UX: a small, floating icon inside the notes box (top-right); no pointer triangle.
	- Use Fluent UI icon names that exist (e.g., `Pinned` for pin, `Unpin` for unpin).
	- Ensure `z-index` is above content to keep it visible.
- Source confirmation microcopy: prefer a clear, neutral hint
	- “Source confirmation: these notes may be intake rep call notes, a web form message, or an auto‑parsed email.”
	- Display as a compact hover tooltip or a muted caption under the label.
- VAT display: when an Amount is entered, show VAT 20% and Total inc VAT (formatted, concise) near the input.
	- Don’t render the panel when the amount is empty or invalid.
- Flattened detail layout: in detail mode, avoid double/triple card chrome; keep a sticky header + main content only.
- Reveal/copy controls for contact info: reveal on hover, with copy affordance; keep typography compact.

### Editor overlay pattern (for placeholder-rich text)
- Use a transparent textarea over a highlighted pre layer to render placeholders like `[TOKEN]`.
- Snap selection to the full placeholder token on click/drag inside it for easy replace.
- Provide undo/redo (Ctrl+Z/Ctrl+Y) with a small, debounced history (≈300ms) to avoid noise.
- Unify font metrics between layers (font, lineHeight, letterSpacing, ligatures) to prevent drift.

## Azure Functions (Node)
- Use v4 model: `app.http(...)` with separate typed handler.
- Always handle CORS + OPTIONS.
- Read config from env; fallback to Key Vault in prod. No hardcoded secrets.
- Error handling: 4xx for validation; 5xx for server errors.

### Function security and observability
- Validate and coerce inputs at the boundary; prefer narrow runtime validators.
- Parameterize all SQL; never interpolate user input.
- Don’t log PII or secrets; scrub if needed.
- Return structured errors with appropriate status codes.

## Testing
- Jest + Testing Library for React.
- Integration tests for Functions where possible.
- Cover happy path + ≥1 edge case per public function.

## Performance & DX
- Avoid O(n²) on large lists.
- Memoise expensive selectors.
- Maintain CRA/react-scripts compatibility.
