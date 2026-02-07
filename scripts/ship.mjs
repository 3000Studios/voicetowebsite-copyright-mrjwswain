import { spawnSync } from "node:child_process";

const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
const gitCmd = process.platform === "win32" ? "git.exe" : "git";

const args = process.argv.slice(2);
const wantsPush = args.includes("--push");

const messageFlagIndex = args.findIndex((a) => a === "-m" || a === "--message");
const explicitMessage = messageFlagIndex >= 0 && args[messageFlagIndex + 1] ? args[messageFlagIndex + 1] : null;

const message =
  explicitMessage ||
  process.env.SHIP_MESSAGE ||
  `chore: ship ${new Date().toISOString().replace("T", " ").slice(0, 16)} UTC`;

const run = (cmd, cmdArgs, opts = {}) => {
  const res = spawnSync(cmd, cmdArgs, { stdio: "inherit", shell: false, env: process.env, ...opts });
  if (res.status !== 0) process.exit(res.status ?? 1);
};

run(npmCmd, ["run", "verify"]);

const status = spawnSync(gitCmd, ["status", "--porcelain"], {
  stdio: ["ignore", "pipe", "inherit"],
  shell: false,
  env: process.env,
});

if (status.status !== 0) process.exit(status.status ?? 1);

const hasChanges = Boolean(String(status.stdout || "").trim());
if (!hasChanges) {
  console.log("Nothing to commit.");
  process.exit(0);
}

run(gitCmd, ["add", "-A"]);
run(gitCmd, ["commit", "-m", message]);

if (wantsPush) {
  run(gitCmd, ["push"]);
}
