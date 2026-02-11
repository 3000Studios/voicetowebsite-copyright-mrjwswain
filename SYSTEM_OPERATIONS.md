# System Operations (Authoritative)

This repo is designed to be operated by humans and autonomous agents ("bots") without breaking production.

## Non-Negotiables (Ship Gates)

- Always run `npm run verify` before committing or deploying.
- Never commit if `npm run verify` fails.
- Never put secrets in git (no keys/passwords in files or client bundles).
- Production is Cloudflare **Workers** using `wrangler deploy` (not GitHub Actions).
- `DONE` means: deployed live to `voicetowebsite.com` via `npm run deploy`.

## Architecture (What’s Actually Running)

- Runtime: Cloudflare Worker `worker.js` (`wrangler.toml` `main = "worker.js"`).
- Static site: Vite build output in `dist/` served via Worker assets binding `ASSETS`.
- Data:
  - D1 (`D1` binding)
  - KV (`KV` binding)
  - R2 (`R2` binding)
- Global shell UI: `nav.js`, `styles.css` (Worker forces `no-store` caching on these to avoid stale nav).

## Deployment (The Truth)

Source of truth: `DEPLOYMENT.md`.

- Verify:
  - `npm run verify`
- Deploy production:
  - `npm run deploy`
  - This is enforced as: `npm run verify && wrangler deploy --keep-vars` (`package.json`).
- Auto everything (watch -> verify -> commit -> push -> deploy):
  - `npm run auto:ship`

## Things To Not Touch (High-Risk Breakpoints)

- `wrangler.toml` `main = "worker.js"` and `assets = { directory = "dist", binding = "ASSETS" }`
- `wrangler.toml` `routes` for `voicetowebsite.com/*` and `www.voicetowebsite.com/*`
- `package.json` `scripts.verify` and `scripts.deploy`
- `.github/workflows/*` deploy workflows
  - `npm run verify` includes `scripts/guard-deploy.mjs` which blocks CI deploy workflows by design.
- `cloudflare.pages.toml.disabled`
  - Do not rename it back to `cloudflare.pages.toml` or Wrangler may detect Pages and fail `wrangler deploy`.

## Bot Roles (Multi-Agent System)

Source of truth: `AGENT_HANDSHAKE.txt` and `.Jules/*`.

- Commander (you):
  - Sets priorities, approves destructive actions, owns product direction.
- Antigravity (Ops/Architecture):
  - Keeps deploy pipeline stable; prefers `npm run sync`, `npm run verify`, `npm run deploy`.
- Codex / Gemini Code Assist (Implementation):
  - Makes code changes, refactors, fixes, tests, and ships through the gates.
- Jules (Quality/Safety/UX):
  - Enforces: no secret injection, accessibility gatekeeping, reduced motion, admin isolation.

## Bot Communication (How Agents Stay In Sync)

- Shared sources of truth:
  - `PROJECT_NOTES.md`
  - `products.json`
  - `AGENTS.md`, `DEPLOYMENT.md`, `SYSTEM_OPERATIONS.md`
- Shared workflow:
  1. Preflight (below)
  2. Small change set
  3. `npm run verify`
  4. Commit + push
  5. Deploy via `npm run deploy` (if shipping)
- Shared vocabulary:
  - `verify` means `npm run verify`
  - `ship` means commit + push (and deploy only if explicitly requested)
  - `DONE` means deployed to production Workers

## Preflight (Required Before Any Bot Changes Code)

From repo root:

```powershell
git status
git pull --rebase
npm ci
npm run verify
```

If preflight fails:

- Fix the root cause.
- Re-run `npm run verify`.
- Do not commit or deploy until green.

## Environment Variables (Security Rules)

- Any `VITE_*` variable is **public** (it can end up in the client bundle).
- Secrets must be Worker secrets/vars (Cloudflare Dashboard or `wrangler secret put`).
- Never inject secrets into `window.__ENV` (see `.Jules/sentinel.md`).

Practical guidance:

- OK to inject publicly safe values at runtime (Worker does this in HTML):
  - PayPal client id, Stripe publishable key, AdSense publisher/slots.
- Not OK to inject:
  - `CONTROL_PASSWORD`, `LICENSE_SECRET`, `ADMIN_COOKIE_SECRET`, Stripe secret key, PayPal secret, OpenAI keys, Gemini keys.

## Monitoring + Debugging (Cloudflare)

- Logs/traces are enabled in `wrangler.toml` under `[observability]`.
- During incident debugging (local):
  - `wrangler tail` (or Cloudflare dashboard logs) to watch runtime errors.
- When a deploy "succeeds" but UI doesn’t change:
  - Suspect caching. Note: `nav.js` and `styles.css` are forced `no-store` by the Worker.

## Incident Runbooks

Site is down (fast path):

- Revert the breaking commit:
  - `git revert <sha>`
- Verify and redeploy:
  - `npm run verify`
  - `npm run deploy`

Deploy is failing:

- Do not loop commits.
- Fix the root cause, then re-run `npm run verify`, then deploy.

## Monetization System (What Bots Should Optimize For)

Guardrails:

- Respect browser + AdSense expectations:
  - No autoplay audio. Video may autoplay muted only.
  - Clear nav, no deceptive UI, privacy/terms/contact accessible.

Autonomous growth backlog (safe default):

- Performance:
  - compress large images, reduce JS, reduce layout shift, fix console errors.
- SEO:
  - keep `public/sitemap.xml` generation working (runs in `npm run build` via `prebuild`).
  - add page-specific descriptions/OG where missing.
- Conversion:
  - clarify hero copy, single primary CTA, add trust strip, improve pricing clarity.
- Revenue:
  - ensure Stripe/PayPal purchase flows are resilient and logged.
  - add license gating server-side (HttpOnly cookies; signed tokens).

## Creativity Policy (For Bots)

Bots are expected to propose improvements, but must:

- Keep diffs small and reversible.
- Prefer shared layers (`nav.js`, `styles.css`) over editing many pages.
- Add tests when behavior changes.
- Never trade security for convenience (no client-side auth, no secret leakage).

## Workspace + Tooling (Local)

- VS Code settings: `.vscode/settings.json`
- Recommended extensions: `.vscode/extensions.json`
- Dev tasks: `.vscode/tasks.json`

Core commands:

- `npm run dev:all` for local site + worker
- `npm run verify` before committing
- `npm run deploy` for production

## Adding A New Bot (Registration Checklist)

When introducing a new agent/tool:

- Add/update its operational notes in `AGENT_HANDSHAKE.txt`.
- Ensure it follows ship gates (`npm run verify` before commit/deploy).
- Ensure it does not require a laptop-on tunnel for production operations.
- Add a "kill switch":
  - Ability to disable autonomous deploy (`AUTO_SHIP_DEPLOY=0`) or stop a scheduler/task.
