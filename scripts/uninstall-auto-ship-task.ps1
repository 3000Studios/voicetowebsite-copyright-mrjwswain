$ErrorActionPreference = "Stop"

$taskName = "VTW Auto Ship"
$runKey = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run"
$valueName = "VTWAutoShip"

Write-Host ("Removing scheduled task (if present): {0}" -f $taskName)

try {
  schtasks /Delete /F /TN $taskName | Out-Null
} catch {}

Write-Host "Removing HKCU Run entry (if present)..."
try {
  Remove-ItemProperty -Path $runKey -Name $valueName -ErrorAction Stop
} catch {}

Write-Host "OK"
