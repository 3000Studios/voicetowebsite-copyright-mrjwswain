# Uninstall Auto-Run Everything Windows Task
# This script removes the Windows Task Scheduler task and related configurations

param(
    [switch]$Force
)

# Ensure running as Administrator
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "❌ This script must be run as Administrator" -ForegroundColor Red
    Write-Host "🔄 Restarting with elevated privileges..." -ForegroundColor Yellow
    Start-Process PowerShell -Verb RunAs "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`" -Force"
    exit
}

Write-Host "🗑️  Uninstalling Auto-Run Everything Windows Task..." -ForegroundColor Cyan

$TaskName = "VoiceToWebsite-AutoRunEverything"
$DesktopPath = [Environment]::GetFolderPath("Desktop")
$ShortcutPath = Join-Path $DesktopPath "VoiceToWebsite-AutoRun.lnk"

# Check if task exists
$ExistingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue

if (-not $ExistingTask) {
    Write-Host "ℹ️  Task not found: $TaskName" -ForegroundColor Yellow
} else {
    # Stop the task if running
    Write-Host "🛑 Stopping running task..." -ForegroundColor Yellow
    Stop-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    
    # Remove the task
    Write-Host "🗑️  Removing task..." -ForegroundColor Yellow
    try {
        Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction Stop
        Write-Host "✅ Task removed successfully" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to remove task: $_" -ForegroundColor Red
    }
}

# Remove desktop shortcut
if (Test-Path $ShortcutPath) {
    Write-Host "🗑️  Removing desktop shortcut..." -ForegroundColor Yellow
    Remove-Item $ShortcutPath -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Desktop shortcut removed" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Desktop shortcut not found" -ForegroundColor Yellow
}

# Remove environment variables
Write-Host "🗑️  Removing environment variables..." -ForegroundColor Yellow
$EnvVars = @(
    "VTW_AUTO_RUN_ENABLED",
    "VTW_PROJECT_PATH", 
    "VTW_AUTO_DEPLOY",
    "VTW_AUTO_COMMIT",
    "VTW_AUTO_PUSH",
    "VTW_AUTO_TEST"
)

foreach ($Var in $EnvVars) {
    try {
        [Environment]::SetEnvironmentVariable($Var, $null, "User")
        Write-Host "✅ Removed: $Var" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Could not remove: $Var" -ForegroundColor Yellow
    }
}

# Kill any running auto-run processes
Write-Host "🛑 Stopping any running auto-run processes..." -ForegroundColor Yellow
$Processes = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -and $_.CommandLine.Contains("auto-run-everything")
}

if ($Processes) {
    $Processes | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Stopped auto-run processes" -ForegroundColor Green
} else {
    Write-Host "ℹ️  No auto-run processes found running" -ForegroundColor Yellow
}

# Clean up any temporary files
$TempFiles = @(
    "$env:TEMP\vtw-auto-run-*",
    "$env:USERPROFILE\AppData\Local\Temp\vtw-auto-run-*"
)

foreach ($File in $TempFiles) {
    if (Test-Path $File) {
        Remove-Item $File -Force -Recurse -ErrorAction SilentlyContinue
        Write-Host "✅ Cleaned temp files: $File" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "🎉 Auto-Run Everything uninstallation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Summary of actions:" -ForegroundColor Cyan
Write-Host "  • Removed Windows Task Scheduler task" -ForegroundColor White
Write-Host "  • Removed desktop shortcut" -ForegroundColor White
Write-Host "  • Removed environment variables" -ForegroundColor White
Write-Host "  • Stopped running processes" -ForegroundColor White
Write-Host "  • Cleaned temporary files" -ForegroundColor White
Write-Host ""
Write-Host "💡 To run Auto-Run Everything manually:" -ForegroundColor Cyan
Write-Host "  • npm run auto:run" -ForegroundColor White
Write-Host "  • Or reinstall: npm run auto:run:install" -ForegroundColor White
Write-Host ""
Write-Host "🔧 To reinstall with different settings:" -ForegroundColor Cyan
Write-Host "  • npm run auto:run:install" -ForegroundColor White
Write-Host "  • Customize scripts/auto-run-everything.mjs first" -ForegroundColor White
Write-Host ""

# Ask if user wants to restart Node services
$RestartServices = Read-Host "🔄 Restart development services now? (y/N)"
if ($RestartServices -match '^[Yy]') {
    Write-Host "🔄 Restarting development services..." -ForegroundColor Green
    Set-Location $PSScriptRoot\..
    Start-Process -FilePath "npm" -ArgumentList "run", "dev:all" -NoNewWindow
    Write-Host "✅ Development services restarted" -ForegroundColor Green
}

Write-Host "🎯 Uninstallation complete!" -ForegroundColor Green
