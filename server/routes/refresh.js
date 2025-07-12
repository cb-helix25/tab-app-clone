const express = require('express');
const { getSecret } = require('../utils/getSecret');

function inLocalMode() {
    return process.env.USE_LOCAL_SECRETS === 'true';
}

const router = express.Router();

router.post('/activecampaign', async (_req, res) => {
    try {
        const token = await getSecret('ac-automations-apitoken');
        res.json({ ok: true });
    } catch (err) {
        console.error('ActiveCampaign check failed', err);
        res.status(500).json({ error: 'ActiveCampaign check failed' });
    }
});

router.post('/clio/:initials', async (req, res) => {
    const initials = req.params.initials.toLowerCase();
    try {
        const clientId = await getSecret(`${initials}-clio-v1-clientid`);
        const clientSecret = await getSecret(`${initials}-clio-v1-clientsecret`);
        const refreshToken = await getSecret(`${initials}-clio-v1-refreshtoken`);
        const url = `https://eu.app.clio.com/oauth/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=refresh_token&refresh_token=${refreshToken}`;
        console.log('Refreshing Clio token for', initials);
        if (inLocalMode()) {
            console.log('Local mode - skipping Clio API call');
            return res.json({ ok: true, simulated: true });
        }
        const resp = await fetch(url, { method: 'POST' });
        if (!resp.ok) {
            console.error('Clio token refresh failed', await resp.text());
            return res.status(500).json({ error: 'Clio token refresh failed' });
        }
        res.json({ ok: true });
    } catch (err) {
        console.error('Clio token refresh failed', err);
        res.status(500).json({ error: 'Clio token refresh failed' });
    }
});

router.post('/asana', async (req, res) => {
    const { clientId, clientSecret, refreshToken } = req.body;
    if (!clientId || !clientSecret || !refreshToken) {
        return res.status(400).json({ error: 'Missing Asana credentials' });
    }
    try {
        const body = new URLSearchParams();
        body.append('grant_type', 'refresh_token');
        body.append('client_id', clientId);
        body.append('client_secret', clientSecret);
        body.append('refresh_token', refreshToken);
        console.log('Refreshing Asana token');
        if (inLocalMode()) {
            console.log('Local mode - skipping Asana API call');
            return res.json({ ok: true, simulated: true });
        }
        const resp = await fetch('https://app.asana.com/-/oauth_token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body.toString()
        });
        if (!resp.ok) {
            console.error('Asana token refresh failed', await resp.text());
            return res.status(500).json({ error: 'Asana token refresh failed' });
        }
        res.json({ ok: true });
    } catch (err) {
        console.error('Asana token refresh failed', err);
        res.status(500).json({ error: 'Asana token refresh failed' });
    }
});

module.exports = router;
