$ErrorActionPreference = 'Stop'

$extraPaths = @(
  'C:\Program Files\Git\cmd',
  'C:\Program Files\nodejs',
  "$env:LOCALAPPDATA\Programs\Python\Python312",
  "$env:LOCALAPPDATA\Programs\Python\Python312\Scripts",
  "$env:LOCALAPPDATA\Programs\Ollama"
)

$env:Path = ($extraPaths + ($env:Path -split ';' | Where-Object { $_ })) -join ';'
$env:OLLAMA_KEEP_ALIVE = '30m'
$env:OLLAMA_API_BASE = 'http://127.0.0.1:11434'

$requiredCommands = @('ollama', 'python')
foreach ($command in $requiredCommands) {
  if (-not (Get-Command $command -ErrorAction SilentlyContinue)) {
    throw "$command is required for the free local agent setup."
  }
}

$models = @(
  'qwen2.5-coder:7b',
  'nomic-embed-text'
)

foreach ($model in $models) {
  ollama pull $model
}

python -m pip install --user --upgrade aider-chat

if (Get-Command code -ErrorAction SilentlyContinue) {
  code --install-extension continue.continue --force
}

Write-Output 'Free local coding agent setup is ready.'
Write-Output 'Use Continue in VS Code for a free local extension agent.'
Write-Output 'Use .\free-agent.ps1 for the terminal coding agent.'
