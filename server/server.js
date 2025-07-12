const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local'), override: false });
const express = require('express');
const morgan = require('morgan');
const { DefaultAzureCredential } = require('@azure/identity');
const { SecretClient } = require('@azure/keyvault-secrets');

const app = express();
const PORT = process.env.PORT || 8080;

// Set up Key Vault client for retrieving secrets
const credential = new DefaultAzureCredential();
const vaultUrl = process.env.KEY_VAULT_URL || 'https://helix-keys.vault.azure.net/';
const client = new SecretClient(vaultUrl, credential);

// When running locally index.js lives in the `server` folder and the built
// client files are one level up. However after deployment the build script
// copies `index.js` to the site root alongside the compiled client assets.
// Using `__dirname` directly works for both cases.
const buildPath = path.join(__dirname);

// basic request logging
app.use(morgan('dev'));
app.use(express.json());

// serve the built React files
app.use(express.static(buildPath));

// simple liveness probe
app.get('/health', (_req, res) => {
    res.sendStatus(200);
});

// expose Key Vault secret preview so the full value isn't sent to the client
app.get('/api/keys/:name/preview', async (req, res) => {
    try {
        const secret = await client.getSecret(req.params.name);
        const length = parseInt(process.env.SECRET_PREVIEW_LEN || '4', 10);
        res.json({ preview: secret.value.slice(0, length) });
    } catch (err) {
        console.error('Failed to retrieve secret preview', err);
        res.status(500).json({ error: 'Failed to retrieve secret preview' });
    }
});

// expose Key Vault secrets via simple API
app.get('/api/keys/:name', async (req, res) => {
    try {
        const secret = await client.getSecret(req.params.name);
        res.json({ value: secret.value });
    } catch (err) {
        console.error('Failed to retrieve secret', err);
        res.status(500).json({ error: 'Failed to retrieve secret' });
    }
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
