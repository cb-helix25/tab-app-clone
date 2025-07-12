# Token Refresh Simulation

The Matter Opening workflow now includes automated refresh steps for ActiveCampaign, Clio and Asana tokens.

During local development the Express server exposes `/api/refresh` endpoints that call each vendor using stored credentials. This avoids manual token generation while testing the workflow.

| Endpoint | Description |
| -------- | ----------- |
| `POST /api/refresh/activecampaign` | Validates the stored ActiveCampaign API token against `https://helix-law54533.api-us1.com/api/3/account` |
| `POST /api/refresh/clio/:initials` | Refreshes a Clio access token using the client ID, secret and refresh token retrieved from Key Vault |
| `POST /api/refresh/asana` | Refreshes an Asana access token using credentials supplied in the request body |

Run `npm run start:server` to start the local server. Processing steps will call these endpoints to simulate real token refreshes so any failures appear in the browser console and server logs.