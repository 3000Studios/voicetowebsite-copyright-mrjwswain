import { spawnSync } from "node:child_process";

const gitCmd = process.platform === "win32" ? "git.exe" : "git";
const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

const run = (cmd, args, opts = {}) => {
  const res = spawnSync(cmd, args, { stdio: "inherit", shell: false, env: process.env, ...opts });
  if (res.status !== 0) process.exit(res.status ?? 1);
};

run(gitCmd, ["fetch", "--prune", "origin"]);
run(gitCmd, ["pull", "--rebase"]);
run(npmCmd, ["ci"]);
run(npmCmd, ["run", "format"]);
run(npmCmd, ["run", "verify"]);
