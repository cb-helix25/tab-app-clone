# Quick deployment script for Teams mobile ECONNRESET fix
# Run from project root

Write-Host "🔧 Deploying Teams Mobile Connection Fix..." -ForegroundColor Cyan

# Check if logged in to Azure
$context = az account show 2>$null
if (-not $context) {
    Write-Host "❌ Not logged in to Azure. Run 'az login' first." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Azure CLI authenticated" -ForegroundColor Green

# Configuration
$appName = "link-hub-v1"
$resourceGroup = "your-resource-group" # UPDATE THIS

Write-Host "📦 Building application..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build successful" -ForegroundColor Green

Write-Host "🚀 Deploying to Azure App Service..." -ForegroundColor Yellow
.\build-and-deploy.ps1

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deployment failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Deployment successful" -ForegroundColor Green

Write-Host ""
Write-Host "⚙️  Configuring environment variables..." -ForegroundColor Yellow

# Set recommended production environment variables
$envVars = @(
    "SQL_MAX_CONCURRENT_REQUESTS=25",
    "SQL_POOL_MAX=25",
    "SQL_POOL_MIN=2",
    "SQL_REQUEST_TIMEOUT_MS=60000",
    "SQL_CONNECTION_TIMEOUT_MS=15000",
    "SQL_POOL_ACQUIRE_TIMEOUT_MS=10000",
    "SQL_POOL_IDLE_TIMEOUT_MS=30000",
    "SQL_QUEUE_TIMEOUT_MS=30000",
    "SQL_HEALTH_CHECK_INTERVAL_MS=120000"
)

Write-Host "Setting environment variables..." -ForegroundColor Cyan
foreach ($envVar in $envVars) {
    $parts = $envVar -split '=', 2
    $name = $parts[0]
    $value = $parts[1]
    
    Write-Host "  Setting $name = $value" -ForegroundColor Gray
    az webapp config appsettings set `
        --name $appName `
        --resource-group $resourceGroup `
        --settings "$name=$value" `
        --output none
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ⚠️  Warning: Failed to set $name" -ForegroundColor Yellow
    }
}

Write-Host "✅ Environment variables configured" -ForegroundColor Green

Write-Host ""
Write-Host "🔄 Restarting App Service..." -ForegroundColor Yellow
az webapp restart --name $appName --resource-group $resourceGroup --output none

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Restart failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ App Service restarted" -ForegroundColor Green

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✨ Deployment Complete!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Monitor application logs with:" -ForegroundColor Yellow
Write-Host "   az webapp log tail --name $appName --resource-group $resourceGroup" -ForegroundColor White
Write-Host ""
Write-Host "🔍 Look for 'SQL Connection Metrics' entries showing:" -ForegroundColor Yellow
Write-Host "   - queuedRequests should be low (< 5)" -ForegroundColor White
Write-Host "   - errorRate should be < 1%" -ForegroundColor White
Write-Host "   - totalQueueTimeouts should stay at 0" -ForegroundColor White
Write-Host ""
Write-Host "📱 Test in Teams mobile app to verify ECONNRESET is resolved" -ForegroundColor Yellow
Write-Host ""
