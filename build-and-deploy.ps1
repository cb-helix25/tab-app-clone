$ErrorActionPreference = 'Stop'

$zipPath  = Join-Path $PSScriptRoot 'build.zip'
$buildDir = Join-Path $PSScriptRoot 'build'
$cfgPath  = Join-Path $PSScriptRoot 'server\web.config'

Write-Host "Removing existing build.zip if it exists"
Remove-Item -Path $zipPath -Force -ErrorAction SilentlyContinue

Write-Host "Building project"
npm run build

Write-Host "Installing server dependencies"
npm ci --prefix server --only=prod

Write-Host "Preparing build directory"
New-Item -ItemType Directory -Path $buildDir -Force

Write-Host "Copying server files"
Copy-Item -Path "server\*" -Destination $buildDir -Recurse -Force

Write-Host "Copying web.config into build folder"
Copy-Item -Path $cfgPath -Destination $buildDir -Force

Write-Host "Creating IISNode log directory"
New-Item -ItemType Directory -Path (Join-Path $buildDir 'iisnode') -Force

Push-Location $buildDir
Write-Host "Zipping build folder"
Compress-Archive -Path * -DestinationPath $zipPath -Force
Pop-Location

Write-Host "Deploying to Azure"
az webapp deploy --resource-group Main --name link-hub-v1 --src-path $zipPath

Write-Host "Cleaning up build artifacts"
Remove-Item -Recurse -Force $buildDir
Remove-Item -Force $zipPath
