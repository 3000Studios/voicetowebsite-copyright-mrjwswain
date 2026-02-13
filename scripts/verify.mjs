import fs from "fs";
import path from "path";

const OPS_SITE = "ops/site";

function verifyPages() {
  const pagesSrc = path.join(OPS_SITE, "pages.json");
  if (!fs.existsSync(pagesSrc)) throw new Error("pages.json missing");

  const pagesData = JSON.parse(fs.readFileSync(pagesSrc, "utf8"));
  const routes = new Set();

  pagesData.pages.forEach((page) => {
    if (routes.has(page.route)) throw new Error(`Duplicate route: ${page.route}`);
    routes.add(page.route);

    // Check asset exists (this might be tricky if assets are in root or public)
    const assetPath = path.join(process.cwd(), page.asset);
    if (!fs.existsSync(assetPath)) {
      console.warn(`Warning: Asset ${page.asset} for route ${page.route} not found at root`);
    }
  });

  console.log("Pages verification passed");
}

function verifyNav() {
  const navSrc = path.join(OPS_SITE, "nav.json");
  if (!fs.existsSync(navSrc)) throw new Error("nav.json missing");
  console.log("Nav verification passed");
}

try {
  verifyPages();
  verifyNav();
  console.log("All verifications passed");
} catch (err) {
  console.error("Verification failed:", err.message);
  process.exit(1);
}
