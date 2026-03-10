<#
Install recommended VS Code extensions for this workspace.
Run from project root in PowerShell:
  powershell -NoProfile -ExecutionPolicy Bypass -File ./scripts/install-vscode-extensions.ps1
#>

$ErrorActionPreference = "Stop"
$extensionsPath = ".\.vscode\extensions.json"

if (-not (Test-Path -LiteralPath $extensionsPath)) {
  Write-Host "Missing $extensionsPath. Cannot load workspace recommendations." -ForegroundColor Red
  exit 1
}

try {
  $extensionsConfig = Get-Content -LiteralPath $extensionsPath -Raw | ConvertFrom-Json
  $extensions = @($extensionsConfig.recommendations | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
} catch {
  Write-Host "Failed to parse ${extensionsPath}: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}

if ($extensions.Count -eq 0) {
  Write-Host "No recommended extensions found in $extensionsPath." -ForegroundColor Yellow
  exit 0
}

if (-not (Get-Command code -ErrorAction SilentlyContinue)) {
  Write-Host "The 'code' CLI is not available. Open VS Code, press Ctrl+Shift+P → 'Shell Command: Install 'code' command in PATH' and rerun this script." -ForegroundColor Yellow
  exit 1
}

foreach ($ext in $extensions) {
  Write-Host "Installing $ext..."
  code --install-extension $ext --force | Out-Null
}

Write-Host "Installed workspace-recommended extensions from $extensionsPath." -ForegroundColor Green
