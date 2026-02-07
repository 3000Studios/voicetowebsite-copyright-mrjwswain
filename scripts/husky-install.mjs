import fs from "node:fs";
import { spawnSync } from "node:child_process";

if (process.env.CI) process.exit(0);
if (!fs.existsSync(".git")) process.exit(0);

const npxCmd = process.platform === "win32" ? "npx.cmd" : "npx";
const res = spawnSync(npxCmd, ["--no-install", "husky", "install"], { stdio: "inherit", shell: false });
process.exit(res.status ?? 0);
