const express = require('express');
const { getSecret } = require('../utils/getSecret');

const router = express.Router();

router.post('/', async (req, res) => {
    const baseUrl = process.env.MATTER_REQUEST_FUNC_BASE_URL ||
        'https://instructions-vnet-functions.azurewebsites.net/api/recordMatterRequest';
    try {
        let code = process.env.MATTER_REQUEST_FUNC_CODE;
        if (!code) {
            const secretName = process.env.MATTER_REQUEST_FUNC_CODE_SECRET || 'recordMatterRequest-code';
            code = await getSecret(secretName);
        }

        const url = `${baseUrl}?code=${code}`;
        const resp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body)
        });

        if (!resp.ok) {
            const text = await resp.text();
            console.error('Matter request failed', text);
            return res.status(500).json({ error: 'Matter request failed' });
        }

        res.json({ message: 'Matter request recorded; further IDs will be patched in later steps' });
    } catch (err) {
        console.error('Matter request error', err);
        res.status(500).json({ error: 'Matter request failed' });
    }
});

module.exports = router;
