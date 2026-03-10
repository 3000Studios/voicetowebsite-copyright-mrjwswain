# AGENTS.md

## Cursor Cloud specific instructions

### Deployment Lock Policy (Do Not Deviate)

Follow this workflow for this repo unless the user explicitly says otherwise.

**Source of truth**

- Cloudflare Workers + Wrangler is the deployment path.
- **Single deploy path:** From any entry point (Cursor, another IDE, Custom GPT, CLI) run
  `npm run deploy:live`. It runs verify then deploy (`scripts/deploy-unified.mjs`). Do not use a
  different deploy flow.
- Do not introduce a different deploy method, platform, or branch strategy.

**Branch and release model**

- Use `main` only.
- Keep local and remote `main` in sync.
- Do not create side branches unless the user explicitly requests it.

**Required flow after any code change**

1. Run `npm run verify`.
2. If verify fails: fix issues immediately in the same session, then re-run `npm run verify` until
   green.
3. When green: run `npm run ship` (or equivalent verify+commit flow).
4. Push with `npm run ship:push` (or equivalent).
5. Deploy with `npm run deploy:live` (single path: verify + deploy).
6. Confirm deploy/build success and report result.

**Hard rules**

- Never commit or deploy a red/broken state.
- Never skip verify before ship/deploy.
- Never change deploy pipeline/config unless required to fix a failure, and then explain exactly
  what changed.
- Keep Custom GPT execute flow, auth, schema, and command center integration working.
- Keep checkout/pay links, previews, UI/UX requests, and AdSense readiness functional.
- If anything breaks (verify/test/build/deploy), auto-fix it in-session and continue to green.

**Expected behavior**

- Default behavior is: verify → ship → push → deploy.
- Stick to the current working deployment path and lock it in.
- Only change this policy when the user explicitly instructs to.

**Environment for verify/ship/deploy**

- Use **Node 20** (see `.nvmrc`). Run `nvm use 20` before verify/ship/deploy; other Node versions
  can cause `types:check` or other steps to fail.
- If verify fails on formatting only, run `npm run format` then re-run verify. Use the project
  `npm run format` script rather than raw `npx prettier` to avoid environment-specific issues.

---

### Overview

VoiceToWebsite is an AI-powered voice-to-website builder. The frontend is React + Vite; the backend
is a Cloudflare Worker (`worker.js`). All storage (D1, KV, R2, Durable Objects) is
Cloudflare-managed and emulated locally by `wrangler dev --local`.

### Cloudflare plugin (use for all CF work)

Use the **Cloudflare plugin** for everything possible on this project:

- **Docs**: Call `search_cloudflare_documentation` (cloudflare-docs MCP) before answering questions
  about Workers, D1, KV, R2, Durable Objects, wrangler, bindings, or deployment. Prefer retrieved
  docs over generic knowledge.
- **Skills**: Use **workers-best-practices** when editing `worker.js`; **durable-objects** for DO
  code; **wrangler** before running wrangler commands; **cloudflare** for general CF config and
  bindings.
- **MCP**: Use **cloudflare-bindings** (D1/KV/R2/Workers tools) when inspecting or validating
  account resources; **cloudflare-builds** / **cloudflare-observability** for deploy and
  observability when relevant.
- **Commands**: Use `/build-agent` or `/build-mcp` when the user wants to build an AI agent or
  remote MCP server on Workers.

See `.cursor/rules/cloudflare-plugin.mdc` for the full rule.

- **Config hygiene**: Keep `compatibility_date` in `wrangler.toml` current (e.g. today’s date).
  After adding/renaming bindings, run `npm run types` so `worker-configuration.d.ts` stays in sync.
  Use `npm run types:check` in CI if desired.

### Quick reference

| Task                | Command                                |
| ------------------- | -------------------------------------- |
| Install deps        | `npm ci` (or `npm install` for non-CI) |
| Lint                | `npm run lint`                         |
| Type-check          | `npm run type-check`                   |
| Tests               | `npm test`                             |
| Build               | `npm run build`                        |
| Dev (frontend only) | `npm run dev`                          |
| Dev (worker only)   | `npm run dev:worker`                   |
| Dev (both)          | `npm run dev:all`                      |
| Format              | `npm run format`                       |
| Full verify         | `npm run verify`                       |
| Worker types        | `npm run types`                        |
| Types check (CI)    | `npm run types:check`                  |

See `README.md` for full documentation.

### PowerShell scripts (user preference)

When writing PowerShell scripts for this repo (e.g. env/config or one-off automation):

- Start with `cd` to the project root so the script works from any current directory.
- Set `$ErrorActionPreference = "Stop"` and declare variables at the top.
- If the target file may not exist, create it with
  `if (!(Test-Path $path)) { New-Item -ItemType File -Path $path | Out-Null }`.
- Read with `Get-Content $path -ErrorAction SilentlyContinue`.
- Use a simple `$out = @()` array and `$out += ...` (no ArrayList).
- Use multi-line, indented `foreach`/`if`/`else` blocks for readability.
- Write with `$out | Set-Content $path` (no `-NoNewline` unless required).
- End with a green success message and `Select-String` or similar to show the result.

Example pattern: `scripts/set-admin-env.ps1`.

### Non-obvious caveats

- **Node 20 required.** The `.nvmrc` pins Node 20. Run `nvm use 20` (or ensure default is 20) before
  any commands. Lighthouse 13 warns about wanting Node >= 22.19 — this is safe to ignore for local
  dev.
- **ESLint plugins missing from `package.json`.** The `eslint.config.js` imports `eslint`,
  `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `globals`, and `typescript-eslint`,
  but these are not listed in `package.json`. You must install them:
  `npm install --save-dev eslint eslint-plugin-react-hooks eslint-plugin-react-refresh globals typescript-eslint --legacy-peer-deps`.
  The `--legacy-peer-deps` flag is needed because `eslint-plugin-react-hooks` has a peer dep on
  ESLint <= 9 while the project uses ESLint 10.
- **Pre-existing lint errors.** ESLint reports ~137 errors and ~505 warnings in the existing
  codebase. These are not regressions — they are the baseline state.
- **`.env` file.** Copy `ENV.example` to `.env` for local development. No secrets are required for
  the frontend Vite dev server or for running tests.
- **Vite dev server** runs on port 5173. API calls are proxied to `wrangler dev` on port 8787 (see
  `vite.config.js`).
- **Husky hooks** run `npm run verify` on pre-commit, which includes type-check, tests, build, link
  check, and more. This can be slow; be aware when committing.
