import { spawnSync } from "node:child_process";

const isWin = process.platform === "win32";
const gitCmd = isWin ? "git.exe" : "git";
const npmCmd = isWin ? process.env.ComSpec || "cmd.exe" : "npm";
const npmPrefixArgs = isWin ? ["/d", "/s", "/c", "npm"] : [];

const run = (cmd, args, opts = {}) => {
  const res = spawnSync(cmd, args, {
    stdio: "inherit",
    shell: false,
    env: process.env,
    ...opts,
  });
  if (res.status !== 0) process.exit(res.status ?? 1);
};

run(gitCmd, ["fetch", "--prune", "origin"]);
run(gitCmd, ["pull", "--rebase"]);
run(npmCmd, [...npmPrefixArgs, "ci"]);
run(npmCmd, [...npmPrefixArgs, "run", "format"]);
run(npmCmd, [...npmPrefixArgs, "run", "verify"]);
