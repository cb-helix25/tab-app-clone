/**
 * Simple Clio Pressure Test
 * Mirrors the exact usage pattern from MetaMetricsReport
 */

const axios = require('axios');

// Use the same emails that are failing in the logs
const FACEBOOK_EMAILS = [
    'mariaj1218@icloud.com',
    'makgrimsby@gmail.com', 
    'martinhanson4mkh@aol.com',
    'njamahunkaikai@yahoo.co.uk',
    'stephencalaghan@gmail.com',
    'aiwazyounis8@gmail.com',
    'bobbyojla@gmail.com',
    'chiezus@yahoo.com',
    'richloveamissah@gmail.com',
    'freetruthjustice@protonmail.com'
];

async function testClioReliability() {
    console.log('🔍 Clio Reliability Pressure Test');
    console.log('==================================');
    console.log(`Testing ${FACEBOOK_EMAILS.length} Facebook lead emails`);
    
    let totalTests = 0;
    let successfulTests = 0;
    let rateLimited = 0;
    let badRequests = 0;
    let networkErrors = 0;
    
    for (let i = 0; i < FACEBOOK_EMAILS.length; i++) {
        const email = FACEBOOK_EMAILS[i];
        totalTests++;
        
        console.log(`\n[${i + 1}/${FACEBOOK_EMAILS.length}] Testing: ${email}`);
        
        try {
            const startTime = Date.now();
            
            const response = await axios.post('http://localhost:3000/api/search-clio-contacts', {
                emails: [email]
            }, {
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const duration = Date.now() - startTime;
            successfulTests++;
            
            const result = response.data;
            const hasContact = result.results[email] !== null;
            
            console.log(`✅ Success (${duration}ms) - Contact found: ${hasContact ? 'YES' : 'NO'}`);
            
            if (hasContact) {
                const contact = result.results[email];
                console.log(`   Name: ${contact.name}`);
                console.log(`   Matters: ${contact.matters?.length || 0}`);
            }
            
        } catch (error) {
            const duration = Date.now() - startTime;
            
            if (error.response) {
                const status = error.response.status;
                console.log(`❌ HTTP ${status} (${duration}ms) - ${error.response.statusText}`);
                
                if (status === 429) {
                    rateLimited++;
                    console.log('   Rate limited - too many requests');
                } else if (status === 400) {
                    badRequests++;
                    console.log('   Bad request - malformed request');
                } else {
                    console.log(`   Unexpected HTTP error: ${status}`);
                }
            } else if (error.code === 'ECONNREFUSED') {
                networkErrors++;
                console.log(`❌ Connection refused - server not available`);
            } else if (error.code === 'TIMEOUT') {
                networkErrors++;
                console.log(`❌ Timeout - request took too long`);
            } else {
                networkErrors++;
                console.log(`❌ Network error: ${error.message}`);
            }
        }
        
        // Rate limiting: wait between requests
        if (i < FACEBOOK_EMAILS.length - 1) {
            const delay = 2000; // 2 second delay
            console.log(`⏳ Waiting ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    
    console.log('\n📊 FINAL RESULTS');
    console.log('================');
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Successful: ${successfulTests} (${((successfulTests/totalTests)*100).toFixed(1)}%)`);
    console.log(`Rate Limited (429): ${rateLimited}`);
    console.log(`Bad Requests (400): ${badRequests}`);
    console.log(`Network Errors: ${networkErrors}`);
    console.log(`Success Rate: ${((successfulTests/totalTests)*100).toFixed(1)}%`);
    
    if (successfulTests === totalTests) {
        console.log('\n🎉 All tests passed! Clio integration is reliable.');
    } else {
        console.log('\n⚠️  Some tests failed. Review the errors above.');
        
        if (rateLimited > 0) {
            console.log('💡 Tip: Increase delays between requests to avoid rate limiting');
        }
        if (badRequests > 0) {
            console.log('💡 Tip: Check email format validation and URL encoding');
        }
        if (networkErrors > 0) {
            console.log('💡 Tip: Check server connectivity and timeout settings');
        }
    }
}

// Run the test
if (require.main === module) {
    testClioReliability()
        .then(() => process.exit(0))
        .catch(error => {
            console.error('Test failed:', error);
            process.exit(1);
        });
}

module.exports = testClioReliability;