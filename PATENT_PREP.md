# Patent Preparation Notes (Proprietary)

Copyright (c) 2026 Mr. jwswain. All rights reserved.

Use this as the working draft for counsel. Do not distribute without written permission.

## Core invention

- Title: Voice-driven site editing and auto-deploy orchestration for static sites (Cloudflare
  Worker + AI plan/apply loop).
- Inventor: Mr. jwswain
- Summary: Voice/typed commands are turned into structured actions by an AI orchestrator, applied to
  source files, auto-committed to the repo, and deployed via CI to Cloudflare. Includes live
  preview/admin console, plan/apply safety, and environment-aware file edits (HTML/CSS/JS).

## Problem solved

- Manual web edits and deployments are slow and error-prone; non-technical users cannot safely
  edit/ship changes.

## Solution overview

- Client: Admin console with speech-to-text, plan/apply, iframe preview, and history.
- Orchestrator (Cloudflare Worker): AI planning (OpenAI), action execution on repo files, Git commit
  to `main`, CI auto-deploy via Wrangler.
- Targets: Static HTML/CSS/JS bundle (Vite), Cloudflare Worker routes (youtuneai.com/\*), D1 + KV
  logging.

## System architecture

- Frontend: `admin/index.html`, `admin/admin.js` (voice UI), `index.html` loads `app.js` for runtime
  copy/state, Vite build.
- Worker: `worker.js` routes `/api/orchestrator` → `functions/orchestrator.js` (live apply) and
  serves static assets.
- Git/CI: GitHub Actions `.github/workflows/deploy.yml` uses `CF_API_TOKEN`/`CF_ACCOUNT_ID` to run
  `wrangler deploy`.
- Data/logs: D1 (`commands` table) for history, optional KV (`LEARN`) for recent commands.
- Secrets: `OPENAI_API`, `GH_TOKEN/GH_BOT_TOKEN`, `GH_REPO`, `GH_BASE_BRANCH`, `CF_API_TOKEN`,
  `CF_ACCOUNT_ID`, optional PayPal/AdSense.

## Key workflows (step-by-step)

1. User speaks/types command in admin UI → POST `/api/orchestrator` mode=plan/apply.
2. Orchestrator calls OpenAI (fallback heuristics if needed) to get structured actions.
3. Apply: fetches repo files (app.js, index.html, styles.css, new pages), mutates according to
   actions, commits directly to `main` via GitHub API.
4. CI: GitHub Actions auto-runs build + `wrangler deploy` to Cloudflare, updating worker + assets.
5. Runtime: `app.js` state hydrates UI; new storage key `youtuneai-state-v2` flushes stale local
   data.

## Differentiators (novel points)

- Voice-driven plan/apply loop that directly edits source, commits, and deploys without human
  merging.
- Action schema covering copy, theme, media, monetization, new pages, and CSS injection with preview
  application.
- Dual data-plane logging (D1 + KV) for command traceability.
- Cloudflare Worker wrapper that injects assets and handles admin logs/routes.

## Files of interest (current)

- `worker.js`, `functions/orchestrator.js`, `admin/admin.js`, `app.js`, `index.html`, `styles.css`,
  `readme.md`, `COPYRIGHT`, `PATENT_PREP.md`.

## Prior art notes (to be completed)

- List closest products/papers/patents with similar voice-to-deploy flows, AI site editors, or
  CI-integrated LLM actions. Note differences for claim support.

## Evidence

- Commits showing automated apply: e.g., `fcb29e6a3a78f49ba7f7d4127cffce0945cf7e85` (headline
  update), `7783787992d5a004e8faa1cef2a81b261add19cf` (CTA update), `37e55b6` (copyright), `c195e27`
  (load app.js).
- CI success run after CF token fix (Deploy to Cloudflare workflow green on 2026-01-18).

## Claim skeleton (draft for counsel)

- A method of receiving natural-language commands, generating structured web-edit actions via an AI
  model, applying actions to source files of a static site, committing to a repository, and
  triggering automated deployment to an edge worker environment; with optional live preview,
  monetization injection, and logging of actions to database/kv.

## Outstanding items for filing

- Add detailed sequence diagrams and screenshots of admin console + apply logs.
- Complete prior art list and distinctions.
- Confirm jurisdiction and inventor entity details for application.
- Ensure all contributors have IP assignment to Mr. jwswain.

## Confidentiality

This document is confidential and proprietary. Do not disclose publicly. All rights reserved.
