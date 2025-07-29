const express = require('express');
const path = require('path');

const router = express.Router();

// Load local user data if available
let localUsers = [];
try {
    localUsers = require(path.join(process.cwd(), 'src', 'localData', 'localUserData.json'));
} catch {
    localUsers = [];
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

function inLocalMode() {
    return process.env.USE_LOCAL_SECRETS === 'true';
}

router.post('/', async (req, res) => {
    const {
        name,
        matterReference,
        bundleLink,
        deliveryOptions = {},
        arrivalDate,
        officeReadyDate,
        coveringLetters = [],
        copiesInOffice,
        notes
    } = req.body || {};

    if (!name || !matterReference || !bundleLink) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const user = findUserByName(name);
    const clientId = user?.ASANAClientID || process.env.ASANA_CLIENT_ID;
    const clientSecret = user?.ASANASecret || process.env.ASANA_SECRET;
    const refreshToken = user?.ASANARefreshToken || process.env.ASANA_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
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
            coveringLetters.forEach((cl, idx) => {
                descriptionParts.push(`Letter ${idx + 1}: ${cl.link} x${cl.copies}`);
            });
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
