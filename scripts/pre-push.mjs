import { spawnSync } from "node:child_process";

const isWin = process.platform === "win32";
const gitCmd = isWin ? "git.exe" : "git";

const run = (cmd, args, { capture = false } = {}) => {
  const res = spawnSync(cmd, args, {
    stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
    shell: false,
    env: process.env,
  });
  return {
    status: res.status,
    out: capture ? String(res.stdout || "").trim() : "",
  };
};

// Skip `git fetch`: it can trigger credential helpers (e.g. credential-manager-core) and
// cause segfaults or missing-command errors on some Windows setups. Use existing refs.
// Block pushing if local is behind origin/main to keep "always synced" discipline.
const { status: revStatus, out } = run(
  gitCmd,
  ["rev-list", "--left-right", "--count", "origin/main...HEAD"],
  { capture: true }
);

if (revStatus !== 0) {
  console.warn(
    "pre-push: could not compare to origin/main (run 'git fetch' if needed). Allowing push."
  );
  process.exit(0);
}

const [behindRaw, aheadRaw] = out.split(/\s+/);
const behind = Number(behindRaw || 0);
const ahead = Number(aheadRaw || 0);

if (Number.isFinite(behind) && behind > 0) {
  console.error(
    `Refusing push: your branch is behind origin/main by ${behind} commit(s). Run: git pull --rebase (or npm run sync).`
  );
  process.exit(1);
}

console.log(`Sync check OK (ahead=${ahead}, behind=${behind}).`);
// Verify is already run in pre-commit; skip here to avoid long runs and credential-triggering git ops.
process.exit(0);
