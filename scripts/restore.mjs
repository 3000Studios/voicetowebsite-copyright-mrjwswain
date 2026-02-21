import { execSync } from "node:child_process";

execSync("git fetch --all", { stdio: "inherit" });
execSync("git checkout v1.0-clean-production", { stdio: "inherit" });
execSync("npm install", { stdio: "inherit" });
execSync("npm run build", { stdio: "inherit" });
console.log("Restored to golden baseline.");
