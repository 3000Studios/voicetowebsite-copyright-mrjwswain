# Cloudflare Bindings

This repo currently ships as a Cloudflare Pages project with an optional Worker proxy in `worker/worker.js`.

## Safe Local Secret Setup

Do not commit Cloudflare, GitHub, Stripe, PayPal, or R2 credentials into the repo.

Use one of these local-only files instead:

- `.env.local`
- `.dev.vars`

Both are ignored by git.

## Recommended Local Variables

```env
ADMIN_API_ORIGIN=http://127.0.0.1:8787
APP_NAME=voicetowebsite
API_MODE=repo-local
SITE_ORIGIN=https://voicetowebsite.com
ADMIN_API_KEY=replace-with-strong-random-string
R2_PUBLIC_BASE_URL=
R2_BUCKET_NAME=voicetowebsite
R2_S3_ENDPOINT=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
```

## Pages Variables

Set these in Cloudflare Pages for production:

- `APP_NAME`
- `API_MODE`
- `SITE_ORIGIN`
- `ADMIN_API_KEY`

## R2 Binding

If you want a real Cloudflare R2 binding in `wrangler.toml`, you still need the R2 bucket name.

Example shape:

```toml
[[r2_buckets]]
binding = "ASSETS_BUCKET"
bucket_name = "voicetowebsite"
preview_bucket_name = "voicetowebsite"
```

## Important

- The S3 endpoint, access key ID, and secret access key are for S3-compatible clients.
- The Cloudflare API token is separate from R2 S3 credentials.
- Never commit live token values into `wrangler.toml`, `.env.example`, or tracked source files.
