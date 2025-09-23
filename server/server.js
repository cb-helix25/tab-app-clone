const path = require('path');

// Provide a fetch implementation when running on Node versions
// that do not ship with a global `fetch` (Node <18). This prevents
// runtime ReferenceError failures that surface as HTTP 500 responses
// when routes attempt to call `fetch`.
if (typeof fetch === 'undefined') {
    global.fetch = require('node-fetch');
}

require('dotenv').config({ path: path.join(__dirname, '../.env'), override: false });
require('dotenv').config({ path: path.join(__dirname, '../.env.local'), override: false });
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
// Optional compression (safe no-op if not installed)
let compression;
try { compression = require('compression'); } catch { /* optional */ }
const opLog = require('./utils/opLog');
const { DefaultAzureCredential } = require('@azure/identity');
const { SecretClient } = require('@azure/keyvault-secrets');
const refreshRouter = require('./routes/refresh');
const keysRouter = require('./routes/keys');
const matterRequestsRouter = require('./routes/matterRequests');
const opponentsRouter = require('./routes/opponents');
const clioContactsRouter = require('./routes/clioContacts');
const clioMattersRouter = require('./routes/clioMatters');
const clioClientQueryRouter = require('./routes/clio-client-query');
const getMattersRouter = require('./routes/getMatters');
const getAllMattersRouter = require('./routes/getAllMatters');
const riskAssessmentsRouter = require('./routes/riskAssessments');
const bundleRouter = require('./routes/bundle');
const proxyToAzureFunctionsRouter = require('./routes/proxyToAzureFunctions');

const enquiriesRouter = require('./routes/enquiries');
const enquiriesUnifiedRouter = require('./routes/enquiries-unified');
const enquiriesCombinedRouter = require('./routes/enquiries-combined');
const enquiryEmailsRouter = require('./routes/enquiryEmails');
const pitchesRouter = require('./routes/pitches');
const mattersRouter = require('./routes/matters');
const paymentsRouter = require('./routes/payments');
const instructionsRouter = require('./routes/instructions');
const documentsRouter = require('./routes/documents');
const verifyIdRouter = require('./routes/verify-id');
const teamLookupRouter = require('./routes/team-lookup');
const teamDataRouter = require('./routes/teamData');
const pitchTeamRouter = require('./routes/pitchTeam');
const sendEmailRouter = require('./routes/sendEmail');
const attendanceRouter = require('./routes/attendance');
console.log('📋 Attendance router imported');
// const { router: cclRouter, CCL_DIR } = require('./routes/ccl');

// Initialize ops log (loads recent entries and ensures log dir)
try { opLog.init(); } catch { /* best effort */ }

const app = express();
// Enable gzip compression if available
if (compression) {
    app.use(compression());
}
const PORT = process.env.PORT || 8080;

// TEMP: Open CORS to all origins (reflect request origin). Revert to allowlist when ready.
app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Defer Key Vault client creation to route-time to avoid IMDS probe on boot
const vaultUrl = process.env.KEY_VAULT_URL || 'https://helix-keys.vault.azure.net/';
let kvClient = null;
function getKvClient() {
    if (!kvClient) {
        const credential = new DefaultAzureCredential();
        kvClient = new SecretClient(vaultUrl, credential);
    }
    return kvClient;
}

// When running locally index.js lives in the `server` folder and the built
// client files are one level up. However after deployment the build script
// copies `index.js` to the site root alongside the compiled client assets.
// Using `__dirname` directly works for both cases.
const buildPath = path.join(__dirname);

// basic request logging (disable verbose logs in production)
if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
}
app.use(express.json());
app.use('/api/refresh', refreshRouter);
app.use('/api/matter-requests', matterRequestsRouter);
app.use('/api/opponents', opponentsRouter);
app.use('/api/risk-assessments', riskAssessmentsRouter);
app.use('/api/bundle', bundleRouter);
app.use('/api/clio-contacts', clioContactsRouter);
app.use('/api/clio-matters', clioMattersRouter);
app.use('/api/clio-client-query', clioClientQueryRouter);
app.use('/api/getMatters', getMattersRouter);
app.use('/api/getAllMatters', getAllMattersRouter);
// app.use('/api/ccl', cclRouter);
// app.use('/ccls', express.static(CCL_DIR));

app.use('/api/enquiries', enquiriesRouter);
app.use('/api/enquiries-unified', enquiriesUnifiedRouter);
app.use('/api/enquiries-combined', enquiriesCombinedRouter);
app.use('/api/enquiry-emails', enquiryEmailsRouter);

// Update enquiry endpoint - moved to enquiries-unified/update
// app.post('/api/update-enquiry', require('../api/update-enquiry'));
console.log('🔧 REGISTERING UPDATE DEAL ROUTE: POST /api/update-deal');
app.post('/api/update-deal', require('./routes/updateDeal'));
app.use('/api/pitches', pitchesRouter);
app.use('/api/matters', mattersRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/instructions', instructionsRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/deals', require('./routes/dealUpdate'));
app.use('/api/verify-id', verifyIdRouter);
app.use('/api/team-lookup', teamLookupRouter);
app.use('/api/team-data', teamDataRouter);
app.use('/api/pitch-team', pitchTeamRouter);
app.use('/api', sendEmailRouter);

// IMPORTANT: Attendance routes must come BEFORE proxy routes to avoid conflicts
app.use('/api/attendance', attendanceRouter);
console.log('📋 Attendance routes registered at /api/attendance');

// Proxy routes to Azure Functions
app.use('/', proxyToAzureFunctionsRouter);

app.get('/api/keys/:name/preview', async (req, res) => {
    try {
        const secret = await getKvClient().getSecret(req.params.name);
        const length = parseInt(process.env.SECRET_PREVIEW_LEN || '4', 10);
        res.json({ preview: secret.value.slice(0, length) });
    } catch (err) {
        console.error('Failed to retrieve secret preview', err);
        res.status(500).json({ error: 'Failed to retrieve secret preview' });
    }
});

app.use('/api/keys', keysRouter);
app.use('/api/refresh', refreshRouter);

// serve the built React files
// Serve static assets with better caching
app.use(express.static(buildPath, {
    etag: true,
    setHeaders: (res, filePath) => {
        if (/\.html?$/i.test(filePath)) {
            res.setHeader('Cache-Control', 'no-cache');
        } else if (/\.(?:js|css|png|jpg|jpeg|gif|svg|woff2?|ttf|ico)$/i.test(filePath)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
    },
}));

// simple liveness probe
app.get('/health', (_req, res) => {
    res.sendStatus(200);
});

// example Server-Sent Events endpoint emitting fake progress
app.get('/process', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let progress = 0;
    const interval = setInterval(() => {
        progress += 10;
        res.write(`data: ${JSON.stringify({ progress })}\n\n`);
        if (progress >= 100) {
            res.write('event: done\n');
            res.write('data: {}\n\n');
            clearInterval(interval);
            res.end();
        }
    }, 500);

    req.on('close', () => clearInterval(interval));
});

// fallback to index.html for client-side routes
app.get('*', (_req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
