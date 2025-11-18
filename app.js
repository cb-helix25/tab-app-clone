const express = require("express");
const path = require("path");
const morgan = require("morgan");
const { DefaultAzureCredential } = require('@azure/identity');
const { SecretClient } = require('@azure/keyvault-secrets');

// Import existing server routes
const serverRoutes = require('./server');

const app = express();
const port = process.env.PORT || 8080;

// Initialize Azure Key Vault client with error handling
try {
  const keyVaultUrl = 'https://secret-keys-helix.vault.azure.net/';
  const credential = new DefaultAzureCredential();
  const secretClient = new SecretClient(keyVaultUrl, credential);
  app.locals.secretClient = secretClient;
  console.log('[KEY-VAULT] Client initialized successfully');
} catch (error) {
  console.warn('[KEY-VAULT] Failed to initialize Key Vault client:', error.message);
  console.warn('[KEY-VAULT] Falling back to environment variables');
  app.locals.secretClient = null;
}

app.use(morgan("tiny"));

// Use existing server routes for APIs
app.use(serverRoutes);

// Serve the React build (created by `npm run build`)
const buildPath = path.join(__dirname, "build");
app.use(express.static(buildPath));

// Health check (optional)
app.get("/healthz", (_req, res) => res.send("ok"));

// SPA fallback
app.get("*", (_req, res) => {
  res.sendFile(path.join(buildPath, "index.html"));
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Server listening on ${port}`);
});

module.exports = app;