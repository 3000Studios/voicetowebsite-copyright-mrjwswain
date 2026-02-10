---
description: Fully automate the project build, verify, and deploy pipeline (Cloudflare Workers)
---

# Production Deployment Flow (The TRUTH)

**TRUTH**: GitHub Actions deploy is disabled. We deploy from the local machine via Wrangler.
`wrangler.toml` routes `voicetowebsite.com/*` to the Worker.

## Manual Deployment Steps

1. **Verify locally**:

   ```bash
   npm run verify
   ```

2. **Deploy to Cloudflare**:
   (Builds then runs `wrangler deploy`)
   ```bash
   npm run deploy
   ```

## "Auto everything" loop

(Watch/Verify/Commit/Push/Deploy)

```bash
npm run auto:ship
```

## Local Development

(Runs site + worker dev together)

```bash
npm run dev:all
```

// turbo
npm run deploy
