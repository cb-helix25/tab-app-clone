$ErrorActionPreference = 'Stop'

$zipPath   = Join-Path $PSScriptRoot 'build.zip'
$copyPath  = Join-Path $PSScriptRoot 'last-deploy.zip'
$cfgPath   = Join-Path $PSScriptRoot 'server\web.config'

Write-Host "Removing existing zip artifacts"
Remove-Item -Path $zipPath, $copyPath -Force -ErrorAction SilentlyContinue

Write-Host "Building frontend (app directory)"
npm run build --prefix app

# Ensure frontend build output is in root build/ directory if needed
if (Test-Path "app\build") {
    Write-Host "Copying frontend build output to root build/ directory"
    Remove-Item -Recurse -Force "$PSScriptRoot\build" -ErrorAction SilentlyContinue
    Copy-Item -Path "app\build" -Destination "$PSScriptRoot\build" -Recurse -Force
}

Write-Host "Installing server dependencies (production only)"
npm ci --prefix server --only=prod

Write-Host "Creating IISNode log directory"
New-Item -ItemType Directory -Path "$PSScriptRoot\iisnode" -Force | Out-Null



# Copy server files to root for Azure compatibility
Copy-Item -Path "server\package.json" -Destination "$PSScriptRoot\package.json" -Force
Copy-Item -Path "server\package-lock.json" -Destination "$PSScriptRoot\package-lock.json" -Force
Copy-Item -Path "server\server.js" -Destination "$PSScriptRoot\server.js" -Force
Copy-Item -Path "server\web.config" -Destination "$PSScriptRoot\web.config" -Force

Write-Host "Zipping files for deploy"
Compress-Archive -Path `
  "build\*", `
  "server.js", `
  "web.config", `
  "iisnode", `
  "package.json", `
  "package-lock.json" `
  -DestinationPath $zipPath -Force

Write-Host "Copying deployment zip for inspection"
Copy-Item -Path $zipPath -Destination $copyPath -Force

Write-Host "Deploying to Azure"
az webapp deploy --resource-group Main --name link-hub-v1 --src-path $zipPath


Write-Host "Cleaning up"
Remove-Item -Recurse -Force "$PSScriptRoot\iisnode"
Remove-Item -Force $zipPath
Remove-Item -Force "$PSScriptRoot\package.json" -ErrorAction SilentlyContinue
Remove-Item -Force "$PSScriptRoot\package-lock.json" -ErrorAction SilentlyContinue
Remove-Item -Force "$PSScriptRoot\server.js" -ErrorAction SilentlyContinue
Remove-Item -Force "$PSScriptRoot\web.config" -ErrorAction SilentlyContinue

Write-Host "✅ Done"
