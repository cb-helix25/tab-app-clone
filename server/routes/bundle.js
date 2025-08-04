const express = require('express');
const path = require('path');
// Ensure a fetch implementation is available.  In some production
// environments the global `fetch` API is missing which would cause the
// route handler to throw a ReferenceError.  Fallback to `node-fetch` when
// necessary so the bundle submission works both locally and after
// deployment.
const fetch = global.fetch || require('node-fetch');

const router = express.Router();

function inLocalMode() {
    return process.env.USE_LOCAL_SECRETS === 'true';
}

// Load local user data if in local mode
let localUsers = [];
if (inLocalMode()) {
    try {
        localUsers = require(path.join(process.cwd(), 'src', 'localData', 'localUserData.json'));
    } catch (err) {
        console.warn('localUserData.json not loaded:', err.message);
        localUsers = [];
    }
}

function findUserByName(name) {
    if (!name) return null;
    return (localUsers || []).find(u => {
        const full = u['Full Name'] || `${u.First} ${u.Last}`;
        return (
            full.toLowerCase() === name.toLowerCase() ||
            (u.Initials && u.Initials.toLowerCase() === name.toLowerCase())
        );
    }) || null;
}

router.post('/', async (req, res) => {
    const {
        name,
        matterReference,
        bundleLink,
        deliveryOptions = {},
        arrivalDate,
        officeReadyDate,
        coveringLetter,
        copiesInOffice,
        notes,
        user,
    } = req.body || {};

    if (!name || !matterReference || !bundleLink) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Credentials may be supplied directly on the payload or nested under a
    // `user` object.  This mirrors how the client sends user data and avoids
    // additional database lookups in production.
    // Support both camelCase and snake_case field names for compatibility
    const userData = user || req.body;
    const clientId = userData.ASANAClientID || userData.ASANAClient_ID;
    const clientSecret = userData.ASANASecret || userData.ASANA_Secret;
    const refreshToken = userData.ASANARefreshToken || userData.ASANARefresh_Token;

    if (!clientId || !clientSecret || !refreshToken) {
        console.error('Asana credentials missing:', { 
            hasClientId: !!clientId, 
            hasSecret: !!clientSecret, 
            hasRefreshToken: !!refreshToken,
            availableFields: Object.keys(userData).filter(k => k.includes('ASANA'))
        });
        return res.status(500).json({ error: 'Asana credentials not found' });
    }

    const projectId = process.env.ASANA_BUNDLE_PROJECT_ID || '1207163713256345';

    const tokenBody = new URLSearchParams();
    tokenBody.append('grant_type', 'refresh_token');
    tokenBody.append('client_id', clientId);
    tokenBody.append('client_secret', clientSecret);
    tokenBody.append('refresh_token', refreshToken);

    try {
        let accessToken = 'mock';
        if (!inLocalMode()) {
            const tokenResp = await fetch('https://app.asana.com/-/oauth_token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: tokenBody.toString()
            });
            if (!tokenResp.ok) {
                const text = await tokenResp.text();
                console.error('Asana token refresh failed', text);
                return res.status(500).json({ error: 'Asana token refresh failed' });
            }
            const tokenData = await tokenResp.json();
            accessToken = tokenData.access_token;
        } else {
            console.log('Local mode - skipping Asana token refresh');
            accessToken = 'local-token';
        }

        const descriptionParts = [
            `Matter: ${matterReference}`,
            `Bundle: ${bundleLink}`
        ];
        if (notes) descriptionParts.push(`Notes: ${notes}`);
        if (deliveryOptions.posted) {
            descriptionParts.push('Posted to opponent');
            if (arrivalDate) descriptionParts.push(`Arrival date: ${arrivalDate}`);
            if (coveringLetter && coveringLetter.link) {
                descriptionParts.push(`Letter: ${coveringLetter.link} x${coveringLetter.copies}`);
            }
        }
        if (deliveryOptions.leftInOffice) {
            descriptionParts.push('Copies left in office');
            if (officeReadyDate) descriptionParts.push(`Office-ready date: ${officeReadyDate}`);
            if (copiesInOffice) descriptionParts.push(`Copies: ${copiesInOffice}`);
        }

        const taskBody = {
            data: {
                projects: [projectId],
                name: `${matterReference} - Bundle`,
                notes: descriptionParts.join('\n')
            }
        };

        if (!inLocalMode()) {
            const resp = await fetch('https://app.asana.com/api/1.0/tasks', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(taskBody)
            });
            if (!resp.ok) {
                const text = await resp.text();
                console.error('Asana task creation failed', text);
                return res.status(500).json({ error: 'Asana task creation failed' });
            }
            const data = await resp.json();
            return res.json({ ok: true, task: data.data });
        } else {
            console.log('Local mode - skipping Asana task creation');
            return res.json({ ok: true, simulated: true });
        }
    } catch (err) {
        console.error('Bundle submission failed', err);
        res.status(500).json({ error: 'Bundle submission failed' });
    }
});

module.exports = router;