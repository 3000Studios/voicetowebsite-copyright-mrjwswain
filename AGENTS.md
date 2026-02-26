# AGENTS.md

This is the root agent operations contract for the repository.

## Scope

- Applies to the entire repo unless a deeper `AGENTS.md` exists in a subdirectory.
- Subdirectory files refine behavior for that directory only.

## Primary goals

1. Keep production deploy-safe (Cloudflare Worker + Vite assets).
2. Keep admin auth secure (server-side validation + HttpOnly cookies).
3. Keep route/navigation consistency across:
   - static pages (`*.html` at repo root),
   - React surfaces (`src/`),
   - worker routing (`worker.js`),
   - admin shell routes (`/admin/*` aliases).

## Mandatory operating baseline

- Install: `npm install`
- Local run:
  - `npm run dev:worker`
  - `npm run dev`
  - or both: `npm run dev:all`
- Pre-ship gate: `npm run verify`
- Deploy: `npm run deploy`

## Canonical architecture anchors

- Runtime edge entrypoint: `worker.js`
- Static asset sync source: `nav.js`, `styles.css` -> `public/` via `scripts/sync-public-assets.mjs`
- React entry: `src/main.tsx`
- Admin shell entry: `admin/integrated-dashboard.html` + `admin/ccos.js`
- Vite dev proxy config: `vite.config.js`

## Path and route conventions

- Public pages are canonicalized to extensionless routes (e.g., `/features` -> `features.html`).
- Admin auth public pages are:
  - `/admin/login` and `/admin/login.html`
  - `/admin/access` and `/admin/access.html`
- Admin module routes (single shell app) are path-based (`/admin/mission`, `/admin/analytics`, etc.).
- The directory `app Store apps to Sell` contains spaces; always quote this path in shell commands.

## Skill library

Use the skills under `skills/` based on task type:

- `skills/01_repo_bootstrap_and_ports.md`
- `skills/02_navigation_and_route_inventory.md`
- `skills/03_admin_auth_login_flow.md`
- `skills/04_worker_api_and_security.md`
- `skills/05_react_ui_and_shared_nav.md`
- `skills/06_targeted_testing_strategy.md`
- `skills/07_docs_and_path_hygiene.md`
- `skills/08_deploy_and_release_guardrails.md`
- `skills/09_orchestrator_subproject_changes.md`

## Directory-specific agent docs

- `admin/AGENTS.md`
- `src/AGENTS.md`
- `functions/AGENTS.md`
- `scripts/AGENTS.md`
- `skills/AGENTS.md`
- `tests/AGENTS.md`
- `.agent/AGENTS.md`
- `voicetowebsite-orchestrator/AGENTS.md`

## Collaboration + handoff

- Shared protocol file: `AGENT_HANDSHAKE.txt`
- System governance docs:
  - `SYSTEM_OPERATIONS.md`
  - `DEPLOYMENT.md`
  - `GLOBAL_SYSTEM_INSTRUCTIONS.md`

