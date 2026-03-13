cd "C:\WorkSpaces\voicetowebsite-copyright-mrjwswain"
$ErrorActionPreference = "Stop"
$node = (Get-Command node -ErrorAction Stop).Source
$server = Join-Path $PWD "mcp-server-memory.mjs"
& $node $server
exit $LASTEXITCODE
