import { spawnSync } from "node:child_process";

const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

const run = (args) => {
  const res = spawnSync(npmCmd, args, { stdio: "inherit", shell: false, env: process.env });
  if (res.status !== 0) process.exit(res.status ?? 1);
};

run(["run", "clean"]);
run(["ci"]);
run(["run", "verify"]);
