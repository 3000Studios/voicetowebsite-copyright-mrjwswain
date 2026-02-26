# VoiceToWebsite — Full Repository Audit Report

**Date:** 2026-02-26  
**Scope:** Structure, imports, dead code, build, Worker compatibility, admin command center, preview
iframe, routing, env, package.json scripts, wrangler.toml vs worker.js, main.tsx mount, app.js vs
React, unused files, redundant scripts, performance, SEO, mobile, runtime errors, loops, production
readiness.  
**Rule:** Audit only — no changes applied.

---

## 1) Structural problems

| #   | Issue                                                               | Location                                   | Detail                                                                                                                                                                                                                                              |
| --- | ------------------------------------------------------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.1 | **app.js not loaded by any HTML**                                   | `app.js` (root)                            | No `<script src="app.js">` or equivalent in any HTML. Index loads `main.tsx` (React). app.js implements unified command handler and `api/ui-command`; it is dead unless loaded by a page not in the repo or by a legacy/demo entry.                 |
| 1.2 | **Duplicate / legacy route path**                                   | `worker.js` ~1352–1356                     | `/.netlify/functions/orchestrator` is handled alongside `/api/orchestrator`. Deployment is Cloudflare-only; Netlify path is never hit and is legacy noise.                                                                                          |
| 1.3 | **Worker references env.SITE_ASSETS**                               | `worker.js` ~823, 1766                     | Code uses `env.ASSETS \|\| env.SITE_ASSETS`. wrangler.toml only defines `ASSETS`; `SITE_ASSETS` is never set. Harmless fallback but inconsistent with config.                                                                                       |
| 1.4 | **admin/live-stream.html loads admin.js but has no #preview-frame** | `admin/live-stream.html`, `admin/admin.js` | admin.js expects `#preview-frame` (line 19). live-stream.html has no element with that id. Preview iframe logic no-ops on this page; either add the iframe or accept partial feature.                                                               |
| 1.5 | **index.html links to /src/index.css**                              | `index.html` line 121                      | In production build, Vite inlines/bundles CSS; linking to `/src/index.css` can 404 if not processed. Confirm Vite build output serves or inlines this.                                                                                              |
| 1.6 | **verify.mjs asset path check is weak**                             | `scripts/verify.mjs` ~19–24                | Page assets are checked with `path.join(process.cwd(), page.asset)`. ops/site/pages.json uses assets like `index.html`, `admin/index.html`; these exist at repo root, but `page.asset` does not include `public/` for assets that might live there. |
| 1.7 | **Two styles.css locations**                                        | Root `styles.css`, `public/styles.css`     | Both exist. index.html uses `styles.css` (root). Risk of divergence or wrong file served depending on server/Vite.                                                                                                                                  |
| 1.8 | **admin/access-guard.js ADMIN_MODULE_LINKS routes**                 | `admin/access-guard.js`                    | Links point to `/admin/mission`, `/admin/cc`, `/admin/vcc`, etc. Worker and Vite build serve admin via `/admin/*.html` (e.g. integrated-dashboard.html, voice-commands.html). Verify these paths resolve (redirect or actual HTML).                 |

---

## 2) Runtime risks

| #   | Issue                                           | Location                           | Detail                                                                                                                                                                                                 |
| --- | ----------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2.1 | **Missing ASSETS binding**                      | `worker.js` ~787–795               | If `env.ASSETS` is missing and path is not `/api/*`, worker returns 500. wrangler.toml sets ASSETS; runtime misconfiguration would take down non-API traffic.                                          |
| 2.2 | **No rate limiting on expensive APIs**          | `worker.js`                        | `/api/generate`, `/api/publish`, `/api/orchestrator`, `/api/chat`, `/api/godmode/infer` are not rate-limited. Abuse can spike D1/KV/AI usage and cost. execute.js and supportChat.js are rate-limited. |
| 2.3 | **tracking.js loaded from /tracking.js**        | `index.html` line 126              | Script is at `public/tracking.js`. Vite serves public at root, so `/tracking.js` is correct in dev/build if public is copied. Confirm build copies public/.                                            |
| 2.4 | **app.js hardcodes API origin**                 | `app.js` line 26                   | `apiEndpoint: "https://voicetowebsite.com/api/ui-command"` — fails when running on localhost or another domain. Should use relative `/api/ui-command` or `window.location.origin`.                     |
| 2.5 | **database-cache.js setInterval without clear** | `functions/database-cache.js` ~289 | `cachedDb.monitoringInterval = setInterval(...)`. If module is re-evaluated or Worker instance is long-lived, intervals could accumulate. Ensure single interval per binding or cleanup.               |
| 2.6 | **admin/admin.js inactivity timer**             | `admin/admin.js` ~341              | `inactivityTimer = setTimeout(...)`. Confirm timer is cleared on teardown or navigation to avoid leaks.                                                                                                |
| 2.7 | **Possible double body read**                   | `worker.js` multiple routes        | Several handlers use `request.clone().json()` or `.text()`. Safe for single use per clone; ensure no route reads body twice without clone.                                                             |

---

## 3) Deployment risks

| #   | Issue                            | Location                          | Detail                                                                                                                                                                                                                                                                                                                                            |
| --- | -------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3.1 | **Deploy only from local**       | `scripts/guard-deploy.mjs`        | CI cannot run `wrangler deploy`. Single point of failure; no CI-based rollback. Documented in DEPLOYMENT.md.                                                                                                                                                                                                                                      |
| 3.2 | **Large env surface**            | ENV_SCHEMA.md, worker + functions | 134+ keys used, 51 missing in schema. Missing vars (e.g. ASSETS at runtime, CONTROL*PASSWORD, PAYPAL*\*) can cause 503/401 or broken flows. Use `wrangler deploy --keep-vars`.                                                                                                                                                                    |
| 3.3 | **prebuild and verify ordering** | package.json                      | `prebuild` runs sync-public-assets, generate:config, generate:sitemap. `verify` runs verify.mjs, env:audit, guard:deploy, ops:global-doc:check, format:check, check:css-governance, check:css-budget, type-check, test, build, governance:check, guard:ui, check:links. Build runs after tests; ensure generate:config and sitemap are not stale. |
| 3.4 | **orch:start / orch:install**    | package.json                      | `cd voicetowebsite-orchestrator && npm start/install`. If `voicetowebsite-orchestrator` is missing or not committed, these scripts fail. Confirm directory exists and is part of deploy story if needed.                                                                                                                                          |
| 3.5 | **Husky pre-commit**             | `.husky/pre-commit`               | Currently runs `npm run build` only. Previous setup ran verify (including tests). Failing tests can be committed if only build passes.                                                                                                                                                                                                            |

---

## 4) Performance bottlenecks

| #   | Issue                                 | Location                       | Detail                                                                                                                                                                                          |
| --- | ------------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 4.1 | **HTML injection on every request**   | `worker.js` ~2574–2835         | Every HTML response: fetch asset, `await assetRes.text()`, then many regex/replace (SEO, AdSense, CSP nonce). Adds latency and CPU. Consider KV cache for injected HTML or limit to key routes. |
| 4.2 | **Large main JS bundles**             | Vite build output              | `client-*.js` and `App-*.js` are large (~180KB + ~152KB reported). Slows LCP and parse. manualChunks in vite.config.js has vendor; consider splitting framer-motion and other heavy libs.       |
| 4.3 | **Long linear route chain**           | `worker.js` fetch handler      | One long if/else chain for all API routes. Cold start and size grow with each new route.                                                                                                        |
| 4.4 | **nav.js setInterval 15s**            | `nav.js`, `public/nav.js` ~958 | `setInterval(refreshAndUpdateNavigation, 15000)` runs forever. Acceptable but adds periodic work; ensure no accumulation.                                                                       |
| 4.5 | **admin/ccos.js setInterval 10s**     | `admin/ccos.js` ~1371          | `setInterval(refreshDeployLogs, 10_000)`. Same as above.                                                                                                                                        |
| 4.6 | **No caching of capability manifest** | `worker.js` /api/capabilities  | Manifest is built on each request. Could be cached in memory or KV with short TTL.                                                                                                              |

---

## 5) Monetization gaps

| #   | Issue                         | Location                                                | Detail                                                                                                                                                 |
| --- | ----------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 5.1 | **AdSense config disabled**   | `public/config/adsense.json`                            | `"enabled": false`, empty `slots`. Enable and define slots for high-traffic pages to improve placement.                                                |
| 5.2 | **Affiliate links not wired** | `public/config/affiliates.json`, nav/pages              | affiliates.json has Amazon, Impact, ShareASale, CJ ids and customLinks. Not clearly used in nav or key pages; add affiliate strip or in-content links. |
| 5.3 | **Revenue rail and tracking** | `nav.js`, `src/App.tsx`, `src/utils/revenueTracking.ts` | Revenue rail and store CTAs call `/api/analytics/event`. Worker persists to D1. Ensure analytics/event route is not blocked and D1 table exists.       |
| 5.4 | **Checkout flows**            | store.html, worker /api/checkout, /api/paypal/\*        | PayPal and Stripe flows exist. Unify frontend (store.html, store-products.js, Checkout.tsx) to normalized item payloads and consistent error handling. |

---

## 6) Monetization layer audit (VoiceToWebsite)

| Question                                | Status  | Detail                                                                                                                                                                                                                                                                                                                                                                                              |
| --------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Is Stripe integrated?**               | Yes     | Worker exposes `/api/stripe/checkout` (and Stripe Connect endpoints in `stripe-connect-integration.js`). Checkout session creation via `https://api.stripe.com/v1/checkout/sessions`; env keys `STRIPE_PUBLISHABLE_KEY` / `STRIPE_SECRET_KEY` injected into `window.__ENV`. Store UI: `store-products.js`, `cartManager.js`, `Checkout.tsx` use Stripe; payment links and buy-button IDs supported. |
| **Is usage-based billing implemented?** | Partial | Deploy metering exists: `DeployControllerDO` (deploy count per actor/day), `GET /api/deploy/meter`, `DEPLOY_BILLING_STATUS`. execute.js and commandCenterApi.js pass billing status and consume deploy allowance. No Stripe metered billing or usage-based pricing in checkout — plans are tier-based with deploy quotas.                                                                           |
| **Is rate limiting in Worker?**         | Partial | `functions/rate-limiter.js`: D1-backed sliding-window limits. **Applied to:** `/api/execute` (per action: heavy/token/auto/default) and support chat (`support_start`, `support_message`). **Not applied to:** `/api/generate`, `/api/publish`, `/api/orchestrator`, `/api/chat`, `/api/godmode/infer` — these can spike D1/KV/AI cost if abused.                                                   |
| **Is logging structured?**              | Partial | **Structured:** `functions/logger.js` — Logger with levels, traceId/requestId context, `logStructured(JSON.stringify(entry))`, redaction. Used in execute.js, godmode.js, chat.js, supportChat.js. **Not structured:** `worker.js` uses raw `console.log`/`console.warn`/`console.error` in several places; request/response and route handling are not consistently logged via the shared logger.  |
| **Is there abuse protection?**          | Partial | **Present:** Rate limiting on execute + support chat; admin auth (cookie/bearer); confirmation phrase for deploy; token-based idempotency for preview/apply. **Gaps:** No rate limiting on generate, publish, orchestrator, chat, godmode/infer; no CAPTCHA or bot mitigation on public endpoints.                                                                                                  |

**Recommendations (monetization layer)**

- Add rate limiting to `/api/generate`, `/api/publish`, `/api/chat`, `/api/godmode/infer` (reuse
  `rate-limiter.js` + D1 or in-memory).
- Use the shared logger (or a Worker-scoped structured logger) in `worker.js` for API route
  entry/exit and errors so logs are queryable and consistent.
- Document deploy metering (and optional Stripe metered billing) in ENV_SCHEMA or a billing runbook.

---

## 7) Exact files that must be edited

**Structural / dead code / routing**

- `worker.js` — Remove or comment legacy `/.netlify/functions/orchestrator` path; optionally
  normalize to `env.ASSETS` only (drop SITE_ASSETS mention if not used).
- `app.js` — Replace hardcoded `https://voicetowebsite.com/api/ui-command` with relative URL (e.g.
  `/api/ui-command` or `window.location.origin + '/api/ui-command'`). Alternatively remove or
  document if app.js is legacy/unused and not loaded.
- `admin/live-stream.html` — If preview iframe is required on this page, add
  `<iframe id="preview-frame" ...>` (or document that this admin page intentionally has no preview).
- `admin/access-guard.js` — Confirm ADMIN_MODULE_LINKS hrefs (`/admin/mission`, `/admin/cc`, etc.)
  match actual routes or redirects; fix paths or add redirects in worker if needed.
- `index.html` — Verify `/src/index.css` is correct for production (Vite should bundle; if not, use
  built asset path).
- `scripts/verify.mjs` — Harden asset existence check for pages.json (e.g. resolve asset path
  against both root and public/).

**Runtime / env**

- `worker.js` — Add rate limiting for `/api/generate`, `/api/publish`, `/api/orchestrator`,
  `/api/chat`, `/api/godmode/infer` (reuse existing rate-limiter + D1 or in-memory).
- `functions/database-cache.js` — Ensure single monitoring interval and cleanup (e.g. clearInterval
  on reassign or document single-instance assumption).
- `ENV_SCHEMA.md` / env-audit — Update and document “minimum required” vars for deploy; ASSETS is
  provided by wrangler.toml at deploy time.

**Deployment / scripts**

- `package.json` — Optionally add `rollback` script if desired
  (`git reset --hard HEAD~1 && git push origin main --force`). Confirm `orch:start` / `orch:install`
  are valid (voicetowebsite-orchestrator present).
- `.husky/pre-commit` — Consider re-adding full verify (or at least type-check + test) so broken
  tests cannot be committed.
- `DEPLOYMENT.md` — Keep aligned with guard-deploy and actual deploy flow.

**Performance**

- `worker.js` — Consider KV cache for post-injection HTML or restrict injection to a subset of
  routes.
- `vite.config.js` — Consider additional manualChunks (e.g. framer-motion) and ensure index entry
  does not pull in admin/store-heavy code unnecessarily.
- `scripts/css-budget-validator.mjs` — Already used in verify; keep enforcing budgets.

**Monetization**

- `public/config/adsense.json` — Set `enabled: true` and define slot IDs for key pages.
- Nav or key pages — Wire `public/config/affiliates.json` into UI (e.g. affiliate strip or links).

**Optional cleanup**

- Remove or archive unused files (e.g. `app.js` if confirmed dead; duplicate or obsolete scripts).
  Confirm before deletion.
- Remove redundant or duplicate scripts from package.json only after confirming nothing references
  them.

---

## Summary table

| Category                | Count               | Severity    |
| ----------------------- | ------------------- | ----------- |
| Structural problems     | 8                   | Medium      |
| Runtime risks           | 7                   | Medium–High |
| Deployment risks        | 5                   | Medium      |
| Performance bottlenecks | 6                   | Medium      |
| Monetization gaps       | 4                   | Low–Medium  |
| Files to edit           | 15+ (see section 7) | —           |

---

## Validation notes (no issues found)

- **Build:** `npm run build` (Vite) and prebuild scripts exist and are wired; verify runs
  type-check, test, build.
- **Worker imports:** All worker.js imports resolve (functions/_.js, src/durable_objects/_.js,
  src/functions/uiCommand.js, products.json).
- **wrangler.toml vs worker.js:** main = worker.js; assets = dist with binding ASSETS; D1, KV, R2,
  DO, AI bindings match worker usage. No SITE_ASSETS in wrangler (worker fallback only).
- **main.tsx:** Mounts to `#root`; index.html has `<div id="root">`. Correct.
- **app.js vs React:** index.html loads only main.tsx (React). app.js is not loaded by index or
  sandbox; no conflict but app.js is currently unused by built site.
- **Package.json scripts:** All referenced scripts (verify.mjs, guard-deploy.mjs, check_smash.cjs,
  apply_smash.cjs, link-checker.js, release.mjs, restore.mjs, etc.) exist at specified paths.
- **Preview iframe:** commandCenterApi and worker serve `/preview/*` and `/api/preview/build`;
  admin.js and ccos.js use iframes with preview URLs; logic is consistent. live-stream.html does not
  provide #preview-frame for admin.js.
- **Admin command center:** commandCenterApi.js and worker route command-center paths; auth
  (cookie/bearer) and D1 usage are consistent.
- **Environment variables:** Worker and functions use env.\*; wrangler.toml vars and secrets are
  documented; ENV_SCHEMA.md lists used vs defined. ASSETS is provided by Wrangler at deploy time
  (not in vars).

End of audit. No changes have been applied.
