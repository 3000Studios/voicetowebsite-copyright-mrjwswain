# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

VoiceToWebsite.com — a React 19 + Vite SPA deployed to Cloudflare (Pages + Workers), with D1, KV, R2, Workers AI, and several Durable Objects. The site is a voice-driven website generator with an admin command center, store, blog automation, and bot hub.

## Required reading

This repo has a layered governance system. Read these before non-trivial changes:

- `AGENTS.md` (root) — production-first rules, branch policy, communication format, completion standard.
- `.cursor/rules/vtw-production-governance.mdc` — authoritative production flow.
- `.cursor/rules/rule-1-no-bullshit.mdc` — never claim something is fixed/deployed without verifying it in the actual built/deployed artifact.
- `.cursor/rules/cloudflare-plugin.mdc` — Cloudflare surfaces and bindings.
- `src/AGENTS.md`, `functions/AGENTS.md`, `scripts/AGENTS.md` — scoped overrides.
- `skills/` — 9 numbered playbooks (`01_repo_bootstrap_and_ports.md` … `09_orchestrator_subproject_changes.md`). Pick the smallest relevant one; nearer `AGENTS.md` wins on conflict.

If a rule under `.cursor/rules/` conflicts with anything in this file, the cursor rule wins.

## Commands

Node version is **20** (`.nvmrc` = `20.19.0`; `.node-version` says `22` but husky enforces the major from `.nvmrc`).

What's actually in `package.json`:

```
npm run dev               # Vite dev server (uses vite.config.ts — see "Two Vite configs" below)
npm run dev:legacy-server # tsx server.ts — legacy Express+Vite middleware on :3000
npm run build             # vite build && node scripts/strip-spa-conflicts.mjs
npm run preview           # vite preview
npm run lint              # tsc --noEmit  (this is the typecheck; there is no separate type-check script)
npm run test              # alias for npm run lint — does NOT run vitest
npm run deploy            # PowerShell only: deploy-simple.ps1 (will not run on Linux/macOS)
npm run deploy:prod       # build then deploy
```

**Important script gotcha:** the governance docs and the husky `pre-commit` hook reference scripts that **do not exist** in `package.json`: `verify`, `ship`, `ship:push`, `deploy:live`, `type-check`, `types`, `lint-staged`, `ops:global-doc:update`. Committing locally with husky enabled will fail on `npm run lint-staged` / `npm run verify`. Either add the missing scripts before relying on the governance flow, or commit with `--no-verify` only when the user explicitly approves.

**Deploying from Linux/macOS:** `npm run deploy` is PowerShell. Use `npx wrangler deploy` (or `npx wrangler pages deploy dist`) directly.

**Tests:** `vitest.config.ts` is narrowed to `include: ["tests/smoke.test.js"]`, so `npx vitest` only picks up that one file even though many `*.test.ts(x)` and `tests/*.test.js` files exist in the tree. Run a specific test with `npx vitest run path/to/file.test.tsx` (the include filter applies to discovery, not explicit paths). `tsconfig.json` excludes `**/*.test.ts(x)` from typecheck.

## High-level architecture

This codebase has accumulated several backend shapes that all coexist. Knowing which one a request hits matters.

### Frontend (the actual product)

- **SPA**: React 19 + React Router v7, entry `src/main.tsx` → `src/App.tsx`. Routes live in `src/App.tsx` and `src/pages/`.
- **Static shell**: `index.html` is the SPA mount. The repo also contains ~80 root-level `.html` files (`pricing.html`, `features.html`, `store.html`, `about.html`, …). These are **legacy multi-page artifacts**. `scripts/strip-spa-conflicts.mjs` runs after every `vite build` and **overwrites every non-`index.html` file in `dist/`** with the SPA shell so that stale Cloudflare Pages copies still serve the React app. Treat legacy `.html` files as non-authoritative; the React route in `src/App.tsx` / `src/pages/` is the source of truth.
- **Shared nav**: `src/constants/navigation.ts` (`SHARED_NAV_ITEMS`) must stay aligned with `public/nav.js` / root `nav.js`. The `prebuild` step copies the root `nav.js` into `public/`; edit the source that gets copied (see `rule-1-no-bullshit.mdc`).
- **Design system**: tokens in `src/design-system.css`, layout helpers in `src/layout-system.css`. Never hardcode colors/spacing — use CSS custom properties (`var(--color-primary)`, `var(--space-4)`, etc.). See `.cursor/rules/figma-design-system.mdc`.

### Two Vite configs

Both `vite.config.ts` and `vite.config.js` exist. Vite resolves `.ts` first, so `npm run dev` / `npm run build` use **`vite.config.ts`** (simple SPA build, alias `@` → repo root).

`vite.config.js` is the older, much larger multi-page config (alias `@` → `src`, dev proxy of every `/api/*` route to `http://127.0.0.1:8787`, `rollupOptions.input` listing 80+ HTML entries plus all the `src/apps/*.html` previews). It is **not picked up automatically** — only relevant if a script invokes Vite with an explicit `--config vite.config.js`. Be aware of the alias mismatch if you copy a snippet: `@/*` resolves to `./src/*` in `tsconfig.json`, but to repo root in `vite.config.ts`.

### Cloudflare Worker (production runtime)

- **`worker.js`** (~140k lines) — the production fetch handler. Imports from `functions/*.js` (siteGenerator, botHub, execute, orchestrator, chat, supportChat, commandCenterApi, contentInventory, blogAutomation, adminAuth, godmode, imageSearch, capabilities, aiWos) and from `src/durable_objects/*.js`.
- **`wrangler.toml`** — bindings: `DB` (D1, id `ca8260b3-…`), `SITES_BUCKET` (R2, `voicetowebsite`), `ORDERS_KV` (KV), `AI` (Workers AI). `pages_build_output_dir = "dist"`. There is one production env (`[env.production]`); `compatibility_date = "2024-04-12"` — bump when touching Worker config.
- **`worker-configuration.d.ts`** — generated by `wrangler types`. Don't hand-edit. After binding changes, regenerate (the script for it isn't in `package.json` yet — run `npx wrangler types` directly).
- **Durable Objects** in `src/durable_objects/`: `BotHubDO`, `DeployControllerDO`, `LiveRoomDO`, `AuditLogDO`. Wired through `worker.js`.
- **Pages Functions** in `functions/api/` (e.g. `generate.js`, `img.js`, `health.js`, `create-checkout-session.ts`, Stripe/PayPal webhooks, `admin/*`, `blog/*`, `site/*`). These run as Pages Functions when not handled by `worker.js`.

### Local dev backends (two of them)

- **`server/index.js`** (Express, default port `8787`) — the modern local repo-server. Mounted routes: `/api/admin/*`, `/api/public/*`, plus `compatApiRoutes` and `commandRoutes`. CORS gated by `ALLOWED_ORIGINS`. This is the server `vite.config.js`'s dev proxy targets at `127.0.0.1:8787`. Run it via the equivalent of `node server/index.js` (no npm script; `dev:legacy-server` runs the *other* server).
- **`server.ts`** (Express + Vite middleware on port `3000`) — `npm run dev:legacy-server`. Excluded from typecheck. Stripe + PayPal endpoints inline. Treat as legacy.

When working on backend logic, first check whether the code path lives in `worker.js` (production), `functions/api/*` (Pages Functions), or `server/` (local-only). Behavior must match across runtimes for any endpoint that exists in more than one.

## Branch & deploy policy

- `main` is the only production branch. Don't force-push it. Don't create alternate long-lived production branches.
- Production deploys go through Cloudflare Wrangler. After a deploy, verify the change at `https://voicetowebsite.com` (not `*.pages.dev`) before reporting it as live.
- Pages preview URLs are diagnostic only.

## Conventions worth knowing

- React components: PascalCase, default-exported, in `src/components/` (or alongside the feature). Use `.tsx`.
- Admin auth state must use admin session endpoints (`/api/config/status`), not generic health endpoints (`src/AGENTS.md`).
- Endpoint contracts under `/api/admin/*` and the apply/deploy confirm-token flow are security-sensitive — preserve cookie flags, TTLs, and confirm-token signing when editing `functions/adminAuth.js` or related files (`functions/AGENTS.md`, `SECURITY.md`).
- Secrets: `.env.local` (gitignored) for local; Cloudflare Worker secrets for prod. `.env.example`, `.dev.vars.example`, `ENV.example` document the keys. Never commit a populated `.env*`.
- D1 migrations live in `migrations/` (excluded from typecheck).
