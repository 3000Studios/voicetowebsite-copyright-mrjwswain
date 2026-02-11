# Agent Operating Manual (Jules)

This repo is designed for an autonomous operator to make changes safely and keep production live.

## Non-Negotiables

- Always run `npm run verify` before shipping.
- Never commit if `npm run verify` fails.
- DONE means deployed to production (Cloudflare).
- Do not add secrets to git. Use environment variables only.

## One Command Rules

- Verify: `npm run verify`
- Local dev: `npm run dev:all`
- Deploy (production): `npm run deploy`
- Auto everything (watch, verify, commit, push, deploy): `npm run auto:ship`

## Deployment Policy

- GitHub Actions deployment is intentionally disabled for this repo.
- Production deploy is performed via local `wrangler deploy` (`npm run deploy`), typically driven by `npm run auto:ship`.
  - `npm run deploy` runs `npm run verify` first, then `wrangler deploy --keep-vars`.

## Environment Variables (Typical)

Set only what you need for the task.

- Cloudflare deploy:
  - `CLOUDFLARE_API_TOKEN` (required to deploy from a hosted agent environment)
- Admin auth:
  - `CONTROL_PASSWORD` (enables `/api/admin/login`)

## Project Map

- Global styles: `styles.css`, `src/index.css`
- Global shell (nav/footer/widget/waves/theme): `nav.js`
- Worker entrypoint: `worker.js`
- Wrangler config: `wrangler.toml`
- Admin UI: `admin/index.html`, `admin/*.html`
- Public static assets: `public/`

## UI Change Guidelines

- Prefer editing shared layers (`styles.css`, `nav.js`) over changing every page.
- Keep overlays behind content: use stable z-index layers and avoid `pointer-events` traps.
- If changing animations, respect `prefers-reduced-motion`.

## Failure Handling

- If deploy fails: do not loop commits. Fix the root cause, then re-run `npm run verify`, then deploy.
- If you need to rollback quickly: redeploy a known-good commit (or revert) and run `npm run deploy`.
