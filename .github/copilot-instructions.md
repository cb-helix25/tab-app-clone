# Copilot Instructions

Keep responses concise. Make only requested changes.

## Type Safety
- Prefer `unknown` over `any` at boundaries, narrow with type guards when practical.
- Consider returning `{ ok: true, value } | { ok: false, error }` for validation errors.

## Security
- Prefer parameterized SQL to prevent injection attacks.
- Avoid logging secrets, tokens, or PII.
- Use env vars or Key Vault (DefaultAzureCredential) for sensitive data.

## Data Schema
- Prefer new schema: snake_case/UPPERCASE fields.
- Legacy spaced keys ("Display Number", "Unique ID") exist; normalize via `src/utils/matterNormalization.ts` when possible.

## Azure Functions
- Prefer @azure/functions v4: `app.http` with typed handlers.
- Include CORS headers and handle OPTIONS preflight when needed.

## Code Style
- Prefer `async/await` over Promise chains.
- Add JSDoc on exported functions when helpful.
- Keep diffs minimal.
