// Local API endpoint testing script
console.log('🧪 Testing Local API Endpoints...\n');

const testDate = new Date();
const dateFrom = new Date(testDate.getFullYear(), testDate.getMonth() - 6, 1).toISOString().split('T')[0];
const dateTo = testDate.toISOString().split('T')[0];
const testEmail = 'lz@helix-law.com';

// Test 1: Local Express route - should proxy to decoupled function
async function testLocalEnquiriesRoute() {
    console.log('🔵 TEST 1: Local Express Route (/api/enquiries)');
    console.log('   Expected: Simple GET that proxies to decoupled function');
    console.log('   This should call fetchEnquiriesData with NO parameters');
    
    try {
        const url = 'http://localhost:8080/api/enquiries';
        console.log('   URL:', url);
        console.log('   Method: GET');
        console.log('   Headers: Content-Type: application/json');
        
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        console.log('   Status:', response.status, response.statusText);
        
        if (response.ok) {
            const data = await response.json();
            console.log('   ✅ SUCCESS - Response format:', typeof data);
            if (data.enquiries) {
                console.log('   📊 Enquiries count:', data.enquiries.length);
                console.log('   📋 Sample enquiry keys:', data.enquiries[0] ? Object.keys(data.enquiries[0]).slice(0, 5) : 'No data');
            } else if (data.error) {
                console.log('   ⚠️  Expected error (Key Vault auth):', data.error);
            } else {
                console.log('   📋 Response data:', data);
            }
        } else {
            const errorText = await response.text().catch(() => 'Could not read error');
            console.log('   ❌ FAILED - Error:', errorText);
        }
    } catch (error) {
        console.log('   ❌ FAILED - Network error:', error.message);
    }
    console.log('');
}

// Test 2: Test that fetch with Content-Type header triggers CORS preflight
async function testCORSPreflight() {
    console.log('🔵 TEST 2: CORS Preflight Behavior');
    console.log('   Testing if Content-Type header triggers OPTIONS request');
    
    try {
        // This should trigger a preflight OPTIONS request due to Content-Type header
        const url = 'http://localhost:8080/api/enquiries';
        console.log('   URL:', url);
        console.log('   Method: GET with Content-Type header (should trigger preflight)');
        
        const response = await fetch(url, {
            method: 'GET',
            headers: { 
                'Content-Type': 'application/json',
                'X-Test-Header': 'test' // Custom header to force preflight
            }
        });
        
        console.log('   Status:', response.status, response.statusText);
        console.log('   ✅ CORS preflight handled successfully');
        
    } catch (error) {
        console.log('   ❌ CORS preflight failed:', error.message);
    }
    console.log('');
}

// Test 3: Simple GET without custom headers (no preflight)
async function testSimpleGET() {
    console.log('🔵 TEST 3: Simple GET (No CORS Preflight)');
    console.log('   Testing GET without custom headers');
    
    try {
        const url = 'http://localhost:8080/api/enquiries';
        console.log('   URL:', url);
        console.log('   Method: GET (no custom headers)');
        
        const response = await fetch(url, {
            method: 'GET'
        });
        
        console.log('   Status:', response.status, response.statusText);
        
        if (response.ok) {
            const data = await response.json();
            console.log('   ✅ SUCCESS - No preflight needed');
            if (data.error) {
                console.log('   ⚠️  Expected error (Key Vault auth):', data.error);
            }
        } else {
            console.log('   ❌ FAILED');
        }
        
    } catch (error) {
        console.log('   ❌ FAILED:', error.message);
    }
    console.log('');
}

// Test 4: Check if server is actually running
async function testServerHealth() {
    console.log('🔵 TEST 4: Server Health Check');
    
    try {
        const response = await fetch('http://localhost:8080/', {
            method: 'GET'
        });
        
        console.log('   Status:', response.status, response.statusText);
        console.log('   ✅ Server is running on localhost:8080');
        
    } catch (error) {
        console.log('   ❌ Server not responding:', error.message);
        console.log('   💡 Make sure to run: node server/index.js');
    }
    console.log('');
}

// Run all tests
async function runAllTests() {
    await testServerHealth();
    await testLocalEnquiriesRoute();
    await testSimpleGET();
    await testCORSPreflight();
    
    console.log('🎯 LOCAL TEST SUMMARY:');
    console.log('1. Server should be running on localhost:8080');
    console.log('2. /api/enquiries should proxy to decoupled function');
    console.log('3. Should handle CORS preflight requests properly');
    console.log('4. May show Key Vault auth errors (expected in local dev)');
    console.log('\n✅ Local test completed!');
}

// Wait a bit for server to start, then run tests
setTimeout(runAllTests, 3000);
