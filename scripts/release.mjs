import { execSync } from "node:child_process";
import fs from "node:fs";

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const parts = String(pkg.version || "0.0.0").split(".");
parts[2] = String((Number.parseInt(parts[2] || "0", 10) || 0) + 1);
pkg.version = parts.join(".");

fs.writeFileSync("package.json", `${JSON.stringify(pkg, null, 2)}\n`);

execSync("git add package.json", { stdio: "inherit" });
execSync(`git commit -m "Release v${pkg.version}"`, { stdio: "inherit" });
execSync("git push origin main", { stdio: "inherit" });

console.log("Released:", pkg.version);
