# PowerShell script to patch HLX-27367-72547 with Clio client/matter data
# This script demonstrates the complete workflow for linking instruction to Clio

param(
    [string]$InstructionRef = "HLX-27367-72547",
    [string]$Email = "testitem@gmail.com"
)

Write-Host "=== Clio Client/Matter Linking Workflow ===" -ForegroundColor Green
Write-Host "Instruction: $InstructionRef" -ForegroundColor Cyan
Write-Host "Email: $Email" -ForegroundColor Cyan

# Function to get Clio access token via our API
function Get-ClioAccessToken {
    try {
        # Use our existing getMatterOverview endpoint to get a token (it includes token refresh)
        $testResponse = Invoke-WebRequest -Uri "http://localhost:7072/api/getMatterOverview" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"matterId": 12600808}' -TimeoutSec 10
        
        if ($testResponse.StatusCode -eq 200) {
            Write-Host "✓ Clio API access confirmed" -ForegroundColor Green
            return $true
        }
    }
    catch {
        Write-Host "✗ Failed to access Clio API: $_" -ForegroundColor Red
        return $false
    }
}

# Function to search for client by email using direct Clio API call
function Search-ClioClientByEmail {
    param([string]$ClientEmail)
    
    Write-Host "Searching for client with email: $ClientEmail" -ForegroundColor Yellow
    
    # This would be the actual Clio API call structure
    # For now, we'll simulate the search logic
    
    $searchUrl = "https://eu.app.clio.com/api/v4/contacts.json"
    $searchParams = @{
        "type" = "Person"
        "query" = $ClientEmail
        "fields" = "id,name,primary_email_address,phone_numbers,addresses"
    }
    
    Write-Host "Search URL: $searchUrl" -ForegroundColor Gray
    Write-Host "Search Parameters: $($searchParams | ConvertTo-Json -Compress)" -ForegroundColor Gray
    
    # Simulate response - in real implementation this would be actual API call
    return @{
        found = $false
        client_id = $null
        name = "Mr Test Item"
        message = "Client search simulation - would query Clio API"
    }
}

# Function to create new client in Clio
function New-ClioClient {
    param(
        [string]$Name,
        [string]$Email,
        [string]$Phone
    )
    
    Write-Host "Creating new Clio client: $Name" -ForegroundColor Yellow
    
    $clientData = @{
        "name" = $Name
        "primary_email_address" = $Email
        "phone_numbers" = @(@{
            "name" = "Mobile"
            "number" = $Phone
            "default_number" = $true
        })
        "type" = "Person"
    }
    
    Write-Host "Client Data: $($clientData | ConvertTo-Json -Depth 3)" -ForegroundColor Gray
    
    # Simulate client creation - would be actual API call to Clio
    return @{
        success = $true
        client_id = 999999  # Simulated new client ID
        message = "Client creation simulation - would create in Clio"
    }
}

# Function to create new matter for client
function New-ClioMatter {
    param(
        [int]$ClientId,
        [string]$Description = "Property Transaction"
    )
    
    Write-Host "Creating new matter for client ID: $ClientId" -ForegroundColor Yellow
    
    $matterData = @{
        "client" = @{ "id" = $ClientId }
        "description" = $Description
        "practice_area" = @{ "name" = "Real Estate" }
        "status" = "Open"
    }
    
    Write-Host "Matter Data: $($matterData | ConvertTo-Json -Depth 3)" -ForegroundColor Gray
    
    # Simulate matter creation - would be actual API call to Clio
    return @{
        success = $true
        matter_id = 888888  # Simulated new matter ID
        display_number = "ABC V10795-00002"
        message = "Matter creation simulation - would create in Clio"
    }
}

# Function to update instruction in database
function Update-InstructionDatabase {
    param(
        [string]$InstructionRef,
        [int]$ClientId,
        [int]$MatterId
    )
    
    Write-Host "Updating instruction $InstructionRef in database" -ForegroundColor Yellow
    
    # This would be the actual SQL update
    $updateQuery = "UPDATE Instructions SET ClientId = $ClientId, MatterId = $MatterId, UpdatedDate = GETDATE() WHERE InstructionRef = '$InstructionRef'"
    
    Write-Host "SQL Update Query:" -ForegroundColor Gray
    Write-Host $updateQuery -ForegroundColor Gray
    
    return @{
        success = $true
        rows_affected = 1
        message = "Database update simulation - would update Instructions table"
    }
}

# Main workflow execution
try {
    # Step 1: Verify Clio API access
    Write-Host "`n--- Step 1: Verify Clio API Access ---" -ForegroundColor Magenta
    $hasAccess = Get-ClioAccessToken
    if (-not $hasAccess) {
        throw "Cannot access Clio API"
    }
    
    # Step 2: Search for existing client
    Write-Host "`n--- Step 2: Search for Existing Client ---" -ForegroundColor Magenta
    $searchResult = Search-ClioClientByEmail -ClientEmail $Email
    Write-Host "Search Result: $($searchResult.message)" -ForegroundColor Gray
    
    $clientId = $null
    
    if ($searchResult.found) {
        Write-Host "✓ Found existing client with ID: $($searchResult.client_id)" -ForegroundColor Green
        $clientId = $searchResult.client_id
    } else {
        # Step 3: Create new client if not found
        Write-Host "`n--- Step 3: Create New Client ---" -ForegroundColor Magenta
        $createResult = New-ClioClient -Name "Mr Test Item" -Email $Email -Phone "+447123456789"
        Write-Host "Creation Result: $($createResult.message)" -ForegroundColor Gray
        
        if ($createResult.success) {
            Write-Host "✓ Created new client with ID: $($createResult.client_id)" -ForegroundColor Green
            $clientId = $createResult.client_id
        } else {
            throw "Failed to create client"
        }
    }
    
    # Step 4: Create new matter for the client
    Write-Host "`n--- Step 4: Create New Matter ---" -ForegroundColor Magenta
    $matterResult = New-ClioMatter -ClientId $clientId -Description "Property Purchase - Test Instruction"
    Write-Host "Matter Result: $($matterResult.message)" -ForegroundColor Gray
    
    if ($matterResult.success) {
        Write-Host "✓ Created new matter: $($matterResult.display_number) (ID: $($matterResult.matter_id))" -ForegroundColor Green
    } else {
        throw "Failed to create matter"
    }
    
    # Step 5: Update instruction database
    Write-Host "`n--- Step 5: Update Instruction Database ---" -ForegroundColor Magenta
    $updateResult = Update-InstructionDatabase -InstructionRef $InstructionRef -ClientId $clientId -MatterId $matterResult.matter_id
    Write-Host "Update Result: $($updateResult.message)" -ForegroundColor Gray
    
    if ($updateResult.success) {
        Write-Host "✓ Updated instruction $InstructionRef with ClientId: $clientId, MatterId: $($matterResult.matter_id)" -ForegroundColor Green
    }
    
    # Summary
    Write-Host "`n=== WORKFLOW COMPLETE ===" -ForegroundColor Green
    Write-Host "Instruction: $InstructionRef" -ForegroundColor White
    Write-Host "Client ID: $clientId" -ForegroundColor White
    Write-Host "Matter ID: $($matterResult.matter_id)" -ForegroundColor White
    Write-Host "Matter Number: $($matterResult.display_number)" -ForegroundColor White
    
    Write-Host "`n--- Next Steps for Real Implementation ---" -ForegroundColor Yellow
    Write-Host "1. Replace simulation functions with actual Clio API calls" -ForegroundColor Gray
    Write-Host "2. Add proper error handling and retry logic" -ForegroundColor Gray
    Write-Host "3. Implement actual database update using Azure SQL" -ForegroundColor Gray
    Write-Host "4. Add logging and audit trail" -ForegroundColor Gray
    Write-Host "5. Test with real Clio credentials and data" -ForegroundColor Gray
    
}
catch {
    Write-Host "`n✗ Workflow failed: $_" -ForegroundColor Red
    Write-Host "Check API access and credentials" -ForegroundColor Yellow
}