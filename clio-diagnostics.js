/**
 * Quick Clio Diagnostic Script
 * Tests basic connectivity and authentication
 */

const axios = require('axios');

async function testClioConnectivity() {
    console.log('🔍 Testing Clio connectivity...');
    
    try {
        // Test 1: Simple connectivity test
        console.log('\n1. Testing basic server response...');
        const healthResponse = await axios.get('http://localhost:3000/health', { timeout: 5000 });
        console.log('✅ Server is responsive');
        
        // Test 2: Test with a single, simple email
        console.log('\n2. Testing single email lookup...');
        const testEmail = 'test@example.com';
        
        const response = await axios.post('http://localhost:3000/api/search-clio-contacts', {
            emails: [testEmail]
        }, {
            timeout: 15000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`✅ Request successful: ${response.status}`);
        console.log(`📧 Searched for: ${testEmail}`);
        console.log(`📊 Response:`, JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        console.log('❌ Error details:');
        console.log(`Status: ${error.response?.status || 'No status'}`);
        console.log(`Message: ${error.response?.data?.error || error.message}`);
        
        if (error.response?.data) {
            console.log('Full response:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

// Test 3: Validate email formats
function testEmailFormats() {
    console.log('\n3. Testing problematic email formats...');
    
    const problematicEmails = [
        'mariaj1218@icloud.com',
        'makgrimsby@gmail.com',
        'test@example.com'
    ];
    
    problematicEmails.forEach(email => {
        console.log(`Email: ${email}`);
        console.log(`Encoded: ${encodeURIComponent(email)}`);
        console.log(`URL Safe: ${email.replace(/[^a-zA-Z0-9@._-]/g, '')}`);
        console.log('---');
    });
}

async function runDiagnostics() {
    console.log('🏥 Clio API Diagnostics');
    console.log('=======================');
    
    testEmailFormats();
    await testClioConnectivity();
    
    console.log('\n✅ Diagnostics complete');
}

if (require.main === module) {
    runDiagnostics().catch(console.error);
}

module.exports = { testClioConnectivity, testEmailFormats };