# Agent Operating Manual (Jules)

This repo is designed for an autonomous operator to make changes safely and keep production live.

## Non-Negotiables

- Always run `npm run verify` before shipping.
- Never commit if `npm run verify` fails.
- DONE means deployed to production (Cloudflare).
- Do not add secrets to git. Use environment variables only.

## Agent Roles & Specialties

- **Windsurf**: Implementation surface, UX assembly, and visual polish.
- **Codex**: Parallel engineering, unit tests, refactoring, and performance.
- **Gemini**: Architecture, context management, and integration reasoning.
- **Jules**: Safety, hygiene, operational quality, and security.

## Core Directives

- Verify: `npm run verify`
- Local dev: `npm run dev:all`
- Deploy: `npm run deploy`
- Auto everything: `npm run auto:ship`

## Deployment Policy

- GitHub Actions deployment is intentionally disabled for this repo.
- Production deploy is performed via local `wrangler deploy` (`npm run deploy`), typically driven by
  `npm run auto:ship`.
  - `npm run deploy` runs `npm run verify` first, then `wrangler deploy --keep-vars`.

## Environment Variables (Typical)

Set only what you need for the task.

- Cloudflare deploy:
  - `CLOUDFLARE_API_TOKEN` (required to deploy from a hosted agent environment)
  - `VOICETOWEBSITE_WORKERS_BUILD_TOKEN` (required in Cloudflare Worker Builds API token settings
    for auto-deploy)
  - `CF_WORKERS_BUILDS_AUTO_DEPLOY=1` (runtime flag when using push-triggered Workers Builds)
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

## Debugging & Monitoring

- **Tail logs**: `npx wrangler tail` to see live Worker errors.
- **Trace**: Add `console.trace()` to locate the source of unexpected calls.
- **Inspect**: Use `debug:*` namespaces to filter console output (if tools are installed).
- **Verify**: Always check `npm run verify` before assuming a fix works.

## Failure Handling

- If deploy fails: Fix the root cause, then re-run `npm run verify`, then deploy.
- If payment fails: Check `PAYPAL_CLIENT_ID` and `VITE_PAYPAL_CLIENT_ID` parity.
- Rollback: Redeploy a known-good commit and run `npm run deploy`.
