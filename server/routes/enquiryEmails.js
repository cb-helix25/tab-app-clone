const express = require('express');
const { getSecret } = require('../utils/getSecret');
const { append, redact } = require('../utils/opLog');

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
        append({ type: 'email', action: 'fetchEnquiryEmails', status: 'started', enquiryId: req.params.enquiryId, url: redact(url) });
        const resp = await fetch(url);
        if (!resp.ok) {
            const text = await resp.text();
            console.error('Failed to fetch enquiry emails', text);
            append({ type: 'email', action: 'fetchEnquiryEmails', status: 'error', enquiryId: req.params.enquiryId, httpStatus: resp.status });
            return res.status(500).json({ error: 'Failed to fetch enquiry emails' });
        }
        const data = await resp.json();
        append({ type: 'email', action: 'fetchEnquiryEmails', status: 'success', enquiryId: req.params.enquiryId });
        res.json(data);
    } catch (err) {
        console.error('Error fetching enquiry emails', err);
        append({ type: 'email', action: 'fetchEnquiryEmails', status: 'error', enquiryId: req.params.enquiryId, error: String(err) });
        res.status(500).json({ error: 'Failed to fetch enquiry emails' });
    }
});

module.exports = router;