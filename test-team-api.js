// Quick test script to check the team data API
const fetch = require('node-fetch');

const DEFAULT_PROXY_BASE_URL = "https://helix-keys-proxy.azurewebsites.net/api";

async function testTeamDataAPI() {
    // You'll need to replace this with the actual code value
    const code = process.env.REACT_APP_GET_TEAM_DATA_CODE || "test-code";
    const url = `${DEFAULT_PROXY_BASE_URL}/getTeamData?code=${code}`;
    
    console.log('Testing API:', url);
    
    try {
        const response = await fetch(url, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        });
        
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        
        if (!response.ok) {
            console.error('API Error:', response.statusText);
            return;
        }
        
        const data = await response.json();
        console.log('Data received:', data?.length, 'team members');
        console.log('First member:', data?.[0]);
        console.log('Sample statuses:', data?.slice(0, 5).map(m => ({ name: m['Full Name'], status: m.status })));
        
    } catch (error) {
        console.error('Fetch error:', error.message);
    }
}

testTeamDataAPI();