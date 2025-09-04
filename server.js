//
// Production entry point
// ----------------------
// This file simply loads and executes the Express application defined in
// `server/server.js`. Keeping the real server implementation under the
// `server` directory avoids duplicating logic between development and
// production environments.

require('./server/server');