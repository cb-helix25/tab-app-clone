// Run this in browser console to test the team data API
// Copy and paste this into your browser's developer console

async function testTeamAPI() {
    const proxyBaseUrl = "https://helix-keys-proxy.azurewebsites.net/api";
    
    // Try to get the code from current page's environment
    const code = "your-api-code-here"; // You need to replace this
    
    const url = `${proxyBaseUrl}/getTeamData?code=${code}`;
    
    console.log('🧪 Testing Team Data API...');
    console.log('📍 URL:', url);
    
    try {
        const response = await fetch(url, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        });
        
        console.log('📊 Status:', response.status);
        console.log('✅ Response OK:', response.ok);
        
        if (!response.ok) {
            console.error('❌ API Error:', response.statusText);
            return { success: false, error: response.statusText };
        }
        
        const data = await response.json();
        console.log('👥 Team members received:', data?.length);
        console.log('👤 First member:', data?.[0]);
        
        // Check status distribution
        const activeCount = data?.filter(m => m.status?.toLowerCase() === 'active').length || 0;
        const inactiveCount = data?.filter(m => m.status?.toLowerCase() === 'inactive').length || 0;
        
        console.log('📈 Active members:', activeCount);
        console.log('📉 Inactive members:', inactiveCount);
        console.log('📋 Sample members with status:');
        
        data?.slice(0, 5).forEach(member => {
            console.log(`  - ${member['Full Name'] || member.First + ' ' + member.Last}: ${member.status}`);
        });
        
        return { success: true, data, activeCount, inactiveCount };
        
    } catch (error) {
        console.error('💥 Fetch error:', error);
        return { success: false, error: error.message };
    }
}

// Run the test
testTeamAPI();