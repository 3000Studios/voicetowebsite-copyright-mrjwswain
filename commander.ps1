# ============================================================
# VOICE TO WEBSITE — COMMANDER EXECUTOR SYSTEM
# Owner: Mr. J W Swain
# Persistent AI Memory + Autonomous Coding Engine
# ============================================================

cd C:\voicetowebsite-copyright-mrjwswain\

Write-Host "`n=== VOICE TO WEBSITE COMMANDER SYSTEM BOOTING ===`n" -ForegroundColor Cyan

# ------------------------------------------------------------
# Validate OpenAI API Key
# ------------------------------------------------------------
if (-not $env:OPENAI_API) {
    Write-Host "ERROR: OPENAI_API environment variable not found." -ForegroundColor Red
    Write-Host "Fix with:" -ForegroundColor Yellow
    Write-Host 'setx OPENAI_API "your-api-key-here"' -ForegroundColor White
    exit
}

$OPENAI_KEY = $env:OPENAI_API

# ------------------------------------------------------------
# Directory Structure
# ------------------------------------------------------------
$base      = "C:\voicetowebsite-copyright-mrjwswain"
$memoryDir = "$base\memory"
$logsDir   = "$base\logs"

New-Item -ItemType Directory -Force -Path $memoryDir | Out-Null
New-Item -ItemType Directory -Force -Path $logsDir   | Out-Null

# ------------------------------------------------------------
# Persistent Memory File
# ------------------------------------------------------------
$memoryFile = "$memoryDir\commander-profile.json"

if (-not (Test-Path $memoryFile)) {
@"
{
  "owner": "Mr J W Swain",
  "project": "Voice To Website Editor",
  "role": "Commander",
  "interaction_mode": "commands only",
  "coding_rules": "full production scripts only",
  "testing_policy": "always test and auto-fix",
  "execution_policy": "never stop early",
  "priority": "completion over explanation",
  "learned_patterns": []
}
"@ | Set-Content $memoryFile
}

# ------------------------------------------------------------
# Load Memory
# ------------------------------------------------------------
$memory = Get-Content $memoryFile -Raw

# ------------------------------------------------------------
# SYSTEM PROMPT (Executor Brain)
# ------------------------------------------------------------
$systemPrompt = @"
You are operating in COMMANDER–EXECUTOR MODE.

The Commander is the sole authority.
You exist to execute commands.

Rules:
- Do not ask questions unless execution is impossible.
- Always output full working implementations.
- Automatically test all logic.
- If errors occur, fix and continue.
- Never stop early.
- Never give partial solutions.
- Assume modern, secure, production standards.

Execution Loop:
PLAN → BUILD → TEST → FIX → OPTIMIZE → FINALIZE

Commander Memory:
$memory

At the end of your response, include:

MEMORY UPDATE:
- New preferences
- Behavioral patterns
- Execution improvements
"@

# ------------------------------------------------------------
# COMMAND LOOP
# ------------------------------------------------------------
while ($true) {

    Write-Host "`nCOMMANDER > " -NoNewline -ForegroundColor Green
    $command = Read-Host

    if ($command -eq "exit") {
        Write-Host "`nCommander system offline." -ForegroundColor Yellow
        break
    }

    $payload = @{
        model = "gpt-4.1"
        messages = @(
            @{ role = "system"; content = $systemPrompt }
            @{ role = "user"; content = $command }
        )
        temperature = 0.2
    } | ConvertTo-Json -Depth 8

    try {

        $response = Invoke-RestMethod `
            -Uri "https://api.openai.com/v1/chat/completions" `
            -Method POST `
            -Headers @{
                "Authorization" = "Bearer $OPENAI_KEY"
                "Content-Type"  = "application/json"
            } `
            -Body $payload

        $reply = $response.choices[0].message.content

        Write-Host "`n--- EXECUTOR OUTPUT ---`n" -ForegroundColor Cyan
        Write-Host $reply

        # ----------------------------------------------------
        # Log Everything
        # ----------------------------------------------------
        $timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
        $logFile = "$logsDir\$timestamp.txt"
        $reply | Set-Content $logFile

        # ----------------------------------------------------
        # Learning Memory
        # ----------------------------------------------------
        if ($reply -match "MEMORY UPDATE:") {
            $mem = Get-Content $memoryFile -Raw | ConvertFrom-Json
            $mem.learned_patterns += $command
            $mem | ConvertTo-Json -Depth 8 | Set-Content $memoryFile
            Write-Host "[Memory updated]" -ForegroundColor Magenta
        }

    }
    catch {
        Write-Host "`nEXECUTOR FAILURE:" -ForegroundColor Red
        Write-Host $_
    }
}

# ============================================================
# END SYSTEM
# ============================================================
