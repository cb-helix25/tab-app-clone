const express = require('express');
const fetch = require('node-fetch');
const { DefaultAzureCredential } = require('@azure/identity');
const { SecretClient } = require('@azure/keyvault-secrets');
const router = express.Router();

// Set up Key Vault client
const credential = new DefaultAzureCredential();
const vaultUrl = process.env.KEY_VAULT_URL || 'https://helix-keys.vault.azure.net/';
const client = new SecretClient(vaultUrl, credential);

// Route: GET /api/enquiries
// Calls the fetchenquiries function app in the instructions VNet space
router.get('/', async (req, res) => {
  try {
    // Get the function key from Key Vault
    const secret = await client.getSecret('fetchenquiries-key');
    const functionCode = secret.value;
    
    // Forward any query parameters from the request
    const queryParams = new URLSearchParams(req.query);
    
    // Call the function app
    const functionUrl = 'https://your-instructions-function-app.azurewebsites.net/api/fetchenquiries';
    const url = `${functionUrl}?code=${functionCode}&${queryParams.toString()}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch enquiries data.' });
    }
    
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Error fetching enquiries data:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
