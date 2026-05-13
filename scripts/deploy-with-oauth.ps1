# Deploy using OAuth (wrangler login). Unsets token env vars so they don't override login.
# Run from repo root: .\scripts\deploy-with-oauth.ps1
#
# If you still get "Unable to authenticate request [code: 10001]":
#   Wrangler loads .env and CLOUDFLARE_API_TOKEN there overrides OAuth.
#   Comment out or remove CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID in .env, then run this script again.

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

# Unset Cloudflare token/account in this session so wrangler may use OAuth from "wrangler login"
$env:CLOUDFLARE_API_TOKEN = $null
$env:CLOUDFLARE_ACCOUNT_ID = $null
$env:CF_API_TOKEN = $null
$env:CF_ACCOUNT_ID = $null

# If .env contains CLOUDFLARE_API_TOKEN, wrangler will still load it and override OAuth.
# Use unified path (verify + deploy) — same as all other entry points
& npm run deploy:live
