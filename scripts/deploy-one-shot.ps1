# One-shot deploy: cd to repo root, allow OAuth by temporarily neutralizing token vars in .env, then deploy.
# Run from anywhere: & "C:\WorkSpaces\voicetowebsite-copyright-mrjwswain\scripts\deploy-one-shot.ps1"
# Or from repo root: .\scripts\deploy-one-shot.ps1

$ErrorActionPreference = "Stop"

# 1) Go to project root (script lives in repo/scripts/)
$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $ProjectRoot
Write-Host "Project root: $ProjectRoot" -ForegroundColor Cyan

# 2) Unset token/account in this session so they don't override OAuth
$env:CLOUDFLARE_API_TOKEN = $null
$env:CLOUDFLARE_ACCOUNT_ID = $null
$env:CF_API_TOKEN = $null
$env:CF_ACCOUNT_ID = $null

# 3) If .env exists, temporarily comment out Cloudflare auth lines so wrangler uses OAuth
$EnvPath = Join-Path $ProjectRoot ".env"
$BakPath = Join-Path $ProjectRoot ".env.bak.deploy"
$restored = $false
if (Test-Path $EnvPath) {
  $lines = Get-Content $EnvPath -Raw
  if ($lines -match "CLOUDFLARE_API_TOKEN|CLOUDFLARE_ACCOUNT_ID|CF_API_TOKEN|CF_ACCOUNT_ID") {
    Copy-Item $EnvPath $BakPath -Force
    $newLines = Get-Content $EnvPath | ForEach-Object {
      if ($_ -match "^\s*(CLOUDFLARE_API_TOKEN|CLOUDFLARE_ACCOUNT_ID|CF_API_TOKEN|CF_ACCOUNT_ID)\s*=") {
        "# (deploy-one-shot) $_"
      } else {
        $_
      }
    }
    $newLines | Set-Content $EnvPath
    $restored = $true
    Write-Host "Temporarily commented Cloudflare auth vars in .env for OAuth deploy." -ForegroundColor Yellow
  }
}

try {
  # 4) Deploy
  & npm run deploy
} finally {
  # 5) Restore .env if we modified it
  if ($restored -and (Test-Path $BakPath)) {
    Move-Item $BakPath $EnvPath -Force
    Write-Host "Restored .env." -ForegroundColor Green
  }
}
