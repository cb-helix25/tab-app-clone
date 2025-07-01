# run from /api
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot          # cd to script’s folder

# ensure Node 20 is active
if ((node -v) -notmatch '^v20') {
    nvm install 20.15.1 2>$null     # no-op if already installed
    nvm use 20.15.1
}

# clean & build locally
Remove-Item -Recurse -Force node_modules,dist -ErrorAction SilentlyContinue
npm ci
npm run clean
npm run build                       # produces /dist

# deploy (local build, no remote flag)
func azure functionapp publish helix-keys-proxy