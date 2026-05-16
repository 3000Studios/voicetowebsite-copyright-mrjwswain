# =============================================================================
# push-prod-env.ps1
# Reads secrets from C:\Workspaces\LOCAL_ENV.txt (and local .env) and pushes
# them to the voicetowebsite Cloudflare Pages production env, then triggers
# a redeploy.
#
# No secrets are hardcoded in this file - safe to commit.
#
# Usage (from anywhere):
#   powershell -ExecutionPolicy Bypass -File C:\Users\Servi\voicetowebsite-copyright-mrjwswain\scripts\push-prod-env.ps1
# =============================================================================

$ErrorActionPreference = 'Stop'

# --- jump into repo root --------------------------------------------------
$repoRoot = 'C:\Users\Servi\voicetowebsite-copyright-mrjwswain'
Set-Location $repoRoot
Write-Host ""
Write-Host "==> Working dir: $(Get-Location)" -ForegroundColor Cyan

# --- load local .env (already has all values aligned for prod use) -------
$envFile = Join-Path $repoRoot '.env'
if (-not (Test-Path $envFile)) {
  Write-Host "ERROR: .env not found at $envFile" -ForegroundColor Red
  exit 1
}

$envMap = @{}
Get-Content $envFile | ForEach-Object {
  $line = $_.Trim()
  if ($line -eq '' -or $line.StartsWith('#')) { return }
  $idx = $line.IndexOf('=')
  if ($idx -lt 1) { return }
  $key = $line.Substring(0, $idx).Trim()
  $val = $line.Substring($idx + 1).Trim().Trim('"').Trim("'")
  if ($val -ne '') { $envMap[$key] = $val }
}

Write-Host "==> Loaded $($envMap.Count) keys from .env" -ForegroundColor Cyan

# --- auth wrangler against the right Cloudflare account ------------------
if (-not $envMap.ContainsKey('CLOUDFLARE_API_TOKEN') -or -not $envMap.ContainsKey('CLOUDFLARE_ACCOUNT_ID')) {
  Write-Host "ERROR: CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID missing from .env" -ForegroundColor Red
  exit 1
}
$env:CLOUDFLARE_API_TOKEN  = $envMap['CLOUDFLARE_API_TOKEN']
$env:CLOUDFLARE_ACCOUNT_ID = $envMap['CLOUDFLARE_ACCOUNT_ID']

# --- list of keys to push to production ----------------------------------
# Override APP_URL for prod (local .env uses localhost)
$envMap['APP_URL'] = 'https://voicetowebsite.com'

$pushKeys = @(
  # Firebase Auth (voicetowebsite-3000 project)
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_FIREBASE_MEASUREMENT_ID',
  'VITE_OWNER_ADMIN_EMAIL',
  # App URL (Stripe success/cancel)
  'APP_URL',
  # Stripe live
  'STRIPE_SECRET_KEY',
  # Gemini
  'GEMINI_API_KEY',
  'VITE_GEMINI_API_KEY',
  'VITE_GEMINI_MODEL',
  # PayPal fallback
  'PAYPAL_CLIENT_ID',
  'PAYPAL_CLIENT_SECRET',
  'PAYPAL_ENV'
)

# --- push each secret -----------------------------------------------------
$project = 'voicetowebsite'
$total = $pushKeys.Count
$i = 0
$skipped = @()
foreach ($name in $pushKeys) {
  $i++
  if (-not $envMap.ContainsKey($name) -or $envMap[$name] -eq '') {
    Write-Host ("[{0}/{1}] {2} - SKIPPED (empty in .env)" -f $i, $total, $name) -ForegroundColor DarkGray
    $skipped += $name
    continue
  }
  $value = $envMap[$name]
  Write-Host ("[{0}/{1}] {2}" -f $i, $total, $name) -ForegroundColor Yellow
  $value | npx --yes wrangler pages secret put $name --project-name $project
  if ($LASTEXITCODE -ne 0) {
    Write-Host "  FAILED on $name (exit $LASTEXITCODE) - aborting." -ForegroundColor Red
    exit $LASTEXITCODE
  }
}

Write-Host ""
Write-Host "==> Pushed $($total - $skipped.Count) of $total secrets." -ForegroundColor Green
if ($skipped.Count -gt 0) {
  Write-Host "    Skipped (empty): $($skipped -join ', ')" -ForegroundColor DarkYellow
}
Write-Host ""

# --- trigger production deploy via Cloudflare Deploy Hook ----------------
Write-Host "==> Triggering Cloudflare Pages production deploy..." -ForegroundColor Cyan
$hookUrl = 'https://api.cloudflare.com/client/v4/pages/webhooks/deploy_hooks/2213644c-8931-45a6-a708-6648405b5425'
try {
  $resp = Invoke-RestMethod -Method Post -Uri $hookUrl -ErrorAction Stop
  Write-Host "  Deploy hook fired." -ForegroundColor Green
  $resp | ConvertTo-Json -Depth 5 | Write-Host
} catch {
  Write-Host "  Deploy hook failed: $($_.Exception.Message)" -ForegroundColor Red
  Write-Host "  You can manually trigger from Cloudflare dashboard." -ForegroundColor Yellow
  exit 1
}

Write-Host ""
Write-Host "==> DONE." -ForegroundColor Green
Write-Host "    Dashboard: https://dash.cloudflare.com/$env:CLOUDFLARE_ACCOUNT_ID/pages/view/$project" -ForegroundColor Cyan
Write-Host "    Goes live in ~60-90s. Test: https://voicetowebsite.com/signup" -ForegroundColor Cyan
Write-Host ""
