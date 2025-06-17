# Build and deploy the tab app to Azure

$ErrorActionPreference = 'Stop'

# Path to the output zip file in repo root
$zipPath = Join-Path $PSScriptRoot 'build.zip'

Write-Host "Removing existing build.zip if it exists"
Remove-Item -Path $zipPath -Force -ErrorAction SilentlyContinue

Write-Host "Building project"
npm run build

Push-Location build
Write-Host "Zipping build folder"
Compress-Archive -Path * -DestinationPath $zipPath -Force
Pop-Location

Write-Host "Deploying to Azure"
az webapp deployment source config-zip --resource-group Main --name link-hub-v1 --src $zipPath