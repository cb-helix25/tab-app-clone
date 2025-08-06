const express = require('express');
const { getSecret } = require('../utils/getSecret');

const router = express.Router();

router.post('/', async (req, res) => {
    const baseUrl =
        process.env.PITCH_SECTIONS_FUNC_BASE_URL ||
        'https://instructions-vnet-functions.azurewebsites.net/api/recordPitchSections';
    try {
        let code = process.env.PITCH_SECTIONS_FUNC_CODE;
        if (!code) {
            const secretName =
                process.env.PITCH_SECTIONS_FUNC_CODE_SECRET || 'recordPitchSections-code';
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
            console.error('Pitch save failed', text);
            return res.status(500).json({ error: 'Pitch save failed' });
        }

        const data = await resp.json();
        res.json(data);
    } catch (err) {
        console.error('Pitch save error', err);
        res.status(500).json({ error: 'Pitch save failed' });
    }
});

module.exports = router;
