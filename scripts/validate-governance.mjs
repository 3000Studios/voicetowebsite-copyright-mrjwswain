import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OPS_DIR = path.join(ROOT, "ops", "site");
const PUBLIC_DIR = path.join(ROOT, "public");

const requiredFiles = [
  path.join(OPS_DIR, "pages.json"),
  path.join(OPS_DIR, "redirects.json"),
  path.join(OPS_DIR, "patch-allowlist.json"),
];

const loadJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));

const normalizeRoute = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return raw;
  if (raw === "/") return raw;
  return raw.replace(/\/+$/, "");
};

const main = () => {
  const failures = [];

  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      failures.push(`missing required file: ${path.relative(ROOT, file)}`);
    }
  }

  if (failures.length) {
    console.error("governance: FAIL");
    for (const msg of failures) console.error(`- ${msg}`);
    process.exit(1);
  }

  const pages = loadJson(path.join(OPS_DIR, "pages.json"));
  const pageList = Array.isArray(pages.pages) ? pages.pages : [];
  if (!pageList.length) {
    failures.push("pages.json: pages list is empty");
  }

  const routeSet = new Set();
  for (const page of pageList) {
    const missing = [];
    if (!page.id) missing.push("id");
    if (!page.route) missing.push("route");
    if (!page.asset) missing.push("asset");
    if (!page.zone) missing.push("zone");
    if (missing.length) {
      failures.push(
        `pages.json: missing required fields (${missing.join(", ")}) in ${JSON.stringify(page)}`
      );
      continue;
    }

    const normalized = normalizeRoute(page.route);
    if (routeSet.has(normalized)) {
      failures.push(`pages.json: duplicate route detected (${normalized})`);
    }
    routeSet.add(normalized);
  }

  const redirects = loadJson(path.join(OPS_DIR, "redirects.json"));
  const redirectList = Array.isArray(redirects.redirects)
    ? redirects.redirects
    : [];
  const redirectSet = new Set();
  for (const redirect of redirectList) {
    const from = normalizeRoute(redirect.from);
    if (!from) continue;
    if (redirectSet.has(from)) {
      failures.push(`redirects.json: overlapping redirect detected (${from})`);
    }
    redirectSet.add(from);
  }

  const sitemapPath = path.join(PUBLIC_DIR, "sitemap.xml");
  if (fs.existsSync(sitemapPath)) {
    const sitemap = fs.readFileSync(sitemapPath, "utf8");
    if (/\/admin\b/i.test(sitemap)) {
      failures.push("sitemap.xml: admin routes must not appear in sitemap");
    }
    if (/\/labs\b/i.test(sitemap)) {
      failures.push("sitemap.xml: labs routes must not appear in sitemap");
    }
  } else {
    failures.push("sitemap.xml: missing sitemap.xml in public/");
  }

  if (failures.length) {
    console.error("governance: FAIL");
    for (const msg of failures) console.error(`- ${msg}`);
    process.exit(1);
  }

  console.log("governance: OK");
};

main();
