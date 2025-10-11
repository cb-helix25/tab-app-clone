const { getSecret } = require('./server/utils/getSecret');
const teamLookup = require('./server/utils/teamLookup');
const createOrUpdate = require('./server/utils/createOrUpdate');
const { PRACTICE_AREAS } = require('./server/utils/clioConstants');

// Sample matter data for HLX-28145-99286 based on typical structure
const sampleFormData = {
    matter_details: {
        instruction_ref: "HLX-28145-99286",
        description: "Trust of Land (TOLATA) Advice",
        date_created: new Date().toISOString(),
        client_type: "Individual", 
        practice_area: "Trust of Land (TOLATA) Advice",
        folder_structure: "Default",
        dispute_value: "Less than £10k"
    },
    team_assignments: {
        supervising_partner: "RC",
        originating_solicitor_initials: "RC"
    },
    client_information: [{
        first_name: "Test",
        last_name: "Client",
        email: "test@example.com",
        phone: "01234567890",
        address: {
            street: "123 Test Street",
            city: "Test City",
            post_code: "TE1 2ST"
        },
        verification: {
            check_result: "PassportCard",
            check_id: "12345",
            check_expiry: "2030-12-31"
        }
    }]
};

async function createMatterManually() {
    try {
        console.log('Starting manual matter creation for HLX-28145-99286...');
        
        const initials = "RC";
        const { formData } = { formData: sampleFormData, initials };
        
        // 1. Refresh token
        console.log('Step 1: Getting Clio access token...');
        const lower = String(initials || '').toLowerCase();
        const cid = await getSecret(`${lower}-clio-v1-clientid`);
        const cs = await getSecret(`${lower}-clio-v1-clientsecret`);
        const rt = await getSecret(`${lower}-clio-v1-refreshtoken`);
        
        if (!cid || !cs || !rt) {
            throw new Error(`Missing Clio credentials for ${initials}`);
        }
        
        const tv = `https://eu.app.clio.com/oauth/token?client_id=${cid}&client_secret=${cs}&grant_type=refresh_token&refresh_token=${rt}`;
        const tr = await fetch(tv, { method: 'POST' });
        if (!tr.ok) throw new Error(await tr.text());
        const { access_token } = await tr.json();
        const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${access_token}` };
        console.log('✓ Got access token');

        // 2. Extract matter data
        const md = formData.matter_details;
        const { instruction_ref, description, practice_area, folder_structure, dispute_value } = md;
        
        console.log(`Step 2: Processing matter data for ${instruction_ref}...`);
        console.log(`Practice area: "${practice_area}"`);

        // 3. Build custom fields
        const ND_OPTIONS = {
            "Adjudication": 187069,
            "Residential Possession": 187072,
            "Employment": 187075,
            "Default": 187078
        };
        const VALUE_OPTIONS = {
            "Less than £10k": 244802,
            "£10k - £500k": 244805,
            "£501k - £1m": 244808,
            "£1m - £5m": 244811,
            "£5m - £20m": 244814,
            "Over £20m": 244817
        };
        
        const cf = [
            { value: formData.team_assignments.supervising_partner, custom_field: { id: 232574 } },
            ND_OPTIONS[folder_structure] && { value: ND_OPTIONS[folder_structure], custom_field: { id: 299746 } },
            VALUE_OPTIONS[dispute_value] && { value: VALUE_OPTIONS[dispute_value], custom_field: { id: 378566 } },
            { value: instruction_ref, custom_field: { id: 380722 } }
        ].filter(Boolean);

        // 4. Create/update client contact
        console.log('Step 3: Creating client contact...');
        const first = formData.client_information[0];
        if (!first) {
            throw new Error('Missing client details for contact');
        }
        
        const contactPayload = {
            type: 'Person',
            first_name: first.first_name || first.first || '',
            last_name: first.last_name || first.last || '',
            email_addresses: [
                {
                    name: 'Home',
                    address: first.email || '',
                    default_email: true
                }
            ],
            phone_numbers: first.phone ? [{ 
                name: 'Home', 
                number: first.phone, 
                default_number: true 
            }] : [],
            addresses: [
                {
                    name: 'Home',
                    street: first.address?.street || '',
                    city: first.address?.city || '',
                    postal_code: first.address?.post_code || '',
                    country: 'GB'
                }
            ]
        };
        
        const contactResult = await createOrUpdate(contactPayload, headers);
        const pid = contactResult.data.id;
        console.log(`✓ Client contact created/updated with ID: ${pid}`);

        // 5. Get team member Clio IDs
        console.log('Step 4: Looking up team member Clio IDs...');
        // Using hardcoded Clio IDs from team data
        const responsibleId = 143006; // RC's Clio ID
        const originatingId = 143006; // RC's Clio ID (same person)

        console.log(`✓ Responsible attorney ID: ${responsibleId}`);
        console.log(`✓ Originating attorney ID: ${originatingId}`);
        
        // 6. Find practice area ID with case-insensitive matching
        console.log('Step 5: Finding practice area ID...');
        const practiceAreaId = PRACTICE_AREAS[practice_area] || 
            Object.entries(PRACTICE_AREAS).find(([key]) => 
                key.toLowerCase() === practice_area.toLowerCase()
            )?.[1];
        
        if (!practiceAreaId) {
            console.error(`No practice area ID found for: "${practice_area}"`);
            console.error('Available practice areas:', Object.keys(PRACTICE_AREAS));
            throw new Error(`Invalid practice area: ${practice_area}`);
        }
        
        console.log(`✓ Practice area ID: ${practiceAreaId}`);
        
        // 7. Build matter payload
        const payload = {
            data: {
                billable: true,
                client: { id: pid },
                client_reference: instruction_ref,
                description,
                practice_area: { id: practiceAreaId },
                responsible_attorney: { id: responsibleId },
                originating_attorney: { id: originatingId },
                status: 'Open',
                custom_field_values: cf
            }
        };
        
        console.log('Step 6: Creating matter in Clio...');
        console.log('Matter payload:', JSON.stringify(payload, null, 2));

        // 8. Create matter
        const mr = await fetch('https://eu.app.clio.com/api/v4/matters.json', { 
            method: 'POST', 
            headers, 
            body: JSON.stringify(payload) 
        });
        
        if (!mr.ok) {
            const errorText = await mr.text();
            throw new Error(`Clio API error: ${mr.status} ${mr.statusText} - ${errorText}`);
        }
        
        const matter = (await mr.json()).data;
        console.log('✓ Matter created successfully!');
        console.log('Matter details:', JSON.stringify(matter, null, 2));
        
        return matter;
        
    } catch (error) {
        console.error('❌ Manual matter creation failed:', error.message);
        throw error;
    }
}

// Run the script
if (require.main === module) {
    createMatterManually()
        .then(() => {
            console.log('\n🎉 Matter creation completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Matter creation failed:', error);
            process.exit(1);
        });
}

module.exports = { createMatterManually };