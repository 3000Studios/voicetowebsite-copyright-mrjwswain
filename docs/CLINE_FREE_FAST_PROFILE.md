# Free + Fast Cline Profile (voicetowebsite)

Goal: make this workspace **run “free-first”** (local Ollama), stay **fast**, and keep **safe defaults**.

## 1) One-time setup (local)

1. Install Ollama: https://ollama.com/
2. Start Ollama (it runs at `http://127.0.0.1:11434`).
3. Pull the default model I configured for this repo:

```bash
ollama pull qwen2.5-coder:7b
```

Optional (nice to have):

```bash
ollama pull deepseek-coder:latest
ollama pull llama3.2:3b
ollama pull nomic-embed-text
```

## 2) What I changed in this repo

### Cline settings

File: `.vscode/cline-settings.json`

- Default model overrides set to **`ollama/qwen2.5-coder:7b`** (no paid API required).
- Browser control set to **headless 900x600** (faster + matches tool window).
- MCP servers curated to “local essentials”:
  - enabled: filesystem / git / github / memory / web-browser
  - disabled by default: cloudflare / docker / npm-modules / stripe

If you *do* want cloud deploy tools enabled, turn them on and add the env vars.

### VS Code tasks

File: `.vscode/tasks.json`

You can now run:

- `npm: verify (lint+test+build)`
- `deploy: pages (build+pages:deploy)`

## 3) Fast daily workflow

1. Dev:
   - `npm run dev`
2. Verify before shipping:
   - `npm run lint && npm run test && npm run build`
3. Deploy:
   - `npm run pages:deploy`

## 4) Recommended “skills” (mental checklist)

When you ask Cline to do things in this repo, I will automatically follow the repo’s rules:

- install → lint → test → build → deploy → commit
- keep secrets in env vars
- preserve routes and folder structure
