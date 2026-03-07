# VoiceToWebsite

Static + Vite-powered site for the VoiceToWebsite ecosystem (public pages + admin tools + app
store).

## Local dev

- Install: `npm install`
- Terminal 1 (API): `npm run dev:worker` (serves `/api/orchestrator`)
- Terminal 2 (site): `npm run dev`
- One command (both): `npm run dev:all`
- Build: `npm run build`
- Preview: `npm run preview`
- Verify (typecheck + tests + build + link check): `npm run verify`
- Heal (clean + fresh install + verify): `npm run heal`

## Environment

- Copy `ENV.example` → `.env` (or set env vars in your deploy platform)
- Cloudflare settings live in `wrangler.toml`. Keep `compatibility_date` current; after changing
  bindings run `npm run types` to regenerate `worker-configuration.d.ts` (see
  [Workers best practices](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/)).
- If you want `/api/analytics/overview` to return real Cloudflare data, set `CF_ZONE_ID` +
  `CF_API_TOKEN` (see `ENV.example`).
- Admin login uses `CONTROL_PASSWORD` and server-issued signed cookies. Optional hardening: set
  `ADMIN_COOKIE_SECRET`.
- PayPal server-side checkout uses `PAYPAL_CLIENT_ID(_PROD)` + `PAYPAL_CLIENT_SECRET(_PROD)` and
  optional `PAYPAL_ENV=sandbox|live`.

## Production Variable Mapping

- Cloudflare Worker `voicetowebsite` → `wrangler.toml` `[vars]` (repo-managed safe vars):
  `ENVIRONMENT`, `PUBLIC_GENERATE`, `CF_ALLOW_LEGACY_DEPLOY_HOOKS`, `ALLOW_REMOTE_DEPLOY_TRIGGER`,
  `GH_BASE_BRANCH`, `GH_REPO`, `ADMIN_EMAIL`, `ADSENSE_PUBLISHER`, `ADSENSE_CUSTOMER_ID`,
  `ADSENSE_MODE`, `ADSENSE_ALLOW_ALL_PAGES`, `ADSENSE_MAX_SLOTS`, `PAYPAL_ENV`,
  `CACHE_CONTROL_STATIC`, `CACHE_CONTROL_HTML`, `STRIPE_PUBLISHABLE_KEY`,
  `STRIPE_ALLOW_CUSTOM_AMOUNT`, `STRIPE_PAYMENT_METHOD_TYPES`, `STRIPE_PRICE_STARTER`,
  `STRIPE_PRICE_GROWTH`, `STRIPE_PRICE_ENTERPRISE`, `STRIPE_PRICE_LIFETIME`,
  `STRIPE_PAYMENT_LINK_STARTER`, `STRIPE_PAYMENT_LINK_GROWTH`, `STRIPE_PAYMENT_LINK_ENTERPRISE`,
  `STRIPE_PAYMENT_LINK_LIFETIME`, `STRIPE_BUY_BUTTON_ID_STARTER`, `STRIPE_BUY_BUTTON_ID_GROWTH`,
  `STRIPE_BUY_BUTTON_ID_ENTERPRISE`, `STRIPE_BUY_BUTTON_ID_LIFETIME`
- Cloudflare Dashboard → Worker `voicetowebsite` → Settings → Variables and Secrets → `Secrets`
  (private): `CONTROL_PASSWORD`, `ADMIN_ACCESS_CODE` (optional alternative to `CONTROL_PASSWORD`),
  `ADMIN_COOKIE_SECRET`, `LICENSE_SECRET`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`,
  `PAYPAL_CLIENT_ID_PROD`, `PAYPAL_CLIENT_SECRET_PROD`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
  (or `STRIPE_ENDPOINT_SECRET`), `UNSPLASH_ACCESS_KEY`, `LIVE_ROOM_VIEWER_TOKEN` (optional),
  `LIVE_ROOM_ADMIN_TOKEN` (optional), `CF_API_TOKEN` (optional for API-triggered deploy/analytics
  paths), `CF_ZONE_ID` (optional for API-triggered deploy/analytics paths)
- Cloudflare Dashboard → Worker `voicetowebsite` → Settings → Variables and Secrets → `Variables`
  (non-secret toggles if used): `CF_WORKERS_BUILDS_AUTO_DEPLOY`, `CF_DEPLOY_HOOK_URL`,
  `CF_PAGES_DEPLOY_HOOK`
- Railway project vars only: `KRAKEN_API_KEY`, `KRAKEN_API_SECRET`
- Local PowerShell session only for manual Wrangler auth: `CLOUDFLARE_API_TOKEN`,
  `CLOUDFLARE_ACCOUNT_ID`

## Agent operations docs

- Root agent contract: `AGENTS.md`
- Shared agent protocol: `AGENT_HANDSHAKE.txt`
- Skills index: `skills/README.md`
- Directory-scoped agent docs:
  - `admin/AGENTS.md`
  - `src/AGENTS.md`
  - `functions/AGENTS.md`
  - `scripts/AGENTS.md`
  - `tests/AGENTS.md`

## Head Plans

- Monetization + Automation (human plan): `MONETIZATION_AUTOMATION_HEAD_PLAN.md`
- Monetization + Automation (machine roadmap): `ops/site/monetization-roadmap.json`
- Public roadmap mirror: `public/config/monetization-roadmap.json`

## Edge AI + R2

- Workers AI binding: `wrangler.toml` `[ai] binding = "AI"`
- R2 binding: `wrangler.toml` `[[r2_buckets]]` with `binding = "R2"`
- Voice-to-layout endpoints:
  - `POST /api/generate` (accepts JSON prompt or multipart `audio`)
  - `GET /api/preview?id=...`
  - `GET /preview/:id`
  - `POST /api/publish`
  - `GET /api/bot-hub/brief`
  - `POST /api/bot-hub/coordinate`

## Payments

- **Unified checkout:** All buy buttons (store, app store, cart) use `POST /api/checkout` with
  `provider: "paypal"` or `"stripe"`, then PayPal uses `POST /api/paypal/capture` with `orderId`
  after approval. **Payouts go to the account whose credentials are set in Worker secrets** (PayPal:
  `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` or `_PROD`; Stripe: `STRIPE_SECRET_KEY` /
  `STRIPE_PUBLISHABLE_KEY`). Set these in Cloudflare Dashboard → Worker → Settings → Variables and
  Secrets so all purchases complete to your account.
- PayPal: `POST /api/checkout` (body: `{ provider: "paypal", id: "starter" | appId | sku }`) returns
  `{ id }` (order ID); frontend then calls `POST /api/paypal/capture` with `{ orderId }` after user
  approves. Orders are logged to D1.
- Stripe: `POST /api/checkout` (body: `{ provider: "stripe", id }`) returns `{ url, sessionId }`;
  frontend redirects via `window.location.href = data.url` (do not use deprecated
  `stripe.redirectToCheckout`). Configure `STRIPE_WEBHOOK_SECRET` and point Stripe to
  `POST /api/stripe/webhook` for authoritative payment confirmation and order logging.
- **ads.txt:** Served at `/ads.txt` from `public/ads.txt`; update for your AdSense/partner IDs.

## Deploy

- Manual production deploy: `npm run deploy` (runs `wrangler deploy --keep-vars`; run
  `npm run verify` first if you want full checks).
- Regenerate Worker binding types after editing `wrangler.toml`: `npm run types`. Check they’re up
  to date: `npm run types:check`.
- Set required Worker vars/secrets in Cloudflare (examples in `ENV.example` and `wrangler.toml`
  comments).
- Unified deploy mode defaults:
  - `CF_WORKERS_BUILDS_AUTO_DEPLOY=0`
  - `CF_ALLOW_LEGACY_DEPLOY_HOOKS=0`
  - remote/API deploy is disabled unless `ALLOW_REMOTE_DEPLOY_TRIGGER=1`
- Local ship helper (verify → commit → optional push): `npm run ship -- -m "your message" --push`

## Makeover workflow

- See `MAKEOVER.md` for a clean, safe “new everything” order and the key entry points.

<!-- auto-deploy smoke test: 2026-02-08 12:02:55 -->

<!-- auto-deploy token retest: 2026-02-08 12:33:08 -->
