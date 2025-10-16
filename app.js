// app.js - Root Express entrypoint for Azure App Service
// This file binds to the Azure-provided port and starts the server

console.log('='.repeat(60));
console.log(`[APP.JS] ENTRY POINT STARTING AT ${new Date().toISOString()}`);
console.log(`[APP.JS] NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`[APP.JS] process.cwd(): ${process.cwd()}`);
console.log(`[APP.JS] PORT: ${process.env.PORT}`);
console.log('='.repeat(60));

const app = require('./server');

// Azure App Service provides the port via environment variable
const port = process.env.PORT || 3001;

// Start the server - following Codex pattern
app.listen(port, () => {
  console.log('='.repeat(60));
  console.log(`[APP.JS] SERVER SUCCESSFULLY STARTED ON PORT ${port}`);
  console.log(`[APP.JS] Server ready to accept connections`);
  console.log('='.repeat(60));
});

module.exports = app;