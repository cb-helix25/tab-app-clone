//
// Production entry point
// ----------------------
// This file simply loads and executes the Express application defined in
// `server/server.js`. Keeping the real server implementation under the
// `server` directory avoids duplicating logic between development and
// production environments.

// Add error handling for debugging Azure deployment issues
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    console.error('Stack:', err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

try {
    console.log('Starting server from:', __dirname);
    console.log('Node version:', process.version);
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Port:', process.env.PORT);
    
    require('./server/server');
} catch (error) {
    console.error('Failed to start server:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
}