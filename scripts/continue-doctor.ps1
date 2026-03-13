cd "C:\WorkSpaces\voicetowebsite-copyright-mrjwswain"
$ErrorActionPreference = "Stop"

$repoRoot = $PWD.Path
$node = (Get-Command node -ErrorAction Stop).Source
$checks = @()

$checks += [pscustomobject]@{
    Check = "Node path"
    Status = if (Test-Path $node) { "OK" } else { "FAIL" }
    Detail = $node
}

$configFiles = @(
    ".continue\config.yaml",
    ".continue\agents\new-config.yaml",
    ".continue\agents\new-config-1.yaml",
    ".continue\mcpServers\new-mcp-server.yaml"
)

foreach ($config in $configFiles) {
    $path = Join-Path $repoRoot $config
    $checks += [pscustomobject]@{
        Check = $config
        Status = if (Test-Path $path) { "OK" } else { "FAIL" }
        Detail = $path
    }
}

$placeholderFiles = Get-ChildItem ".continue" -Recurse -File | Select-String -Pattern "YOUR_OPENAI_API_KEY_HERE" -List -ErrorAction SilentlyContinue
$checks += [pscustomobject]@{
    Check = "Placeholder API keys"
    Status = if ($placeholderFiles) { "FAIL" } else { "OK" }
    Detail = if ($placeholderFiles) { ($placeholderFiles.Path -join ", ") } else { "No placeholder keys found" }
}

$smokeTargets = @(
    "mcp-server-memory.mjs",
    "mcp-server-project.mjs",
    "mcp-server-ui-commands.mjs"
)

foreach ($target in $smokeTargets) {
    $command = @"
import('./$target');
setTimeout(() => process.exit(0), 400);
"@
    & $node --input-type=module -e $command *> $null
    $checks += [pscustomobject]@{
        Check = $target
        Status = if ($LASTEXITCODE -eq 0) { "OK" } else { "FAIL" }
        Detail = "Startup smoke test exit code: $LASTEXITCODE"
    }
}

$checks | Format-Table -AutoSize
