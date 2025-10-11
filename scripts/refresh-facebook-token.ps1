# Facebook Token Auto-Refresh Script
# Run this monthly to keep your Marketing API token fresh

Write-Host "=== Facebook Marketing Token Auto-Refresh ===" -ForegroundColor Cyan
Write-Host "Starting token refresh process..." -ForegroundColor Yellow

try {
    # Call the Azure Function to refresh the token
    $functionUrl = "https://link-hub-v1-fehchxeqgxe9bsha.uksouth-01.azurewebsites.net/api/refreshFacebookToken"
    
    Write-Host "Calling refresh function..." -ForegroundColor Yellow
    $response = Invoke-RestMethod -Uri $functionUrl -Method POST -ContentType "application/json"
    
    if ($response.success) {
        Write-Host "✅ Token refresh successful!" -ForegroundColor Green
        Write-Host "Expires in: $($response.expiresIn) seconds" -ForegroundColor Green
        Write-Host "Test result: $($response.testResult)" -ForegroundColor Green
        Write-Host "Timestamp: $($response.timestamp)" -ForegroundColor Green
    } else {
        Write-Host "❌ Token refresh failed!" -ForegroundColor Red
        Write-Host "Error: $($response.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Script execution failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Refresh Complete ===" -ForegroundColor Cyan
Write-Host "Next refresh recommended in 30 days" -ForegroundColor Yellow

# To schedule this script to run monthly, use Windows Task Scheduler:
# 1. Open Task Scheduler
# 2. Create Basic Task
# 3. Name: "Facebook Token Refresh"
# 4. Trigger: Monthly (run on 1st of each month)
# 5. Action: Start a program
#    Program: powershell.exe
#    Arguments: -ExecutionPolicy Bypass -File "C:\path\to\this\script.ps1"