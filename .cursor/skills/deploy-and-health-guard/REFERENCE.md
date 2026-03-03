# Deploy and Health Guard — Full Reference Checklist

Use this when performing a full health pass or when the user asks to ensure everything is working.

## 1. Repo and Branch

- [ ] Single branch workflow: all work on `main`; no stray feature branches for normal changes.
- [ ] After changes: `npm run verify` passes → `npm run ship` → push → deploy.
- [ ] Repo is up to date and synced (local and remote).

## 2. Builds and Deploys

- [ ] `npm run verify` passes (env audit, format, type-check, types:check, test, build, governance,
      guard:ui, check:links).
- [ ] `npm run build` succeeds; `dist/` is produced.
- [ ] Deploy succeeds (`npm run deploy` or CI deploy on push to `main`).
- [ ] Worker and frontend assets are live and serving.

## 3. Command Center and Custom GPT

- [ ] Execute API is deployed and reachable (e.g. `voicetowebsite.com/api`).
- [ ] Custom GPT is configured with correct schema (`ops/contracts/openapi.execute.json`) and auth
      (`x-orch-token`, `ORCH_TOKEN`).
- [ ] User requests in Custom GPT chat result in API calls that apply changes (content, theme,
      pages, store, media, deploy).
- [ ] Deploy trigger is set (`CF_DEPLOY_HOOK_URL` or Workers Builds on `main`) so apply/deploy
      actually deploys.
- [ ] UI command API and MCP/server flows work if used (see `UNIFIED_COMMAND_CENTER_SETUP.md`,
      `CUSTOM_GPT_SETUP.md`).

## 4. Checkouts and Pay Links

- [ ] Checkout flows (Stripe, PayPal, or project-specific) are configured and working.
- [ ] Pay links and payment endpoints are verified and usable (no 404s, correct env vars).
- [ ] Products/config that drive checkout (`public/config/products.json`, store config) are
      consistent and valid.
- [ ] Run any project checkout or payment smoke tests if they exist.

## 5. AdSense

- [ ] AdSense publisher ID and meta tags are present where required (e.g. `google-adsense-account`).
- [ ] Required pages for AdSense are live: Privacy, Contact, About (see `ADSENSE_READINESS.md`).
- [ ] Privacy policy includes AdSense disclosure and cookies.
- [ ] `public/config/adsense.json` and slot config are set for final review (enabled, slots defined
      for key pages).
- [ ] No deceptive UI or forced autoplay that would violate AdSense policy.

## 6. UI/UX and “Million-Dollar” Look

- [ ] All UI/UX requests from the user have been deployed and are working.
- [ ] Pages render correctly; layout, typography, and responsiveness are polished.
- [ ] Previews (command center, page previews) are populating.
- [ ] Media, inputs, animations, Bootstrap (or other UI framework) work as designed.
- [ ] No broken layout or missing assets on critical pages.

## 7. Revenue and Suggestions

- [ ] Revenue-related code and config are reviewed (ads, products, checkout, affiliates).
- [ ] Fix or create anything needed so a revenue stream is possible (e.g. ad placements, product
      listings, checkout links).
- [ ] Proactively suggest improvements for the site and monetization when relevant.

## 8. Crypto Bot and Apps

- [ ] Crypto bot is monitored and tested; aggression-test critical paths.
- [ ] All apps (worker, admin, store, live room, etc.) are tested and working.
- [ ] Display and behavior match expectations (data, charts, controls).

## 9. Code Review and Auto-Fix

- [ ] Review code touched by recent changes; fix issues (logic, security, style).
- [ ] If anything fails (tests, build, deploy, link check): fix in the same session. Auto-fix,
      auto-install, or auto-create as needed.
- [ ] No known broken state left behind; agent uses full access to resolve failures.

## 10. User Requests (Media, Animations, Bootstrap, etc.)

- [ ] User requests for media (scraping/fetching), inputs, animations, Bootstrap, or other features
      are implemented and working.
- [ ] Behavior matches “as designed and expected”; no half-finished or broken flows.

---

## Verify pipeline and environment (validation)

**Verify chain order** (from `package.json`):

1. `node ./scripts/verify.mjs` (pages, nav, admin UI, etc.)
2. `npm run env:audit`
3. `npm run ops:global-doc:check`
4. `npm run format:check` (Prettier)
5. `npm run check:css-governance`
6. `npm run check:css-budget`
7. `npm run type-check` (tsc)
8. `npm run types:check` (wrangler types --check)
9. `npm run test`
10. `npm run build`
11. `npm run governance:check`
12. `npm run guard:ui`
13. `npm run check:links`

**Environment:**

- **Node version:** Repo requires **Node 20** (`.nvmrc`). Use `nvm use 20` (or equivalent) before
  verify/ship/deploy. On Node 24+, `types:check` or other steps may fail or behave differently.
- **Format:** If verify fails on formatting only, run `npm run format` (not raw `npx prettier`) to
  fix, then re-run verify. On Windows, prefer the project script to avoid intermittent Prettier/CLR
  issues.

**Validation result:** With format clean and Node/env correct, full `npm run verify` passes. Scripts
and `wrangler.toml` are present and aligned with Workers/Wrangler. Deploy path: `npm run deploy` (or
CI deploy-on-push to `main` when configured). Use `npx wrangler deploy --dry-run` to validate deploy
packaging without deploying.

---

**References:** `AGENTS.md`, `CUSTOM_GPT_SETUP.md`, `UNIFIED_COMMAND_CENTER_SETUP.md`,
`ADSENSE_READINESS.md`, `skills/08_deploy_and_release_guardrails.md`, `DEPLOYMENT.md`.
