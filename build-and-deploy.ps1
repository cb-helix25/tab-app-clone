$ErrorActionPreference = 'Stop'

$zipPath   = Join-Path $PSScriptRoot 'build.zip'
$copyPath  = Join-Path $PSScriptRoot 'last-deploy.zip'
$cfgPath   = Join-Path $PSScriptRoot 'server\web.config'

Write-Host "Removing existing zip artifacts"
Remove-Item -Path $zipPath, $copyPath -Force -ErrorAction SilentlyContinue

Write-Host "Building frontend"
npm run build

Write-Host "Installing server dependencies (production only)"
npm ci --prefix server --only=prod

Write-Host "Creating IISNode log directory"
New-Item -ItemType Directory -Path "$PSScriptRoot\iisnode" -Force | Out-Null

Write-Host "Zipping files for deploy"
Compress-Archive -Path `
  "build\*", `
  "server\server.js", `
  "server\package.json", `
  "server\package-lock.json", `
  "server\web.config", `
  "server\node_modules", `
  "iisnode" `
  -DestinationPath $zipPath -Force

Write-Host "Copying deployment zip for inspection"
Copy-Item -Path $zipPath -Destination $copyPath -Force

Write-Host "Deploying to Azure"
az webapp deploy --resource-group Main --name link-hub-v1 --src-path $zipPath

Write-Host "Cleaning up"
Remove-Item -Recurse -Force "$PSScriptRoot\iisnode"
Remove-Item -Force $zipPath

Write-Host "✅ Done"
