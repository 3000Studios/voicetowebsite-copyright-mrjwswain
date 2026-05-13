$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $repoRoot

Write-Host ("[auto-ship-runner] Repo: {0}" -f $repoRoot)

while ($true) {
  try {
    Write-Host ("[auto-ship-runner] Starting: npm run auto:ship  ({0})" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"))
    & npm run auto:ship
    $code = $LASTEXITCODE
    Write-Host ("[auto-ship-runner] Exited code={0}  ({1})" -f $code, (Get-Date -Format "yyyy-MM-dd HH:mm:ss"))
  } catch {
    Write-Host ("[auto-ship-runner] Crash: {0}" -f $_.Exception.Message)
  }

  Start-Sleep -Seconds 5
}

