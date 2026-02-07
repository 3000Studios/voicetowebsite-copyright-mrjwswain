import { spawnSync } from "node:child_process";

const gitCmd = process.platform === "win32" ? "git.exe" : "git";
const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

const run = (cmd, args, { capture = false } = {}) => {
  const res = spawnSync(cmd, args, {
    stdio: capture ? ["ignore", "pipe", "inherit"] : "inherit",
    shell: false,
    env: process.env,
  });
  if (res.status !== 0) process.exit(res.status ?? 1);
  return capture ? String(res.stdout || "") : "";
};

run(gitCmd, ["fetch", "--prune", "origin"]);

// Block pushing if local is behind origin/main to keep "always synced" discipline.
const out = run(gitCmd, ["rev-list", "--left-right", "--count", "origin/main...HEAD"], { capture: true }).trim();
const [behindRaw, aheadRaw] = out.split(/\s+/);
const behind = Number(behindRaw || 0);
const ahead = Number(aheadRaw || 0);

if (Number.isFinite(behind) && behind > 0) {
  console.error(
    `Refusing push: your branch is behind origin/main by ${behind} commit(s). Run: npm run sync (or git pull --rebase).`
  );
  process.exit(1);
}

console.log(`Sync check OK (ahead=${ahead}, behind=${behind}).`);
run(npmCmd, ["run", "verify"]);
