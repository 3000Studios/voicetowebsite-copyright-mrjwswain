$ErrorActionPreference = "Stop"

$taskName = "VTW Auto Ship"
$runner = (Resolve-Path (Join-Path $PSScriptRoot "auto-ship-runner.ps1")).Path

$ps = (Join-Path $env:SystemRoot "System32\\WindowsPowerShell\\v1.0\\powershell.exe")
$ps = $ps -replace "\\\\", "\\"
$tr = "`"$ps`" -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$runner`""

Write-Host ("Installing scheduled task: {0}" -f $taskName)
Write-Host ("Command: {0}" -f $tr)

try {
  & schtasks /Create /F /SC ONLOGON /TN $taskName /TR $tr | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "schtasks /Create failed with exit code $LASTEXITCODE" }

  Write-Host "Starting task now..."
  & schtasks /Run /TN $taskName | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "schtasks /Run failed with exit code $LASTEXITCODE" }

  Write-Host "OK (Scheduled Task)"
  exit 0
} catch {
  Write-Host ("Scheduled Task install failed ({0}). Falling back to HKCU Run..." -f $_.Exception.Message)
}

$runKey = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run"
$valueName = "VTWAutoShip"
New-Item -Path $runKey -Force | Out-Null
Set-ItemProperty -Path $runKey -Name $valueName -Value $tr -Type String

Write-Host "Starting auto-ship now..."
Start-Process -WindowStyle Hidden -FilePath $ps -ArgumentList @(
  "-NoProfile",
  "-ExecutionPolicy",
  "Bypass",
  "-WindowStyle",
  "Hidden",
  "-File",
  $runner
)

Write-Host "OK (HKCU Run)"
