# Recommended VS Code / Cursor Extensions for This Repo

Extensions are listed in `.vscode/extensions.json`. Install all: **Extensions** → "Recommended"
filter → "Install Workspace Recommended Extensions".

---

## Already Recommended (in extensions.json)

| Extension                  | Why it helps                                                                               |
| -------------------------- | ------------------------------------------------------------------------------------------ |
| **ESLint**                 | Lint JS/TS; matches `npm run lint` and pre-commit.                                         |
| **Prettier**               | Format on save; matches `npm run format` and lint-staged.                                  |
| **EditorConfig**           | Keeps indent/line endings consistent across editors.                                       |
| **Cloudflare KV Explorer** | Browse and inspect KV namespaces during local dev with Wrangler (fuzzy search, tree view). |
| **TypeScript (next)**      | Strong TS support for `src/`, `worker.js` types.                                           |
| **GitLens**                | Blame, history, and git context in the editor.                                             |
| **Path Intellisense**      | Autocomplete file paths in imports and strings.                                            |
| **Code Spell Checker**     | Catches typos in prose and identifiers.                                                    |
| **Error Lens**             | Inline errors and warnings in the editor.                                                  |
| **ES7+ React Snippets**    | Fast React/JSX snippets.                                                                   |
| **Continue**               | AI pair-programming/chat workflows in-editor.                                              |
| **Material Icon Theme**    | Clear file/folder icons.                                                                   |
| **PowerShell**             | Run scripts and `npm run` from integrated terminal on Windows.                             |
| **GitHub Actions**         | Edit and validate `.github/workflows/*.yml`.                                               |
| **REST Client**            | Send HTTP requests from `.http` files (e.g. test `/api/generate`, `/api/execute`).         |
| **Dotenv**                 | Syntax highlighting and validation for `.env` and `.dev.vars`.                             |
| **Vitest**                 | Run and debug tests from the sidebar.                                                      |
| **Thunder Client**         | API testing with a GUI (collections, history).                                             |
| **Markdown All in One**    | Shortcuts and preview for `AGENTS.md`, `README.md`, etc.                                   |

---

## Optional

| Extension                   | ID                      | Why                                                                        |
| --------------------------- | ----------------------- | -------------------------------------------------------------------------- |
| **Wrangler** (if available) | Cloudflare              | Deploy, tail, and manage secrets from the editor.                          |
| **Todo Tree**               | `Gruntfuggly.todo-tree` | Collects TODO/FIXME in one view (in unwanted by default; add if you like). |

---

## Unwanted (in extensions.json)

These are listed as **unwanted** so the editor won’t suggest them for this workspace: duplicate or
conflicting tools (e.g. multiple Vitest explorers, Copilot if you use Cursor/Continue), or ones that
were explicitly disabled (e.g. Live Server, since you use Vite).

---

## Quick start

1. Open the repo in VS Code or Cursor.
2. When prompted, click **Install** for workspace recommendations, or open Extensions
   (`Ctrl+Shift+X`), filter by **Recommended**, and install.
3. For **REST Client**: open `.vscode/api-tests.http` and use "Send Request" above each block to hit
   `/api/health`, `/api/generate`, `/api/execute`, `/api/deploy/logs`, etc. Use `npm run dev:worker`
   (port 8787) or `npm run dev` (5173 proxies to 8787) so requests go to your local Worker.
