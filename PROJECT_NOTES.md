# Project Notes

- Domain/routes: `voicetowebsite.com/*`, `www.voicetowebsite.com/*` (set in `wrangler.toml`). Old
  domain `youtuneai.com/*` can be redirected at Cloudflare if desired.
- Worker entry: `worker.js` imports `functions/orchestrator.js` for `/api/orchestrator`; serves
  static assets from `dist`.
- Admin UI: `/admin` (files in `admin/`), voice capture + command preview.
- Frontend: `index.html`, `app.js`, `styles.css`, supporting pages (`store.html`, etc.).
- Build: Vite (`package.json`, `vite.config.js`). `npm run build` emits to `dist/`.
- Secrets: `OPENAI_API`, `GITHUB_TOKEN`, `GITHUB_REPO`, `GITHUB_BASE_BRANCH`, optional
  `PAYPAL_CLIENT_ID_PROD`, `ADSENSE_PUBLISHER`, `ADSENSE_SLOT`, `DB` (D1).
- Ownership/IP: `OWNER.md`, `COPYRIGHT`, `PATENT_PREP.md`. Repo is proprietary, no public license.
- Pending hardening (future): JWT/Access gate on `/api/orchestrator`, JSON Schema validation of
  commands, rate limiting, D1 logging/rollback.

## Automation & Deployment Rules

- **Always Auto-Retry Deployment**: The deployment script (`automate_all.ps1`) is configured to
  automatically retry deployment up to 3 times on failure. This is a critical rule to handle
  transient network or CLI issues.
- **Always Accept All**: Use `git add .` and `git commit` to accept all changes automatically in
  scripts. Avoid interactive prompts.
- **Auto-Fix Loop**: If a task fails (especially deployment or tests), the agent must:
  1. Read the debug info/error logs.
  2. Propose and implement a fix.
  3. Retry the operation.
  4. Repeat until all bugs are fixed and the operation succeeds.
