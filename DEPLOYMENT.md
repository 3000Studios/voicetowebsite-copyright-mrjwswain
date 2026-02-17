# Deployment (Authoritative)

This repo deploys the live site to Cloudflare **Workers** (not GitHub Actions).

## Commands (One-Liners)

- Verify (must pass before any commit/deploy):
  - `npm run verify`
- Local dev:
  - `npm run dev:all`
- Deploy production (runs verify first):
  - `npm run deploy`
- Auto everything (watch -> verify -> commit -> push -> deploy):
  - `npm run auto:ship`

## What `npm run verify` Does

`npm run verify` runs, in order:

1. `npm run guard:deploy` (blocks adding GitHub Actions deploy workflows)
2. `npm run format:check`
3. `npm run type-check`
4. `npm run test`
5. `npm run build` (generates `dist/`)
6. `npm run check:links`

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

- `npm run deploy` is `npm run verify && wrangler deploy --keep-vars`.
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

At minimum, to deploy from a new machine you typically need Wrangler authentication (login or API
token).

## Workers Builds Auto-Deploy (Optional, Phone/Remote Friendly)

If you want commits pushed by `/api/execute` to deploy while your laptop is off:

1. Connect Worker Builds to this repo and keep production branch on `main`.
2. In Worker -> Settings -> Build -> API token, select token `VOICETOWEBSITE_WORKERS_BUILD_TOKEN`.
3. In Worker runtime vars/secrets, set `CF_WORKERS_BUILDS_AUTO_DEPLOY=1`.
4. In Build variables, set `CLOUDFLARE_ACCOUNT_ID` to your account id.

Notes:

- This does not require GitHub Actions deploy workflows.
- Keep `npm run deploy` unchanged for manual production deploys
  (`npm run verify && wrangler deploy --keep-vars`).

## Rollback

Fast rollback approach:

```powershell
git revert <bad_commit_sha>
npm run verify
npm run deploy
```

Or redeploy a known-good commit by checking it out in a temporary branch and deploying it.
