// src/setupProxy.js (Create React App) - Dev proxy (local only)
// Routes API calls from the CRA dev server to the Express backend.

const { createProxyMiddleware } = require('http-proxy-middleware');

const normalizeTarget = (target) => {
  if (!target) {
    return target;
  }
  return target.endsWith('/') ? target.slice(0, -1) : target;
};

module.exports = function(app) {
  const defaultTarget = 'http://localhost:8080';
  const envTarget = process.env.EXPRESS_PROXY_TARGET
    || process.env.REACT_APP_API_BASE_URL
    || `${process.env.EXPRESS_PROXY_PROTOCOL || 'http'}://${process.env.EXPRESS_PROXY_HOST || 'localhost'}:${process.env.EXPRESS_PROXY_PORT || '8080'}`;

  const target = normalizeTarget(envTarget) || defaultTarget;

  app.use('/api', createProxyMiddleware({
    target,
    changeOrigin: true,
    logLevel: 'warn'
  }));
};