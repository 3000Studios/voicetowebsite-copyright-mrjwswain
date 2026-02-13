import fs from "fs";
import path from "path";

const SITE_URL = process.env.SITE_URL || "https://voicetowebsite.com";
const OPS_SITE = "ops/site";
const PUBLIC_DIR = "public";
const ROOT_DIR = process.cwd();
const DEFAULT_PRIORITY = "0.8";
const DEFAULT_CHANGEFREQ = "weekly";
const FILE_EXCLUSIONS = new Set(["sandbox.html", "404.html"]);
const SUBSTRING_EXCLUSIONS = ["google", "preview", "workers"].map((s) => s.toLowerCase());

function generateSitemap() {
  const urlMap = new Map();

  const opsPages = readOpsPages();
  opsPages.forEach((page) => {
    addRoute(urlMap, page.route, {
      priority: page.route === "/" ? "1.0" : page.priority || DEFAULT_PRIORITY,
      changefreq: page.changefreq || DEFAULT_CHANGEFREQ,
    });
  });

  const discoveredRoutes = discoverStaticRoutes();
  discoveredRoutes.forEach((route) => {
    if (!urlMap.has(route)) {
      addRoute(urlMap, route, {
        priority: route === "/" ? "1.0" : DEFAULT_PRIORITY,
        changefreq: DEFAULT_CHANGEFREQ,
      });
    }
  });

  if (urlMap.size === 0) {
    console.warn("No routes discovered for sitemap generation");
    return;
  }

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  for (const url of urlMap.values()) {
    xml += "  <url>\n";
    xml += `    <loc>${url.loc}</loc>\n`;
    xml += `    <priority>${url.priority}</priority>\n`;
    xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
    xml += "  </url>\n";
  }

  xml += "</urlset>";

  if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR);
  }

  fs.writeFileSync(path.join(PUBLIC_DIR, "sitemap.xml"), xml);
  console.log(`Sitemap generated with ${urlMap.size} URLs`);
}

function addRoute(map, route, meta = {}) {
  const normalized = normalizeRoute(route);
  if (!normalized || normalized.startsWith("/admin") || normalized.startsWith("/labs")) {
    return;
  }

  map.set(normalized, {
    loc: `${SITE_URL}${normalized}`,
    priority: meta.priority || DEFAULT_PRIORITY,
    changefreq: meta.changefreq || DEFAULT_CHANGEFREQ,
  });
}

function readOpsPages() {
  const pagesSrc = path.join(OPS_SITE, "pages.json");
  if (!fs.existsSync(pagesSrc)) {
    console.warn("pages.json not found, falling back to static discovery only");
    return [];
  }

  try {
    const data = JSON.parse(fs.readFileSync(pagesSrc, "utf8"));
    return (data.pages || []).filter((page) => page.zone !== "admin" && page.zone !== "hidden");
  } catch (err) {
    console.error("Failed to parse pages.json", err);
    return [];
  }
}

function discoverStaticRoutes() {
  try {
    const entries = fs.readdirSync(ROOT_DIR, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".html"))
      .filter((entry) => !FILE_EXCLUSIONS.has(entry.name))
      .filter((entry) => !SUBSTRING_EXCLUSIONS.some((substring) => entry.name.toLowerCase().includes(substring)))
      .map((entry) => {
        if (entry.name === "index.html") return "/";
        const base = path.basename(entry.name, ".html");
        return `/${base}`;
      });
  } catch (err) {
    console.warn("Failed to discover static routes", err);
    return [];
  }
}

function normalizeRoute(route) {
  if (!route) return "/";
  const trimmed = String(route).trim();
  if (!trimmed || trimmed === "/") return "/";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

generateSitemap();
