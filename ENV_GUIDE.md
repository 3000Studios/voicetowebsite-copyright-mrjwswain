# Environment Variables Guide

This document lists environment variables required or recommended for **VoiceToWebsite**.

## Critical Variables (Required for Core Functionality)

| Variable               | Description                                        | Where to find                    |
| :--------------------- | :------------------------------------------------- | :------------------------------- |
| **`CONTROL_PASSWORD`** | Password for Admin API & Neural Gate login.        | Set by you.                      |
| **`ADMIN_EMAIL`**      | Email address for Admin login validation.          | Set by you.                      |
| **`GEMINIAPIKEY2`**    | Google Gemini API key for server-side AI features. | Google AI Studio.                |
| **`LICENSE_SECRET`**   | Secret string used to sign/verify license tokens.  | Generate a strong random string. |

---

## "Run Better" Variables (Performance & Flexibility)

These are new recommendations to improve site operations, flexibility, and security.

### AI Configuration

| Variable                 | Default                | Description                                                                                     |
| :----------------------- | :--------------------- | :---------------------------------------------------------------------------------------------- |
| **`VITE_GEMINI_MODEL`**  | `gemini-2.0-flash-exp` | Override the AI model version without redeploying code. Useful when Google releases new models. |
| **`VITE_GEMINIAPIKEY2`** | (optional)             | Public client-side Gemini key used by WebForge in the browser. Treat as **public** if used.     |

### Commerce (Stripe & PayPal)

| Variable                    | Description                                                |
| :-------------------------- | :--------------------------------------------------------- |
| `STRIPE_SECRET_KEY`         | Stripe Secret Key (`sk_live_...`). Required for checkout.  |
| `STRIPE_PUBLISHABLE_KEY`    | Stripe Public Key (`pk_live_...`). Injected into frontend. |
| `PAYPAL_CLIENT_ID_PROD`     | PayPal Client ID for Live/Production environment.          |
| `PAYPAL_CLIENT_SECRET_PROD` | PayPal Secret for Live/Production environment.             |

### Demo Email Delivery

| Variable           | Description                                                                |
| :----------------- | :------------------------------------------------------------------------- |
| `RESEND_API_KEY`   | Preferred provider for demo result emails (`/api/demo/save`).              |
| `SENDGRID_API_KEY` | Fallback provider if Resend is not configured.                             |
| `DEMO_EMAIL_FROM`  | Sender identity for outbound demo emails (example: `Brand <noreply@...>`). |

### SEO & Analytics

| Variable            | Description                                                                             |
| :------------------ | :-------------------------------------------------------------------------------------- |
| `CF_ZONE_ID`        | Cloudflare Zone ID. Required for the `/admin/analytics` dashboard to show live traffic. |
| `CF_API_TOKEN`      | Cloudflare API Token with `Zone.Analytics:Read` permissions.                            |
| `ADSENSE_PUBLISHER` | Google AdSense Publisher ID (`ca-pub-XXXXXXXX`).                                        |

### Deploy Automation (Workers Builds)

| Variable                             | Description                                                                 |
| :----------------------------------- | :-------------------------------------------------------------------------- |
| `CF_WORKERS_BUILDS_AUTO_DEPLOY`      | Runtime flag (`1`) to mark deploys as queued when commit is pushed to main. |
| `VOICETOWEBSITE_WORKERS_BUILD_TOKEN` | Build token name/value used by Cloudflare Worker Builds (keep secret).      |
| `CLOUDFLARE_ACCOUNT_ID`              | Account id required by Wrangler in cloud build environments.                |

### Security & Identity

| Variable              | Description                                                                                  |
| :-------------------- | :------------------------------------------------------------------------------------------- |
| `ADMIN_COOKIE_SECRET` | Optional. If set, uses a different secret for cookie signing than the login password. Safer. |

---

## Complete `.env` Reference

```ini
# --- CORE AUTH ---
CONTROL_PASSWORD=5555
ADMIN_EMAIL=you@example.com
ADMIN_COOKIE_SECRET=

# --- AI CONFIGURATION ---
GEMINIAPIKEY2=your_key_here
# NEW: Switch models easily (e.g., gemini-1.5-pro, gemini-ultra)
VITE_GEMINI_MODEL=gemini-2.0-flash-exp
# OPTIONAL (PUBLIC): WebForge browser-side key. Do not use a secret key here.
VITE_GEMINIAPIKEY2=

# --- COMMERCE ---
LICENSE_SECRET=super_secret_signing_string
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLISHABLE_KEY=pk_...
PAYPAL_CLIENT_ID_PROD=
PAYPAL_CLIENT_SECRET_PROD=

# --- ANALYTICS ---
CF_ZONE_ID=
CF_API_TOKEN=
ADSENSE_PUBLISHER=

# --- WORKERS BUILDS (AUTO DEPLOY) ---
CF_WORKERS_BUILDS_AUTO_DEPLOY=1
VOICETOWEBSITE_WORKERS_BUILD_TOKEN=
CLOUDFLARE_ACCOUNT_ID=
```
