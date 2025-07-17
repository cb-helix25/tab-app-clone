const express = require('express');
const { getSecret } = require('../utils/getSecret');

const router = express.Router();

router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const initials = (process.env.CLIO_USER_INITIALS || 'lz').toLowerCase();
        const cid = await getSecret(`${initials}-clio-v1-clientid`);
        const cs = await getSecret(`${initials}-clio-v1-clientsecret`);
        const rt = await getSecret(`${initials}-clio-v1-refreshtoken`);
        // Use the EU endpoint by default to match credentials
        const clioBase = process.env.CLIO_BASE || 'https://eu.app.clio.com';
        const tokenUrl = `${clioBase}/oauth/token?client_id=${cid}&client_secret=${cs}&grant_type=refresh_token&refresh_token=${rt}`;
        const tr = await fetch(tokenUrl, { method: 'POST' });
        if (!tr.ok) throw new Error(await tr.text());
        const { access_token } = await tr.json();
        const clioApiBase = process.env.CLIO_API_BASE || `${clioBase}/api/v4`;
        const resp = await fetch(`${clioApiBase}/matters/${id}`, {
            headers: { Authorization: `Bearer ${access_token}` }
        });
        if (!resp.ok) throw new Error(await resp.text());
        const data = await resp.json();
        res.json({ display_number: data?.data?.display_number || '' });
    } catch (err) {
        console.error('Matter proxy failed', err);
        res.status(500).json({ error: 'Failed to fetch matter' });
    }
});

module.exports = router;