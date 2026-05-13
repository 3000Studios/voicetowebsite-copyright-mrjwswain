import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const dirsToEnsure = [
  path.join(rootDir, "public"),
  path.join(rootDir, "dist"),
  path.join(rootDir, "admin"),
];

// 1. Auto-heal missing directories
dirsToEnsure.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(
      `[prebuild-heal] Created missing directory: ${path.relative(rootDir, dir)}`
    );
  }
});

// 2. Sync Public Assets (cross-platform copy)
const sourceAssets = path.join(rootDir, "src", "assets");
const destAssets = path.join(rootDir, "public", "assets");

if (fs.existsSync(sourceAssets)) {
  fs.cpSync(sourceAssets, destAssets, { recursive: true, force: true });
  console.log("[prebuild-heal] Assets synced to public/assets");
}

// 3. Generate config stub (prevents missing config crashes)
const configPath = path.join(rootDir, "public", "config.json");
if (!fs.existsSync(configPath)) {
  const defaultConfig = { apiBase: "/api", liveRoomEnabled: true };
  fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
  console.log("[prebuild-heal] Generated fallback public/config.json");
}

console.log("[prebuild-heal] Ready to compile.");
