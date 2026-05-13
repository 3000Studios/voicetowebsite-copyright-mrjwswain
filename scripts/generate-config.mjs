import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const OPS_SITE = path.join(repoRoot, "ops", "site");
const PUBLIC_CONFIG = path.join(repoRoot, "public", "config");

function ensureDirectory(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function processFiles() {
  ensureDirectory(PUBLIC_CONFIG);

  // Copy global config files
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
    const src = path.join(OPS_SITE, file);
    if (fs.existsSync(src)) {
      const dest = path.join(PUBLIC_CONFIG, file);
      ensureDirectory(path.dirname(dest));
      fs.copyFileSync(src, dest);
      console.log(`Copied ${file} to public/config`);
    }
  });

  // Generate registry.json from pages.json
  const pagesSrc = path.join(OPS_SITE, "pages.json");
  if (fs.existsSync(pagesSrc)) {
    const pagesData = JSON.parse(fs.readFileSync(pagesSrc, "utf8"));
    const registryPath = path.join(PUBLIC_CONFIG, "registry.json");
    fs.writeFileSync(registryPath, `${JSON.stringify(pagesData, null, 2)}\n`);
    console.log(`Generated registry.json from pages.json`);
  }

  // Copy page-specific content
  const contentDir = path.join(OPS_SITE, "content");
  if (fs.existsSync(contentDir)) {
    const contentFiles = fs.readdirSync(contentDir);
    contentFiles.forEach((file) => {
      const src = path.join(contentDir, file);
      if (!fs.statSync(src).isFile()) return;
      const dest = path.join(PUBLIC_CONFIG, file);
      fs.copyFileSync(src, dest);
      console.log(`Copied content ${file} to public/config`);
    });
  }
}

processFiles();
