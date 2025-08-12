---
applyTo: "api/src/**/*.ts,decoupled-functions/**/*.ts"
---
- Use @azure/functions v4 style with app.http and a separate typed handler.
- Always return proper CORS headers and handle OPTIONS preflight (respond 204 quickly without body).
- Read configuration from environment variables first; fall back to Key Vault via DefaultAzureCredential.
- Parameterize SQL queries; never concatenate user input.
- Log at info/warn/error levels; never log secrets or PII.
 - Return 4xx for validation errors with a structured body; reserve 5xx for server faults.
