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
- Stripe: `POST /api/checkout` (body: `{ provider: "stripe", id }`) returns `{ sessionId }`;
  frontend redirects to Stripe Checkout.

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
