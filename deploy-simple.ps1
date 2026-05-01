# GLOBAL DEPLOYMENT RULE: Single repo, single branch, single Cloudflare Page
# This script ALWAYS deploys to voicetowebsite.com and www.voicetowebsite.com
# NEVER creates custom domains or separate deployments

Write-Host "DEPLOYING TO voicetowebsite.com (GLOBAL RULE: SINGLE DOMAIN)" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# Build the project
Write-Host "Building project..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

# Deploy to main Cloudflare Pages project
Write-Host "Deploying to voicetowebsite.com..." -ForegroundColor Green
npx wrangler pages deploy dist --project-name voicetowebsite --commit-dirty=true

if ($LASTEXITCODE -ne 0) {
    Write-Host "Deployment failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host "Live at: https://voicetowebsite.com" -ForegroundColor Cyan
Write-Host "Also at: https://www.voicetowebsite.com" -ForegroundColor Cyan
Write-Host ""
Write-Host "GLOBAL RULE ENFORCED: Single repo, single branch, single Cloudflare Page" -ForegroundColor Yellow
