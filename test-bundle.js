// Quick test to verify bundle route field name compatibility
const fetch = require('node-fetch');

async function testBundleRoute() {
    const testData = {
        name: "Test User",
        matterReference: "TEST-001",
        bundleLink: "https://example.com/test",
        deliveryOptions: { posted: true },
        // Test with camelCase fields
        ASANAClientID: "test-client-id",
        ASANASecret: "test-secret",
        ASANARefreshToken: "test-refresh-token"
    };

    const testDataSnakeCase = {
        name: "Test User 2",
        matterReference: "TEST-002", 
        bundleLink: "https://example.com/test2",
        deliveryOptions: { posted: true },
        // Test with snake_case fields
        ASANAClient_ID: "test-client-id-2",
        ASANA_Secret: "test-secret-2",
        ASANARefresh_Token: "test-refresh-token-2"
    };

    try {
        console.log('Testing camelCase fields...');
        const response1 = await fetch('http://localhost:53000/api/bundle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testData)
        });
        console.log('CamelCase test result:', response1.status, await response1.text());

        console.log('Testing snake_case fields...');
        const response2 = await fetch('http://localhost:53000/api/bundle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testDataSnakeCase)
        });
        console.log('Snake_case test result:', response2.status, await response2.text());

    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

// Wait a bit for server to start, then run test
setTimeout(testBundleRoute, 5000);
