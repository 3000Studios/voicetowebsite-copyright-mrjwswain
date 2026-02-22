# GLOBAL SYSTEM INSTRUCTIONS (UPLOADABLE MASTER FILE)

## Mission

- Operate VoiceToWebsite as a stable, fast, monetizable, and secure production system.
- Run autonomous changes without breaking deployment, routing, payments, admin, or trust.

## Commander

- Commander identity: `Mr.jwswain@gmail.com` (Bossman).
- Authority model: Bossman is final business and product authority.
- Hard boundary: no secret leakage, no security sabotage, no destructive bypass of deploy
  safeguards.

## Agent Behavior Rules (Smart Bot Protocol)

- **No silent failures**: If a command or process fails, report the exact error and suggest a fix.
- **No half-wired UI**: Ensure all UI elements are fully functional or hidden/disabled if
  experimental.
- **No duplicate logic**: Centralize business logic in `src/commerce.js` or `worker.js`.
- **Proactive Debugging**: When an error is encountered, the bot MUST search for the root cause
  across logs and related files before asking the user.
- **Fix-First Mentality**: Prioritize fixing broken high-impact features (Payments, Deploy, Admin)
  over aesthetic changes.
- **Self-Healing**: If a task reveals a common error pattern, implement a permanent fix or a
  validator inside the `verify` script.
- **Resilience**: Every change must be reversible or have a forward-fix plan.

## Cross-Agent Collaboration

- Always converge with multi-agent review before high-impact changes:
  - Windsurf: implementation surface + UX assembly
  - Codex: parallel engineering + tests + refactors
  - Gemini: architecture/context + integration reasoning
  - Jules: safety, hygiene, and operational quality
- Canonical invariants:
  - one command parser
  - one action schema
  - one executor with dryRun parity
  - one deploy line

## Deploy Laws (Never Break)

- `npm run verify` must pass before commit/deploy.
- `npm run deploy` remains: `npm run verify && wrangler deploy --keep-vars`.
- Keep Worker wiring intact in `wrangler.toml`:
  - `main = "worker.js"`
  - `assets = { directory = "dist", binding = "ASSETS" }`
  - production routes for `voicetowebsite.com/*` and `www.voicetowebsite.com/*`
- Keep `cloudflare.pages.toml.disabled` disabled.
- Never add CI deploy workflow if guard policy forbids it.

## Security Laws (Never Break)

- Never commit secrets.
- Never expose secrets to client/runtime injection (`window.__ENV`).
- Treat any `VITE_*` value as public.
- Rotate compromised keys immediately.

## Monetization + Growth Priorities

- Keep checkout + entitlement + webhook verification reliable.
- Protect AdSense compliance (no deceptive UI, no forced autoplay audio).
- Optimize performance and conversion together (speed, clarity, trust).

## Change Workbook

- This file is both policy and workbook.
- All structural/ops changes must be reflected here.
- Auto-generated snapshot below must remain fresh.

<!-- AUTO-GENERATED:START -->

## Auto-Generated Workbook Snapshot

### Runtime Profile

- Runtime: Cloudflare Workers + Vite static assets (`worker.js` + `dist/` via `ASSETS` binding)
- Deploy lock: local Wrangler deploy only (`npm run deploy`)
- Deploy safety: `npm run verify` must pass before deploy/commit

### Canonical Commands (from package.json)

- `dev:all`: `node ./scripts/dev-all.mjs`
- `verify`: `node ./scripts/verify.mjs && npm run env:audit && npm run guard:deploy && npm run ops:global-doc:check && npm run format:check && npm run check:css-governance && npm run check:css-budget && npm run type-check && npm run test && npm run build && npm run governance:check && npm run guard:ui && npm run check:links`
- `deploy`: `npm run verify && npm run guard:release-tag && wrangler deploy --keep-vars`
- `auto:ship`: `node ./scripts/auto-ship.mjs`
- `sync`: `node ./scripts/sync.mjs`
- `ship`: `node ./scripts/ship.mjs`
- `ship:push`: `node ./scripts/ship.mjs --push`

### Route Inventory (Detected)

Public pages:

- `/about` -> `about.html`
- `/api-documentation` -> `api-documentation.html`
- `/appstore-new` -> `appstore-new.html`
- `/appstore` -> `appstore.html`
- `/blog` -> `blog.html`
- `/color-synth` -> `color-synth.html`
- `/contact` -> `contact.html`
- `/copyrights` -> `copyrights.html`
- `/cursor-demo` -> `cursor-demo.html`
- `/cyber-blog` -> `cyber-blog.html`
- `/demo` -> `demo.html`
- `/disclosure` -> `disclosure.html`
- `/features` -> `features.html`
- `/focus-timer` -> `focus-timer.html`
- `/gallery` -> `gallery.html`
- `/geological-studies` -> `geological-studies.html`
- `/how-it-works` -> `how-it-works.html`
- `/` -> `index.html`
- `/legal` -> `legal.html`
- `/lexicon-pro` -> `lexicon-pro.html`
- `/license` -> `license.html`
- `/livestream` -> `livestream.html`
- `/memory-matrix` -> `memory-matrix.html`
- `/neon-snake` -> `neon-snake.html`
- `/neural-engine` -> `neural-engine.html`
- `/partners` -> `partners.html`
- `/pricing` -> `pricing.html`
- `/privacy` -> `privacy.html`
- `/project-planning-hub` -> `project-planning-hub.html`
- `/projects` -> `projects.html`
- `/referrals` -> `referrals.html`
- `/rush-percussion` -> `rush-percussion.html`
- `/sandbox` -> `sandbox.html`
- `/search` -> `search.html`
- `/seo-template` -> `seo-template.html`
- `/status` -> `status.html`
- `/store` -> `store.html`
- `/strata-design-system` -> `strata-design-system.html`
- `/stripe-connect-dashboard` -> `stripe-connect-dashboard.html`
- `/stripe-connect-storefront` -> `stripe-connect-storefront.html`
- `/studio3000` -> `studio3000.html`
- `/support` -> `support.html`
- `/templates` -> `templates.html`
- `/terms` -> `terms.html`
- `/the3000-gallery` -> `the3000-gallery.html`
- `/the3000` -> `the3000.html`
- `/trust` -> `trust.html`
- `/voice-to-json` -> `voice-to-json.html`
- `/webforge` -> `webforge.html`
- `/zen-particles` -> `zen-particles.html`

Admin pages:

- `/admin/access` -> `admin/access.html`
- `/admin/analytics-enhanced` -> `admin/analytics-enhanced.html`
- `/admin/analytics` -> `admin/analytics.html`
- `/admin/app-store-manager` -> `admin/app-store-manager.html`
- `/admin/bot-command-center` -> `admin/bot-command-center.html`
- `/admin/customer-chat` -> `admin/customer-chat.html`
- `/admin` -> `admin/index.html`
- `/admin/integrated-dashboard` -> `admin/integrated-dashboard.html`
- `/admin/live-stream-enhanced` -> `admin/live-stream-enhanced.html`
- `/admin/live-stream` -> `admin/live-stream.html`
- `/admin/login` -> `admin/login.html`
- `/admin/nexus` -> `admin/nexus.html`
- `/admin/progress` -> `admin/progress.html`
- `/admin/store-manager` -> `admin/store-manager.html`
- `/admin/test-lab-1` -> `admin/test-lab-1.html`
- `/admin/test-lab-2` -> `admin/test-lab-2.html`
- `/admin/test-lab-3` -> `admin/test-lab-3.html`
- `/admin/voice-commands` -> `admin/voice-commands.html`
- `/admin/wallpaper` -> `admin/wallpaper.html`

App Store pages:

- `/apps/audioboost-pro-ai` -> `app Store apps to Sell/audioboost-pro-ai/index.html`
- `/apps/project-planning-hub` -> `app Store apps to Sell/project-planning-hub/index.html`

### Bot Tooling & Workspace

Scripts available:

- `scripts/auto-ship-runner.ps1`
- `scripts/auto-ship.mjs`
- `scripts/autopilot.mjs`
- `scripts/check-css-governance.mjs`
- `scripts/css-budget-validator.mjs`
- `scripts/dev-all.mjs`
- `scripts/env-audit.mjs`
- `scripts/generate-config.mjs`
- `scripts/generate-sitemap.mjs`
- `scripts/guard-deploy.mjs`
- `scripts/guard-release-tag.mjs`
- `scripts/guard-ui.mjs`
- `scripts/heal.mjs`
- `scripts/husky-install.mjs`
- `scripts/install-auto-ship-task.ps1`
- `scripts/install-bots.ps1`
- `scripts/install-jules.ps1`
- `scripts/install-vscode-extensions.ps1`
- `scripts/jules-setup.sh`
- `scripts/open-facebook.ps1`
- `scripts/open-snapchat.ps1`
- `scripts/open-voicetowebsite.ps1`
- `scripts/open-vtw-admin.ps1`
- `scripts/open-vtw-voice-commands.ps1`
- `scripts/open-youtube.ps1`
- `scripts/performance-benchmark.mjs`
- `scripts/pre-push.mjs`
- `scripts/release.mjs`
- `scripts/restore.mjs`
- `scripts/ship.mjs`
- `scripts/sync-public-assets.mjs`
- `scripts/sync.mjs`
- `scripts/test-checkout-flow.mjs`
- `scripts/test-runner.mjs`
- `scripts/uninstall-auto-ship-task.ps1`
- `scripts/update-global-system-doc.mjs`
- `scripts/validate-governance.mjs`
- `scripts/verify.mjs`

Git hooks:

- `.husky/pre-commit`
- `.husky/pre-push`

Recommended VS Code extensions:
_None found_

Core governance docs present:

- `AGENTS.md`
- `DEPLOYMENT.md`
- `SYSTEM_OPERATIONS.md`
- `EXECUTION.md`
- `ENV_GUIDE.md`
- `GLOBAL_SYSTEM_INSTRUCTIONS.md`

### Environment Keys (Detected, names only)

- `ADMIN_COOKIE_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_ROLE`
- `ADSENSE_MAX_SLOTS`
- `ADSENSE_MODE`
- `ADSENSE_PUBLISHER`
- `ADSENSE_SLOT`
- `ADSENSE_SLOT_BOTTOM`
- `ADSENSE_SLOT_MID`
- `ADSENSE_SLOT_TOP`
- `ALLOW_ADMIN_HEADER_TOKEN`
- `ALLOW_INSECURE_ADMIN_COOKIE_SECRET`
- `CF_ACCOUNT_API_VOICETOWEBSITE`
- `CF_API_TOKEN`
- `CF_API_TOKEN2`
- `CF_DEPLOY_HOOK_URL`
- `CF_PAGES_DEPLOY_HOOK`
- `CF_USER_TOKEN`
- `CF_WORKERS_BUILDS_AUTO_DEPLOY`
- `CF_ZONE_ID`
- `CLOUDFLARE_ACCOUNT_ID`
- `CONTROL_PASSWORD`
- `DEMO_EMAIL_FROM`
- `GH_BASE_BRANCH`
- `GH_BOT_TOKEN`
- `GH_REPO`
- `GH_TOKEN`
- `LICENSE_SECRET`
- `OPENAI_API`
- `OPENAI_API_KEY3`
- `OPENAI_MODEL`
- `ORCH_TOKEN`
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_ID_PROD`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_CLIENT_SECRET_PROD`
- `PAYPAL_ENV`
- `PAYPAL_PAYMENT_LINK_AI_DRIVE`
- `PAYPAL_PAYMENT_LINK_ENTERPRISE`
- `PAYPAL_PAYMENT_LINK_GOOGLE_PROMPTS`
- `PAYPAL_PAYMENT_LINK_GROWTH`
- `PAYPAL_PAYMENT_LINK_LIFETIME`
- `PAYPAL_PAYMENT_LINK_PROJECT_PLANNING_HUB`
- `PAYPAL_PAYMENT_LINK_STARTER`
- `PAYPAL_PAYMENT_LINK_WEB_FORGE`
- `PERSONAL_ACCESS_TOKEN_API`
- `RESEND_API_KEY`
- `SENDGRID_API_KEY`
- `STRIPE_ALLOW_CUSTOM_AMOUNT`
- `STRIPE_BUY_BUTTON_ID_ENTERPRISE`
- `STRIPE_BUY_BUTTON_ID_GROWTH`
- `STRIPE_BUY_BUTTON_ID_LIFETIME`
- `STRIPE_BUY_BUTTON_ID_STARTER`
- `STRIPE_PAYMENT_LINK_ENTERPRISE`
- `STRIPE_PAYMENT_LINK_GROWTH`
- `STRIPE_PAYMENT_LINK_LIFETIME`
- `STRIPE_PAYMENT_LINK_STARTER`
- `STRIPE_PAYMENT_METHOD_TYPES`
- `STRIPE_PRICE_ENTERPRISE`
- `STRIPE_PRICE_GROWTH`
- `STRIPE_PRICE_LIFETIME`
- `STRIPE_PRICE_STARTER`
- `STRIPE_PUBLIC`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `VITE_GEMINI_MODEL`
- `VITE_GEMINIAPIKEY2`
- `VITE_PAYPAL_CLIENT_ID`
- `VOICETOWEBSITE_WORKERS_BUILD_TOKEN`

### Auto-Update Contract

- This snapshot is generated by `scripts/update-global-system-doc.mjs`.
- Pre-commit runs update automatically and stages this file.
- Verify enforces freshness with `npm run ops:global-doc:check`.
<!-- AUTO-GENERATED:END -->
