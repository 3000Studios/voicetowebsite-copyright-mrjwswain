<#
Install recommended VS Code extensions for this workspace.
Run from project root in PowerShell:
  powershell -NoProfile -ExecutionPolicy Bypass -File ./scripts/install-vscode-extensions.ps1
#>

$extensions = @(
  'dbaeumer.vscode-eslint',
  'esbenp.prettier-vscode',
  'EditorConfig.EditorConfig',
  'cloudflare.cloudflare-workers-bindings-extension',
  'ms-vscode.vscode-typescript-next',
  'eamodio.gitlens',
  'christian-kohler.path-intellisense',
  'streetsidesoftware.code-spell-checker',
  'usernamehw.errorlens',
  'dsznajder.es7-react-js-snippets',
  'Continue.continue',
  'PKief.material-icon-theme',
  'ms-vscode.powershell',
  'GitHub.vscode-github-actions'
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
