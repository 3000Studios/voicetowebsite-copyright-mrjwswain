# VoiceToWebsite: Get Everything Running & Monetized

This doc is the single reference for: site stability, Custom GPT → deploy, revenue (AdSense,
checkout), apps/preview/checkout, UI/UX/AdSense readiness, public vs admin nav, and main-only
workflow.

---

## 1. Site Running Perfectly

- **Stack:** React (Vite) + Cloudflare Worker; D1, KV, R2, Durable Objects.
- **Local:** `npm run dev:all` (Vite on 5173, Worker on 8787; API proxied).
- **Verify before any deploy:** `npm run verify` (lint, type-check, tests, build, link check).
- **Production:** Push to `main` → GitHub Action runs `npm install`, `npm run build`, `wrangler`
  deploy. Ensure **CF_API_TOKEN** and **CF_ACCOUNT_ID** are in repo Secrets. Resolve any GitHub
  billing lock so the workflow can run.
- **One-line deploy from machine:** `npm run deploy` (runs `wrangler deploy --keep-vars` only).

---

## 2. Custom GPT → Deploy Anything to Your Site

**Option A – GitHub + main (recommended)**

- Your Custom GPT (or any automation) commits and pushes to `main` (e.g. via GitHub API or `gh` with
  a token). Push to `main` triggers the Deploy workflow; no extra step.
- **Secrets:** Give the GPT a token with `contents: write` (and optionally `workflow: write` if you
  want it to trigger workflows). Never put Cloudflare keys in the GPT; let GitHub Actions use
  **CF_API_TOKEN** / **CF_ACCOUNT_ID**.

**Option B – Deploy hook**

- Worker supports deploy hooks (e.g. `CF_DEPLOY_HOOK_URL`). The GPT or an external service can call
  that URL (with auth) to trigger a deploy. Configure the hook in Cloudflare and store the URL as a
  secret.

**Option C – Direct Wrangler (least preferred)**

- Run `wrangler deploy` from a secure environment that has **CF_API_TOKEN**; only if you cannot use
  GitHub or a hook.

---

## 3. Make Money: AdSense + Checkout

- **AdSense:** `wrangler.toml` [vars] and Dashboard set `ADSENSE_*`. Worker and pages use env for
  client ID and placement. Keep content and layout policy-friendly (see §6). No adult/violent
  content; clear privacy/terms.
- **Checkout:**
  - **PayPal:** Set **VITE_PAYPAL_CLIENT_ID** (and server-side **PAYPAL_CLIENT_ID** if used).
    `Checkout.tsx` loads the PayPal SDK when the client ID is present.
  - **Stripe:** Set **VITE*STRIPE*\*** and server secrets as needed; wire Checkout to your Stripe
    backend.
- **Revenue tracking:** `trackRevenueEvent` and `/api/analytics/event`; use for conversions and
  tuning.

---

## 4. Apps, Preview, Checkout Working

- **Apps:** Worker serves HTML/JS from `dist/` and static routes. Ensure `npm run build` runs and
  all app entry points are in Vite’s build or copied into `dist/`/`public` as needed.
- **Preview:** Worker exposes preview routes (e.g. `handlePreviewPageRequest` /
  `handlePreviewApiRequest` in `siteGenerator.js`). Admin or command-center flows that open iframes
  should point at those preview URLs; ensure CSP and frame-src allow your origin.
- **Checkout:** See §3. Test with real (or sandbox) keys; confirm PayPal/Stripe scripts load (CSP
  allows `paypal.com`, `stripe.com`).

---

## 5. UI/UX & Content AdSense-Ready

- **Layout:** Ad slots (e.g. auto ads or fixed placements) should not obstruct main content; avoid
  too many ads above the fold. Use `ADSENSE_*` env for client ID and options.
- **Content:** Original, policy-safe content; clear navigation and footer (privacy, terms). No
  prohibited content (see AdSense program policies).
- **Technical:** CSP in `worker.js` already allows `pagead2.googlesyndication.com`,
  `googleads.g.doubleclick.net`; keep these if using AdSense.

---

## 6. Nav: All Public Pages Visible; Admin Only After Access Code Then Login

- **Public nav:** All public pages are in the nav (see `publicLinks` in `public/nav.js` and
  `SHARED_NAV_ITEMS` in `src/constants/navigation.ts`). Admin link is **not** in the default list.
- **After access code:** When the user has entered the access code at `/admin/access.html`, the nav
  shows an **Admin** link (to `/admin/access.html` or login). Implemented via `hasSessionUnlock()`
  in `nav.js`; `getNavLinks()` returns `publicLinks` + admin link only when unlocked.
- **After login:** When the user is logged in (cookie/session validated via `/api/config/status`),
  the nav shows full admin sections (Mission, Command Center, etc.). Implemented via
  `hasAdminAccess()`; `getNavLinks()` then returns `publicLinks` + `adminLinks`.
- **React:** `SHARED_NAV_ITEMS` does not include Admin; the main site shell uses `nav.js` for
  public/admin visibility. Admin is never shown in the React nav until you add an explicit “admin
  unlocked” check (e.g. call `/api/config/status` and conditionally add Admin).

---

## 7. Main-Only; Clean Up Branches

- **Canonical branch:** `main`. All production deploys come from `main` (GitHub Action on push).
- **Merge good work to main:**
  - From your feature branch:
    `git checkout main && git pull origin main && git merge <feature-branch> && git push origin main`.
  - Or use a PR and merge to `main`.
- **Delete remote branches after merge:**
  - `git push origin --delete <branch-name>` for each merged branch you no longer need.
  - Keep `main` and any long-lived branches (e.g. `develop`) if you use them.
- **Local cleanup:** `git branch -d <branch-name>` to delete local merged branches;
  `git fetch --prune` to drop remote-tracking refs for deleted remotes.

---

## 8. Everything Pushed, Synced, Committed, Live

- **Before going live:**
  1. `git status` clean (or only intended changes committed).
  2. `npm run verify` passes.
  3. Push to `main`: `git push origin main`.
  4. Check **GitHub → Actions** for “Deploy to Cloudflare Worker”; confirm success.
  5. Open production URL and smoke-test nav, one app, checkout (if enabled), and admin (after access
     code + login).
- **If deploy fails:** Fix the cause (e.g. missing secrets, billing, build failure), re-run verify,
  push again. No silent deploys; always check Actions.

---

## Quick Checklist

| Goal                 | Action                                                                             |
| -------------------- | ---------------------------------------------------------------------------------- |
| Site running         | `npm run dev:all` locally; push to `main` for production.                          |
| Custom GPT deploys   | GPT pushes to `main` (GitHub token) or calls deploy hook.                          |
| AdSense + checkout   | Set env/secrets; keep content and layout policy-ready.                             |
| Apps + preview       | Build includes all apps; preview routes and CSP allow iframes.                     |
| Nav: public vs admin | Public pages always in nav; Admin link/sections only after access code then login. |
| Main-only            | Merge to `main`, delete obsolete branches.                                         |
| Live and synced      | Verify → push `main` → check Actions → smoke-test.                                 |
