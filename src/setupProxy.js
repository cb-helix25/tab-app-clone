// src/setupProxy.js
// Proxy configuration for development to route API calls to Express server

const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Proxy API requests to the Express server during development
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:3001',
      changeOrigin: true,
      logLevel: 'debug', // Enable detailed logging
      onError: (err, req, res) => {
        console.error('Proxy error:', err.message);
        res.status(500).json({
          error: 'Proxy connection failed',
          message: 'Cannot connect to git history server',
          details: err.message
        });
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log(`Proxying request: ${req.method} ${req.url} -> http://localhost:3001${req.url}`);
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log(`Proxy response: ${proxyRes.statusCode} for ${req.url}`);
      }
    })
  );
};