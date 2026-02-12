import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IGNORE_DIRS = new Set([
  ".git",
  "node_modules",
  "dist",
  ".wrangler",
  // Local/private vaults (not served as site pages)
  "black-vault",
  // Source drops / downloadable app bundles (not served as site pages)
  "app Store apps to Sell",
  // PayPal integration sample files (not served as site pages)
  "v6-web-sdk-sample-integration",
]);
const HTML_RE = /\.html?$/i;
const ATTR_RE = /\s(?:href|src)\s*=\s*"([^"]+)"/gi;

const isSkippable = (raw) => {
  const link = raw.trim();
  if (!link) return true;
  if (link.includes("{{") || link.includes("}}")) return true;
  if (link.startsWith("#")) return true;
  if (link.startsWith("mailto:")) return true;
  if (link.startsWith("tel:")) return true;
  if (link.startsWith("data:")) return true;
  if (link.startsWith("javascript:")) return true;
  if (link.startsWith("http://") || link.startsWith("https://")) return true;
  if (link.startsWith("//")) return true;
  if (link.includes("${") || link.includes("__ADSENSE_") || link.includes("__PAYPAL_")) return true;
  if (link.startsWith("/api/")) return true;
  return false;
};

const stripQueryHash = (link) => link.split("#")[0].split("?")[0];

const walk = (dir, out = []) => {
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    if (err && (err.code === "EPERM" || err.code === "EACCES")) return out;
    throw err;
  }

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      walk(path.join(dir, entry.name), out);
      continue;
    }
    if (entry.isFile() && HTML_RE.test(entry.name)) {
      out.push(path.join(dir, entry.name));
    }
  }
  return out;
};

const resolveTarget = (fromHtmlPath, hrefOrSrc) => {
  const clean = stripQueryHash(hrefOrSrc.trim());
  if (!clean) return null;

  // Treat root as index.html if explicitly linked.
  if (clean === "/") return path.join(__dirname, "index.html");

  if (clean.startsWith("/")) {
    const fromRoot = path.join(__dirname, clean.slice(1));
    if (fs.existsSync(fromRoot)) return fromRoot;
    const fromPublic = path.join(__dirname, "public", clean.slice(1));
    if (fs.existsSync(fromPublic)) return fromPublic;
    return fromRoot;
  }
  return path.resolve(path.dirname(fromHtmlPath), clean);
};

const existsAsFileOrIndex = (p) => {
  if (!p) return false;
  if (fs.existsSync(p) && fs.statSync(p).isFile()) return true;
  if (fs.existsSync(p) && fs.statSync(p).isDirectory()) {
    return fs.existsSync(path.join(p, "index.html"));
  }
  // Support clean URLs like "/pricing" that are served as "/pricing.html" by the Worker.
  if (!path.extname(p)) {
    const withHtml = `${p}.html`;
    if (fs.existsSync(withHtml) && fs.statSync(withHtml).isFile()) return true;
  }
  return false;
};

const checkFile = (htmlPath) => {
  const content = fs.readFileSync(htmlPath, "utf8");
  const broken = [];

  let match;
  while ((match = ATTR_RE.exec(content)) !== null) {
    const raw = match[1];
    if (isSkippable(raw)) continue;

    const target = resolveTarget(htmlPath, raw);
    if (!target) continue;

    if (!existsAsFileOrIndex(target)) {
      broken.push({ raw, target });
    }
  }

  return broken;
};

const main = () => {
  const htmlFiles = walk(__dirname);
  const allBroken = [];

  for (const file of htmlFiles) {
    const broken = checkFile(file);
    if (broken.length) {
      for (const item of broken) {
        allBroken.push({ file, ...item });
      }
    }
  }

  if (!allBroken.length) {
    console.log(`OK: checked ${htmlFiles.length} HTML files`);
    return 0;
  }

  console.log(`Broken links (${allBroken.length}):`);
  for (const b of allBroken) {
    const relFile = path.relative(__dirname, b.file).replace(/\\/g, "/");
    const relTarget = path.relative(__dirname, b.target).replace(/\\/g, "/");
    console.log(`- ${relFile}: "${b.raw}" -> ${relTarget}`);
  }

  return 1;
};

process.exitCode = main();
