const express = require('express');
const { getSecret } = require('../utils/getSecret');

const router = express.Router();

router.get('/:enquiryId', async (req, res) => {
    const baseUrl =
        process.env.ENQUIRY_EMAILS_FUNC_BASE_URL ||
        'https://instructions-vnet-functions.azurewebsites.net/api/fetchEnquiryEmails';
    try {
        let code = process.env.ENQUIRY_EMAILS_FUNC_CODE;
        if (!code) {
            const secretName =
                process.env.ENQUIRY_EMAILS_FUNC_CODE_SECRET || 'fetchEnquiryEmails-code';
            code = await getSecret(secretName);
        }
        const url = `${baseUrl}?code=${code}&enquiryId=${encodeURIComponent(
            req.params.enquiryId
        )}`;
        const resp = await fetch(url);
        if (!resp.ok) {
            const text = await resp.text();
            console.error('Failed to fetch enquiry emails', text);
            return res.status(500).json({ error: 'Failed to fetch enquiry emails' });
        }
        const data = await resp.json();
        res.json(data);
    } catch (err) {
        console.error('Error fetching enquiry emails', err);
        res.status(500).json({ error: 'Failed to fetch enquiry emails' });
    }
});

module.exports = router;