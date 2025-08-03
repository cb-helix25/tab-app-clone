const express = require('express');
const { DefaultAzureCredential } = require('@azure/identity');
const { SecretClient } = require('@azure/keyvault-secrets');
const router = express.Router();

// Set up Key Vault client
const credential = new DefaultAzureCredential();
const vaultUrl = process.env.KEY_VAULT_URL || 'https://helix-keys.vault.azure.net/';
const client = new SecretClient(vaultUrl, credential);

// Route: GET /api/enquiries
// Tries the new fetchEnquiriesData function first, falls back to the legacy fetchenquiries function
router.get('/', async (req, res) => {
  try {
    const queryParams = new URLSearchParams(req.query);

    // Attempt the new function if a base URL is configured
    const baseUrl = process.env.VNET_FUNCTION_BASE_URL;
    if (baseUrl) {
      try {
        const secret = await client.getSecret('fetchEnquiriesData-code');
        const functionCode = secret.value;
        const url = `${baseUrl}/api/fetchEnquiriesData?code=${functionCode}&${queryParams.toString()}`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          return res.json(data);
        }
        console.error(`VNet function call failed: ${response.status} ${response.statusText}`);
      } catch (err) {
        console.error('VNet function error:', err);
      }
      // Fall through to legacy if new function is not configured or fails
    }

    // Legacy instructions function
    const legacySecret = await client.getSecret('fetchenquiries-key');
    const legacyCode = legacySecret.value;
    const legacyUrl = 'https://your-instructions-function-app.azurewebsites.net/api/fetchenquiries';
    const legacyResponse = await fetch(`${legacyUrl}?code=${legacyCode}&${queryParams.toString()}`);
    if (!legacyResponse.ok) {
      return res.status(legacyResponse.status).json({ error: 'Failed to fetch enquiries data.' });
    }
    const legacyData = await legacyResponse.json();
    res.json(legacyData);
  } catch (err) {
    console.error('Error fetching enquiries data:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
