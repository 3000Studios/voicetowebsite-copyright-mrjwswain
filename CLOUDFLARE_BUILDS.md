# Cloudflare Workers Builds — build syntax for dashboard

Use these values when editing **Build configuration** for the **voicetowebsite** Worker (Workers &
Pages → voicetowebsite → Builds / Git).

## Build configuration (recommended)

| Field              | Value                             |
| ------------------ | --------------------------------- |
| **Root directory** | `/`                               |
| **Build command**  | `npm ci && npm run build`         |
| **Deploy command** | `npx wrangler deploy --keep-vars` |
| **Build caching**  | Enable                            |

Enable **build caching** in the Build configuration so dependencies and build output are cached
between builds (faster CI).

- **Build:** Install deps and build only. Fast and stable in CI; avoids flaky tests or link checks
  in the Cloudflare environment.
- **Deploy:** Same as local; `--keep-vars` keeps Dashboard vars/secrets.
- **Quality gate:** Use `npm run deploy:live` (verify + deploy) locally or from Custom GPT before
  pushing to `main`, so CI only ever build+deploys green code.

## Optional: strict CI (verify in Cloudflare)

To make Cloudflare run the full verify pipeline (tests, type-check, links, etc.) before deploy, set
**Build command** to `npm ci && npm run verify`. Same as `deploy:live` but in CI; builds are slower
and may fail on env-specific issues.

## Branch control

- **Production branch:** `main`
- Builds for non-production branches: optional (e.g. Disabled so only `main` deploys).

## Check that it deploys live

1. Push a commit to `main` (or use an empty commit:
   `git commit --allow-empty -m "trigger build" && git push`).
2. In Cloudflare: Workers & Pages → voicetowebsite → Builds.
3. Open the latest build and confirm both build and deploy steps succeed.
4. Visit the live site to confirm the new version is live.

## Variables and secrets (Builds)

In the same Builds configuration, under **Variables and secrets**, ensure the token or secrets
Wrangler needs to deploy are set (e.g. `CLOUDFLARE_ACCOUNT_ID` if required by your token). The
Worker’s runtime vars (e.g. `CONTROL_PASSWORD`, Stripe, PayPal) are configured in the Worker’s
**Settings → Variables and secrets**, not in Builds.
