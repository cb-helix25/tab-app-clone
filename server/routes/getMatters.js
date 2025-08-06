const express = require('express');
const { DefaultAzureCredential } = require('@azure/identity');
const { SecretClient } = require('@azure/keyvault-secrets');

const router = express.Router();

// Set up Key Vault client
const credential = new DefaultAzureCredential();
const vaultUrl = process.env.KEY_VAULT_URL || 'https://helix-keys.vault.azure.net/';
const client = new SecretClient(vaultUrl, credential);

// Route: POST /api/getMatters
// Proxies to the getMatters Azure Function so local dev can use real data
router.post('/', async (req, res) => {
    const { fullName } = req.body || {};
    if (!fullName) {
        return res.status(400).json({ error: 'fullName is required' });
    }

    try {
        let functionCode;
        try {
            const secret = await client.getSecret('getMatters-code');
            functionCode = secret.value;
        } catch (kvError) {
            console.error('Failed to retrieve getMatters-code from Key Vault', kvError.message);
            return res.status(500).json({ error: 'Failed to authenticate with getMatters function' });
        }

        const baseUrl = process.env.GET_MATTERS_FUNC_BASE_URL ||
            'https://instructions-vnet-functions.azurewebsites.net/api/getMatters';
        const url = `${baseUrl}?code=${functionCode}`;

        const resp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fullName })
        });

        if (!resp.ok) {
            const text = await resp.text();
            console.warn('getMatters function call failed', text);
            return res.status(resp.status).json({ error: 'Failed to fetch matters' });
        }

        const data = await resp.json();
        res.json(data);
    } catch (err) {
        console.error('Error calling getMatters function', err);
        res.status(500).json({ error: 'Failed to fetch matters' });
    }
});

module.exports = router;
