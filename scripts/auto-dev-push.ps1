<#
Auto-commit + push loop for development branch.
- Runs `npm run verify`; will NOT push if verify fails.
- Commits all staged changes with a timestamped auto message.
- Pushes to the configured branch (default: development).
Usage:
  pwsh ./scripts/auto-dev-push.ps1

Press Ctrl+C to stop the loop.
#>

$ErrorActionPreference = "Stop"
$branch = "development"
$pollSeconds = 12

Write-Host "Auto dev push loop starting. Target branch: $branch" -ForegroundColor Cyan

while ($true) {
  # Detect dirty working tree
  $status = git status --porcelain
  if (-not $status) {
    Start-Sleep -Seconds $pollSeconds
    continue
  }

  Write-Host "`nChanges detected, running verify..." -ForegroundColor Yellow
  $verify = npm run verify
  if ($LASTEXITCODE -ne 0) {
    Write-Warning "verify failed; changes not committed or pushed. Fix and save; will retry."
    Start-Sleep -Seconds ($pollSeconds * 3)
    continue
  }

  git add -A
  $msg = "auto: sync $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
  git commit -m $msg | Out-Null

  Write-Host "Pushing to origin/$branch..." -ForegroundColor Cyan
  git push origin $branch

  Start-Sleep -Seconds $pollSeconds
}
