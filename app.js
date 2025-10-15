// app.js - Root Express entrypoint for Azure App Service
// This file binds to the Azure-provided port and starts the server

const app = require('./server');

// Azure App Service provides the port via environment variable
const port = process.env.PORT || 3001;

// Start the server - following Codex pattern
app.listen(port, () => console.log(`Server listening on port ${port}`));

module.exports = app;