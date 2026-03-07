# Install Auto-Run Everything as Windows Task
# This script creates a Windows Task Scheduler task to run auto-run-everything on startup

param(
    [string]$ProjectPath = (Get-Location).Path,
    [switch]$Force
)

# Ensure running as Administrator
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "❌ This script must be run as Administrator" -ForegroundColor Red
    Write-Host "🔄 Restarting with elevated privileges..." -ForegroundColor Yellow
    Start-Process PowerShell -Verb RunAs "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`" -ProjectPath `"$ProjectPath`""
    exit
}

Write-Host "🚀 Installing Auto-Run Everything Windows Task..." -ForegroundColor Cyan

# Validate project path
if (-not (Test-Path $ProjectPath)) {
    Write-Host "❌ Project path does not exist: $ProjectPath" -ForegroundColor Red
    exit 1
}

$TaskName = "VoiceToWebsite-AutoRunEverything"
$ScriptPath = Join-Path $ProjectPath "scripts\auto-run-everything.mjs"
$NodePath = "node"

# Check if script exists
if (-not (Test-Path $ScriptPath)) {
    Write-Host "❌ Auto-run script not found: $ScriptPath" -ForegroundColor Red
    exit 1
}

# Check if task already exists
$ExistingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($ExistingTask -and -not $Force) {
    Write-Host "⚠️  Task already exists: $TaskName" -ForegroundColor Yellow
    Write-Host "💡 Use -Force to overwrite or run uninstall first" -ForegroundColor Yellow
    exit 1
}

# Remove existing task if Force is specified
if ($ExistingTask -and $Force) {
    Write-Host "🗑️  Removing existing task..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
}

# Create the task action
$Action = New-ScheduledTaskAction -Execute $NodePath -Argument "`"$ScriptPath`"" -WorkingDirectory $ProjectPath

# Create the trigger (At startup and on logon)
$StartupTrigger = New-ScheduledTaskTrigger -AtStartup
$LogonTrigger = New-ScheduledTaskTrigger -AtLogon

# Create the principal (Run with highest privileges)
$Principal = New-ScheduledTaskPrincipal -UserId "NT AUTHORITY\SYSTEM" -LogonType ServiceAccount -RunLevel Highest

# Create the settings
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RunOnlyIfNetworkAvailable -DontStopOnIdleEnd -WakeToRun

# Register the task
try {
    Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $StartupTrigger -Principal $Principal -Settings $Settings -Description "VoiceToWebsite Auto-Run Everything System" -ErrorAction Stop
    Write-Host "✅ Task registered successfully!" -ForegroundColor Green
    
    # Add logon trigger as additional trigger
    Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $LogonTrigger -Principal $Principal -Settings $Settings -Description "VoiceToWebsite Auto-Run Everything System (Logon)" -ErrorAction SilentlyContinue
    
} catch {
    Write-Host "❌ Failed to register task: $_" -ForegroundColor Red
    exit 1
}

# Create a desktop shortcut for manual control
$DesktopPath = [Environment]::GetFolderPath("Desktop")
$ShortcutPath = Join-Path $DesktopPath "VoiceToWebsite-AutoRun.lnk"
$WScriptShell = New-Object -ComObject WScript.Shell
$Shortcut = $WScriptShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = $NodePath
$Shortcut.Arguments = "`"$ScriptPath`""
$Shortcut.WorkingDirectory = $ProjectPath
$Shortcut.IconLocation = "shell32.dll,25"
$Shortcut.Description = "Start VoiceToWebsite Auto-Run Everything"
$Shortcut.Save()

Write-Host "🔗 Desktop shortcut created: $ShortcutPath" -ForegroundColor Green

# Create environment variables for auto-run configuration
[Environment]::SetEnvironmentVariable("VTW_AUTO_RUN_ENABLED", "1", "User")
[Environment]::SetEnvironmentVariable("VTW_PROJECT_PATH", $ProjectPath, "User")
[Environment]::SetEnvironmentVariable("VTW_AUTO_DEPLOY", "1", "User")
[Environment]::SetEnvironmentVariable("VTW_AUTO_COMMIT", "1", "User")

Write-Host "📝 Environment variables configured" -ForegroundColor Green

# Display final status
Write-Host ""
Write-Host "🎉 Auto-Run Everything installation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Summary:" -ForegroundColor Cyan
Write-Host "  • Task Name: $TaskName" -ForegroundColor White
Write-Host "  • Project Path: $ProjectPath" -ForegroundColor White
Write-Host "  • Script: $ScriptPath" -ForegroundColor White
Write-Host "  • Desktop Shortcut: $ShortcutPath" -ForegroundColor White
Write-Host ""
Write-Host "🔄 The system will now:" -ForegroundColor Cyan
Write-Host "  • Start automatically on Windows startup" -ForegroundColor White
Write-Host "  • Start when you log in" -ForegroundColor White
Write-Host "  • Run development servers automatically" -ForegroundColor White
Write-Host "  • Auto-commit and push changes" -ForegroundColor White
Write-Host "  • Auto-deploy on successful builds" -ForegroundColor White
Write-Host ""
Write-Host "⚙️  To control the system:" -ForegroundColor Cyan
Write-Host "  • Start manually: npm run auto:run" -ForegroundColor White
Write-Host "  • Use desktop shortcut for manual start" -ForegroundColor White
Write-Host "  • Uninstall: npm run auto:run:uninstall" -ForegroundColor White
Write-Host ""
Write-Host "🔧 To customize behavior, edit:" -ForegroundColor Cyan
Write-Host "  • scripts/auto-run-everything.mjs" -ForegroundColor White
Write-Host "  • Environment variables (VTW_*)" -ForegroundColor White
Write-Host ""

# Ask if user wants to start immediately
$StartNow = Read-Host "🚀 Start Auto-Run Everything now? (y/N)"
if ($StartNow -match '^[Yy]') {
    Write-Host "🚀 Starting Auto-Run Everything..." -ForegroundColor Green
    Start-Process -FilePath $NodePath -ArgumentList "`"$ScriptPath`"" -WorkingDirectory $ProjectPath
    Write-Host "✅ Auto-Run Everything started!" -ForegroundColor Green
} else {
    Write-Host "💡 Auto-Run Everything will start on next Windows restart or logon" -ForegroundColor Yellow
}

Write-Host "🎯 Installation complete!" -ForegroundColor Green
