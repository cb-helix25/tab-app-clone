// Test script to verify the fixed API endpoints
console.log('🧪 Testing Fixed API Endpoints...\n');

const testDate = new Date();
const dateFrom = new Date(testDate.getFullYear(), testDate.getMonth() - 6, 1).toISOString().split('T')[0];
const dateTo = testDate.toISOString().split('T')[0];
const testEmail = 'lz@helix-law.com';

// Test 1: NEW decoupled function (simple GET, no params)
async function testNewDecoupledFunction() {
    console.log('🔵 TEST 1: NEW Decoupled Function (fetchEnquiriesData)');
    console.log('   Expected: Simple GET with no parameters to return ALL data');
    
    try {
        const url = 'https://instructions-vnet-functions.azurewebsites.net/api/fetchEnquiriesData';
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
            console.log('   ✅ SUCCESS - Data received:', data.enquiries ? data.enquiries.length : 'unknown count', 'enquiries');
        } else {
            const errorText = await response.text().catch(() => 'Could not read error');
            console.log('   ❌ FAILED - Error:', errorText);
        }
    } catch (error) {
        console.log('   ❌ FAILED - Network error:', error.message);
    }
    console.log('');
}

// Test 2: LEGACY function (POST with email, dateFrom, dateTo)
async function testLegacyFunction() {
    console.log('🔵 TEST 2: LEGACY Function (getEnquiries)');
    console.log('   Expected: POST with JSON body containing email, dateFrom, dateTo');
    
    try {
        const url = 'https://helix-functions.azurewebsites.net/api/getEnquiries?code=Nm5b_roocFL4d3_sc9E5QI2OrG_5zljGlx9asutElHtzAzFuB7OoLA%3D%3D';
        const body = {
            email: testEmail,
            dateFrom: dateFrom,
            dateTo: dateTo
        };
        
        console.log('   URL:', url.replace(/code=[^&]+/, 'code=[REDACTED]'));
        console.log('   Method: POST');
        console.log('   Headers: Content-Type: application/json');
        console.log('   Body:', body);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        
        console.log('   Status:', response.status, response.statusText);
        
        if (response.ok) {
            const data = await response.json();
            const count = Array.isArray(data) ? data.length : 'unknown count';
            console.log('   ✅ SUCCESS - Data received:', count, 'enquiries');
        } else {
            const errorText = await response.text().catch(() => 'Could not read error');
            console.log('   ❌ FAILED - Error:', errorText);
        }
    } catch (error) {
        console.log('   ❌ FAILED - Network error:', error.message);
    }
    console.log('');
}

// Test 3: Local Express route (should proxy to decoupled function)
async function testLocalRoute() {
    console.log('🔵 TEST 3: Local Express Route (/api/enquiries)');
    console.log('   Expected: Simple GET that proxies to decoupled function');
    
    try {
        const url = 'http://localhost:53000/api/enquiries';
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
            console.log('   ✅ SUCCESS - Data received:', data.enquiries ? data.enquiries.length : 'unknown count', 'enquiries');
        } else {
            const errorText = await response.text().catch(() => 'Could not read error');
            console.log('   ❌ FAILED - Error:', errorText);
        }
    } catch (error) {
        console.log('   ❌ FAILED - Network/Server error:', error.message);
        console.log('   (This is expected if local server is not running)');
    }
    console.log('');
}

// Run all tests
async function runAllTests() {
    await testNewDecoupledFunction();
    await testLegacyFunction();
    await testLocalRoute();
    
    console.log('🎯 SUMMARY:');
    console.log('1. NEW function should accept simple GET and return ALL data');
    console.log('2. LEGACY function should accept POST with email/dates and return filtered data');
    console.log('3. Local route should proxy to NEW function when server is running');
    console.log('\n✅ Test completed!');
}

runAllTests().catch(console.error);
