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

        function mapPerson(client) {
            return {
                first_name: client.first_name || client.first || '',
                last_name: client.last_name || client.last || '',
                prefix: client.prefix || null,
                date_of_birth: client.date_of_birth || null,
                email_addresses: [
                    {
                        name: 'Home',
                        address: client.email || '',
                        default_email: true
                    }
                ],
                phone_numbers: client.best_number
                    ? [
                        {
                            name: 'Home',
                            number: client.best_number,
                            default_number: true
                        }
                    ]
                    : [],
                addresses: [
                    {
                        name: 'Home',
                        street: `${client.house_building_number || ''} ${client.street || ''}`.trim(),
                        city: client.city || '',
                        province: client.county || '',
                        postal_code: client.post_code || '',
                        country: client.country || ''
                    }
                ]
            };
        }

        function mapCompany(company, nameOverride) {
            return {
                name: nameOverride || company.company_details?.name || company.company_name || '',
                email_addresses: company.email
                    ? [
                        {
                            name: 'Work',
                            address: company.email,
                            default_email: true
                        }
                    ]
                    : [],
                phone_numbers: company.best_number
                    ? [
                        {
                            name: 'Work',
                            number: company.best_number,
                            default_number: true
                        }
                    ]
                    : [],
                addresses: company.company_house_building_number || company.company_street
                    ? [
                        {
                            name: 'Work',
                            street: `${company.company_house_building_number || ''} ${company.company_street || ''}`.trim(),
                            city: company.company_city || '',
                            province: company.company_county || '',
                            postal_code: company.company_post_code || '',
                            country: company.company_country || ''
                        }
                    ]
                    : []
            };
        }

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

            const { type: contactType, ...rest } = contact;

            const payload = {
                data: {
                    type: contactType,
                    attributes: rest
                }
            };

            console.log('Sending to Clio:', JSON.stringify(payload, null, 2));

            const resp = await fetch(url, {
                method,
                headers,
                body: JSON.stringify(payload)
            });

            if (!resp.ok) {
                const text = await resp.text();
                console.error('Clio contact create/update failed:', text);
                throw new Error('Create/update failed');
            }

            return resp.json();
        }


        if (type === 'Individual') {
            for (const c of clients) {
                results.push(await createOrUpdate({ ...mapPerson(c), type: 'Person', email: c.email }));
            }
        } else if (type === 'Company') {
            const companyClient = clients.find(c => c.company_details) || clients[0];
            if (companyClient) {
                results.push(await createOrUpdate({ ...mapCompany(companyClient), type: 'Company', email: companyClient.email }));
            }
            for (const c of clients) {
                results.push(await createOrUpdate({ ...mapPerson(c), type: 'Person', email: c.email }));
            }
        } else if (type === 'Multiple Individuals') {
            const name = formData.matter_details?.client_as_on_file || 'Multiple Clients';
            const firstClient = clients[0];
            if (firstClient) {
                results.push(await createOrUpdate({ ...mapCompany(firstClient, name), type: 'Company', email: firstClient.email }));
            }
            for (const c of clients) {
                results.push(await createOrUpdate({ ...mapPerson(c), type: 'Person', email: c.email }));
            }
        } else {
            for (const c of clients) {
                results.push(await createOrUpdate({ ...mapPerson(c), type: 'Person', email: c.email }));
            }
        }

        res.json({ ok: true, results });
    } catch (err) {
        console.error('Clio contact error', err);
        res.status(500).json({ error: 'Failed to sync contacts' });
    }
});

module.exports = router;