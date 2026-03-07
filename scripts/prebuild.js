/**
 * Universal Prebuild — auto-heal dirs, config, and asset sync. Windows-safe; uses only Node fs/path.
 * Run: node scripts/prebuild.js
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

function ensureDir(dir) {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log("[prebuild] Created " + path.relative(rootDir, dir));
    }
  } catch (e) {
    console.warn("[prebuild] ensureDir " + dir + ": " + e.message);
  }
}

function safeCopy(src, dest) {
  try {
    if (fs.existsSync(src)) {
      ensureDir(path.dirname(dest));
      fs.copyFileSync(src, dest);
      return true;
    }
  } catch (e) {
    console.warn("[prebuild] copy " + src + ": " + e.message);
  }
  return false;
}

// ——— 1. Auto-heal directories ———
["public", "dist", "admin", path.join("public", "config")].forEach((rel) => {
  ensureDir(path.join(rootDir, rel));
});

// ——— 2. Sync src/assets → public/assets ———
const srcAssets = path.join(rootDir, "src", "assets");
const destAssets = path.join(rootDir, "public", "assets");
if (fs.existsSync(srcAssets)) {
  try {
    fs.cpSync(srcAssets, destAssets, { recursive: true, force: true });
    console.log("[prebuild] Synced public/assets");
  } catch (e) {
    console.warn("[prebuild] cpSync assets: " + e.message);
  }
}

// ——— 3. Config stub ———
const configJson = path.join(rootDir, "public", "config.json");
if (!fs.existsSync(configJson)) {
  try {
    fs.writeFileSync(
      configJson,
      JSON.stringify({ apiBase: "/api", liveRoomEnabled: true }, null, 2)
    );
    console.log("[prebuild] Wrote public/config.json");
  } catch (e) {
    console.warn("[prebuild] config.json: " + e.message);
  }
}

// ——— 4. Copy ops/site → public/config ———
const opsSite = path.join(rootDir, "ops", "site");
const publicConfig = path.join(rootDir, "public", "config");
const globalFiles = [
  "nav.json",
  "materials.json",
  "seo.defaults.json",
  "products.json",
  "adsense.json",
  "affiliates.json",
  "redirects.json",
  "progress.json",
  "monetization-roadmap.json",
];
globalFiles.forEach((file) => {
  if (safeCopy(path.join(opsSite, file), path.join(publicConfig, file))) {
    console.log("[prebuild] Config " + file);
  }
});
const pagesSrc = path.join(opsSite, "pages.json");
if (fs.existsSync(pagesSrc)) {
  try {
    const pagesData = JSON.parse(fs.readFileSync(pagesSrc, "utf8"));
    fs.writeFileSync(
      path.join(publicConfig, "registry.json"),
      JSON.stringify(pagesData, null, 2) + "\n"
    );
    console.log("[prebuild] Registry from pages.json");
  } catch (e) {
    console.warn("[prebuild] registry: " + e.message);
  }
}
const contentDir = path.join(opsSite, "content");
if (fs.existsSync(contentDir)) {
  try {
    fs.readdirSync(contentDir).forEach((file) => {
      const src = path.join(contentDir, file);
      if (fs.statSync(src).isFile()) {
        safeCopy(src, path.join(publicConfig, file));
      }
    });
  } catch (e) {
    console.warn("[prebuild] content: " + e.message);
  }
}

// ——— 5. styles.css (inline @import) → public/styles.css ———
const stylesPath = path.join(rootDir, "styles.css");
const publicStyles = path.join(rootDir, "public", "styles.css");
function inlineCss(entryPath, stack) {
  if (!fs.existsSync(entryPath)) return "";
  const resolved = path.resolve(entryPath);
  if (stack && stack.includes(resolved)) return "";
  const stackNext = stack ? [...stack, resolved] : [resolved];
  const baseDir = path.dirname(resolved);
  let source = fs.readFileSync(resolved, "utf8");
  source = source.replace(
    /^[ \t]*@import\s+(?:url\()?["']([^"']+)["']\)?\s*;[ \t]*$/gm,
    (_, spec) => {
      if (/^(?:https?:)?\/\//i.test(spec) || spec.startsWith("data:")) return _;
      const imp = path.resolve(baseDir, spec);
      return inlineCss(imp, stackNext);
    }
  );
  return source;
}
try {
  const bundled = fs.existsSync(stylesPath)
    ? inlineCss(stylesPath).trim()
    : "/* prebuild: no styles.css */";
  ensureDir(path.dirname(publicStyles));
  fs.writeFileSync(publicStyles, bundled + "\n", "utf8");
  console.log("[prebuild] public/styles.css");
} catch (e) {
  console.warn("[prebuild] styles: " + e.message);
  try {
    ensureDir(path.dirname(publicStyles));
    fs.writeFileSync(publicStyles, "/* prebuild fallback */\n", "utf8");
  } catch (_) {}
}

// ——— 6. nav.js → public/nav.js ———
const navSrc = path.join(rootDir, "nav.js");
const navDest = path.join(rootDir, "public", "nav.js");
if (safeCopy(navSrc, navDest)) {
  console.log("[prebuild] public/nav.js");
}

console.log("[prebuild] Done. Ready to compile.");
