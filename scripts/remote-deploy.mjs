#!/usr/bin/env node
/**
 * Remote deploy runner: pull latest from Git, build, and deploy via wrangler.
 * Run this from a machine or serverless that has:
 *   - Clone of this repo (or run from inside the repo)
 *   - Node 20, npm, wrangler on PATH
 *   - Env: CF_API_TOKEN (or CLOUDFLARE_API_TOKEN), CF_ACCOUNT_ID (or CLOUDFLARE_ACCOUNT_ID)
 *
 * Usage:
 *   node scripts/remote-deploy.mjs
 *   curl -X POST https://your-runner.example.com/deploy  # your server runs this script
 *
 * When the Worker calls CF_DEPLOY_HOOK_URL, your runner should run this script
 * so that the latest code from main is built and deployed.
 */
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const repoRoot =
  process.env.REPO_DIR ||
  (existsSync(join(process.cwd(), "package.json"))
    ? process.cwd()
    : join(process.cwd(), ".."));

function run(cmd, opts = {}) {
  console.log(`[remote-deploy] ${cmd}`);
  return execSync(cmd, {
    cwd: repoRoot,
    stdio: "inherit",
    ...opts,
  });
}

function main() {
  const token =
    process.env.CF_API_TOKEN ||
    process.env.CLOUDFLARE_API_TOKEN ||
    process.env.CF_TOKEN;
  const accountId =
    process.env.CF_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID;
  if (!token || !accountId) {
    console.error(
      "[remote-deploy] Set CF_API_TOKEN and CF_ACCOUNT_ID (or CLOUDFLARE_*)"
    );
    process.exit(1);
  }

  run("git fetch origin main && git checkout main && git pull origin main");
  run("npm ci --no-audit --no-fund");
  run("npm run build");
  run("npx wrangler deploy --keep-vars");
  console.log("[remote-deploy] Done.");
}

main();
