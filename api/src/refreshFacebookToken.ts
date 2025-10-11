import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { DefaultAzureCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';

export async function refreshFacebookToken(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log('Starting Facebook token refresh process');

    try {
        // Get current token and app credentials from Key Vault
        const credential = new DefaultAzureCredential();
        const vaultUrl = "https://helix-keys.vault.azure.net/";
        const client = new SecretClient(vaultUrl, credential);

        // Get current token and app details
        const currentTokenSecret = await client.getSecret("facebook-marketing-hub-access-token");
        const appSecretSecret = await client.getSecret("facebook-marketing-hub-app-secret");
        
        const currentToken = currentTokenSecret.value;
        const appSecret = appSecretSecret.value;
        const appId = "3367675020051719"; // LeadHandler/Marketing Hub App ID

        if (!currentToken || !appSecret) {
            throw new Error("Missing required tokens in Key Vault");
        }

        // Call Facebook's token exchange endpoint
        const exchangeUrl = `https://graph.facebook.com/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${currentToken}`;
        
        context.log('Calling Facebook token exchange API');
        const response = await fetch(exchangeUrl);
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Facebook API error: ${response.status} - ${errorText}`);
        }

        const tokenData = await response.json() as { access_token: string; expires_in?: number };
        const newToken = tokenData.access_token;

        if (!newToken) {
            throw new Error("No access token received from Facebook");
        }

        // Update the token in Key Vault
        await client.setSecret("facebook-marketing-hub-access-token", newToken);
        
        context.log('Successfully refreshed Facebook Marketing Hub token');
        
        // Test the new token
        const testUrl = `https://graph.facebook.com/v20.0/act_3870546011665/insights?fields=spend&date_preset=yesterday&access_token=${newToken}`;
        const testResponse = await fetch(testUrl);
        
        const testResult = testResponse.ok ? 'Test successful' : `Test failed: ${testResponse.status}`;
        context.log(`Token test result: ${testResult}`);

        return {
            status: 200,
            jsonBody: {
                success: true,
                message: 'Facebook token refreshed successfully',
                testResult: testResult,
                expiresIn: tokenData.expires_in || 'Unknown',
                timestamp: new Date().toISOString()
            }
        };

    } catch (error) {
        context.log('Error refreshing Facebook token:', error);
        
        return {
            status: 500,
            jsonBody: {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            }
        };
    }
}

app.http('refreshFacebookToken', {
    methods: ['POST'],
    authLevel: 'function',
    handler: refreshFacebookToken
});