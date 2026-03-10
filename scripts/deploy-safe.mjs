#!/usr/bin/env node
/**
 * Deploy to Cloudflare Workers via wrangler. Called by deploy-unified.mjs after verify.
 * Use npm run deploy:live for the full path (verify + deploy).
 */

import { spawnSync } from "node:child_process";
import { accessSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const TOKEN_KEYS = [
  "CLOUD_FLARE_API_TOKEN",
  "CLOUDFLARE_API_TOKEN",
  "CF_API_TOKEN",
];
const ACCOUNT_KEYS = ["CLOUDFLARE_ACCOUNT_ID", "CF_ACCOUNT_ID"];

const PLACEHOLDER_VALUES = new Set([
  "",
  "placeholder",
  "placeholder_token",
  "your_token_here",
  "your_cloudflare_api_token",
  "changeme",
  "change_me",
  "token_here",
]);

function isPlaceholder(value) {
  const v = String(value || "").trim();
  if (!v) return true;
  const lower = v.toLowerCase();
  if (PLACEHOLDER_VALUES.has(lower)) return true;
  if (lower.startsWith("placeholder_")) return true;
  if (lower.includes("example")) return true;
  return false;
}

function isValidApiToken(value) {
  const v = String(value || "").trim();
  if (!v || isPlaceholder(v)) return false;
  // Basic Cloudflare API token format validation (starts with specific prefix)
  // Cloudflare tokens typically start with "v1." or similar prefixes
  return /^[A-Za-z0-9._-]{20,}$/.test(v);
}

function isValidAccountId(value) {
  return /^[a-f0-9]{32}$/i.test(String(value || "").trim());
}

function log(msg) {
  console.error(`[deploy-safe] ${msg}`);
}

function main() {
  try {
    const requiredFiles = ["package.json", "wrangler.toml", "worker.js"];
    for (const file of requiredFiles) {
      try {
        accessSync(path.join(root, file));
      } catch (err) {
        log(
          `Required file missing: ${file}. Make sure you're in the project root directory.`
        );
        process.exit(2);
      }
    }

    const env = { ...process.env };
    for (const key of TOKEN_KEYS) {
      if (!isValidApiToken(env[key])) delete env[key];
    }
    for (const key of ACCOUNT_KEYS) {
      const val = String(env[key] || "").trim();
      if (!val || !isValidAccountId(val)) delete env[key];
    }

    const hasAuth =
      TOKEN_KEYS.some((k) => env[k]) || ACCOUNT_KEYS.some((k) => env[k]);
    if (!hasAuth) {
      log(
        "No valid Cloudflare auth found. Set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID, or run 'npx wrangler login'."
      );
      process.exit(3);
    }

    const args = [
      "wrangler",
      "deploy",
      "--keep-vars",
      ...process.argv.slice(2),
    ];
    const result = spawnSync("npx", args, {
      stdio: "inherit",
      env,
      shell: process.platform === "win32",
      cwd: root,
    });

    if (result.error) {
      log(`Failed to start wrangler: ${result.error.message}`);
      process.exit(4);
    }

    if (result.status !== 0) {
      log(`Wrangler exited with code ${result.status}`);
      // Fix: Only use fallback if result.status is null/undefined, not if it's 0
      process.exit(
        result.status !== null && result.status !== undefined
          ? result.status
          : 5
      );
    }
  } catch (err) {
    log(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

main();
