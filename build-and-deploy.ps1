$ErrorActionPreference = 'Stop'

$zipPath   = Join-Path $PSScriptRoot 'build.zip'
$copyPath  = Join-Path $PSScriptRoot 'last-deploy.zip'
$buildRoot = Join-Path $PSScriptRoot 'build-flat'
$cfgPath   = Join-Path $PSScriptRoot 'server\web.config'

Write-Host "Removing existing build artifacts"
Remove-Item -Path $zipPath, $copyPath, $buildRoot -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $buildRoot -Force | Out-Null

Write-Host "Building frontend"
npm run build

Write-Host "Installing server dependencies (production only)"
npm ci --prefix server --only=prod

Write-Host "Copying server files to flat build folder"
Copy-Item -Path "server\server.js" -Destination $buildRoot -Force
Copy-Item -Path "server\package.json" -Destination $buildRoot -Force
Copy-Item -Path "server\package-lock.json" -Destination $buildRoot -Force -ErrorAction SilentlyContinue
Copy-Item -Path "server\web.config" -Destination $buildRoot -Force
Copy-Item -Recurse -Path "server\node_modules" -Destination "$buildRoot\node_modules" -Force

Write-Host "Creating IISNode log directory"
New-Item -ItemType Directory -Path (Join-Path $buildRoot 'iisnode') -Force | Out-Null

Write-Host "Zipping flat contents for deploy"
Compress-Archive -Path "$buildRoot\*" -DestinationPath $zipPath -Force

Write-Host "Copying deployment zip for inspection"
Copy-Item -Path $zipPath -Destination $copyPath -Force

Write-Host "Deploying to Azure"
az webapp deploy --resource-group Main --name link-hub-v1 --src-path $zipPath

Write-Host "Cleaning up build artifacts"
Remove-Item -Recurse -Force $buildRoot
Remove-Item -Force $zipPath

Write-Host "✅ Done"
