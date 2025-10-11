const { getSecret } = require('./server/utils/getSecret');

async function findRecentMatters() {
    try {
        console.log('Finding recent matters for RC...');
        
        const initials = "RC";
        
        // 1. Get access token
        const lower = String(initials || '').toLowerCase();
        const cid = await getSecret(`${lower}-clio-v1-clientid`);
        const cs = await getSecret(`${lower}-clio-v1-clientsecret`);
        const rt = await getSecret(`${lower}-clio-v1-refreshtoken`);
        
        const tv = `https://eu.app.clio.com/oauth/token?client_id=${cid}&client_secret=${cs}&grant_type=refresh_token&refresh_token=${rt}`;
        const tr = await fetch(tv, { method: 'POST' });
        if (!tr.ok) throw new Error(await tr.text());
        const { access_token } = await tr.json();
        const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${access_token}` };
        
        // 2. Get recent matters
        const response = await fetch('https://eu.app.clio.com/api/v4/matters.json?limit=10&order=created_at(desc)', {
            headers
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Recent matters:');
        
        data.data.forEach(matter => {
            console.log(`ID: ${matter.id}, Display: ${matter.display_number}, Client Ref: ${matter.client_reference}, Description: ${matter.description}`);
        });
        
        // Look for our matter specifically
        const ourMatter = data.data.find(m => m.client_reference === 'HLX-28145-99286');
        if (ourMatter) {
            console.log('\nFound our matter:');
            console.log(JSON.stringify(ourMatter, null, 2));
            return ourMatter;
        } else {
            console.log('\nOur matter not found in recent matters');
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

findRecentMatters();