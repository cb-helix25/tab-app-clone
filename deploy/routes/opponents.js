const express = require('express');
const { getSecret } = require('../utils/getSecret');

const router = express.Router();

router.post('/', async (req, res) => {
    const baseUrl =
        process.env.OPPONENT_FUNC_BASE_URL ||
        'https://instructions-vnet-functions.azurewebsites.net/api/recordOpponents';
    try {
        let code = process.env.OPPONENT_FUNC_CODE;
        if (!code) {
            const secretName = process.env.OPPONENT_FUNC_CODE_SECRET || 'recordOpponents-code';
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
            console.error('Opponent update failed', text);
            return res.status(500).json({ error: 'Opponent update failed' });
        }

        const data = await resp.json();
        res.json(data);
    } catch (err) {
        console.error('Opponent update error', err);
        res.status(500).json({ error: 'Opponent update failed' });
    }
});

module.exports = router;
