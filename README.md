# VoiceToWebsite

© 2026 Mr. jwswain. All rights reserved. Patent Pending. This codebase is proprietary and not licensed for redistribution or reuse without written permission.

## Overview
Voice-driven site + admin console served by a Cloudflare Worker (`worker.js`) with static assets from `dist`. Routes in `wrangler.toml` target `voicetowebsite.com/*` and `www.voicetowebsite.com/*`. Admin lives at `/admin`; orchestration endpoint is `/api/orchestrator` (`functions/orchestrator.js`).

## Runtime secrets (Worker)
- `OPENAI_API`
- `OPENAI_MODEL` (optional, default: gpt-4o-mini)
- `GITHUB_TOKEN` / `GH_TOKEN` / `GH_BOT_TOKEN` (repo write scope)
- `GITHUB_REPO` (owner/repo)
- `GITHUB_BASE_BRANCH` (default: main)
- `ADMIN_ROLE` (optional)
- `PAYPAL_CLIENT_ID_PROD` (optional)
- `ADSENSE_PUBLISHER` (optional)
- `ADSENSE_SLOT` (optional)
- `DB` (D1 binding) for command logs

## Deploy
```bash
npm install
npm run build
wrangler publish
```

Ensure `wrangler.toml` has your `account_id`, `zone_id`, and routes for `voicetowebsite.com/*`.

## Ownership files
- `OWNER.md`
- `COPYRIGHT`
- `PATENT_PREP.md`
