#!/usr/bin/env node
/**
 * Run vite build with bundle analyzer. Writes dist/stats.html (open in browser to inspect chunk sizes).
 * Usage: npm run build:analyze
 */

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const result = spawnSync("npx", ["vite", "build"], {
  stdio: "inherit",
  shell: true,
  cwd: root,
  env: { ...process.env, ANALYZE: "1", VITE_ANALYZE: "1" },
});

process.exit(result.status ?? 1);
