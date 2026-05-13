<#
Install Jules-related local automation (wrapper around npm auto:ship installer).
This runs the repo's `npm run auto:ship:install` which registers the local auto-ship task.
Run from project root in PowerShell:
  powershell -NoProfile -ExecutionPolicy Bypass -File ./scripts/install-jules.ps1
#>

if (-not (Test-Path package.json)) {
  Write-Host "package.json not found in current folder. Run this script from the repository root." -ForegroundColor Red
  exit 1
}

Write-Host "Running: npm run auto:ship:install" -ForegroundColor Cyan
npm run auto:ship:install

if ($LASTEXITCODE -eq 0) {
  Write-Host "Jules installer ran successfully. Review README and AGENTS.md for next steps." -ForegroundColor Green
} else {
  Write-Host "Jules installer exited with code $LASTEXITCODE" -ForegroundColor Red
  exit $LASTEXITCODE
}
