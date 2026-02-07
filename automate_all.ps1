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
Write-Host "Deploying to Cloudflare Pages..." -ForegroundColor Yellow
npm run deploy
if ($LASTEXITCODE -ne 0) { Write-Error "Deployment failed!"; exit 1 }

Write-Host "Automation Complete! 🚀" -ForegroundColor Green
