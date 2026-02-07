import { spawnSync } from "node:child_process";

const isWin = process.platform === "win32";
const npmCmd = isWin ? process.env.ComSpec || "cmd.exe" : "npm";
const npmPrefixArgs = isWin ? ["/d", "/s", "/c", "npm"] : [];

const run = (args) => {
  const res = spawnSync(npmCmd, [...npmPrefixArgs, ...args], { stdio: "inherit", shell: false, env: process.env });
  if (res.status !== 0) process.exit(res.status ?? 1);
};

run(["run", "clean"]);
run(["ci"]);
run(["run", "verify"]);
