$ErrorActionPreference = 'Stop'

$zipPath = Join-Path $PSScriptRoot 'build.zip'
$buildDir = Join-Path $PSScriptRoot 'build'

Write-Host "Removing existing build.zip if it exists"
Remove-Item -Path $zipPath -Force -ErrorAction SilentlyContinue

Write-Host "Building project"
npm run build

Push-Location $buildDir
Write-Host "Zipping build folder"
Compress-Archive -Path * -DestinationPath $zipPath -Force
Pop-Location

Write-Host "Deploying to Azure"
az webapp deployment source config-zip --resource-group Main --name link-hub-v1 --src $zipPath

Write-Host "Cleaning up build artifacts"
Remove-Item -Recurse -Force $buildDir
Remove-Item -Force $zipPath
