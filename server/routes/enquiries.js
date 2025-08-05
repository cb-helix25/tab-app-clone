const express = require('express');
const { DefaultAzureCredential } = require('@azure/identity');
const { SecretClient } = require('@azure/keyvault-secrets');
const router = express.Router();

// Set up Key Vault client
const credential = new DefaultAzureCredential();
const vaultUrl = process.env.KEY_VAULT_URL || 'https://helix-keys.vault.azure.net/';
const client = new SecretClient(vaultUrl, credential);

// Route: GET /api/enquiries
// Calls the external fetchEnquiriesData function (decoupled function in private vnet)
router.get('/', async (req, res) => {
  try {
    console.log('🔵 NEW ENQUIRIES ROUTE CALLED for decoupled function');
    console.log('🔍 Query parameters:', req.query);

    // Try to get the function code from Key Vault
    let functionCode;
    try {
      const secret = await client.getSecret('fetchEnquiriesData-code');
      functionCode = secret.value;
      console.log('✅ Successfully retrieved function code from Key Vault');
    } catch (kvError) {
      console.error('❌ Failed to get function code from Key Vault:', kvError.message);
      // For local development, you might want to use a hardcoded value or env var
      // Uncomment the line below if you have the code in your local env:
      // functionCode = process.env.FETCH_ENQUIRIES_DATA_CODE;
      return res.status(500).json({ 
        enquiries: [], 
        count: 0, 
        error: 'Failed to authenticate with external function' 
      });
    }

    // Build the URL to the external function - remove date filters to avoid column issues
    const baseUrl = 'https://instructions-vnet-functions.azurewebsites.net/api/fetchEnquiriesData';
    const queryParams = new URLSearchParams();
    queryParams.append('code', functionCode);
    // Don't pass date parameters to avoid Touchpoint_Date column error
    const url = `${baseUrl}?${queryParams.toString()}`;

    console.log('🌐 Calling external function URL (all data):', url.replace(functionCode, '[REDACTED]'));

    // Call the external function
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`❌ Function call failed: ${response.status} ${response.statusText}`, errorText);
      // Return empty data instead of failing - don't block app
      return res.status(200).json({ enquiries: [], count: 0, error: 'Data temporarily unavailable' });
    }

    const data = await response.json();
    console.log('✅ Successfully fetched enquiries data, count:', data.enquiries ? data.enquiries.length : data.length || 'unknown');
    res.json(data);
  } catch (err) {
    console.warn('❌ Error calling fetchEnquiriesData (non-blocking):', err.message);
    console.error('Full error:', err);
    // Return empty data instead of 500 error - don't block app
    res.status(200).json({ enquiries: [], count: 0, error: 'Data temporarily unavailable' });
  }
});

module.exports = router;
