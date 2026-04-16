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

## Dev container

A dev container is included at `.devcontainer/devcontainer.json`.

Use it when you want a reproducible environment (same tools/versions on every machine).  
If local Node/Docker setup already works and you prefer native speed, local development is also supported.

## Notes for branch strategy

- Production deploy pipeline is triggered from `main`.
- Feature branches can exist for development, but only `main` should represent production-ready state.
