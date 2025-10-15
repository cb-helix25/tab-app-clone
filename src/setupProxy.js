// src/setupProxy.js (if CRA) - Dev proxy (local only) as per Codex requirements
// Keep proxying to your local Express in dev; no proxy needed in prod.

const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use('/api', createProxyMiddleware({
    target: 'http://localhost:3001',
    changeOrigin: true
  }));
};