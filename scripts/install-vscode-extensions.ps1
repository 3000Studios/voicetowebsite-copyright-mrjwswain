<#
Install recommended VS Code extensions for this workspace.
Run from project root in PowerShell:
  powershell -NoProfile -ExecutionPolicy Bypass -File ./scripts/install-vscode-extensions.ps1
#>

$extensions = @(
  'dbaeumer.vscode-eslint',
  'esbenp.prettier-vscode',
  'eamodio.gitlens',
  'christian-kohler.path-intellisense',
  'eg2.vscode-npm-script',
  'streetsidesoftware.code-spell-checker',
  'EditorConfig.EditorConfig',
  'ms-vscode.vscode-typescript-next',
  'formulahendry.auto-close-tag',
  'formulahendry.auto-rename-tag',
  'ritwickdey.LiveServer'
)

if (-not (Get-Command code -ErrorAction SilentlyContinue)) {
  Write-Host "The 'code' CLI is not available. Open VS Code, press Ctrl+Shift+P → 'Shell Command: Install 'code' command in PATH' and rerun this script." -ForegroundColor Yellow
  exit 1
}

foreach ($ext in $extensions) {
  Write-Host "Installing $ext..."
  code --install-extension $ext --force | Out-Null
}

Write-Host "All recommended extensions have been installed (or were already present)." -ForegroundColor Green
