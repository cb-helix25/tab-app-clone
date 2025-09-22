const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Routes that go to the Express server (port 8080)
  const expressRoutes = [
    '/api/getMatters',
    '/api/matters',
    '/api/getAllMatters',
    '/api/enquiries',
    '/api/clio-contacts',
    '/api/clio-matters',
    '/api/keys',
    '/api/refresh',
    '/api/matter-requests',
    '/api/opponents',
    '/api/risk-assessments',
    '/api/bundle',
    '/api/ccl',
    '/api/enquiry-emails',
    '/api/pitches',
    '/api/instructions',
    '/api/verify-id',
    '/api/sendEmail', // Centralized server email route
    '/api/attendance', // Attendance routes with annual leave integration
    '/ccls'
  ];

  // Azure Functions routes (port 7072 - api folder TypeScript functions)
  const azureFunctionRoutes = [
    '/getSnippetEdits',
    '/getAttendance',
    '/getWIPClio',
    '/getRecovered',
    '/getPOID6Years',
    '/getFutureBookings',
    '/getTransactions',
    '/getOutstandingClientBalances',
    '/getSnippetBlocks',
    '/getAnnualLeave',
    '/insertAttendance',
    '/insertNotableCaseInfo',
    '/insertDeal'  // Added for deal capture
  ];

  // Decoupled Azure Functions routes (port 7071 - JavaScript functions)
  const decoupledFunctionRoutes = [
    '/fetchMattersData',
    '/fetchEnquiriesData',
    '/fetchSnippetEdits',
    '/insertEnquiry',
    '/processEnquiry'
    // Removed /sendEmail - now handled by Express server
  ];

  // Proxy Express server routes to port 8080
  app.use(
    expressRoutes,
    createProxyMiddleware({
      target: 'http://localhost:8080',
      changeOrigin: true,
      onError: (err, req, res) => {
        console.error(`Proxy error for ${req.url} (Express server):`, err.message);
        // Fallback to Azure Functions if Express server fails
        console.log('Attempting fallback to Azure Functions...');
        const fallbackProxy = createProxyMiddleware({
          target: 'http://localhost:7072',
          changeOrigin: true,
        });
        fallbackProxy(req, res);
      }
    })
  );

  // Proxy Azure Functions routes to port 7072 (api folder)
  app.use(
    azureFunctionRoutes,
    createProxyMiddleware({
      target: 'http://localhost:7072',
      changeOrigin: true,
      pathRewrite: {
        '^/(.*)': '/api/$1', // Rewrite /getAttendance to /api/getAttendance
      },
      onError: (err, req, res) => {
        console.error(`Proxy error for ${req.url} (Azure Functions):`, err.message);
        // Fallback to Express server if Azure Functions fails
        console.log('Attempting fallback to Express server...');
        const fallbackProxy = createProxyMiddleware({
          target: 'http://localhost:8080',
          changeOrigin: true,
        });
        fallbackProxy(req, res);
      }
    })
  );

  // Proxy Decoupled Azure Functions routes to port 7071 (JavaScript functions)
  app.use(
    decoupledFunctionRoutes,
    createProxyMiddleware({
      target: 'http://localhost:7071',
      changeOrigin: true,
      pathRewrite: {
        '^/(.*)': '/api/$1', // Rewrite /sendEmail to /api/sendEmail
      },
      onError: (err, req, res) => {
        console.error(`Proxy error for ${req.url} (Decoupled Functions):`, err.message);
        // Fallback to Express server if Azure Functions fails
        console.log('Attempting fallback to Express server...');
        const fallbackProxy = createProxyMiddleware({
          target: 'http://localhost:8080',
          changeOrigin: true,
        });
        fallbackProxy(req, res);
      }
    })
  );

  // Catch-all for any other /api routes - try Express server first, then Azure Functions
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:8080',
      changeOrigin: true,
      onError: (err, req, res) => {
        console.error(`Proxy error for ${req.url} (Express server):`, err.message);
        console.log('Attempting fallback to Azure Functions...');
        const fallbackProxy = createProxyMiddleware({
          target: 'http://localhost:7072',
          changeOrigin: true,
        });
        fallbackProxy(req, res);
      }
    })
  );
};
