# Skill: Repo Bootstrap and Ports

## Use when

- You need to start or validate the local development environment.
- You need to verify which service owns a route in dev.

## Steps

1. Install deps once: `npm install`
2. Start worker API: `npm run dev:worker` (port `8787`)
3. Start Vite site: `npm run dev` (port `5173`)
4. Or run both: `npm run dev:all`
5. Confirm proxy-sensitive routes from the browser:
   - `/api/config/status`
   - `/api/admin/login`
   - `/api/health`

## Common pitfalls

- API route works on `8787` but 404s on `5173` -> missing Vite proxy mapping.
- Worker auth appears disabled locally -> missing local env vars (for example `CONTROL_PASSWORD`).
- Editing `vite.config.js` may require dev server restart if hot restart does not trigger.

## Exit criteria

- Site serves on `5173`.
- Worker serves on `8787`.
- API routes resolve correctly through Vite proxy.
