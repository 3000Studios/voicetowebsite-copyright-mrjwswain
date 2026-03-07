# Cursor session bootstrap for this repo.
# - Opens the repo root
# - Loads env vars from .env into current terminal session
# - Applies local admin defaults
# - Switches to Node 20 (if nvm exists)

$ErrorActionPreference = "Stop"

$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $ProjectRoot

function Import-DotEnv {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Path
  )

  if (-not (Test-Path $Path)) {
    return
  }

  $lines = Get-Content $Path -ErrorAction SilentlyContinue
  foreach ($line in $lines) {
    $trimmed = [string]$line
    if ([string]::IsNullOrWhiteSpace($trimmed)) { continue }
    if ($trimmed.TrimStart().StartsWith("#")) { continue }
    if ($trimmed -notmatch "^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$") { continue }

    $name = $Matches[1]
    $value = $Matches[2].Trim()

    # Remove matching single/double quotes if present.
    if (
      ($value.StartsWith('"') -and $value.EndsWith('"')) -or
      ($value.StartsWith("'") -and $value.EndsWith("'"))
    ) {
      if ($value.Length -ge 2) {
        $value = $value.Substring(1, $value.Length - 2)
      }
    }

    Set-Item -Path "Env:$name" -Value $value
  }
}

Import-DotEnv -Path (Join-Path $ProjectRoot ".env")

$setAdminScript = Join-Path $ProjectRoot "scripts\set-admin-env.ps1"
if (Test-Path $setAdminScript) {
  & $setAdminScript
}

if (Get-Command nvm -ErrorAction SilentlyContinue) {
  nvm use 20 | Out-Host
}

Write-Host "Cursor session initialized at $ProjectRoot" -ForegroundColor Green
