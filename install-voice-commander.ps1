# ============================================================
# VOICE TO WEBSITE – FULL COMMANDER INSTALLER
# Owner: Mr. J W. Swain
# ============================================================

$BASE = "C:\voicetowebsite-copyright-mrjwswain"
$MODULES = "$BASE\modules"
$MEMORY = "$BASE\memory"
$VAULT = "$BASE\vault"
$LOGS = "$BASE\logs"

Write-Host "`n=== INSTALLING VOICE COMMANDER SYSTEM ===`n" -ForegroundColor Cyan

# ------------------------------------------------------------
# Create folders
# ------------------------------------------------------------
$dirs = @($BASE,$MODULES,$MEMORY,$VAULT,$LOGS)
foreach ($d in $dirs) {
    New-Item -ItemType Directory -Force -Path $d | Out-Null
}

# ------------------------------------------------------------
# Encrypted Vault (DPAPI)
# ------------------------------------------------------------
$vaultFile = "$VAULT\openai.secure"

if (-not (Test-Path $vaultFile)) {
    if (-not $env:OPENAI_API) {
        Write-Host "OPENAI_API not found in environment." -ForegroundColor Red
        Write-Host "Run: setx OPENAI_API `"your-key`"" -ForegroundColor Yellow
        exit
    }

    $secure = ConvertTo-SecureString $env:OPENAI_API -AsPlainText -Force
    $secure | ConvertFrom-SecureString | Set-Content $vaultFile
    Write-Host "Encrypted API vault created." -ForegroundColor Green
}

# ------------------------------------------------------------
# Memory Engine
# ------------------------------------------------------------
$memoryFile = "$MEMORY\commander-memory.json"

if (-not (Test-Path $memoryFile)) {
@"
{
  "preferred_languages": [],
  "frameworks": [],
  "testing_tools": [],
  "patterns": [],
  "approved_actions": []
}
"@ | Set-Content $memoryFile
}

# ------------------------------------------------------------
# Retry Engine Module
# ------------------------------------------------------------
@"
param(\$ScriptBlock,\$Max=5)

for (\$i=1; \$i -le \$Max; \$i++) {
    try {
        & \$ScriptBlock
        return
    } catch {
        Write-Host "Retry \$i failed..."
        Start-Sleep 2
    }
}
throw "Maximum retries exceeded"
"@ | Set-Content "$MODULES\retry.ps1"

# ------------------------------------------------------------
# Test Engine
# ------------------------------------------------------------
@"
if (Test-Path package.json) { npm test }
elseif (Get-ChildItem -Recurse *.py) { pytest }
elseif (Get-ChildItem -Recurse *.csproj) { dotnet test }
else { Write-Host 'No test framework detected.' }
"@ | Set-Content "$MODULES\test.ps1"

# ------------------------------------------------------------
# Voice Commander
# ------------------------------------------------------------
@"
Add-Type -AssemblyName System.Speech
\$rec = New-Object System.Speech.Recognition.SpeechRecognitionEngine
\$rec.SetInputToDefaultAudioDevice()
\$rec.LoadGrammar((New-Object System.Speech.Recognition.DictationGrammar))
\$rec.RecognizeAsync([System.Speech.Recognition.RecognizeMode]::Multiple)

Write-Host 'Voice Commander active...'

while (\$true) {
    \$result = \$rec.Recognize()
    if (\$result) {
        \$text = \$result.Text
        Write-Host \"VOICE > \$text\" -ForegroundColor Cyan
        Add-Content \"$BASE\voice-input.txt\" \$text
    }
}
"@ | Set-Content "$MODULES\voice.ps1"

# ------------------------------------------------------------
# Main Commander
# ------------------------------------------------------------
@"
cd $BASE

function Get-ApiKey {
    \$raw = Get-Content '$vaultFile'
    \$sec = ConvertTo-SecureString \$raw
    [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR(\$sec)
    )
}

\$API = Get-ApiKey

Write-Host 'COMMANDER SYSTEM ONLINE' -ForegroundColor Green

while (\$true) {
    Write-Host ''
    Write-Host 'COMMANDER > ' -NoNewline -ForegroundColor Green
    \$cmd = Read-Host

    if (\$cmd -eq 'exit') { break }

    try {
        . '$MODULES\retry.ps1' -ScriptBlock {
            Write-Host \"Executing: \$cmd\"
        }

        . '$MODULES\test.ps1'

        Add-Content '$LOGS\commands.log' \"\$cmd\"

    } catch {
        Write-Host \"ERROR: \$_\" -ForegroundColor Red
    }
}
"@ | Set-Content "$BASE\commander.ps1"

# ------------------------------------------------------------
# Optional Watchdog (user-visible scheduled task)
# ------------------------------------------------------------
$task = Get-ScheduledTask -TaskName "VoiceCommanderWatchdog" -ErrorAction SilentlyContinue
if (-not $task) {
    $action = New-ScheduledTaskAction -Execute "powershell.exe" `
        -Argument "-ExecutionPolicy Bypass -File `"$BASE\commander.ps1`""
    $trigger = New-ScheduledTaskTrigger -AtLogOn
    Register-ScheduledTask -TaskName "VoiceCommanderWatchdog" `
        -Action $action -Trigger $trigger -Description "Voice Commander Auto Start"
    Write-Host "Watchdog scheduled task installed." -ForegroundColor Yellow
}

Write-Host "`nINSTALL COMPLETE." -ForegroundColor Cyan
Write-Host "Run:  $BASE\commander.ps1"
Write-Host "Voice input logs to voice-input.txt"

