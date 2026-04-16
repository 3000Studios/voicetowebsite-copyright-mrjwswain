# voicetowebsite

Production website and AI system manager for `voicetowebsite.com`.

## What this repo contains

- `frontend/`: Vite + React website UI (public and admin views).
- `server/`: Express API used by local/dev runtime.
- `worker/`: Cloudflare Worker entry used for edge health/proxy behavior.
- `content/`: JSON content source (`pages`, `blog`, `products`, `system`).
- `scripts/`: verification and deploy helper scripts.

## Local quick start

1. Install dependencies:
   - `npm install`
2. Start local app:
   - `npm run dev`
   - for browser live preview + hot reload on your local machine: `npm run dev:live`
3. Verify project:
   - `npm run lint`
   - `npm run test`
   - `npm run build`

## Cloudflare deployment model

This repository is configured for `main` branch production deploys:

- **Cloudflare Pages** deploys `dist/` for the site.
- **Cloudflare Worker** deploys from `worker/worker.js`.

CI workflow: `.github/workflows/production.yml`.

Required GitHub Action secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

## AdSense Auto Ads setup

The site loads Google Auto Ads from `frontend/index.html` using:

- `VITE_ADSENSE_PUBLISHER` (example: `ca-pub-1234567890123456`)

Before production, set `VITE_ADSENSE_PUBLISHER` in your environment so the built HTML contains your real publisher ID.

## Notes for branch strategy

- Production deploy pipeline is triggered from `main`.
- Feature branches can exist for development, but only `main` should represent production-ready state.
