/**
 * Test claim functionality with real enquiry ID using lz@helix-law.com
 */

async function testRealClaim() {
    console.log('🧪 Testing Claim with Real Enquiry ID');
    console.log('====================================');
    
    // Configuration with real enquiry ID and lz@helix-law.com
    const CONFIG = {
        baseUrl: 'https://helix-keys-proxy.azurewebsites.net/api',
        path: 'claimEnquiry',
        code: process.env.REACT_APP_CLAIM_ENQUIRY_CODE || 'YOUR_FUNCTION_KEY_HERE',
        enquiryId: 'TEST-CLAIM-46792867-13FA-48A9-831D-0DF1EB7EB863',
        userEmail: 'lz@helix-law.com'
    };
    
    const url = `${CONFIG.baseUrl}/${CONFIG.path}?code=${CONFIG.code}`;
    
    const requestBody = {
        enquiryId: CONFIG.enquiryId,
        userEmail: CONFIG.userEmail
    };
    
    console.log('📤 Request Details:');
    console.log(`URL: ${url}`);
    console.log(`Enquiry ID: ${CONFIG.enquiryId}`);
    console.log(`User Email: ${CONFIG.userEmail}`);
    console.log('');
    
    try {
        console.log('⏳ Sending claim request...');
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        console.log(`📥 Response Status: ${response.status} ${response.statusText}`);
        
        const responseData = await response.json();
        
        console.log('📄 Response Data:');
        console.log(JSON.stringify(responseData, null, 2));
        
        if (response.ok && responseData.success) {
            console.log('🎉 SUCCESS: Enquiry claimed successfully!');
            console.log(`   ✅ Enquiry ID: ${responseData.enquiryId}`);
            console.log(`   ✅ Claimed by: ${responseData.claimedBy}`);
            console.log(`   ✅ Timestamp: ${responseData.timestamp}`);
            console.log('');
            console.log(`The enquiry Point_of_Contact has been updated to "${CONFIG.userEmail}"`);
        } else {
            console.log('❌ FAILED: Claim request failed');
            if (responseData.error) {
                console.log(`   - Error: ${responseData.error}`);
            }
            if (responseData.message) {
                console.log(`   - Message: ${responseData.message}`);
            }
            
            // Provide helpful guidance based on the error
            if (responseData.error === 'Enquiry not found or already claimed') {
                console.log('');
                console.log('💡 This could mean:');
                console.log('   1. The enquiry ID doesn\'t exist in the database');
                console.log('   2. The enquiry is already claimed (Point_of_Contact is not "team@helix-law.com")');
                console.log('   3. The enquiry exists but has a different ID format');
            }
        }
        
    } catch (error) {
        console.log('💥 ERROR: Network or parsing error');
        console.error('   - Details:', error.message);
        console.error('   - Full error:', error);
    }
    
    console.log('');
    console.log('🏁 Test completed');
}

// Export for browser console use
if (typeof window !== 'undefined') {
    window.testRealClaim = testRealClaim;
    console.log('Test function available as: testRealClaim()');
}

// Auto-run if this script is executed directly
if (typeof window === 'undefined') {
    testRealClaim();
}