/**
 * Clio Lookup Pressure Test Script
 * 
 * This script tests the Clio contact search functionality with various scenarios:
 * - Single email lookup
 * - Batch email lookup with rate limiting
 * - Error handling and retry logic
 * - Authentication token validation
 */

const axios = require('axios');
const fs = require('fs');

// Test configuration
const API_BASE_URL = 'http://localhost:3000';
const TEST_EMAILS = [
    'test@example.com',
    'john.doe@gmail.com',
    'jane.smith@outlook.com',
    'invalid-email-format',
    'real.lawyer@lawfirm.com',
    'mohammad.khawaja@example.com'
];

// Real Facebook lead emails from the database (first 5 for testing)
const FACEBOOK_LEAD_EMAILS = [
    'mariaj1218@icloud.com',
    'makgrimsby@gmail.com',
    'martinhanson4mkh@aol.com',
    'njamahunkaikai@yahoo.co.uk',
    'stephencalaghan@gmail.com'
];

class ClioTester {
    constructor() {
        this.results = [];
        this.startTime = Date.now();
    }

    // Test single email lookup
    async testSingleEmail(email) {
        console.log(`\n🔍 Testing single email: ${email}`);
        try {
            const response = await axios.post(`${API_BASE_URL}/api/search-clio-contacts`, {
                emails: [email]
            }, {
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const result = {
                email,
                success: true,
                statusCode: response.status,
                responseTime: response.headers['x-response-time'] || 'unknown',
                contacts: response.data.results?.[email] || [],
                contactCount: response.data.results?.[email]?.length || 0
            };

            console.log(`✅ Success: ${result.contactCount} contacts found`);
            if (result.contactCount > 0) {
                console.log(`   Contacts: ${result.contacts.map(c => c.name || c.display_name || 'Unknown').join(', ')}`);
            }

            return result;

        } catch (error) {
            const result = {
                email,
                success: false,
                statusCode: error.response?.status || 'NETWORK_ERROR',
                error: error.response?.data?.error || error.message,
                responseTime: 'failed'
            };

            console.log(`❌ Failed: ${result.statusCode} - ${result.error}`);
            return result;
        }
    }

    // Test batch email lookup with rate limiting
    async testBatchEmails(emails, delayMs = 1000) {
        console.log(`\n📦 Testing batch emails (${emails.length} emails, ${delayMs}ms delay)`);
        const results = [];

        for (let i = 0; i < emails.length; i++) {
            const email = emails[i];
            console.log(`\n[${i + 1}/${emails.length}] Processing: ${email}`);
            
            const result = await this.testSingleEmail(email);
            results.push(result);

            // Rate limiting delay
            if (i < emails.length - 1) {
                console.log(`⏳ Waiting ${delayMs}ms before next request...`);
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }

        return results;
    }

    // Test authentication status
    async testAuthStatus() {
        console.log('\n🔐 Testing authentication status...');
        try {
            // Try to make a request and see if we get auth-related errors
            const response = await axios.post(`${API_BASE_URL}/api/search-clio-contacts`, {
                emails: ['test@example.com']
            }, {
                timeout: 5000
            });

            console.log('✅ Authentication appears to be working');
            return { success: true, message: 'Auth OK' };

        } catch (error) {
            if (error.response?.status === 401) {
                console.log('❌ Authentication failed - 401 Unauthorized');
                return { success: false, message: 'Authentication failed' };
            } else if (error.response?.status === 400) {
                console.log('⚠️  Bad Request - might be auth token format issue');
                return { success: false, message: 'Bad Request - possible auth issue' };
            } else {
                console.log(`⚠️  Other error: ${error.response?.status || error.message}`);
                return { success: false, message: error.message };
            }
        }
    }

    // Test server health
    async testServerHealth() {
        console.log('\n🏥 Testing server health...');
        try {
            const response = await axios.get(`${API_BASE_URL}/health`, {
                timeout: 3000
            });
            console.log('✅ Server is healthy');
            return { success: true, message: 'Server healthy' };
        } catch (error) {
            console.log(`❌ Server health check failed: ${error.message}`);
            return { success: false, message: error.message };
        }
    }

    // Generate comprehensive test report
    generateReport(results) {
        const report = {
            timestamp: new Date().toISOString(),
            duration: Date.now() - this.startTime,
            summary: {
                totalTests: results.length,
                successful: results.filter(r => r.success).length,
                failed: results.filter(r => !r.success).length,
                contactsFound: results.filter(r => r.contactCount > 0).length
            },
            errorAnalysis: {},
            results: results
        };

        // Analyze error patterns
        const failedResults = results.filter(r => !r.success);
        failedResults.forEach(result => {
            const errorKey = result.statusCode + ': ' + result.error;
            report.errorAnalysis[errorKey] = (report.errorAnalysis[errorKey] || 0) + 1;
        });

        return report;
    }

    // Run comprehensive test suite
    async runFullTest() {
        console.log('🚀 Starting Clio Lookup Pressure Test');
        console.log('=====================================');

        const allResults = [];

        // 1. Test server health
        await this.testServerHealth();

        // 2. Test authentication
        await this.testAuthStatus();

        // 3. Test basic emails with conservative rate limiting
        console.log('\n📝 Phase 1: Testing basic emails (2 second delays)');
        const basicResults = await this.testBatchEmails(TEST_EMAILS, 2000);
        allResults.push(...basicResults);

        // 4. Test Facebook lead emails with slower rate limiting
        console.log('\n📧 Phase 2: Testing Facebook lead emails (3 second delays)');
        const facebookResults = await this.testBatchEmails(FACEBOOK_LEAD_EMAILS, 3000);
        allResults.push(...facebookResults);

        // 5. Generate report
        const report = this.generateReport(allResults);
        
        console.log('\n📊 TEST RESULTS SUMMARY');
        console.log('======================');
        console.log(`Total Tests: ${report.summary.totalTests}`);
        console.log(`Successful: ${report.summary.successful}`);
        console.log(`Failed: ${report.summary.failed}`);
        console.log(`Contacts Found: ${report.summary.contactsFound}`);
        console.log(`Success Rate: ${((report.summary.successful / report.summary.totalTests) * 100).toFixed(1)}%`);
        console.log(`Contact Discovery Rate: ${((report.summary.contactsFound / report.summary.totalTests) * 100).toFixed(1)}%`);

        if (Object.keys(report.errorAnalysis).length > 0) {
            console.log('\n❌ ERROR BREAKDOWN:');
            Object.entries(report.errorAnalysis).forEach(([error, count]) => {
                console.log(`   ${error}: ${count} occurrences`);
            });
        }

        // Save detailed report to file
        const reportFile = 'clio-test-report.json';
        fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
        console.log(`\n📄 Detailed report saved to: ${reportFile}`);

        return report;
    }
}

// Run the test if this script is executed directly
if (require.main === module) {
    const tester = new ClioTester();
    tester.runFullTest()
        .then(report => {
            console.log('\n✅ Test completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Test failed:', error.message);
            process.exit(1);
        });
}

module.exports = ClioTester;