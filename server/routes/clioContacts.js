const express = require('express');
const { getSecret } = require('../utils/getSecret');

const router = express.Router();

router.post('/', async (req, res) => {
    const { formData, initials } = req.body || {};
    if (!formData || !initials) {
        return res.status(400).json({ error: 'Missing data' });
    }

    try {
        const clientId = await getSecret(`${initials.toLowerCase()}-clio-v1-clientid`);
        const clientSecret = await getSecret(`${initials.toLowerCase()}-clio-v1-clientsecret`);
        const refreshToken = await getSecret(`${initials.toLowerCase()}-clio-v1-refreshtoken`);

        const tokenUrl = `https://eu.app.clio.com/oauth/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=refresh_token&refresh_token=${refreshToken}`;
        const tokenResp = await fetch(tokenUrl, { method: 'POST' });
        if (!tokenResp.ok) {
            const text = await tokenResp.text();
            console.error('Clio token refresh failed', text);
            return res.status(500).json({ error: 'Token refresh failed' });
        }
        const { access_token } = await tokenResp.json();
        const headers = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${access_token}`
        };

        const results = [];
        const clients = formData.client_information || [];
        const type = formData.matter_details?.client_type || 'Individual';

        async function createOrUpdate(contact) {
            const query = encodeURIComponent(contact.email);
            const lookupResp = await fetch(`https://eu.app.clio.com/api/v4/contacts.json?query=${query}`, { headers });
            if (!lookupResp.ok) throw new Error('Lookup failed');
            const lookupData = await lookupResp.json();
            let url = 'https://eu.app.clio.com/api/v4/contacts.json';
            let method = 'POST';
            if (lookupData.data && lookupData.data.length > 0) {
                url = `https://eu.app.clio.com/api/v4/contacts/${lookupData.data[0].id}.json`;
                method = 'PUT';
            }
            const resp = await fetch(url, {
                method,
                headers,
                body: JSON.stringify({ contact })
            });

            if (!resp.ok) {
                const text = await resp.text(); // read error body
                console.error('Clio contact create/update failed:', text); // log it
                throw new Error('Create/update failed');
            }

            return resp.json();
        }

        if (type === 'Individual') {
            for (const c of clients) {
                const contact = {
                    first_name: c.first_name,
                    last_name: c.last_name,
                    email: c.email,
                    type: 'Person'
                };
                results.push(await createOrUpdate(contact));
            }
        } else {
            // Company contact from first client with company_details
            const company = clients.find(c => c.company_details);
            if (company && company.company_details) {
                const contact = {
                    name: company.company_details.name,
                    email: company.email,
                    type: 'Company'
                };
                results.push(await createOrUpdate(contact));
            }
            for (const c of clients) {
                const contact = {
                    first_name: c.first_name,
                    last_name: c.last_name,
                    email: c.email,
                    type: 'Person'
                };
                results.push(await createOrUpdate(contact));
            }
        }

        res.json({ ok: true, results });
    } catch (err) {
        console.error('Clio contact error', err);
        res.status(500).json({ error: 'Failed to sync contacts' });
    }
});

module.exports = router;