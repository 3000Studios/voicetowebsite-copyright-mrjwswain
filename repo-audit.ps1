cd C:\WorkSpaces\voicetowebsite-copyright-mrjwswain
$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "========================================"
Write-Host " REPO AUDIT"
Write-Host "========================================"
Write-Host ""

Write-Host "[*] Git status:"
git status

Write-Host ""
Write-Host "[*] Searching for obvious secrets..."
rg -n "sk-|api_key|api-key|secret|token|password|CLOUDFLARE_API|OPENAI_API|STRIPE_SECRET|PAYPAL_CLIENT_SECRET|JWT_SECRET" . 2>$null

Write-Host ""
Write-Host "[*] package.json scripts:"
if (Test-Path ".\package.json") {
  node -e "console.log(require('./package.json').scripts)"
}

Write-Host ""
Write-Host "[*] Done."
