# Admin Dashboard API Wiring

This doc confirms how the Command Center OS (CCOS) dashboard hooks up to the Worker and what you
need for each area to work.

## Auth

- **Access:** `/admin/access.html` (access code) → `/api/admin/access-code` (POST).
- **Login:** `/admin/login.html` → `/api/admin/login` (POST). Sets signed cookie; all dashboard API
  calls send it.
- **Logout:** `/api/admin/logout` (POST).

All Command Center API requests (below) require either a valid admin session cookie or
`Authorization: Bearer <token>` / header token configured in the Worker.

## Dashboard modules and APIs

| Module               | Route(s)              | APIs used                                                                                                                                                                              | Notes                                                                                            |
| -------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Mission Control      | `/admin/mission`      | `GET /api/governance/check`, `GET /api/deploy/logs`, `GET /api/deploy/meter`, `GET /api/analytics/metrics` (via loadAnalytics)                                                         | KPIs, deploy rail, governance.                                                                   |
| Command Center       | `/admin/cc`           | `GET /api/fs/tree`, `GET /api/fs/read`, `POST /api/fs/write`, `POST /api/fs/delete`, `POST /api/preview/build`, `GET /api/repo/status`, `GET /api/deploy/logs`, `POST /api/deploy/run` | File tree, editor, preview build, deploy.                                                        |
| Voice Command Center | `/admin/vcc`          | `POST /api/voice/execute`, `POST /api/execute`, `POST /api/preview/build`, `POST /api/deploy/run`, loadAnalytics (overview/detailed/realtime)                                          | Voice/execute and preview iframe.                                                                |
| Monetization         | `/admin/monetization` | `GET/POST /api/monetization/config`                                                                                                                                                    | Ad density, CTA variant, donation/superchat/affiliate toggles.                                   |
| Analytics            | `/admin/analytics`    | `GET /api/analytics/overview`, `GET /api/analytics/detailed`, `GET /api/analytics/realtime` (admin cookie)                                                                             | Cloudflare zone analytics; set `CLOUD_FLARE_API_TOKEN` + `CF_ZONE_ID` for real data.             |
| Live Manager         | `/admin/live`         | `GET/POST /api/live/state`, **WebSocket** `wss://host/api/live/ws?role=viewer` (or `?role=host`)                                                                                       | State in KV; WebSocket forwarded to LiveRoomDO. Token: query `token` or `Authorization: Bearer`. |
| Store Manager        | `/admin/store`        | `GET /api/store/products`, `POST /api/store/products`                                                                                                                                  | D1 `cc_store_products`.                                                                          |
| Media Library        | `/admin/media`        | `GET /api/media/list`, `POST /api/media/upload`                                                                                                                                        | D1 + R2.                                                                                         |
| Audio Library        | `/admin/audio`        | `GET /api/audio/list`, `POST /api/audio/upload`                                                                                                                                        | D1 + R2.                                                                                         |
| Settings             | `/admin/settings`     | `GET /api/env/audit`, `GET /api/governance/check`                                                                                                                                      | Env audit and governance.                                                                        |

## Previews

- **Preview iframe (CCOS):** `src="/preview/index?shadow=1"` (and `?zones=1` for monetization).
  Worker serves `/preview` and `/preview/*` with `shadow=1` via Command Center (shadow state +
  assets).
- **Preview build:** `POST /api/preview/build` with `routes` and `files` to get preview URLs for the
  Command Center.

## Commands and execute

- **UI command (e.g. Custom GPT):** `POST /api/ui-command` (Worker, not Command Center auth).
- **Execute (dashboard / Custom GPT):** `POST /api/execute` (Worker). Writes to KV/BotHub; deploy
  can be triggered via DeployControllerDO.
- **Voice execute (dashboard):** `POST /api/voice/execute` (Command Center). Parses voice intent and
  runs plan (preview/build, deploy, etc.).

## PayPal and Stripe

- **Checkout:** Worker routes `POST /api/checkout`, `POST /api/stripe/checkout`,
  `POST /api/paypal/checkout`, `POST /api/paypal/order/create`, `POST /api/paypal/create-order` (and
  capture variants). Frontends: `store.html`, `store-products.js`, `src/commerce.js`,
  `Checkout.tsx`, etc.
- **Secrets:** Set in Worker (Dashboard or `wrangler secret`): PayPal (`PAYPAL_CLIENT_ID`,
  `PAYPAL_CLIENT_SECRET`, etc.), Stripe (`STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, etc.).
- **Local dev:** Vite proxies `/api/checkout`, `/api/stripe`, `/api/paypal` to `wrangler dev` (port
  8787).

## Live stream setup (working end-to-end)

1. **Worker:** `LIVE_ROOM` Durable Object binding (wrangler.toml). WebSocket route: **GET**
   `/api/live/ws` with **Upgrade: websocket** is forwarded to LiveRoomDO (path `/ws`). No admin auth
   required; DO validates token (query `token` or `Authorization: Bearer`).
2. **Tokens (Worker secrets):**
   - `LIVE_ROOM_VIEWER_TOKEN` or `CONTROL_PASSWORD` for viewers.
   - `LIVE_ROOM_ADMIN_TOKEN` or `CONTROL_PASSWORD` for host.
3. **Dashboard Live Manager:** Saves state via `POST /api/live/state`; state is stored in KV and
   broadcast to LiveRoomDO. The card shows the WebSocket URL (ws/wss by protocol) and token usage.
4. **Viewer/host page:** Connect to
   `ws(s)://<origin>/api/live/ws?role=viewer&token=<LIVE_ROOM_VIEWER_TOKEN>` (or same with
   `role=host` and admin token). Use the same URL shown in the Live Manager. **Test page:**
   `/admin/live-room-test.html` — paste token, connect, and see status and messages.

## Quick checklist

- [ ] Admin: `CONTROL_PASSWORD` or `ADMIN_ACCESS_CODE` set; login works.
- [ ] Command Center APIs: All require admin session or bearer token; 401 if not.
- [ ] Deploy from dashboard: `ALLOW_REMOTE_DEPLOY_TRIGGER=1` and `CF_DEPLOY_HOOK_URL` (or
      equivalent) set so deploy runs.
- [ ] Analytics (real Cloudflare data): `CLOUD_FLARE_API_TOKEN` + `CF_ZONE_ID` set.
- [ ] Live WebSocket: `LIVE_ROOM` DO binding; optional `LIVE_ROOM_VIEWER_TOKEN` /
      `LIVE_ROOM_ADMIN_TOKEN`; connect to `/api/live/ws`.
- [ ] PayPal/Stripe: Secrets set in Worker; frontends use `/api/checkout` and capture endpoints.
- [ ] Previews: `/preview/*?shadow=1` and `POST /api/preview/build` work with admin auth.
