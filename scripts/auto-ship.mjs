import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const LOCK_PATH = path.join(ROOT, ".git", "auto-ship.lock");

const DEBOUNCE_MS = Number(process.env.AUTO_SHIP_DEBOUNCE_MS || 12000);
const MIN_INTERVAL_MS = Number(process.env.AUTO_SHIP_MIN_INTERVAL_MS || 60000);
const COMMIT_PREFIX = process.env.AUTO_SHIP_COMMIT_PREFIX || "Auto:";
// Permanent default: deploy via local workaround (not GitHub Actions).
const AUTO_DEPLOY = String(process.env.AUTO_SHIP_DEPLOY || "1").trim() !== "0";
const DEPLOY_CMD = process.env.AUTO_SHIP_DEPLOY_CMD || "npm run deploy";

const IGNORE_DIRS = new Set([".git", "node_modules", "dist", ".wrangler", ".vite", "coverage"]);
const IGNORE_FILES = new Set([
  // Prevent churn from editor/temp files
  ".DS_Store",
  "Thumbs.db",
]);

const run = (cmd, args, opts = {}) => {
  const res = spawnSync(cmd, args, {
    cwd: ROOT,
    stdio: "inherit",
    shell: process.platform === "win32",
    ...opts,
  });
  if (res.error) throw res.error;
  return res.status ?? 1;
};

const runShell = (commandLine) => {
  const res = spawnSync(commandLine, {
    cwd: ROOT,
    stdio: "inherit",
    shell: true,
    env: process.env,
  });
  if (res.error) throw res.error;
  return res.status ?? 1;
};

const runCapture = (cmd, args) => {
  const res = spawnSync(cmd, args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    shell: process.platform === "win32",
  });
  return {
    code: res.status ?? 1,
    out: (res.stdout || "").trim(),
    err: (res.stderr || "").trim(),
  };
};

const hasGit = () => runCapture("git", ["rev-parse", "--is-inside-work-tree"]).code === 0;
const isDirty = () => runCapture("git", ["status", "--porcelain=v1"]).out.length > 0;
const isRebasingOrMerging = () => {
  const gitDir = path.join(ROOT, ".git");
  const markers = ["rebase-apply", "rebase-merge", "MERGE_HEAD", "CHERRY_PICK_HEAD"];
  return markers.some((m) => fs.existsSync(path.join(gitDir, m)));
};
const ensureUpstream = () => {
  const r = runCapture("git", ["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"]);
  return r.code === 0;
};

const acquireLock = () => {
  try {
    fs.writeFileSync(LOCK_PATH, String(Date.now()), { flag: "wx" });
    return true;
  } catch {
    return false;
  }
};
const releaseLock = () => {
  try {
    fs.unlinkSync(LOCK_PATH);
  } catch {}
};

const fmtTs = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(
    d.getSeconds()
  )}`;
};

const shouldIgnore = (filePath) => {
  const rel = path.relative(ROOT, filePath);
  if (!rel || rel.startsWith("..")) return true;
  const parts = rel.split(path.sep);
  if (parts.some((p) => IGNORE_DIRS.has(p))) return true;
  const base = parts[parts.length - 1];
  if (IGNORE_FILES.has(base)) return true;
  if (base.endsWith(".swp") || base.endsWith(".tmp")) return true;
  return false;
};

if (!hasGit()) {
  console.error("auto-ship: not a git repository");
  process.exit(1);
}
if (!ensureUpstream()) {
  console.error("auto-ship: no upstream configured (set it with `git push -u origin main`)");
  process.exit(1);
}

let timer = null;
let lastRunAt = 0;
let queued = false;

const schedule = () => {
  queued = true;
  if (timer) clearTimeout(timer);
  timer = setTimeout(tick, DEBOUNCE_MS);
};

const tick = () => {
  timer = null;
  if (!queued) return;
  queued = false;

  const now = Date.now();
  const since = now - lastRunAt;
  if (since < MIN_INTERVAL_MS) {
    timer = setTimeout(tick, MIN_INTERVAL_MS - since);
    return;
  }

  if (isRebasingOrMerging()) {
    console.log("auto-ship: git operation in progress (merge/rebase/cherry-pick); waiting...");
    schedule();
    return;
  }
  if (!isDirty()) return;
  if (!acquireLock()) {
    console.log("auto-ship: another run is in progress; waiting...");
    schedule();
    return;
  }

  lastRunAt = Date.now();
  try {
    console.log(`auto-ship: change detected -> verify -> commit -> push (${fmtTs()})`);

    // Re-generate derived files (sitemap) as part of verify/build.
    const verifyCode = run("npm", ["run", "verify"]);
    if (verifyCode !== 0) {
      console.log("auto-ship: verify failed; not committing. Fix issues and save again.");
      schedule();
      return;
    }

    if (!isDirty()) return;

    if (run("git", ["add", "-A"]) !== 0) {
      console.log("auto-ship: git add failed; will retry on next change.");
      schedule();
      return;
    }

    const msg = `${COMMIT_PREFIX} ${fmtTs()}`;
    const commitCode = run("git", ["commit", "-m", msg]);
    if (commitCode !== 0) {
      // Most common: nothing to commit (race), hooks failure, etc.
      console.log("auto-ship: git commit did not succeed; will retry on next change.");
      schedule();
      return;
    }

    const pushCode = run("git", ["push"]);
    if (pushCode !== 0) {
      console.log("auto-ship: git push failed; will retry on next change.");
      schedule();
      return;
    }

    if (AUTO_DEPLOY) {
      console.log(`auto-ship: deploying to production via "${DEPLOY_CMD}"...`);
      const deployCode = runShell(DEPLOY_CMD);
      if (deployCode !== 0) {
        console.log("auto-ship: deploy failed; will retry on next change.");
        schedule();
        return;
      }
    }
  } finally {
    releaseLock();
  }
};

// Simple recursive watcher using fs.watch. It can drop events on some platforms,
// but debounce + git status is enough for "auto everything" in practice.
const watchDir = (dir) => {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      if (shouldIgnore(full)) continue;
      if (ent.isDirectory()) watchDir(full);
    }

    fs.watch(dir, { persistent: true }, (_event, filename) => {
      if (!filename) return schedule();
      const full = path.join(dir, filename.toString());
      if (shouldIgnore(full)) return;
      schedule();
    });
  } catch {
    // ignore unreadable directories
  }
};

console.log(`auto-ship: watching repo (debounce=${DEBOUNCE_MS}ms minInterval=${MIN_INTERVAL_MS}ms)`);
watchDir(ROOT);
schedule(); // run once on start if dirty
