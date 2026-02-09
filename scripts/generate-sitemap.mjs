import fs from "fs";
import path from "path";

const normalizeSiteUrl = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    const url = new URL(raw);
    return url.origin;
  } catch (_) {
    return raw.replace(/\/+$/, "");
  }
};

const SITE_URL = normalizeSiteUrl(process.env.SITE_URL || process.env.PUBLIC_SITE_URL) || "https://voicetowebsite.com";
const ROOT_DIR = process.cwd();
const PUBLIC_DIR = path.join(ROOT_DIR, "public");

// Files/Directories to exclude from sitemap
const EXCLUSIONS = [
  "admin",
  "google", // verification files
  "sandbox.html",
  "404.html",
  "index.html", // Handled separately as root /
];

function getHtmlFiles() {
  const files = fs.readdirSync(ROOT_DIR);
  return files.filter((file) => {
    return file.endsWith(".html") && !EXCLUSIONS.some((ex) => file.includes(ex)) && !file.startsWith("_"); // Exclude partials if any
  });
}

function generateSitemap() {
  console.log("Generating sitemap...");

  const files = getHtmlFiles();
  const urls = [];

  // Add home page
  urls.push({
    loc: `${SITE_URL}/`,
    priority: "1.0",
  });

  files.forEach((file) => {
    const name = path.basename(file, ".html");
    urls.push({
      loc: `${SITE_URL}/${name}`,
      priority: "0.8",
    });
  });

  // Basic XML structure
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  urls.forEach((url) => {
    xml += "  <url>\n";
    xml += `    <loc>${url.loc}</loc>\n`;
    // process.stdout.write(`Adding ${url.loc}\n`); // optional log
    xml += "  </url>\n";
  });

  xml += "</urlset>";

  if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR);
  }

  fs.writeFileSync(path.join(PUBLIC_DIR, "sitemap.xml"), xml);
  console.log(`Sitemap generated with ${urls.length} URLs at public/sitemap.xml`);
}

generateSitemap();
