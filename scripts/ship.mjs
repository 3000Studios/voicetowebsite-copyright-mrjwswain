#!/usr/bin/env node
/**
 * Master ship command: lint → verify (tests + build) → push (if dirty) → deploy → logs.
 * Single entry point for tests, lint, verify, build, push, deploy, and log summary.
 * Only deploy through: npm run ship
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const isWin = process.platform === "win32";
const npmCmd = isWin ? process.env.ComSpec || "cmd.exe" : "npm";
const npmPrefixArgs = isWin ? ["/d", "/s", "/c", "npm"] : [];
const gitCmd = isWin ? "git.exe" : "git";

const args = process.argv.slice(2);
const skipPush = args.includes("--no-push");
const messageFlagIndex = args.findIndex((a) => a === "-m" || a === "--message");
const explicitMessage =
  messageFlagIndex >= 0 && args[messageFlagIndex + 1]
    ? args[messageFlagIndex + 1]
    : null;

const message =
  explicitMessage ||
  process.env.SHIP_MESSAGE ||
  `chore: ship ${new Date().toISOString().replace("T", " ").slice(0, 16)} UTC`;

const run = (cmd, cmdArgs, opts = {}) => {
  const res = spawnSync(cmd, cmdArgs, {
    stdio: "inherit",
    shell: false,
    env: process.env,
    ...opts,
  });
  if (res.status !== 0) process.exit(res.status ?? 1);
};

console.log("[ship] 1/6 lint");
run(npmCmd, [...npmPrefixArgs, "run", "lint"]);

console.log("[ship] 2/6 verify (tests + build)");
run(npmCmd, [...npmPrefixArgs, "run", "verify"]);

const status = spawnSync(gitCmd, ["status", "--porcelain"], {
  stdio: ["ignore", "pipe", "inherit"],
  shell: false,
  env: process.env,
});
if (status.status !== 0) process.exit(status.status ?? 1);

const hasChanges = Boolean(String(status.stdout || "").trim());
if (hasChanges && !skipPush) {
  console.log("[ship] 3/6 push (commit + push)");
  run(gitCmd, ["add", "-A"]);
  run(gitCmd, ["commit", "-m", message]);
  run(gitCmd, ["push"]);
} else if (hasChanges && skipPush) {
  console.log("[ship] 3/6 skip push (--no-push)");
  run(gitCmd, ["add", "-A"]);
  run(gitCmd, ["commit", "-m", message]);
} else {
  console.log("[ship] 3/6 no changes to push");
}

console.log("[ship] 4/6 deploy");
run(npmCmd, [...npmPrefixArgs, "run", "deploy"]);

console.log("[ship] 5/6 logs (summary)");
const buildIdPath = join(process.cwd(), "dist", ".build-id");
const buildId = existsSync(buildIdPath)
  ? readFileSync(buildIdPath, "utf8").trim()
  : "—";
console.log(`[ship] Build ID: ${buildId}`);
console.log("[ship] 6/6 done. Live logs: npm run debug:tail");
console.log("");
