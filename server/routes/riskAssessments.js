const express = require('express');
const { getSecret } = require('../utils/getSecret');

const router = express.Router();

router.post('/', async (req, res) => {
    const baseUrl =
        process.env.RISK_ASSESSMENT_FUNC_BASE_URL ||
        'https://instructions-vnet-functions.azurewebsites.net/api/recordRiskAssessment';
    try {
        let code = process.env.RISK_ASSESSMENT_FUNC_CODE;
        if (!code) {
            const secretName = process.env.RISK_ASSESSMENT_FUNC_CODE_SECRET || 'recordRiskAssessment-code';
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
            console.error('Risk assessment insert failed', text);
            return res.status(500).json({ error: 'Risk assessment insert failed' });
        }

        const data = await resp.json();
        res.json(data);
    } catch (err) {
        console.error('Risk assessment insert error', err);
        res.status(500).json({ error: 'Risk assessment insert failed' });
    }
});

module.exports = router;
