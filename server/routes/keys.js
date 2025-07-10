const express = require('express');
const { DefaultAzureCredential } = require('@azure/identity');
const { SecretClient } = require('@azure/keyvault-secrets');

const router = express.Router();

const credential = new DefaultAzureCredential();
const vaultUrl = process.env.KEY_VAULT_URL || 'https://helix-keys.vault.azure.net/';
const client = new SecretClient(vaultUrl, credential);

router.get('/:name', async (req, res) => {
    try {
        const name = req.params.name;
        const secret = await client.getSecret(name);
        res.json({ value: secret.value });
    } catch (err) {
        console.error('Failed to retrieve secret', err);
        res.status(500).json({ error: 'Failed to retrieve secret' });
    }
});

module.exports = router;