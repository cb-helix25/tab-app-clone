const express = require('express');
const { getSecret } = require('../utils/getSecret');

const router = express.Router();

// Add a simple test endpoint first
router.get('/test', (req, res) => {
    res.json({ message: 'Clio client query route is working', timestamp: new Date().toISOString() });
});

router.get('/:clientId/:initials', async (req, res) => {
    const { clientId, initials } = req.params;
    
    if (!clientId || !initials) {
        return res.status(400).json({ error: 'Missing clientId or initials' });
    }

    try {
        // Fetch Clio credentials
        const clioClientId = await getSecret(`${initials.toLowerCase()}-clio-v1-clientid`);
        const clientSecret = await getSecret(`${initials.toLowerCase()}-clio-v1-clientsecret`);
        const refreshToken = await getSecret(`${initials.toLowerCase()}-clio-v1-refreshtoken`);

        // Refresh access token
        const tokenUrl = `https://eu.app.clio.com/oauth/token?client_id=${clioClientId}&client_secret=${clientSecret}&grant_type=refresh_token&refresh_token=${refreshToken}`;
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

        const clioApiBase = 'https://eu.app.clio.com/api/v4';

        // Query the specific client
        console.log(`Querying Clio client ID: ${clientId}`);
        const clientUrl = `${clioApiBase}/contacts/${clientId}?fields=id,type,prefix,name,first_name,middle_name,last_name,title,company,avatar,email_addresses{name,address,default_email},phone_numbers{name,number,default_number},date_of_birth,addresses{name,street,city,province,postal_code,country},custom_field_values{id,field_name,value}`;
        
        const clientResp = await fetch(clientUrl, { headers });
        if (!clientResp.ok) {
            const text = await clientResp.text();
            console.error('Clio client query failed', text);
            return res.status(404).json({ error: 'Client not found' });
        }
        
        const clientData = await clientResp.json();
        console.log('Clio client data:', JSON.stringify(clientData, null, 2));

        // Query matters for this client
        console.log(`Querying matters for client ID: ${clientId}`);
        const mattersUrl = `${clioApiBase}/matters?client_id=${clientId}&fields=id,display_number,description,status,created_at,updated_at,open_date,close_date,client{id,type,name,first_name,last_name},responsible_attorney{id,name},originating_attorney{id,name},practice_area{id,name}`;
        
        const mattersResp = await fetch(mattersUrl, { headers });
        if (!mattersResp.ok) {
            const text = await mattersResp.text();
            console.error('Clio matters query failed', text);
            return res.status(500).json({ error: 'Failed to query matters' });
        }
        
        const mattersData = await mattersResp.json();
        console.log('Clio matters data:', JSON.stringify(mattersData, null, 2));

        res.json({
            success: true,
            client: clientData.data,
            matters: mattersData.data || [],
            timestamp: new Date().toISOString()
        });

    } catch (err) {
        console.error('Clio client query error', err);
        res.status(500).json({ error: 'Failed to query Clio client', details: err.message });
    }
});

// Search endpoint for Clio clients
router.get('/search', async (req, res) => {
    const { term, initials } = req.query;
    
    if (!term || !initials) {
        return res.status(400).json({ error: 'Missing search term or initials' });
    }

    try {
        // Fetch Clio credentials
        const clioClientId = await getSecret(`${initials.toLowerCase()}-clio-v1-clientid`);
        const clientSecret = await getSecret(`${initials.toLowerCase()}-clio-v1-clientsecret`);
        const refreshToken = await getSecret(`${initials.toLowerCase()}-clio-v1-refreshtoken`);

        // Refresh access token
        const tokenUrl = `https://eu.app.clio.com/oauth/token?client_id=${clioClientId}&client_secret=${clientSecret}&grant_type=refresh_token&refresh_token=${refreshToken}`;
        const tokenResp = await fetch(tokenUrl, { method: 'POST' });
        if (!tokenResp.ok) {
            const text = await tokenResp.text();
            console.error('Clio token refresh failed', text);
            return res.status(500).json({ error: 'Token refresh failed' });
        }

        const tokenData = await tokenResp.json();
        const accessToken = tokenData.access_token;

        // Search for clients in Clio using the search term
        const searchUrl = `https://eu.app.clio.com/api/v4/contacts.json?fields=id,name,first_name,last_name,primary_email_address,primary_phone_number,type&query=${encodeURIComponent(term)}&limit=20`;
        
        const searchResp = await fetch(searchUrl, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!searchResp.ok) {
            const errorText = await searchResp.text();
            console.error('Clio search failed', errorText);
            return res.status(500).json({ error: 'Clio search failed' });
        }

        const searchData = await searchResp.json();
        
        // Filter for clients only and format the response
        const clients = (searchData.contacts || [])
            .filter(contact => contact.type === 'Person' || contact.type === 'Company')
            .map(contact => ({
                id: contact.id,
                name: contact.name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim(),
                first_name: contact.first_name,
                last_name: contact.last_name,
                primary_email_address: contact.primary_email_address,
                primary_phone_number: contact.primary_phone_number,
                type: contact.type
            }));

        res.json({
            clients,
            total: clients.length,
            searchTerm: term
        });

    } catch (err) {
        console.error('Clio client search error', err);
        res.status(500).json({ error: 'Failed to search Clio clients', details: err.message });
    }
});

module.exports = router;