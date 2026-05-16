# =============================================================================
# check-firebase-auth.ps1
# Audits the voicetowebsite-3000 Firebase project's Authentication config:
#   1. Lists authorized domains (must include voicetowebsite.com)
#   2. Lists enabled sign-in providers
#   3. Checks if "email link / passwordless" is enabled on the password provider
#
# Uses the Google Identity Toolkit Admin REST API via gcloud-issued tokens.
# Read-only — does not change anything.
#
# Prereqs:
#   - Google Cloud SDK installed: https://cloud.google.com/sdk/docs/install
#   - One-time auth: gcloud auth login (use mr.jwswain@gmail.com)
#   - One-time set project: gcloud config set project voicetowebsite-3000
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File C:\Users\Servi\voicetowebsite-copyright-mrjwswain\scripts\check-firebase-auth.ps1
# =============================================================================

$ErrorActionPreference = 'Stop'
$projectId = 'voicetowebsite-3000'

Write-Host ""
Write-Host "==> Auditing Firebase Auth for project: $projectId" -ForegroundColor Cyan
Write-Host ""

# --- prereq: gcloud installed -------------------------------------------
$gcloudCmd = Get-Command gcloud -ErrorAction SilentlyContinue
if (-not $gcloudCmd) {
  Write-Host "ERROR: gcloud not found in PATH." -ForegroundColor Red
  Write-Host "  Install: https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
  Write-Host "  After install, restart this terminal and re-run." -ForegroundColor Yellow
  exit 1
}

# --- prereq: logged in ---------------------------------------------------
$activeAcct = (gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>$null)
if (-not $activeAcct) {
  Write-Host "Not logged into gcloud. Running 'gcloud auth login' now..." -ForegroundColor Yellow
  gcloud auth login
  $activeAcct = (gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>$null)
}
Write-Host "    Logged in as: $activeAcct" -ForegroundColor DarkGray

# --- get access token ---------------------------------------------------
$token = (gcloud auth print-access-token 2>$null)
if (-not $token) {
  Write-Host "ERROR: could not obtain access token." -ForegroundColor Red
  exit 1
}
$headers = @{ Authorization = "Bearer $token" }

# --- fetch Identity Platform config -------------------------------------
$cfgUrl = "https://identitytoolkit.googleapis.com/admin/v2/projects/$projectId/config"
try {
  $cfg = Invoke-RestMethod -Uri $cfgUrl -Headers $headers -Method Get
} catch {
  Write-Host "ERROR: could not fetch config." -ForegroundColor Red
  Write-Host "  HTTP: $($_.Exception.Response.StatusCode.Value__)" -ForegroundColor Yellow
  Write-Host "  Message: $($_.Exception.Message)" -ForegroundColor Yellow
  Write-Host "  Common causes:" -ForegroundColor Yellow
  Write-Host "    - Your gcloud account is not an Owner/Editor on project $projectId" -ForegroundColor Yellow
  Write-Host "    - Identity Platform API is disabled (enable at:" -ForegroundColor Yellow
  Write-Host "      https://console.cloud.google.com/apis/library/identitytoolkit.googleapis.com?project=$projectId )" -ForegroundColor Yellow
  exit 1
}

# --- 1. Authorized domains ----------------------------------------------
Write-Host ""
Write-Host "----- AUTHORIZED DOMAINS -----" -ForegroundColor Cyan
$domains = @($cfg.authorizedDomains)
if (-not $domains -or $domains.Count -eq 0) {
  Write-Host "  (none)" -ForegroundColor Red
} else {
  foreach ($d in $domains) { Write-Host "  $d" -ForegroundColor White }
}

$prodOk = $domains -contains 'voicetowebsite.com'
$wwwOk  = $domains -contains 'www.voicetowebsite.com'
Write-Host ""
if ($prodOk) {
  Write-Host "  [OK] voicetowebsite.com is authorized" -ForegroundColor Green
} else {
  Write-Host "  [MISSING] voicetowebsite.com is NOT in the list" -ForegroundColor Red
}
if ($wwwOk) {
  Write-Host "  [OK] www.voicetowebsite.com is authorized" -ForegroundColor Green
} else {
  Write-Host "  [INFO] www.voicetowebsite.com is not in the list (optional - depends on canonical URL)" -ForegroundColor DarkYellow
}

# --- 2. Sign-in providers -----------------------------------------------
Write-Host ""
Write-Host "----- SIGN-IN PROVIDERS -----" -ForegroundColor Cyan

# Password provider (Email/Password + Email Link)
$pwd = $cfg.signIn.email
if ($pwd) {
  $passOn = [bool]$pwd.enabled
  $linkOn = [bool]$pwd.passwordRequired -eq $false   # API quirk: passwordRequired=false means email-link is on
  Write-Host ("  Email/Password           : {0}" -f $(if ($passOn) {'ENABLED'} else {'disabled'})) `
    -ForegroundColor $(if ($passOn) {'Green'} else {'DarkGray'})
  Write-Host ("  Email link (passwordless): {0}" -f $(if ($linkOn) {'ENABLED'} else {'disabled'})) `
    -ForegroundColor $(if ($linkOn) {'Green'} else {'Red'})
} else {
  Write-Host "  Email/Password           : disabled" -ForegroundColor Red
  Write-Host "  Email link (passwordless): disabled" -ForegroundColor Red
}

# Phone provider
$phone = $cfg.signIn.phoneNumber
$phoneOn = $phone -and $phone.enabled
Write-Host ("  Phone                    : {0}" -f $(if ($phoneOn) {'enabled'} else {'disabled'})) -ForegroundColor DarkGray

# Anonymous
$anon = $cfg.signIn.anonymous
$anonOn = $anon -and $anon.enabled
Write-Host ("  Anonymous                : {0}" -f $(if ($anonOn) {'enabled'} else {'disabled'})) -ForegroundColor DarkGray

# OAuth providers (Google, GitHub, etc.) — listed separately
$oauthUrl = "https://identitytoolkit.googleapis.com/admin/v2/projects/$projectId/defaultSupportedIdpConfigs"
try {
  $oauth = Invoke-RestMethod -Uri $oauthUrl -Headers $headers -Method Get
  if ($oauth.defaultSupportedIdpConfigs) {
    foreach ($idp in $oauth.defaultSupportedIdpConfigs) {
      $idpName = ($idp.name -split '/')[-1]
      $idpOn = [bool]$idp.enabled
      Write-Host ("  OAuth $idpName" + (' ' * [Math]::Max(0, 18 - $idpName.Length)) + ' : ' + $(if ($idpOn) {'ENABLED'} else {'disabled'})) `
        -ForegroundColor $(if ($idpOn) {'Green'} else {'DarkGray'})
    }
  }
} catch {
  Write-Host "  (could not list OAuth providers)" -ForegroundColor DarkGray
}

# --- Verdict ------------------------------------------------------------
Write-Host ""
Write-Host "----- VERDICT -----" -ForegroundColor Cyan
$emailLinkReady = $prodOk -and $pwd -and $pwd.enabled -and (-not $pwd.passwordRequired)
if ($emailLinkReady) {
  Write-Host "  Email-link signup should WORK in production." -ForegroundColor Green
} else {
  Write-Host "  Email-link signup will FAIL in production. To fix:" -ForegroundColor Red
  if (-not $prodOk) {
    Write-Host "    - Add 'voicetowebsite.com' to Authorized domains" -ForegroundColor Yellow
  }
  if (-not ($pwd -and $pwd.enabled)) {
    Write-Host "    - Enable Email/Password sign-in method" -ForegroundColor Yellow
  }
  if ($pwd -and $pwd.passwordRequired) {
    Write-Host "    - Toggle ON 'Email link (passwordless sign-in)'" -ForegroundColor Yellow
  }
  Write-Host ""
  Write-Host "  To apply all fixes automatically, run:" -ForegroundColor Cyan
  Write-Host "    .\scripts\set-firebase-auth.ps1" -ForegroundColor Cyan
}
Write-Host ""
