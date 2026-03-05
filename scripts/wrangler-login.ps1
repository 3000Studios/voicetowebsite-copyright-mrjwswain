# Ensure Node/npm/npx are on PATH, then run wrangler login.
# Use this if "npx" is not recognized in PowerShell.

$nodeDir = "C:\nvm4w\nodejs"
if (-not (Test-Path "$nodeDir\node.exe")) {
  # Try common nvm/fnm paths
  $nodeDir = $env:NVM_HOME
  if (-not $nodeDir -and (Test-Path "$env:APPDATA\nvm")) {
    $nvmVer = Get-Content "$env:APPDATA\nvm\alias\default" -ErrorAction SilentlyContinue
    if ($nvmVer) { $nodeDir = "$env:APPDATA\nvm\$nvmVer" }
  }
}
if (Test-Path "$nodeDir\node.exe") {
  $env:Path = "$nodeDir;$env:Path"
  & "$nodeDir\npx.cmd" wrangler login
} else {
  Write-Host "Node not found at C:\nvm4w\nodejs. Install Node or set PATH to your Node bin, then run: npx wrangler login"
  exit 1
}
