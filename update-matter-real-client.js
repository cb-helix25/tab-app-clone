const { getSecret } = require('./server/utils/getSecret');
const createOrUpdate = require('./server/utils/createOrUpdate');

// Real client data from SQL database for HLX-28145-99286
const realClientData = {
    first_name: "Deborah",
    last_name: "Smith", 
    email: "debismith1971@outlook.com",
    phone: "+447768995130",
    address: {
        house_number: "4",
        street: "Britts Orchard",
        city: "Buxted",
        county: "East Sussex",
        post_code: "TN22 4NA",
        country: "United Kingdom"
    }
};

async function updateMatterWithRealClient() {
    try {
        console.log('Updating Clio matter with real client data...');
        
        const initials = "RC";
        const matterId = 12997420; // The matter we created
        
        // 1. Get access token
        console.log('Step 1: Getting Clio access token...');
        const lower = String(initials || '').toLowerCase();
        const cid = await getSecret(`${lower}-clio-v1-clientid`);
        const cs = await getSecret(`${lower}-clio-v1-clientsecret`);
        const rt = await getSecret(`${lower}-clio-v1-refreshtoken`);
        
        const tv = `https://eu.app.clio.com/oauth/token?client_id=${cid}&client_secret=${cs}&grant_type=refresh_token&refresh_token=${rt}`;
        const tr = await fetch(tv, { method: 'POST' });
        if (!tr.ok) throw new Error(await tr.text());
        const { access_token } = await tr.json();
        const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${access_token}` };
        console.log('✓ Got access token');

        // 2. Create new correct client contact
        console.log('Step 2: Creating correct client contact...');
        const correctContactPayload = {
            type: 'Person',
            first_name: realClientData.first_name,
            last_name: realClientData.last_name,
            email_addresses: [
                {
                    name: 'Home',
                    address: realClientData.email,
                    default_email: true
                }
            ],
            phone_numbers: realClientData.phone ? [{ 
                name: 'Home', 
                number: realClientData.phone, 
                default_number: true 
            }] : [],
            addresses: [
                {
                    name: 'Home',
                    street: `${realClientData.address.house_number} ${realClientData.address.street}`.trim(),
                    city: realClientData.address.city,
                    province: realClientData.address.county,
                    postal_code: realClientData.address.post_code,
                    country: 'GB'
                }
            ]
        };
        
        const contactResult = await createOrUpdate(correctContactPayload, headers);
        const newClientId = contactResult.data.id;
        console.log(`✓ New client contact created with ID: ${newClientId}`);

        // 3. Update the matter to use the new client
        console.log('Step 3: Updating matter to use correct client...');
        const updatePayload = {
            data: {
                client: { id: newClientId }
            }
        };
        
        const updateResponse = await fetch(`https://eu.app.clio.com/api/v4/matters/${matterId}.json`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(updatePayload)
        });
        
        if (!updateResponse.ok) {
            const errorText = await updateResponse.text();
            throw new Error(`Failed to update matter: ${updateResponse.status} ${updateResponse.statusText} - ${errorText}`);
        }
        
        const updatedMatter = await updateResponse.json();
        console.log('✓ Matter updated successfully!');
        console.log('Updated matter:', JSON.stringify(updatedMatter.data, null, 2));

        // 4. Optionally delete the old test client (contact ID 19062781)
        console.log('Step 4: Cleaning up test client contact...');
        try {
            const deleteResponse = await fetch('https://eu.app.clio.com/api/v4/contacts/19062781.json', {
                method: 'DELETE',
                headers
            });
            
            if (deleteResponse.ok) {
                console.log('✓ Old test client contact deleted');
            } else {
                console.log('⚠️ Could not delete old test contact (may be in use elsewhere)');
            }
        } catch (err) {
            console.log('⚠️ Could not delete old test contact:', err.message);
        }
        
        return updatedMatter.data;
        
    } catch (error) {
        console.error('❌ Matter update failed:', error.message);
        throw error;
    }
}

// Run the script
if (require.main === module) {
    updateMatterWithRealClient()
        .then(() => {
            console.log('\n🎉 Matter updated with real client data successfully!');
            console.log('\nReal Client: Deborah Smith');
            console.log('Email: debismith1971@outlook.com');
            console.log('Address: 4 Britts Orchard, Buxted, East Sussex, TN22 4NA');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Matter update failed:', error);
            process.exit(1);
        });
}

module.exports = { updateMatterWithRealClient };