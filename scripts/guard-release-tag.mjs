import { execSync } from "node:child_process";

try {
  execSync("git diff --quiet", { stdio: "ignore" });
  execSync("git diff --cached --quiet", { stdio: "ignore" });
  const tag = execSync("git describe --tags --exact-match", {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
  if (!tag) throw new Error("no tag");
  console.log(`guard-release-tag: OK (${tag})`);
} catch {
  console.error("Not on tagged release. Deploy blocked.");
  process.exit(1);
}
