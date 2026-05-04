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

ollama list | Out-Null
python -m aider `
  --model ollama_chat/qwen2.5-coder:7b `
  --weak-model ollama_chat/qwen2.5-coder:7b `
  --editor-model ollama_chat/qwen2.5-coder:7b `
  --map-tokens 4096 `
  --cache-prompts `
  --no-auto-commits `
  --no-dirty-commits `
  --no-attribute-author `
  --no-attribute-committer `
  --analytics-disable `
  @args
