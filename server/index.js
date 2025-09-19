const path = require('path');

// Ensure `fetch` is available for route handlers when running on
// versions of Node.js that do not provide it natively. Without this
// check, calls to `fetch` would throw a ReferenceError and surface as
// 500 errors in production.
if (typeof fetch === 'undefined') {
    global.fetch = require('node-fetch');
}

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env'), override: false });
require('dotenv').config({ path: path.join(__dirname, '../.env.local'), override: false });
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { init: initOpLog, append: opAppend, sessionId: opSessionId } = require('./utils/opLog');
const keysRouter = require('./routes/keys');
const refreshRouter = require('./routes/refresh');
const matterRequestsRouter = require('./routes/matterRequests');
const opponentsRouter = require('./routes/opponents');
const clioContactsRouter = require('./routes/clioContacts');
const clioMattersRouter = require('./routes/clioMatters');
const mattersRouter = require('./routes/matters');
const getMattersRouter = require('./routes/getMatters');
const getAllMattersRouter = require('./routes/getAllMatters');
const riskAssessmentsRouter = require('./routes/riskAssessments');
const bundleRouter = require('./routes/bundle');
const { router: cclRouter, CCL_DIR } = require('./routes/ccl');
const enquiriesRouter = require('./routes/enquiries');
const enquiryEmailsRouter = require('./routes/enquiryEmails');
const pitchesRouter = require('./routes/pitches');
const paymentsRouter = require('./routes/payments');
const instructionDetailsRouter = require('./routes/instruction-details');
const instructionsRouter = require('./routes/instructions');
const documentsRouter = require('./routes/documents');
const enquiriesUnifiedRouter = require('./routes/enquiries-unified');
const verifyIdRouter = require('./routes/verify-id');
const testDbRouter = require('./routes/test-db');
const teamLookupRouter = require('./routes/team-lookup');
const teamDataRouter = require('./routes/teamData');
const pitchTeamRouter = require('./routes/pitchTeam');
const proxyToAzureFunctionsRouter = require('./routes/proxyToAzureFunctions');
const fileMapRouter = require('./routes/fileMap');
const opsRouter = require('./routes/ops');
const sendEmailRouter = require('./routes/sendEmail');

const app = express();
const PORT = process.env.PORT || 8080;

// Initialize persistent operations log and add request logging middleware
initOpLog();
app.use((req, res, next) => {
    const start = Date.now();
    const ctx = { type: 'http', action: `${req.method} ${req.path}`, status: 'started' };
    opAppend(ctx);
    res.on('finish', () => {
        opAppend({ type: 'http', action: `${req.method} ${req.path}`, status: (res.statusCode >= 400 ? 'error' : 'success'), httpStatus: res.statusCode, durationMs: Date.now() - start });
    });
    next();
});

// Enable CORS for all routes to allow frontend on port 3000 to access API on port 8080
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(morgan('dev'));
app.use(express.json());

app.use('/api/keys', keysRouter);
app.use('/api/refresh', refreshRouter);
app.use('/api/matter-requests', matterRequestsRouter);
app.use('/api/opponents', opponentsRouter);
app.use('/api/risk-assessments', riskAssessmentsRouter);
app.use('/api/bundle', bundleRouter);
app.use('/api/clio-contacts', clioContactsRouter);
app.use('/api/clio-matters', clioMattersRouter);
app.use('/api/matters', mattersRouter);
app.use('/api/getMatters', getMattersRouter);
app.use('/api/getAllMatters', getAllMattersRouter);
app.use('/api/ccl', cclRouter);
app.use('/api/enquiries', enquiriesRouter);
app.use('/api/enquiries-unified', enquiriesUnifiedRouter);
app.use('/api/enquiry-emails', enquiryEmailsRouter);
app.use('/api/ops', opsRouter);
// Email route (server-based). Expose under both /api and / to match existing callers.
app.use('/api', sendEmailRouter);
app.use('/', sendEmailRouter);
// app.post('/api/update-enquiry', require('../api/update-enquiry')); // Moved to enquiries-unified/update
// Register deal update endpoints (used by instruction cards editing)
console.log('🔧 REGISTERING UPDATE DEAL ROUTES');
app.post('/api/update-deal', require('./routes/updateDeal'));
app.use('/api/deals', require('./routes/dealUpdate'));
app.use('/api/pitches', pitchesRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/instruction-details', instructionDetailsRouter);
app.use('/api/instructions', instructionsRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/verify-id', verifyIdRouter);
app.use('/api/test-db', testDbRouter);
app.use('/api/team-lookup', teamLookupRouter);
app.use('/api/team-data', teamDataRouter);
app.use('/api/pitch-team', pitchTeamRouter);
app.use('/api/file-map', fileMapRouter);
app.use('/ccls', express.static(CCL_DIR));

// Temporary debug helper: allow GET /api/update-deal?dealId=...&ServiceDescription=...&Amount=...
app.get('/api/update-deal', async (req, res) => {
    try {
        const updateDeal = require('./routes/updateDeal');
        // Shim req.body from query
        req.body = {
            dealId: req.query.dealId,
            ServiceDescription: req.query.ServiceDescription,
            Amount: req.query.Amount ? Number(req.query.Amount) : undefined,
        };
        return updateDeal(req, res);
    } catch (err) {
        console.error('Fallback GET /api/update-deal failed:', err);
        res.status(500).json({ error: 'Fallback update failed', details: String(err) });
    }
});

console.log('📋 Server routes registered:');
console.log('  ✅ /api/keys');
console.log('  ✅ /api/refresh'); 
console.log('  ✅ /api/matter-requests');
console.log('  ✅ /api/opponents');
console.log('  ✅ /api/risk-assessments');
console.log('  ✅ /api/bundle');
console.log('  ✅ /api/clio-contacts');
console.log('  ✅ /api/clio-matters');
console.log('  ✅ /api/matters');
console.log('  ✅ /api/getMatters');
console.log('  ✅ /api/getAllMatters');
console.log('  ✅ /api/ccl');
console.log('  ✅ /api/enquiries');
console.log('  ✅ /api/enquiries-unified');
console.log('  ✅ /api/enquiry-emails');
console.log('  🆕 /api/ops (OPERATIONS LOG)');
// console.log('  ✅ /api/update-enquiry'); // Moved to enquiries-unified/update
console.log('  ✅ /api/pitches');
console.log('  🆕 /api/payments (PAYMENT DETAILS)');
console.log('  🆕 /api/instruction-details (INSTRUCTION DETAILS)');
console.log('  🆕 /api/instructions (UNIFIED ENDPOINT)');
console.log('  🆕 /api/documents (DOCUMENT PROXY)');
console.log('  🆕 /api/verify-id (ID VERIFICATION)');
console.log('  🆕 /api/team-lookup (TEAM EMAIL LOOKUP)');
console.log('  🆕 /api/team-data (TEAM DATA)');
console.log('  🆕 /api/pitch-team (PITCH TEAM DATA)');
console.log('  🆕 /api/file-map (REPO FILE MAP)');

// Proxy routes to Azure Functions - these handle requests without /api/ prefix
app.use('/', proxyToAzureFunctionsRouter);

// API routes should come BEFORE static file serving and catch-all route
// This ensures API requests don't get caught by the catch-all route

const buildPath = path.join(__dirname, 'static');
// Only serve static files if the directory exists
const fs = require('fs');
if (fs.existsSync(buildPath)) {
    app.use(express.static(buildPath));
    
    // Catch-all route for SPA - only for non-API routes
    app.get('*', (req, res) => {
        // Don't serve HTML for API routes
        if (req.path.startsWith('/api/')) {
            return res.status(404).json({ error: 'API endpoint not found' });
        }
        res.sendFile(path.join(buildPath, 'index.html'));
    });
} else {
    console.log('Static build directory not found, serving API only');
    // For non-API routes when no static files exist
    app.get('*', (req, res) => {
        if (req.path.startsWith('/api/')) {
            return res.status(404).json({ error: 'API endpoint not found' });
        }
        res.status(404).json({ error: 'Static files not available' });
    });
}

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    console.log(`Ops session: ${opSessionId}`);
});