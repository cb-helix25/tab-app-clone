$ErrorActionPreference = 'Stop'
# invisible change

$zipPath = Join-Path $PSScriptRoot 'build.zip'
$buildDir = Join-Path $PSScriptRoot 'build'

Write-Host "Removing existing build.zip if it exists"
Remove-Item -Path $zipPath -Force -ErrorAction SilentlyContinue

Write-Host "Building project"
npm run build

Write-Host "Installing server dependencies"
npm ci --prefix server --only=prod

Write-Host "Copying server files"
Copy-Item -Path "server" -Destination $buildDir -Recurse -Force

Push-Location $buildDir
Write-Host "Zipping build folder"
Compress-Archive -Path * -DestinationPath $zipPath -Force
Pop-Location

Write-Host "Deploying to Azure"
az webapp deploy --resource-group Main --name link-hub-v1 --src-path build.zip
az webapp config set --resource-group Main --name link-hub-v1 --startup-file "node server/index.js"

Write-Host "Cleaning up build artifacts"
Remove-Item -Recurse -Force $buildDir
Remove-Item -Force $zipPath
