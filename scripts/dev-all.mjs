import { spawn } from "node:child_process";

const isWin = process.platform === "win32";
const npmCmd = isWin ? process.env.ComSpec || "cmd.exe" : "npm";
const npmPrefixArgs = isWin ? ["/d", "/s", "/c", "npm"] : [];

const spawnNpm = (label, args) => {
  const child = spawn(npmCmd, [...npmPrefixArgs, ...args], {
    stdio: ["inherit", "pipe", "pipe"],
    shell: false,
    env: process.env,
  });

  child.stdout.on("data", (chunk) => process.stdout.write(`[${label}] ${chunk}`));
  child.stderr.on("data", (chunk) => process.stderr.write(`[${label}] ${chunk}`));

  return child;
};

const worker = spawnNpm("worker", ["run", "dev:worker"]);
const site = spawnNpm("site", ["run", "dev"]);

const shutdown = (code = 0) => {
  for (const child of [worker, site]) {
    if (child.exitCode !== null) continue;
    child.kill("SIGINT");
  }
  setTimeout(() => process.exit(code), 250);
};

worker.on("exit", (code) => shutdown(code ?? 0));
site.on("exit", (code) => shutdown(code ?? 0));

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
