# Simple PowerShell script to demonstrate Clio client/matter linking workflow
param(
    [string]$InstructionRef = "HLX-27367-72547",
    [string]$Email = "testitem@gmail.com"
)

Write-Host "=== Clio Client/Matter Linking Workflow ===" -ForegroundColor Green
Write-Host "Instruction: $InstructionRef" -ForegroundColor Cyan
Write-Host "Email: $Email" -ForegroundColor Cyan

try {
    # Step 1: Verify Clio API access via existing endpoint
    Write-Host "`n--- Step 1: Verify Clio API Access ---" -ForegroundColor Magenta
    $testResponse = Invoke-WebRequest -Uri "http://localhost:7072/api/getMatterOverview" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"matterId": 12600808}' -TimeoutSec 10
    
    if ($testResponse.StatusCode -eq 200) {
        Write-Host "✓ Clio API access confirmed" -ForegroundColor Green
    } else {
        throw "Failed to access Clio API"
    }
    
    # Step 2: Search for client by email (simulation)
    Write-Host "`n--- Step 2: Search for Client by Email ---" -ForegroundColor Magenta
    Write-Host "Searching Clio for client with email: $Email" -ForegroundColor Yellow
    Write-Host "API Endpoint: https://eu.app.clio.com/api/v4/contacts.json" -ForegroundColor Gray
    Write-Host "Search Query: type=Person`&query=$Email" -ForegroundColor Gray
    
    # Simulate client not found
    $clientFound = $false
    if ($clientFound) {
        $clientId = 123456
        Write-Host "✓ Found existing client with ID: $clientId" -ForegroundColor Green
    } else {
        Write-Host "✗ Client not found, will need to create new client" -ForegroundColor Yellow
        
        # Step 3: Create new client
        Write-Host "`n--- Step 3: Create New Client ---" -ForegroundColor Magenta
        $clientData = @{
            name = "Mr Test Item"
            primary_email_address = $Email
            phone_numbers = @(@{
                name = "Mobile"
                number = "+447123456789"
                default_number = $true
            })
            type = "Person"
            addresses = @(@{
                name = "Home"
                street = "123 Test Street"
                city = "Test City"
                province = "Test County"
                postal_code = "TE5 7ST"
                country = "United Kingdom"
            })
        }
        
        Write-Host "Client data to create:" -ForegroundColor Gray
        Write-Host ($clientData | ConvertTo-Json -Depth 3) -ForegroundColor Gray
        
        # Simulate successful client creation
        $clientId = 999999
        Write-Host "✓ Created new client with ID: $clientId" -ForegroundColor Green
    }
    
    # Step 4: Create new matter
    Write-Host "`n--- Step 4: Create New Matter ---" -ForegroundColor Magenta
    $matterData = @{
        client = @{ id = $clientId }
        description = "Property Purchase - Test Instruction $InstructionRef"
        practice_area = @{ name = "Real Estate" }
        status = "Open"
        open_date = (Get-Date).ToString("yyyy-MM-dd")
    }
    
    Write-Host "Matter data to create:" -ForegroundColor Gray
    Write-Host ($matterData | ConvertTo-Json -Depth 3) -ForegroundColor Gray
    
    # Simulate successful matter creation
    $matterId = 888888
    $matterNumber = "THE V10795-00999"
    Write-Host "✓ Created new matter: $matterNumber (ID: $matterId)" -ForegroundColor Green
    
    # Step 5: Update instruction database
    Write-Host "`n--- Step 5: Update Instruction Database ---" -ForegroundColor Magenta
    $updateQuery = "UPDATE Instructions SET ClientId = $clientId, MatterId = $matterId, UpdatedDate = GETDATE() WHERE InstructionRef = '$InstructionRef'"
    Write-Host "SQL Update Query:" -ForegroundColor Gray
    Write-Host $updateQuery -ForegroundColor White
    
    Write-Host "✓ Would update instruction $InstructionRef with ClientId: $clientId, MatterId: $matterId" -ForegroundColor Green
    
    # Final verification - simulate checking the updated record
    Write-Host "`n--- Step 6: Verify Update ---" -ForegroundColor Magenta
    Write-Host "Verifying instruction now shows:" -ForegroundColor Yellow
    Write-Host "  ClientId: $clientId" -ForegroundColor White
    Write-Host "  MatterId: $matterId" -ForegroundColor White
    Write-Host "  Matter Number: $matterNumber" -ForegroundColor White
    Write-Host "  Workbench will now show 'Matter Linked: Yes' and 'Client Details: Confirmed'" -ForegroundColor Green
    
    # Summary
    Write-Host "`n=== WORKFLOW COMPLETE ===" -ForegroundColor Green
    Write-Host "Successfully linked instruction $InstructionRef to Clio client and matter" -ForegroundColor White
    
    Write-Host "`n--- Actual API Calls Needed ---" -ForegroundColor Yellow
    Write-Host "1. POST to https://eu.app.clio.com/api/v4/contacts.json (search by email)" -ForegroundColor Gray
    Write-Host "2. POST to https://eu.app.clio.com/api/v4/contacts.json (create client if not found)" -ForegroundColor Gray
    Write-Host "3. POST to https://eu.app.clio.com/api/v4/matters.json (create matter)" -ForegroundColor Gray
    Write-Host "4. UPDATE Instructions table with ClientId and MatterId" -ForegroundColor Gray
    
} catch {
    Write-Host "`n✗ Workflow failed: $_" -ForegroundColor Red
    Write-Host "Check API access and credentials" -ForegroundColor Yellow
}

Write-Host "`n--- Ready to implement actual Clio API calls? ---" -ForegroundColor Cyan
Write-Host "The workflow above shows exactly what needs to happen to fix HLX-27367-72547" -ForegroundColor White