# Revenue readiness checklist

**Last updated:** after full deploy, link check, tests, and commit/push.

## Done (technical)

- **Deploy:** Latest build deployed (Worker + ASSETS). Version ID from last deploy is in deploy output.
- **Routes:** `voicetowebsite.com/*`, `www.voicetowebsite.com/*` → Worker with ASSETS binding.
- **Links:** `npm run check:links` — 124 HTML files checked, OK.
- **Tests:** 101 tests passing (including Checkout, Execute, SPA fallback, admin, rate-limiter).
- **Store/Pricing:** `/store`, `/pricing` in nav and worker; products in `public/config/products.json`; Stripe price IDs and payment links in `wrangler.toml` [vars].
- **Checkout:** Worker has `/api/checkout`, `/api/stripe/webhook`, `/api/paypal/capture`, etc. Stripe publishable key injected via `window.__ENV`. PayPal client ID injected when set in Worker Secrets.
- **Monetization:** AdSense publisher/customer in [vars]; ad slots in HTML; Stripe/PayPal live keys configured in wrangler (publishable) and Dashboard (secrets).

## Required for first dollar

1. **Worker Secrets (Cloudflare Dashboard → Worker → Variables and Secrets):**
   - `STRIPE_SECRET_KEY` — so `/api/checkout` can create Stripe sessions.
   - `PAYPAL_CLIENT_ID_PROD` and `PAYPAL_CLIENT_SECRET` (or `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` for sandbox) — so PayPal checkout works.
   - `STRIPE_WEBHOOK_SECRET` — from Stripe Dashboard → Webhooks → endpoint for `https://voicetowebsite.com/api/stripe/webhook`.

2. **Stripe:** In Stripe Dashboard, ensure the webhook for `checkout.session.completed` points at your live URL. Test a payment (e.g. test card) to confirm order recording.

3. **Traffic and conversion:** First dollar requires a real (or test) customer to open Store/Pricing, choose a product, and complete Stripe or PayPal checkout. No code change can create that event; it’s traffic + conversion.

## Quick verification

- Open `https://voicetowebsite.com/store` — page loads, products and “Buy”/checkout options visible.
- Open `https://voicetowebsite.com/pricing` — tiers and CTAs load.
- In browser console on store/pricing: `window.__ENV.STRIPE_PUBLISHABLE_KEY` should be set (from Worker injection). PayPal only appears if Worker has PayPal client ID secret set.
