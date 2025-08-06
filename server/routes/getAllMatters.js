const express = require('express');
const { DefaultAzureCredential } = require('@azure/identity');
const { SecretClient } = require('@azure/keyvault-secrets');

const router = express.Router();

// Set up Key Vault client
const credential = new DefaultAzureCredential();
const vaultUrl = process.env.KEY_VAULT_URL || 'https://helix-keys.vault.azure.net/';
const client = new SecretClient(vaultUrl, credential);

// Route: GET /api/getAllMatters
// Proxies to the getAllMatters Azure Function so local dev can use real data
router.get('/', async (_req, res) => {
    try {
        let functionCode;
        try {
            const secret = await client.getSecret('getAllMatters-code');
            functionCode = secret.value;
        } catch (kvError) {
            console.error('Failed to retrieve getAllMatters-code from Key Vault', kvError.message);
            return res.status(500).json({ error: 'Failed to authenticate with getAllMatters function' });
        }

        const baseUrl = process.env.GET_ALL_MATTERS_FUNC_BASE_URL ||
            'https://instructions-vnet-functions.azurewebsites.net/api/getAllMatters';
        const url = `${baseUrl}?code=${functionCode}`;

        const resp = await fetch(url);
        if (!resp.ok) {
            const text = await resp.text();
            console.warn('getAllMatters function call failed', text);
            return res.status(resp.status).json({ error: 'Failed to fetch matters' });
        }

        const data = await resp.json();
        res.json(data);
    } catch (err) {
        console.error('Error calling getAllMatters function', err);
        res.status(500).json({ error: 'Failed to fetch matters' });
    }
});

module.exports = router;
