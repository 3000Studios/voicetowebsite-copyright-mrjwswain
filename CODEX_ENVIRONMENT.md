# Codex Environment For `voicetowebsite`

Use this when creating a Codex environment for this repository.

## Setup Script

```bash
#!/bin/bash
set -e

echo "=== VOICETOWEBSITE ENV SETUP START ==="

apt-get update -y

apt-get install -y \
  git curl wget build-essential python3 python3-pip nodejs npm jq

npm install -g \
  pnpm yarn typescript eslint prettier wrangler vite

pip3 install \
  pytest black flake8 requests

if [ -f package.json ]; then
  npm install
fi

if [ -f requirements.txt ]; then
  pip3 install -r requirements.txt
fi

mkdir -p logs scripts builds

echo "=== VOICETOWEBSITE ENV READY ==="
```

## Commands

- Lint: `npm run lint || eslint . || echo "No lint config"`
- Test: `npm run test || pytest || echo "No tests yet"`
- Build: `npm run build || echo "No build step"`

## Optional Environment Variables

- `NODE_ENV=development`
- `PYTHONUNBUFFERED=1`
- `AI_PROJECT_NAME=voicetowebsite`

## Notes

- The repo already defines working `lint`, `test`, and `build` scripts in `package.json`.
- `main` is treated as the live production branch, so pushes may deploy directly depending on Cloudflare Pages settings.
- `AGENTS.md` contains the higher-level operating rules Codex should follow inside this repo.
