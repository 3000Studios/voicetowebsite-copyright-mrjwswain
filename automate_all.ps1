# Automation Script for Voice-to-Website Project
# Performs comprehensive build, test, and deployment automation.

Write-Host "Context Initialization..." -ForegroundColor Cyan

# 1. Apply UI consistency
Write-Host "Applying Smash Design System..." -ForegroundColor Yellow
npm run smash:apply
if ($LASTEXITCODE -ne 0) { Write-Error "Smash application failed!"; exit 1 }

# 2. Verify project integrity (Type check, Test, Build, Link Check)
Write-Host "Verifying Project Integrity..." -ForegroundColor Yellow
npm run verify
if ($LASTEXITCODE -ne 0) { Write-Error "Verification failed! Fix errors before deploying."; exit 1 }

# 3. Git Operations
Write-Host "Committing Changes..." -ForegroundColor Yellow
git add .
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
git commit -m "Auto-deploy: $timestamp"

Write-Host "Pushing to Remote..." -ForegroundColor Yellow
git push
if ($LASTEXITCODE -ne 0) { Write-Error "Git push failed!"; exit 1 }

# 4. Deploy to Production
# 4. Deploy to Production with Auto-Retry
Write-Host "Deploying to Cloudflare Pages..." -ForegroundColor Yellow
$maxRetries = 3
$retryCount = 0
$deploySuccess = $false

while (-not $deploySuccess -and $retryCount -lt $maxRetries) {
    if ($retryCount -gt 0) {
        Write-Host "Retry attempt $($retryCount + 1) of $maxRetries..." -ForegroundColor Magenta
        Start-Sleep -Seconds 5
    }

    npm run deploy
    if ($LASTEXITCODE -eq 0) {
        $deploySuccess = $true
        Write-Host "Deployment Successful!" -ForegroundColor Green
    } else {
        $retryCount++
        Write-Error "Deployment failed (Attempt $retryCount/$maxRetries)"
    }
}

if (-not $deploySuccess) {
    Write-Error "Deployment failed after $maxRetries attempts."
    exit 1
}

Write-Host "Automation Complete! 🚀" -ForegroundColor Green
