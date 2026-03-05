# Deployment (Authoritative)

This repo deploys the live site to Cloudflare **Workers**. **Push to `main`** triggers the GitHub
Action **Deploy to Cloudflare Worker**, which runs `npm ci`, `npm run verify`, and Wrangler deploy
(requires `CF_API_TOKEN` and `CF_ACCOUNT_ID` in repo secrets).

**Secrets / env at a glance**

| Variable                | Where to set it                  | Purpose                                  |
| ----------------------- | -------------------------------- | ---------------------------------------- |
| `GH_TOKEN`              | GitHub repo secrets / local      | GitHub API (deploy hooks, repo access).  |
| `CF_ACCOUNT_ID`         | GitHub repo secrets              | Cloudflare account ID for CI deploy.     |
| `CLOUDFLARE_ACCOUNT_ID` | Local env (for `npm run deploy`) | Same as above; Wrangler reads this name. |
| `CLOUDFLARE_API_TOKEN`  | GitHub secrets + local           | Cloudflare API auth for deploy.          |

## Commands (One-Liners)

- Verify (must pass before any commit/deploy):
  - `npm run verify`
- Local dev:
  - `npm run dev:all`
- Deploy production (local; optional—GitHub deploys on push to main):
  - `npm run deploy`
- Emergency rollback (resets to previous commit and force-pushes main):
  - `npm run rollback`
- Auto everything (watch -> verify -> commit -> push; GitHub Action deploys):
  - `npm run auto:ship`

## What `npm run verify` Does

`npm run verify` runs, in order:

1. `node ./scripts/verify.mjs`, `npm run env:audit`, `npm run ops:global-doc:check`
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

- `npm run deploy` runs `wrangler deploy --keep-vars` only (no verify). Use after a local build when
  you need to deploy from your machine; normally GitHub Actions deploys on push to main.
- For local deploy, set `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` in your environment (e.g.
  in PowerShell: `$env:CLOUDFLARE_API_TOKEN = "your-token"` and
  `$env:CLOUDFLARE_ACCOUNT_ID = "your-account-id"`).

**Fix "Authentication failed (status: 400) [code: 9106]":** This means Wrangler cannot authenticate
to the Workers API. (1) **Easiest:** run `npx wrangler login`, sign in in the browser, then run
`npm run deploy` again. (2) **Or use an API token:** create one at
[Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens) using the **Edit Cloudflare
Workers** template; set `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` (account ID is in
Dashboard → Workers → sidebar). Ensure the token is for the same account and not expired. (3) Check
auth with `npx wrangler whoami` before deploying.

- The Worker refuses traffic if `ENVIRONMENT` is set to anything other than `production` or
  `development` (e.g. blocks staging-from-production config).
- `--keep-vars` prevents Wrangler from wiping runtime vars/secrets set in the Cloudflare Dashboard.
- `wrangler.toml` deploys `worker.js` with static assets from `dist/` via the `ASSETS` binding. Keep
  `compatibility_date` current; after changing bindings run `npm run types` to regenerate
  `worker-configuration.d.ts`.
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

## Main Branch Release Flow (Locked)

Use this order unless explicitly overridden:

1. `npm run verify`
2. `npm run ship`
3. `npm run ship:push`
4. `npm run deploy` (or rely on CI deploy-on-push to `main`)
5. Confirm deploy/build success and report

Hard rules:

- Never commit or deploy on red.
- Never skip verify.
- Keep Cloudflare Workers + Wrangler as the deploy path.

## Rollback

Fast rollback approach:

```powershell
git revert <bad_commit_sha>
npm run verify
npm run deploy
```

Or redeploy a known-good commit by checking it out in a temporary branch and deploying it.
