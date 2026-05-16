# =============================================================================
# set-firebase-auth.ps1
# Applies the required Firebase Auth config for voicetowebsite.com:
#   1. Adds voicetowebsite.com (and www.) to authorized domains (preserves existing)
#   2. Enables Email/Password sign-in
#   3. Enables Email link (passwordless) sign-in
#
# IDEMPOTENT — safe to run multiple times. Only changes what's wrong.
#
# Prereqs: same as check-firebase-auth.ps1 (gcloud auth login as project owner).
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File C:\Users\Servi\voicetowebsite-copyright-mrjwswain\scripts\set-firebase-auth.ps1
# =============================================================================

$ErrorActionPreference = 'Stop'
$projectId = 'voicetowebsite-3000'
$requiredDomains = @('voicetowebsite.com', 'www.voicetowebsite.com')

Write-Host ""
Write-Host "==> Updating Firebase Auth for project: $projectId" -ForegroundColor Cyan
Write-Host ""

# --- prereq: gcloud ------------------------------------------------------
if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) {
  Write-Host "ERROR: gcloud not installed. See: https://cloud.google.com/sdk/docs/install" -ForegroundColor Red
  exit 1
}

$activeAcct = (gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>$null)
if (-not $activeAcct) {
  gcloud auth login
  $activeAcct = (gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>$null)
}
Write-Host "    gcloud account: $activeAcct" -ForegroundColor DarkGray

$token = (gcloud auth print-access-token 2>$null)
if (-not $token) { Write-Host "ERROR: no token" -ForegroundColor Red; exit 1 }
$headers = @{
  Authorization  = "Bearer $token"
  'Content-Type' = 'application/json'
}

$cfgUrl = "https://identitytoolkit.googleapis.com/admin/v2/projects/$projectId/config"

# --- fetch current ------------------------------------------------------
try {
  $cfg = Invoke-RestMethod -Uri $cfgUrl -Headers $headers -Method Get
} catch {
  Write-Host "ERROR: cannot read current config: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}

$existingDomains = @($cfg.authorizedDomains)
$missingDomains = @($requiredDomains | Where-Object { $existingDomains -notcontains $_ })
$mergedDomains  = @($existingDomains + $missingDomains) | Select-Object -Unique

$currentEmailEnabled = $cfg.signIn.email -and $cfg.signIn.email.enabled
$currentLinkEnabled  = $cfg.signIn.email -and ($cfg.signIn.email.passwordRequired -eq $false)

$needsDomainPatch = $missingDomains.Count -gt 0
$needsEmailPatch  = (-not $currentEmailEnabled) -or (-not $currentLinkEnabled)

if (-not $needsDomainPatch -and -not $needsEmailPatch) {
  Write-Host "==> Nothing to change. Config is already correct." -ForegroundColor Green
  exit 0
}

# --- build patch body ---------------------------------------------------
$patchBody = @{}
$updateMask = @()

if ($needsDomainPatch) {
  $patchBody.authorizedDomains = $mergedDomains
  $updateMask += 'authorizedDomains'
  Write-Host "  + Adding domains: $($missingDomains -join ', ')" -ForegroundColor Yellow
}

if ($needsEmailPatch) {
  $patchBody.signIn = @{
    email = @{
      enabled          = $true
      passwordRequired = $false   # false = email link allowed (passwordless ON)
    }
  }
  $updateMask += 'signIn.email'
  if (-not $currentEmailEnabled) { Write-Host "  + Enabling Email/Password provider" -ForegroundColor Yellow }
  if (-not $currentLinkEnabled)  { Write-Host "  + Enabling Email link (passwordless)" -ForegroundColor Yellow }
}

$jsonBody = $patchBody | ConvertTo-Json -Depth 10 -Compress
$maskStr  = ($updateMask -join ',')
$patchUrl = "$cfgUrl" + "?updateMask=$([System.Web.HttpUtility]::UrlEncode($maskStr))"

Write-Host ""
Write-Host "==> PATCH $patchUrl" -ForegroundColor DarkCyan

try {
  $resp = Invoke-RestMethod -Uri $patchUrl -Headers $headers -Method Patch -Body $jsonBody
  Write-Host "    Applied." -ForegroundColor Green
} catch {
  Write-Host "ERROR: patch failed: $($_.Exception.Message)" -ForegroundColor Red
  if ($_.ErrorDetails) { Write-Host "    Details: $($_.ErrorDetails.Message)" -ForegroundColor Yellow }
  exit 1
}

Write-Host ""
Write-Host "==> Done. Re-running audit to confirm..." -ForegroundColor Cyan
Write-Host ""

# --- re-audit -----------------------------------------------------------
$auditScript = Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) 'check-firebase-auth.ps1'
if (Test-Path $auditScript) {
  & $auditScript
}
