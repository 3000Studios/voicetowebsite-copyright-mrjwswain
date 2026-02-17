import fs from "node:fs";
import { spawnSync } from "node:child_process";

if (process.env.CI) process.exit(0);
if (!fs.existsSync(".git")) process.exit(0);

const isWin = process.platform === "win32";
const npxCmd = isWin ? process.env.ComSpec || "cmd.exe" : "npx";
const npxPrefixArgs = isWin ? ["/d", "/s", "/c", "npx"] : [];

// `husky install` is deprecated in v9; invoking `husky` with no args installs hooks.
const res = spawnSync(npxCmd, [...npxPrefixArgs, "--no-install", "husky"], {
  stdio: "inherit",
  shell: false,
});
process.exit(res.status ?? 0);
