const express = require('express');
const { DefaultAzureCredential } = require('@azure/identity');
const { SecretClient } = require('@azure/keyvault-secrets');
const router = express.Router();

// Set up Key Vault client
const credential = new DefaultAzureCredential();
const vaultUrl = process.env.KEY_VAULT_URL || 'https://helix-keys.vault.azure.net/';
const client = new SecretClient(vaultUrl, credential);

// Route: GET /api/enquiries
// Calls the fetchEnquiriesData function in the VNet space
router.get('/', async (req, res) => {
  try {
    // Get the function code from Key Vault
    const secret = await client.getSecret('fetchEnquiriesData-code');
    const functionCode = secret.value;
    
    // Forward any query parameters from the request
    const queryParams = new URLSearchParams(req.query);
    
    // Call the function app in VNet space
    const functionUrl = process.env.VNET_FUNCTION_BASE_URL || 'https://your-vnet-function-app.azurewebsites.net';
    const url = `${functionUrl}/api/fetchEnquiriesData?code=${functionCode}&${queryParams.toString()}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Function call failed: ${response.status} ${response.statusText}`);
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
