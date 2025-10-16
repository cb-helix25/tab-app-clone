// app.js - Root Express entrypoint for Azure App Service
const express = require("express");
const path = require("path");

// Import existing server routes
const serverRoutes = require('./server');

const app = express();
const port = process.env.PORT || 8080;

// Use existing server routes for APIs
app.use(serverRoutes);

// Serve the React build (run `npm run build` to create it)
app.use(express.static(path.join(__dirname, "build")));

// Quick health endpoint
app.get("/healthz", (_req, res) => res.send("ok"));

// SPA fallback to index.html for React Router
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

app.listen(port, "0.0.0.0", () => {
  console.log(`[SERVER] Started on port ${port} (${process.env.NODE_ENV || 'development'})`);
});

module.exports = app;