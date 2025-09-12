// Debug helper for matter opening functionality
// Add this to your browser console to test the matter opening process

window.debugMatterOpening = function() {
    console.log('=== Matter Opening Debug ===');
    
    // Test data from your JSON
    const testFormData = {
        matter_details: {
            instruction_ref: "HLX-27706-88848",
            client_id: null,
            matter_ref: null,
            stage: "proof-of-id-complete",
            date_created: null,
            client_type: "Individual",
            area_of_work: "Construction",
            practice_area: "Contract Dispute",
            description: "",
            client_as_on_file: null,
            dispute_value: "£10k - £500k",
            folder_structure: "Default / Commercial",
            budget_required: "No",
            budget_amount: null,
            budget_notify_threshold: null,
            budget_notify_users: []
        },
        team_assignments: {
            fee_earner: "Christopher Smith",
            supervising_partner: "JW",
            originating_solicitor: "Christopher Smith",
            requesting_user: "Chris",
            fee_earner_initials: "CS",
            originating_solicitor_initials: "CS"
        },
        client_information: [
            {
                poid_id: "36",
                first_name: "Stacy",
                last_name: "Maphula",
                email: "stacy_irish@hotmail.com",
                best_number: "+447852001476",
                type: "individual",
                nationality: "United Kingdom",
                date_of_birth: "1983-09-15T00:00:00.000Z",
                address: {
                    house_number: "62 Foxon Lane ",
                    street: "Caterham ",
                    city: "Caterham ",
                    county: "Surrey ",
                    post_code: "CR3 5SB",
                    country: "United Kingdom"
                }
            }
        ],
        source_details: {
            source: "search",
            referrer_name: null
        },
        opponent_details: {
            opponent: {
                title: "AI",
                first_name: "A. Placeholder",
                last_name: "Entity",
                is_company: false,
                company_name: "Phantom Entity Ltd",
                email: "ae@hlx.place",
                phone: "00000000000"
            }
        }
    };
    
    console.log('1. Testing form data structure:', testFormData);
    
    // Test each processing step
    async function testProcessingSteps() {
        const steps = [
            {
                name: 'Matter Request',
                url: '/api/matter-requests',
                payload: {
                    instructionRef: testFormData.matter_details?.instruction_ref,
                    clientType: testFormData.matter_details?.client_type,
                    description: testFormData.matter_details?.description || "Test matter description",
                    practiceArea: testFormData.matter_details?.practice_area,
                    value: testFormData.matter_details?.dispute_value,
                    responsibleSolicitor: testFormData.team_assignments?.fee_earner,
                    originatingSolicitor: testFormData.team_assignments?.originating_solicitor,
                    supervisingPartner: testFormData.team_assignments?.supervising_partner,
                    source: testFormData.source_details?.source,
                    createdBy: "CS"
                }
            }
        ];
        
        for (const step of steps) {
            try {
                console.log(`2. Testing ${step.name}...`);
                console.log('Payload:', step.payload);
                
                const response = await fetch(step.url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(step.payload)
                });
                
                if (response.ok) {
                    const result = await response.json();
                    console.log(`✓ ${step.name} successful:`, result);
                } else {
                    const error = await response.text();
                    console.error(`✗ ${step.name} failed:`, response.status, error);
                }
            } catch (error) {
                console.error(`✗ ${step.name} error:`, error.message);
            }
        }
    }
    
    // Test token refresh endpoints
    async function testTokenRefresh() {
        console.log('3. Testing token refresh...');
        
        try {
            const acResponse = await fetch('/api/refresh/activecampaign', { method: 'POST' });
            console.log('ActiveCampaign refresh:', acResponse.ok ? '✓' : '✗', acResponse.status);
            
            const clioResponse = await fetch('/api/refresh/clio/CS', { method: 'POST' });
            console.log('Clio refresh:', clioResponse.ok ? '✓' : '✗', clioResponse.status);
            
            const asanaResponse = await fetch('/api/refresh/asana', { method: 'POST' });
            console.log('Asana refresh:', asanaResponse.ok ? '✓' : '✗', asanaResponse.status);
        } catch (error) {
            console.error('Token refresh error:', error.message);
        }
    }
    
    // Run all tests
    testProcessingSteps();
    testTokenRefresh();
    
    console.log('=== Debug Complete ===');
    console.log('Check the network tab for detailed error information');
};

// Usage: Run debugMatterOpening() in browser console
console.log('Matter opening debug helper loaded. Run debugMatterOpening() to test.');