#!/usr/bin/env bash
set -euo pipefail

echo "[setup] node=$(node -v) npm=$(npm -v)"
echo "[setup] cwd=$(pwd)"

echo "[setup] installing deps"
npm ci

echo "[setup] verifying (format/type/test/build/link-check)"
npm run verify

echo "[setup] done"

