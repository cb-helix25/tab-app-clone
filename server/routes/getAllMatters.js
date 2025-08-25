const express = require('express');
const { DefaultAzureCredential } = require('@azure/identity');
const { SecretClient } = require('@azure/keyvault-secrets');

const router = express.Router();

// Set up Key Vault client for retrieving secrets
const credential = new DefaultAzureCredential();
const vaultUrl = process.env.KEY_VAULT_URL || 'https://helix-keys.vault.azure.net/';
const client = new SecretClient(vaultUrl, credential);

// Helper function to get function key from Key Vault (fallback)
async function getFunctionKey(functionName) {
    try {
        const secret = await client.getSecret(`${functionName}-code`);
        return secret.value;
    } catch (error) {
        console.error(`Failed to retrieve key for ${functionName}:`, error);
        throw error;
    }
}

/**
 * Route: GET /api/getAllMatters
 * 
 * Proxy route that forwards requests to the Azure Function at port 7072.
 * This retrieves ALL matters from the database (no user filtering).
 */
router.get('/', async (req, res) => {
  try {
    console.log('🔍 Express route: Proxying getAllMatters to Azure Function...');
    
    // Check if code is provided in query params (from frontend)
    let functionKey = req.query.code;
    
    // If no code provided, try to get from Key Vault
    if (!functionKey) {
        try {
            functionKey = await getFunctionKey('getAllMatters');
        } catch (error) {
            console.error('No function key available for getAllMatters');
            return res.status(500).json({ 
                error: 'Function key not found for getAllMatters', 
                details: error.message 
            });
        }
    }
    
    const azureFunctionUrl = `http://localhost:7072/api/getAllMatters?code=${functionKey}`;
    
    const response = await fetch(azureFunctionUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Azure Function responded with status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Express route: Successfully proxied getAllMatters, count:', Array.isArray(data) ? data.length : 'unknown');
    
    res.json(data);
  } catch (error) {
    console.error('❌ Express route: Error proxying getAllMatters:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve all matters',
      details: error.message 
    });
  }
});

module.exports = router;
