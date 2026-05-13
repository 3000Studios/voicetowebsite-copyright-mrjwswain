#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, {
    stdio: "pipe",
    encoding: "utf8",
    shell: process.platform === "win32",
    ...options,
  });
  if (result.status !== 0) {
    const message =
      result.stderr?.trim() || result.stdout?.trim() || "Command failed.";
    throw new Error(message);
  }
  return result.stdout?.trim() || "";
};

const main = () => {
  const status = run("git", ["status", "--short"]);
  if (status) {
    throw new Error(
      "Rollback requires a clean git worktree. Commit or stash changes first."
    );
  }

  const head = run("git", ["rev-parse", "--short", "HEAD"]);
  console.log(`Creating revert commit for ${head}...`);
  run("git", ["revert", "--no-edit", "HEAD"], { stdio: "inherit" });

  console.log("Rollback commit created.");
  console.log("Next steps:");
  console.log("1. npm run verify");
  console.log("2. npm run ship:push");
  console.log("3. npm run deploy:live");
};

try {
  main();
} catch (error) {
  console.error(`[rollback-safe] ${error.message}`);
  process.exit(1);
}
