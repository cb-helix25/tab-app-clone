// Test the React proxy on port 3000
console.log('🧪 Testing React Dev Server Proxy...\n');

async function testReactProxy() {
    console.log('🔵 Testing React Dev Server Proxy (localhost:3000 -> localhost:8080)');
    console.log('   This tests the proxy configuration in package.json');
    
    try {
        const url = 'http://localhost:3000/api/enquiries';
        console.log('   URL:', url);
        console.log('   Method: GET');
        
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        console.log('   Status:', response.status, response.statusText);
        
        if (response.ok) {
            const data = await response.json();
            console.log('   ✅ SUCCESS - Proxy working!');
            console.log('   📊 Enquiries count:', data.enquiries ? data.enquiries.length : 'No enquiries');
            console.log('   📋 Data format:', typeof data);
        } else {
            const errorText = await response.text().catch(() => 'Could not read error');
            console.log('   ❌ FAILED - Error:', errorText);
        }
    } catch (error) {
        console.log('   ❌ FAILED - Network error:', error.message);
        console.log('   💡 Make sure React dev server is running on port 3000');
    }
    console.log('');
}

async function testReactServer() {
    console.log('🔵 Testing React Dev Server Health');
    
    try {
        const response = await fetch('http://localhost:3000/', {
            method: 'GET'
        });
        
        console.log('   Status:', response.status, response.statusText);
        console.log('   ✅ React dev server is running');
        
    } catch (error) {
        console.log('   ❌ React dev server not responding:', error.message);
    }
    console.log('');
}

async function runProxyTests() {
    await testReactServer();
    await testReactProxy();
    
    console.log('🎯 PROXY TEST SUMMARY:');
    console.log('1. React dev server should proxy /api/* requests to localhost:8080');
    console.log('2. This simulates how the app will work in development');
    console.log('3. Frontend calls /api/enquiries, which proxies to Express server');
    console.log('\n✅ Proxy test completed!');
}

setTimeout(runProxyTests, 1000);
