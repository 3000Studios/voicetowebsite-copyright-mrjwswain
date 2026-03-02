# AGENTS.md

## Cursor Cloud specific instructions

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
