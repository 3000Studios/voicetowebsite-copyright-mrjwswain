#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const TOKEN_KEYS = ["CLOUDFLARE_API_TOKEN", "CF_API_TOKEN"];
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

function isValidAccountId(value) {
  return /^[a-f0-9]{32}$/i.test(String(value || "").trim());
}

const env = { ...process.env };
for (const key of TOKEN_KEYS) {
  if (isPlaceholder(env[key])) delete env[key];
}
for (const key of ACCOUNT_KEYS) {
  const val = String(env[key] || "").trim();
  if (!val || !isValidAccountId(val)) delete env[key];
}

const args = ["wrangler", "deploy", "--keep-vars", ...process.argv.slice(2)];
const cmd = process.platform === "win32" ? "npx.cmd" : "npx";
const result = spawnSync(cmd, args, { stdio: "inherit", env });
process.exit(result.status ?? 1);
