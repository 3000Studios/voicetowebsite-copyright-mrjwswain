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
- Cloudflare settings live in `wrangler.toml`
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

- PayPal (server-side, tamper-resistant):
  - `POST /api/paypal/order/create` (body: `{ product: 'starter' }` or `{ productId }` or `{ sku }`)
  - `POST /api/paypal/order/capture` (body: `{ orderId, product|productId|sku }`)
- Stripe:
  - `POST /api/stripe/checkout`

## Deploy

- Manual production deploy: `npm run deploy` (runs `npm run verify` first, then
  `wrangler deploy --keep-vars`).
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
