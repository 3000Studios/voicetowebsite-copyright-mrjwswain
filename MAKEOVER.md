# Makeover Starter (Repo Prep)

This repo is ready to be redesigned “from the top” without breaking deploys.

## What’s in here now

- **React home**: `index.html` + `src/main.tsx` + `src/App.tsx`
- **Static pages** (multi-page build): `store.html`, `appstore.html`, `webforge.html`, etc.
- **Admin** (static pages): `admin/index.html` and other `admin/*.html` using `admin/admin.js`
- **Worker + orchestrator**:
  - Worker entry: `worker.js`
  - Orchestrator handler: `functions/orchestrator.js` (served at `/api/orchestrator`)
- **CI deploy**: `.github/workflows/deploy.yml` (Cloudflare Wrangler deploy on pushes to `main`)

## Fast commands

- Dev site: `npm run dev`
- Dev worker: `npm run dev:worker`
- Full verification: `npm run verify`
- Deploy (needs token): `npm run deploy`

## Environment variable names (supported)

**OpenAI**
- `OPENAI_API` (preferred)
- `OPENAI_API_KEY3` (accepted fallback)

**GitHub (for orchestrator commits/uploads)**
- `GH_TOKEN` / `GITHUB_TOKEN` (preferred)
- `PERSONAL_ACCESS_TOKEN_API` (accepted fallback)

**Commerce / Ads**
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`
- `PAYPAL_CLIENT_ID_PROD`
- `ADSENSE_PUBLISHER`, `ADSENSE_SLOT`

**Admin**
- `CONTROL_PASSWORD`

## “New Everything” recommended order

1. **Decide architecture**
   - Keep “multi-page static” and restyle, OR
   - Convert everything into React routes (single SPA), OR
   - Hybrid: React for core surfaces, keep static for marketing pages.
2. **Define design system**
   - Tokens: color, type scale, spacing, radii, motion durations.
   - Components: cards, nav, buttons, form fields, modals.
3. **Content + conversion**
   - Home message → Store plans → App Store products → Checkout.
4. **Admin UX**
   - Keep the “Plan → Confirm → Apply” gate and offline hard-lock.
5. **Ship safely**
   - Keep `npm run verify` green while iterating.

