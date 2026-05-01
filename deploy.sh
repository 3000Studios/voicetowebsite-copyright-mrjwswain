#!/bin/bash

# GLOBAL DEPLOYMENT RULE: Single repo, single branch, single Cloudflare Page
# This script ALWAYS deploys to voicetowebsite.com and www.voicetowebsite.com
# NEVER creates custom domains or separate deployments

set -e

echo "🚀 DEPLOYING TO voicetowebsite.com (GLOBAL RULE: SINGLE DOMAIN)"
echo "=================================================="

# Build the project
echo "📦 Building project..."
npm run build

# Deploy to main Cloudflare Pages project
echo "🌍 Deploying to voicetowebsite.com..."
CLOUDFLARE_API_TOKEN=$CLOUDFLARE_API_TOKEN npx wrangler pages deploy dist --project-name voicetowebsite --commit-dirty=true

echo "✅ Deployment complete!"
echo "🌐 Live at: https://voicetowebsite.com"
echo "🌐 Also at: https://www.voicetowebsite.com"
echo ""
echo "⚠️  GLOBAL RULE ENFORCED: Single repo, single branch, single Cloudflare Page"
