// Quick test to verify bundle route field name compatibility (camelCase + snake_case) and posted array handling.
const fetch = require('node-fetch');

async function testBundleRoute() {
    const port = process.env.BUNDLE_PORT || '8080';
    const baseUrl = `http://localhost:${port}/api/bundle`;

    // Use actual valid credentials from your environment
    const testData = {
        name: 'Test User',
        matterReference: 'TEST-001',
        bundleLink: 'https://example.com/test',
        deliveryOptions: { posted: ['Court (Judge) <judge@example.com>', 'Client (Main) <client@example.com>'] },
        ASANAClientID: process.env.ASANA_CLIENT_ID,
        ASANASecret: process.env.ASANA_CLIENT_SECRET,
        ASANARefreshToken: process.env.ASANA_REFRESH_TOKEN
    };

    const testDataSnakeCase = {
        name: 'Test User 2',
        matterReference: 'TEST-002',
        bundleLink: 'https://example.com/test2',
        deliveryOptions: { posted: ['Opponent (Solicitor) <opp@example.com>'] },
        ASANAClient_ID: process.env.ASANA_CLIENT_ID,
        ASANA_Secret: process.env.ASANA_CLIENT_SECRET,
        ASANARefresh_Token: process.env.ASANA_REFRESH_TOKEN
    };

    try {
        console.log('Testing camelCase fields against', baseUrl);
        const response1 = await fetch(baseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testData)
        });
        console.log('CamelCase test result:', response1.status, await response1.text());

        console.log('Testing snake_case fields against', baseUrl);
        const response2 = await fetch(baseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testDataSnakeCase)
        });
        console.log('Snake_case test result:', response2.status, await response2.text());
    } catch (error) {
        console.error('Test failed:', error);
    }
}

testBundleRoute();
