import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const IGNORE_DIRS = new Set([
  ".git",
  "node_modules",
  "dist",
  ".wrangler",
  "black-vault",
  "app Store apps to Sell",
  "v6-web-sdk-sample-integration",
]);
const HTML_RE = /\.html?$/i;
const ANCHOR_RE = /<a\b[^>]*>/gi;
const HREF_RE = /\bhref\s*=\s*["']([^"']*)["']/i;
const PLACEHOLDER_RE = /^(#|javascript:void\(0\)|javascript:.*)?$/i;
const ALLOW_RE =
  /\b(data-allow-placeholder|aria-disabled)\s*=\s*["']?true["']?/i;

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

const checkPlaceholders = () => {
  const files = walk(ROOT);
  const violations = [];

  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    let match;
    while ((match = ANCHOR_RE.exec(content)) !== null) {
      const tag = match[0];
      const hrefMatch = tag.match(HREF_RE);
      if (!hrefMatch) continue;
      const href = String(hrefMatch[1] || "").trim();
      if (!PLACEHOLDER_RE.test(href)) continue;
      if (ALLOW_RE.test(tag)) continue;
      violations.push({ file, tag });
    }
  }

  if (!violations.length) {
    console.log("guard-ui: OK (no placeholder anchors)");
    return 0;
  }

  console.error("guard-ui: FAIL (placeholder anchors found)");
  for (const v of violations) {
    const rel = path.relative(ROOT, v.file).replace(/\\/g, "/");
    console.error(`- ${rel}: ${v.tag}`);
  }
  return 1;
};

const checkNavImport = () => {
  const navPath = path.join(ROOT, "nav.js");
  if (!fs.existsSync(navPath)) return 0;
  const navText = fs.readFileSync(navPath, "utf8");
  if (/from\s+["']\.\/src\//.test(navText)) {
    console.error("guard-ui: FAIL (nav.js imports from /src)");
    return 1;
  }
  console.log("guard-ui: OK (nav.js import hygiene)");
  return 0;
};

const placeholderCode = checkPlaceholders();
const navCode = checkNavImport();
process.exitCode = placeholderCode || navCode ? 1 : 0;
