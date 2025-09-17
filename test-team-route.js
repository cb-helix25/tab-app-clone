// Test team data API directly in browser console
// Copy and paste this into your browser developer console

async function testTeamDataRoute() {
    console.log('🧪 Testing /api/team-data route...');
    
    try {
        const response = await fetch('/api/team-data', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        console.log('📡 Status:', response.status, response.statusText);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error response:', errorText);
            return { success: false, error: `${response.status}: ${errorText}` };
        }
        
        const data = await response.json();
        console.log('✅ Success! Retrieved', data?.length, 'team members');
        
        const activeCount = data?.filter(m => m.status?.toLowerCase() === 'active').length || 0;
        const inactiveCount = data?.filter(m => m.status?.toLowerCase() === 'inactive').length || 0;
        
        console.log('👥 Active:', activeCount, '🚫 Inactive:', inactiveCount);
        console.log('📋 First 3 members:', data?.slice(0, 3));
        
        return { success: true, data, activeCount, inactiveCount };
        
    } catch (error) {
        console.error('💥 Fetch error:', error);
        return { success: false, error: error.message };
    }
}

// Run the test
testTeamDataRoute();