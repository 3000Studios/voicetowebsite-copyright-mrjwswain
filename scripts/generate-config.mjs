import fs from "fs";
import path from "path";

const OPS_SITE = "ops/site";
const PUBLIC_CONFIG = "public/config";

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
  ];

  globalFiles.forEach((file) => {
    const src = path.join(OPS_SITE, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(PUBLIC_CONFIG, file));
      console.log(`Copied ${file} to ${PUBLIC_CONFIG}`);
    }
  });

  // Generate registry.json from pages.json
  const pagesSrc = path.join(OPS_SITE, "pages.json");
  if (fs.existsSync(pagesSrc)) {
    const pagesData = JSON.parse(fs.readFileSync(pagesSrc, "utf8"));
    fs.writeFileSync(path.join(PUBLIC_CONFIG, "registry.json"), JSON.stringify(pagesData, null, 2));
    console.log(`Generated registry.json from pages.json`);
  }

  // Copy page-specific content
  const contentDir = path.join(OPS_SITE, "content");
  if (fs.existsSync(contentDir)) {
    const contentFiles = fs.readdirSync(contentDir);
    contentFiles.forEach((file) => {
      const src = path.join(contentDir, file);
      fs.copyFileSync(src, path.join(PUBLIC_CONFIG, file));
      console.log(`Copied content ${file} to ${PUBLIC_CONFIG}`);
    });
  }
}

processFiles();
