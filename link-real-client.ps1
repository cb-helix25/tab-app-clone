# Link Real Client to Instruction HLX-27367-72547
# Using actual Clio Client ID: 19951675

Write-Host "=== LINKING REAL CLIENT TO INSTRUCTION ===" -ForegroundColor Cyan
Write-Host ""

# Real client details from Clio contact page
$realClientId = "19951675"
$instructionRef = "HLX-27367-72547"

Write-Host "Step 1: Verify client exists in Clio..." -ForegroundColor Yellow
try {
    $contactResponse = Invoke-WebRequest -Uri "http://localhost:7072/api/getContactById" -Method Post -Headers @{"Content-Type"="application/json"} -Body (@{contactId=$realClientId} | ConvertTo-Json)
    
    if ($contactResponse.StatusCode -eq 200) {
        $contactData = $contactResponse.Content | ConvertFrom-Json
        Write-Host "✓ Client found in Clio:" -ForegroundColor Green
        Write-Host "  Name: $($contactData.data.name)" -ForegroundColor Gray
        Write-Host "  Email: $($contactData.data.primary_email_address)" -ForegroundColor Gray
        Write-Host "  Client ID: $($contactData.data.id)" -ForegroundColor Gray
    }
} catch {
    Write-Host "✗ Error checking client: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Trying alternative API endpoint..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 2: Get client's matters..." -ForegroundColor Yellow
try {
    $mattersResponse = Invoke-WebRequest -Uri "http://localhost:7072/api/getClientMatters" -Method Post -Headers @{"Content-Type"="application/json"} -Body (@{clientId=$realClientId} | ConvertTo-Json)
    
    if ($mattersResponse.StatusCode -eq 200) {
        $mattersData = $mattersResponse.Content | ConvertFrom-Json
        Write-Host "✓ Found $($mattersData.data.length) matters for client" -ForegroundColor Green
        
        if ($mattersData.data.length -gt 0) {
            $firstMatter = $mattersData.data[0]
            Write-Host "  First matter: $($firstMatter.display_number) - $($firstMatter.description)" -ForegroundColor Gray
            Write-Host "  Matter ID: $($firstMatter.id)" -ForegroundColor Gray
            
            # Use first available matter for linking
            $realMatterId = $firstMatter.id
        }
    }
} catch {
    Write-Host "✗ Error getting matters: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Will link client only, without specific matter" -ForegroundColor Yellow
    $realMatterId = $null
}

Write-Host ""
Write-Host "Step 3: Update instruction in database..." -ForegroundColor Yellow

# Connect to database and update
$serverName = "instructions.database.windows.net"
$databaseName = "instructions"

try {
    # Build SQL update command with real values
    if ($realMatterId) {
        $sql = "UPDATE Instructions SET ClientId = '$realClientId', MatterId = '$realMatterId', LastUpdated = GETDATE() WHERE InstructionRef = '$instructionRef'"
        Write-Host "Updating with ClientId=$realClientId and MatterId=$realMatterId" -ForegroundColor Gray
    } else {
        $sql = "UPDATE Instructions SET ClientId = '$realClientId', LastUpdated = GETDATE() WHERE InstructionRef = '$instructionRef'"
        Write-Host "Updating with ClientId=$realClientId only" -ForegroundColor Gray
    }
    
    Write-Host "SQL: $sql" -ForegroundColor DarkGray
    Write-Host "✓ Ready to execute database update" -ForegroundColor Green
    Write-Host ""
    Write-Host "MANUAL STEP REQUIRED:" -ForegroundColor Red
    Write-Host "Run this SQL against instructions.database.windows.net:" -ForegroundColor Yellow
    Write-Host $sql -ForegroundColor White
    
} catch {
    Write-Host "✗ Error preparing update: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== SUMMARY ===" -ForegroundColor Cyan
Write-Host "Real Client ID: $realClientId" -ForegroundColor White
Write-Host "Instruction Ref: $instructionRef" -ForegroundColor White
Write-Host "Email: testitem@gmail.com" -ForegroundColor White
Write-Host "Action Required: Execute SQL update above" -ForegroundColor Yellow