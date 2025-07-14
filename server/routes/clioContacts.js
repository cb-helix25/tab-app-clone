const express = require('express');
const { getSecret } = require('../utils/getSecret');

const router = express.Router();

router.post('/', async (req, res) => {
    const { formData, initials } = req.body || {};
    if (!formData || !initials) {
        return res.status(400).json({ error: 'Missing data' });
    }

    try {
        // Fetch Clio credentials
        const clientId = await getSecret(`${initials.toLowerCase()}-clio-v1-clientid`);
        const clientSecret = await getSecret(`${initials.toLowerCase()}-clio-v1-clientsecret`);
        const refreshToken = await getSecret(`${initials.toLowerCase()}-clio-v1-refreshtoken`);

        // Refresh access token
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

        // Map an individual client to Clio Person payload
        function mapPerson(client) {
            return {
                first_name: client.first_name || client.first || '',
                last_name: client.last_name || client.last || '',
                prefix: client.prefix || null,
                date_of_birth: client.date_of_birth || null,
                email_addresses: [
                    { name: 'Home', address: client.email || '', default_email: true }
                ],
                phone_numbers: client.best_number
                    ? [{ name: 'Home', number: client.best_number, default_number: true }]
                    : [],
                addresses: [
                    {
                        name: 'Home',
                        street: `${client.address.house_number || ''} ${client.address.street || ''}`.trim(),
                        city: client.address.city || '',
                        province: client.address.county || '',
                        postal_code: client.address.post_code || '',
                        country: client.address.country || ''
                    }
                ],
                custom_field_values: [
                    { value: client.poid_id, custom_field: { id: 380728 } },
                    { value: client.verification.check_expiry, custom_field: { id: 235702 } },
                    { id: 'picklist-32009977', field_name: 'ID Type', value: client.verification.check_result === 'DriversLicense' ? 142570 : 142567 }
                ]
            };
        }

        // Map a company client to Clio Company payload
        function mapCompany(company, nameOverride) {
            const base = {
                name: nameOverride || company.company_details?.name || '',
                email_addresses: company.email
                    ? [{ name: 'Work', address: company.email, default_email: true }]
                    : [],
                phone_numbers: company.best_number
                    ? [{ name: 'Work', number: company.best_number, default_number: true }]
                    : [],
                addresses: company.company_details?.address
                    ? [{
                        name: 'Work',
                        street: `${company.company_details.address.house_number || ''} ${company.company_details.address.street || ''}`.trim(),
                        city: company.company_details.address.city || '',
                        province: company.company_details.address.county || '',
                        postal_code: company.company_details.address.post_code || '',
                        country: company.company_details.address.country || ''
                    }]
                    : []
            };

            const customFieldValues = [];
            if (company.poid_id) customFieldValues.push({ value: company.poid_id, custom_field: { id: 380728 } });
            if (company.verification?.check_expiry) customFieldValues.push({ value: company.verification.check_expiry, custom_field: { id: 235702 } });
            const idType = company.verification?.check_result === 'DriversLicense' ? 142570 : 142567;
            customFieldValues.push({ id: 'picklist-32009977', field_name: 'ID Type', value: idType });
            if (company.company_details?.number) customFieldValues.push({ value: company.company_details.number, custom_field: { id: 368788 } });

            return { ...base, custom_field_values: customFieldValues };
        }

        // Create or update a contact in Clio
        async function createOrUpdate(contact) {
            const query = encodeURIComponent(contact.email_addresses[0]?.address || '');
            const lookupResp = await fetch(`https://eu.app.clio.com/api/v4/contacts.json?query=${query}`, { headers });
            if (!lookupResp.ok) throw new Error('Lookup failed');
            const lookupData = await lookupResp.json();

            let url = 'https://eu.app.clio.com/api/v4/contacts.json';
            let method = 'POST';
            if (lookupData.data?.length) {
                url = `https://eu.app.clio.com/api/v4/contacts/${lookupData.data[0].id}.json`;
                method = 'PUT';
            }

            const { type: contactType, ...attributes } = contact;
            const payload = { data: { type: contactType, attributes } };
            console.log('Sending to Clio:', JSON.stringify(payload, null, 2));

            const resp = await fetch(url, { method, headers, body: JSON.stringify(payload) });
            if (!resp.ok) {
                const text = await resp.text();
                console.error('Clio contact create/update failed:', text);
                throw new Error('Create/update failed');
            }
            return resp.json();
        }

        // Main logic
        if (type === 'Individual') {
            for (const c of clients) {
                results.push(await createOrUpdate({ ...mapPerson(c), type: 'Person' }));
            }
        } else if (type === 'Company') {
            const comp = clients.find(c => c.company_details) || clients[0];
            results.push(await createOrUpdate({ ...mapCompany(comp), type: 'Company' }));
            for (const c of clients) {
                results.push(await createOrUpdate({ ...mapPerson(c), type: 'Person' }));
            }
        } else {
            for (const c of clients) {
                results.push(await createOrUpdate({ ...mapPerson(c), type: 'Person' }));
            }
        }

        res.json({ ok: true, results });
    } catch (err) {
        console.error('Clio contact error', err);
        res.status(500).json({ error: 'Failed to sync contacts' });
    }
});

module.exports = router;
