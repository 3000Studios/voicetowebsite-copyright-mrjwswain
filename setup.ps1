[CmdletBinding()]
param(
  [switch]$InstallVSCodeExtensions
)

$ErrorActionPreference = "Stop"

function Write-Step([string]$Message) {
  Write-Host ""
  Write-Host "==> $Message"
}

Write-Step "Checking prerequisites"
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw "Node.js is not installed or not on PATH. Install Node.js (LTS) and retry."
}
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  throw "npm is not installed or not on PATH. Reinstall Node.js (LTS) and retry."
}

node --version
npm --version

Write-Step "Installing dependencies"
if (Test-Path -LiteralPath ".\\package-lock.json") {
  npm ci
} else {
  npm install
}

Write-Step "Creating local environment file (if missing)"
if (-not (Test-Path -LiteralPath ".\\.env")) {
  if (Test-Path -LiteralPath ".\\ENV.example") {
    Copy-Item -LiteralPath ".\\ENV.example" -Destination ".\\.env"
    Write-Host "Created .env from ENV.example"
  } else {
    Write-Host "No ENV.example found; skipping .env creation"
  }
} else {
  Write-Host ".env already exists; leaving as-is"
}

Write-Step "Verifying Wrangler"
try {
  npx --yes wrangler --version
} catch {
  Write-Host "Wrangler check failed (npx wrangler). You can still run via npm script: npm run dev:worker"
}

if ($InstallVSCodeExtensions) {
  Write-Step "Installing VS Code extensions (optional)"
  if (-not (Test-Path -LiteralPath ".\scripts\install-vscode-extensions.ps1")) {
    throw "Missing scripts/install-vscode-extensions.ps1"
  }

  powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\install-vscode-extensions.ps1
}

Write-Step "Done"
Write-Host "Run:"
Write-Host "  npm run dev:worker"
Write-Host "  npm run dev"
