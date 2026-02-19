## Environment Variable Audit (names only)

Generated from `worker.js`, `functions/`, and `src/` by scanning `env.*` usages.

### Core Admin / Auth

- `CONTROL_PASSWORD` (required to enable `/api/admin/login`)
- `ADMIN_COOKIE_SECRET` (recommended; separate cookie signing secret)
- `ADMIN_ACCESS_CODE` (optional; falls back to `CONTROL_PASSWORD` for `/api/admin/access-code`)
- `ALLOW_ADMIN_HEADER_TOKEN` (optional; allow `x-admin-token`)
- `ALLOW_INSECURE_ADMIN_COOKIE_SECRET` (optional; allow cookie signing fallback)
- `ADMIN_ROLE` (optional; app-specific)
- `OWNER_KEY` (used by `src/functions/execute.js` owner bypass)

### Orchestrator / Deploy

- `ORCH_TOKEN`, `X_ORCH_TOKEN`
- `CF_DEPLOY_HOOK_URL`, `CF_PAGES_DEPLOY_HOOK`, `VOICETOWEBSITE_HOOK`
- `CF_WORKERS_BUILDS_AUTO_DEPLOY`, `CF_AUTO_DEPLOY_ON_PUSH`
- `CF_ALLOW_LEGACY_DEPLOY_HOOKS`
- GitHub: `GH_REPO`, `GH_BASE_BRANCH`, `GH_TOKEN`, `GH_BOT_TOKEN`, `GITHUB_*`, `GITHUB_TOKEN`,
  `GITHUB_PAT`

### Cloudflare Analytics

- `CF_ZONE_ID` (fallback if `request.cf.zoneId` absent)
- Tokens (one of): `CF_API_TOKEN` (preferred), `CF_USER_TOKEN`, `CLOUDFLARE_API_TOKEN`,
  `CF_API_TOKEN2`

### Payments / Commerce

- Stripe: `STRIPE_PUBLISHABLE_KEY`/`STRIPE_PUBLIC` (public), `STRIPE_SECRET_KEY` (secret),
  `STRIPE_WEBHOOK_SECRET` (secret)
- Stripe commerce config: `STRIPE_PRICE_*`, `STRIPE_PAYMENT_LINK_*`, `STRIPE_BUY_BUTTON_ID_*`,
  `STRIPE_PAYMENT_METHOD_TYPES`, `STRIPE_ALLOW_CUSTOM_AMOUNT`
- PayPal: `PAYPAL_ENV`/`PAYPAL_MODE`, `PAYPAL_CLIENT_ID(_PROD)`, `PAYPAL_CLIENT_SECRET(_PROD)`,
  `PAYPAL_WEBHOOK_ID(_PROD)`
- PayPal commerce config: `PAYPAL_PAYMENT_LINK_*`

### AI / Email

- OpenAI: `OPENAI_API` or `OPENAI_API_KEY`/`OPENAI_API_KEY3`, `OPENAI_MODEL`
- Gemini: `GEMINIAPIKEY2`, `VITE_GEMINIAPIKEY2`, `VITE_GEMINI_MODEL`
- Email: `RESEND_API_KEY`, `SENDGRID_API_KEY`, `DEMO_EMAIL_FROM`, `EMAIL_FROM`

### Licensing / Downloads

- `LICENSE_SECRET` (required for license tokens)
- `SIGNATURE_SECRET` (required for signed download URLs)

### Storage / Bindings

- `ASSETS`/`SITE_ASSETS` (static binding)
- `D1`/`DB` (database binding)
- `KV`, `VTW_KV`, `VTW_CACHE` (kv bindings/flags)
- `R2`, `R2_BUCKET` (r2 binding)
- `BOT_HUB` (durable object binding)
