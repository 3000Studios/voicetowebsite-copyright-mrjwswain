# VoiceToWebsite

Static + Vite-powered site for the VoiceToWebsite ecosystem (public pages + admin tools + app store).

## Local dev

- Install: `npm install`
- Terminal 1 (API): `npm run dev:worker` (serves `/api/orchestrator`)
- Terminal 2 (site): `npm run dev`
- Build: `npm run build`
- Preview: `npm run preview`
- Verify (typecheck + tests + build + link check): `npm run verify`

## Environment

- Copy `ENV.example` → `.env` (or set env vars in your deploy platform)
- Cloudflare settings live in `wrangler.toml`

## Makeover workflow

- See `MAKEOVER.md` for a clean, safe “new everything” order and the key entry points.
