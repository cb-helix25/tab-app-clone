const express = require('express');
const { getSecret } = require('../utils/getSecret');

const router = express.Router();

router.post('/', async (req, res) => {
    const { formData, initials, contactIds = [], companyId } = req.body || {};
    if (!formData || !initials || contactIds.length === 0) {
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

        const primaryId = companyId || contactIds[0];
        const matterPayload = {
            data: {
                type: 'matters',
                attributes: {
                    description: formData.matter_details?.description || '',
                    practice_area: formData.matter_details?.practice_area || '',
                    status: 'Open'
                },
                relationships: {
                    client: { data: { type: 'contacts', id: primaryId } }
                }
            }
        };

        const resp = await fetch('https://eu.app.clio.com/api/v4/matters', {
            method: 'POST',
            headers,
            body: JSON.stringify(matterPayload)
        });

        if (!resp.ok) {
            const text = await resp.text();
            console.error('Clio matter create failed', text);
            return res.status(500).json({ error: 'Matter creation failed' });
        }

        const data = await resp.json();
        const matterId = data.data?.id;

        if (matterId && contactIds.length > 1) {
            for (const id of contactIds.slice(1)) {
                const relPayload = {
                    data: {
                        type: 'relationships',
                        attributes: { relationship_type: 'Related Client' },
                        relationships: {
                            primary: { data: { type: 'matters', id: matterId } },
                            related: { data: { type: 'contacts', id } }
                        }
                    }
                };
                const relResp = await fetch('https://eu.app.clio.com/api/v4/relationships', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(relPayload)
                });
                if (!relResp.ok) {
                    console.error(`Failed to link contact ${id}`, await relResp.text());
                }
            }
        }

        res.json({ ok: true, matterId });
    } catch (err) {
        console.error('Clio matter error', err);
        res.status(500).json({ error: 'Failed to create matter' });
    }
});

module.exports = router;
