# Production Config

Use these names when setting production secrets and variables for `voicetowebsite`.

## Secrets

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `GH_TOKEN`
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `GEMINI_API_KEY`
- `OLLAMA_API_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `ADSENSE_CUSTOMER_ID`
- `ADSENSE_PUBLISHER`
- `ADMIN_API_KEY`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`

## Plaintext Variables

- `GH_BASE_BRANCH=main`
- `STRIPE_PUBLIC=pk_live_...`
- `NODE_ENV=production`
- `AI_PROJECT_NAME=voicetowebsite`
- `R2_BUCKET_NAME=...`
- `R2_S3_ENDPOINT=...`
- `R2_PUBLIC_BASE_URL=...`
- `R2_BUCKET_NAME=voicetowebsite`

## Important Corrections

- Use `CLOUDFLARE_API_TOKEN`, not `CLOUD_FLARE_API_TOKEN`
- Use `GH_TOKEN` if you need a GitHub token in runtime or scripts
- Use `ANTHROPIC_API_KEY`, not `ANTHROPIC_API`
- Use `OLLAMA_API_URL`, not `OLLAMA_API`
- The HTTP header should be `x-admin-key`, but the secret stored in Cloudflare or GitHub should be `ADMIN_API_KEY`
- Keep Cloudflare API tokens and R2 S3 credentials out of tracked files and store them only as local secrets or platform secrets

## Deploy Flow

This repo now includes a GitHub Actions workflow at `.github/workflows/production.yml`:

1. Push to `main`
2. Run `lint`, `test`, and `build`
3. Deploy `dist/` to Cloudflare Pages using Wrangler
