cd C:\WorkSpaces\voicetowebsite-copyright-mrjwswain

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "========================================"
Write-Host " AUTOFIX LOOP (BUILD/TEST/LINT RUNNER)"
Write-Host "========================================"
Write-Host ""

if (Test-Path ".\package.json") {
  Write-Host "[*] Installing dependencies..."
  npm install
}

Write-Host ""
Write-Host "[*] Running build..."
npm run build

Write-Host ""
Write-Host "[*] Running tests..."
npm test

Write-Host ""
Write-Host "[*] Done."
Write-Host ""
Write-Host "If errors exist, open Continue extension and run:"
Write-Host "Scan repo and fix everything until build passes."
Write-Host ""
