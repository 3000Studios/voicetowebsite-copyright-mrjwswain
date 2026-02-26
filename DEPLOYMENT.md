# Deployment (Authoritative)

This repo deploys the live site to Cloudflare **Workers**. Production deploy is **manual only**: CI
runs `npm run verify` on push/PR but **does not** run `wrangler deploy`. You deploy from your
machine after verify passes. `scripts/guard-deploy.mjs` fails verify if any workflow runs
`wrangler deploy` or uses `cloudflare/wrangler-action`, so broken builds cannot reach production via
CI.

## Commands (One-Liners)

- Verify (must pass before any commit/deploy):
  - `npm run verify`
- Local dev:
  - `npm run dev:all`
- **Ship (full pipeline: lint, verify, push, deploy, logs):**
  - `npm run ship`
- Deploy only (e.g. after verify or when ship is not needed):
  - `npm run deploy`
- Emergency rollback (resets to previous commit and force-pushes main):
  - `npm run rollback`
- Auto everything (watch -> verify -> commit -> push -> deploy locally):
  - `npm run auto:ship`

## What `npm run verify` Does

`npm run verify` runs, in order:

1. `node ./scripts/verify.mjs`, `npm run env:audit`, `npm run guard:deploy`,
   `npm run ops:global-doc:check`
2. `npm run format:check`
3. `npm run type-check`
4. `npm run test`
5. `npm run build` (generates `dist/`)
6. `npm run governance:check`, `npm run guard:ui`, `npm run check:links`

If any step fails: fix the issue and re-run `npm run verify`. Do not commit/deploy.

## Manual Production Deploy (Recommended When You’re Driving)

From repo root:

```powershell
git pull --rebase
npm ci
npm run verify
npm run deploy
```

Notes:

- `npm run deploy` runs `wrangler deploy --keep-vars` only (no verify). Always run `npm run verify`
  first, then `npm run deploy`. CI does not deploy; guard-deploy blocks adding deploy workflows.
- The Worker refuses traffic if `ENVIRONMENT` is set to anything other than `production` or
  `development` (e.g. blocks staging-from-production config).
- `--keep-vars` prevents Wrangler from wiping runtime vars/secrets set in the Cloudflare Dashboard.
- `wrangler.toml` deploys `worker.js` with static assets from `dist/` via the `ASSETS` binding.
- Production routes are `voicetowebsite.com/*` and `www.voicetowebsite.com/*`.

## Auto-Ship (Hands-Free Local Operator)

Start it once and leave it running:

```powershell
npm run auto:ship
```

Behavior:

- Watches the repo for changes.
- Runs `npm run verify`.
- If verify passes, it commits + pushes to `origin/main`.
- Then it deploys with `wrangler deploy --keep-vars` (by default).

Tune via env vars (optional):

- `AUTO_SHIP_DEPLOY=0` disables deploy (verify/commit/push only).
- `AUTO_SHIP_DEPLOY_CMD="..."` overrides the deploy command.

## Required Cloudflare Setup (Runtime Vars/Secrets)

Do not commit secrets to git.

- Runtime vars/secrets must be configured in the Cloudflare Dashboard (Worker settings) or via:
  - `wrangler secret put <NAME>`

**Minimum for deploy:** Wrangler auth (login or API token). The `ASSETS` binding is set by
`wrangler.toml` (no manual var). For admin login set `CONTROL_PASSWORD` (or `ADMIN_ACCESS_CODE`).
For PayPal/Stripe and other features, set the vars listed in `ENV_SCHEMA.md` and Dashboard.

**Custom GPT → deploy live:** VoiceToWebsite Commander:
[https://chatgpt.com/g/g-698a3140739c819196fda7f3badb2754-voicetowebsite-commander](https://chatgpt.com/g/g-698a3140739c819196fda7f3badb2754-voicetowebsite-commander).
To have it push changes and trigger an immediate deploy without GitHub Actions, set
`ALLOW_REMOTE_DEPLOY_TRIGGER=1` and `CF_DEPLOY_HOOK_URL` to a URL that runs
`scripts/remote-deploy.mjs` (pull, build, wrangler deploy). The GPT then POSTs to
`/api/admin/trigger-deploy` with admin auth after pushing to main. See `docs/CUSTOM_GPT_DEPLOY.md`.

At minimum, to deploy from a new machine you typically need Wrangler authentication (login or API
token).

## Local development: ENVIRONMENT

For local runs (`wrangler dev`), set `ENVIRONMENT=development` so dev does not behave like
production. `wrangler.toml` [vars] sets `ENVIRONMENT = "production"` for deployed Workers.

- Create a `.dev.vars` file in the repo root (do not commit it if it contains secrets).
- Add: `ENVIRONMENT=development`
- Wrangler loads `.dev.vars` in dev and overrides [vars]; production keeps `ENVIRONMENT=production`.

If you omit `.dev.vars`, local dev will use production flags from `wrangler.toml`.

## Monetization authority (AdSense, etc.)

**Chosen: environment-driven.** Env is the single source of truth for production.

- **Source of truth:** `env.ADSENSE_*` (and other monetization vars in `wrangler.toml` / Dashboard).
  The Worker does not read `adsense.json` for request-time decisions.
- **Config file:** `public/config/adsense.json` is for tooling only (build, admin UI). Keep it in
  sync with env if something consumes it; do not use it to gate or configure runtime behavior.
- **Ambiguity removed:** Production monetization is **env-driven**. Config-driven behavior is not
  used at runtime.

## When you push to main, what triggers production?

**Answer: nothing automatic.** Production deploy is **manual** unless you change configuration.

| Mechanism                          | Used?        | Notes                                                                                                                                                                                                                                                                                                                                                     |
| ---------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **wrangler deploy manually**       | **Yes**      | You run `npm run deploy` (or `wrangler deploy --keep-vars`) from your machine. Push to `main` does not run this.                                                                                                                                                                                                                                          |
| **GitHub Action**                  | **No**       | `scripts/guard-deploy.mjs` fails verify if a workflow runs `wrangler deploy`. No CI deploy.                                                                                                                                                                                                                                                               |
| **Cloudflare auto-build from Git** | **No**       | `CF_WORKERS_BUILDS_AUTO_DEPLOY=0` in `wrangler.toml`. Workers Builds is not configured to deploy on push.                                                                                                                                                                                                                                                 |
| **Deploy hook**                    | **Optional** | `CF_DEPLOY_HOOK_URL` / `CF_PAGES_DEPLOY_HOOK` are used by the **orchestrator** when a user runs a “deploy” command from the app; the Worker calls the hook. So “deploy” in-product can trigger an external deploy (e.g. Cloudflare Pages or a custom endpoint). That is **not** “push to main → deploy”; it is “user clicked deploy → Worker calls hook”. |

So: **push to main does not trigger production.** You must run `wrangler deploy` (or use the in-app
deploy flow that hits the hook). The env vars `CF_WORKERS_BUILDS_AUTO_DEPLOY`, `CF_DEPLOY_HOOK_URL`,
`CF_PAGES_DEPLOY_HOOK`, `GH_BASE_BRANCH`, `GH_REPO` support the **orchestrator’s deploy flow** (e.g.
calling a hook, or reporting “queued” when auto-deploy is enabled elsewhere); they do not by
themselves make “push → production” happen.

## Deployment method (current)

Deployment is **manual from your machine**:

- **No** Cloudflare Git auto-deploy (repo not connected to Workers “Deploy from Git”).
- **No** GitHub Actions deploy (guard-deploy blocks adding deploy workflows).
- **Canonical path:** `npm run verify` then `npm run deploy` (which runs
  `wrangler deploy --keep-vars`).

So today: **wrangler deploy manually** after push. To add “push → verify → deploy → rollback if
fail” you would either:

1. **Keep manual:** run `npm run verify && npm run deploy` locally after each push, with rollback
   via `git revert` + redeploy, or
2. **Enable remote deploy:** connect the repo to Cloudflare (Git integration or API) and configure
   auto-deploy on push to `main`, with a post-deploy verify/rollback step, or
3. **Unblock CI deploy:** remove or relax guard-deploy and add a GitHub Action that runs verify and
   then `wrangler deploy` (with secrets in GitHub), plus optional rollback on failure.

Once you choose one of these, we can wire the exact steps (e.g. “Push → Auto Verify → Auto Deploy →
Auto Rollback if fail”).

## Remote Auto-Deploy (Disabled by Default)

To keep deployments unified to a single revision source, remote deploy triggers are disabled by
default. Canonical production path is local:

1. `npm run verify`
2. `npm run deploy`

Notes:

- Remote/API deploy routes are blocked unless `ALLOW_REMOTE_DEPLOY_TRIGGER=1`.
- Keep `CF_WORKERS_BUILDS_AUTO_DEPLOY=0` and `CF_ALLOW_LEGACY_DEPLOY_HOOKS=0` for unified deploy
  behavior.

## Rollback

Fast rollback approach:

```powershell
git revert <bad_commit_sha>
npm run verify
npm run deploy
```

Or redeploy a known-good commit by checking it out in a temporary branch and deploying it.
