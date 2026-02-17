import fs from "fs";
import path from "path";

const OPS_SITE = "ops/site";

function verifyPages() {
  const pagesSrc = path.join(OPS_SITE, "pages.json");
  if (!fs.existsSync(pagesSrc)) throw new Error("pages.json missing");

  const pagesData = JSON.parse(fs.readFileSync(pagesSrc, "utf8"));
  const routes = new Set();

  pagesData.pages.forEach((page) => {
    if (routes.has(page.route))
      throw new Error(`Duplicate route: ${page.route}`);
    routes.add(page.route);

    // Check asset exists (this might be tricky if assets are in root or public)
    const assetPath = path.join(process.cwd(), page.asset);
    if (!fs.existsSync(assetPath)) {
      console.warn(
        `Warning: Asset ${page.asset} for route ${page.route} not found at root`
      );
    }
  });

  console.log("Pages verification passed");
}

function verifyNav() {
  const navSrc = path.join(OPS_SITE, "nav.json");
  if (!fs.existsSync(navSrc)) throw new Error("nav.json missing");
  console.log("Nav verification passed");
}

function verifyAdminUi() {
  const adminDir = path.join(process.cwd(), "admin");
  if (!fs.existsSync(adminDir)) throw new Error("admin/ directory missing");

  const htmlFiles = fs
    .readdirSync(adminDir)
    .filter((name) => name.toLowerCase().endsWith(".html"))
    .sort();

  const requireGuard = (name) => {
    const lower = name.toLowerCase();
    return lower !== "access.html" && lower !== "login.html";
  };

  const hasGuard = (content) =>
    content.includes("access-guard.js") &&
    (content.includes('type="module"') || content.includes("type='module'"));

  const mustHaveIds = {
    "voice-commands.html": [
      "startBtn",
      "stopBtn",
      "shipButton",
      "clearHistory",
      "commandHistory",
    ],
    "customer-chat.html": [
      "sessions",
      "messages",
      "reply",
      "sendReply",
      "refreshSessions",
    ],
    "bot-command-center.html": ["boss-input", "boss-send", "boss-mic"],
    "progress.html": ["progress-export", "progress-copy", "progress-reload"],
  };

  for (const file of htmlFiles) {
    const full = path.join(adminDir, file);
    const content = fs.readFileSync(full, "utf8");

    if (requireGuard(file) && !hasGuard(content)) {
      throw new Error(`Admin page missing access guard: admin/${file}`);
    }

    const ids = mustHaveIds[file.toLowerCase()];
    if (ids) {
      for (const id of ids) {
        if (
          !content.includes(`id="${id}"`) &&
          !content.includes(`id='${id}'`)
        ) {
          throw new Error(
            `Admin page missing expected element id="${id}": admin/${file}`
          );
        }
      }
    }
  }

  console.log("Admin UI verification passed");
}

function stableStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value))
    return `[${value.map((v) => stableStringify(v)).join(",")}]`;
  const keys = Object.keys(value).sort();
  const props = keys.map(
    (k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`
  );
  return `{${props.join(",")}}`;
}

function verifyCatalog() {
  const rootCatalogPath = path.join(process.cwd(), "products.json");
  const opsCatalogPath = path.join(
    process.cwd(),
    "ops",
    "site",
    "products.json"
  );
  const publicCatalogPath = path.join(
    process.cwd(),
    "public",
    "config",
    "products.json"
  );
  if (!fs.existsSync(rootCatalogPath)) throw new Error("products.json missing");
  if (!fs.existsSync(opsCatalogPath))
    throw new Error("ops/site/products.json missing");
  if (!fs.existsSync(publicCatalogPath))
    throw new Error("public/config/products.json missing");

  const rootCatalog = JSON.parse(fs.readFileSync(rootCatalogPath, "utf8"));
  const opsCatalog = JSON.parse(fs.readFileSync(opsCatalogPath, "utf8"));
  const publicCatalog = JSON.parse(fs.readFileSync(publicCatalogPath, "utf8"));

  // Keep catalog as a single source of truth: public config must match worker-imported catalog.
  if (stableStringify(rootCatalog) !== stableStringify(opsCatalog)) {
    throw new Error("ops/site/products.json is out of sync with products.json");
  }
  if (stableStringify(rootCatalog) !== stableStringify(publicCatalog)) {
    throw new Error(
      "public/config/products.json is out of sync with products.json"
    );
  }

  const items = [
    ...(rootCatalog.products || []),
    ...(rootCatalog.apps || []),
    ...(rootCatalog.subscriptions || []),
  ];

  const assertExists = (p, label) => {
    if (!fs.existsSync(p)) throw new Error(`${label} missing: ${p}`);
  };

  items.forEach((item) => {
    if (!item || typeof item !== "object")
      throw new Error("Catalog item is not an object");
    if (!item.id) throw new Error("Catalog item missing id");
    if (!item.type) throw new Error(`Catalog item ${item.id} missing type`);
    if (!item.title) throw new Error(`Catalog item ${item.id} missing title`);
    if (
      typeof item.price !== "number" ||
      !Number.isFinite(item.price) ||
      item.price <= 0
    ) {
      throw new Error(`Catalog item ${item.id} has invalid price`);
    }
    if (item.currency && String(item.currency).toUpperCase() !== "USD") {
      throw new Error(
        `Catalog item ${item.id} currency must be USD or omitted`
      );
    }

    const previewUrl = String(item.previewUrl || "").trim();
    if (previewUrl) {
      if (!previewUrl.startsWith("/") || !previewUrl.endsWith(".html")) {
        throw new Error(
          `Catalog item ${item.id} has invalid previewUrl: ${previewUrl}`
        );
      }
      const filePath = path.join(process.cwd(), previewUrl.replace(/^\//, ""));
      assertExists(filePath, `Preview page for ${item.id}`);
    }

    const downloadUrl = String(item.downloadUrl || "").trim();
    if (downloadUrl) {
      if (!downloadUrl.startsWith("/downloads/")) {
        throw new Error(
          `Catalog item ${item.id} has invalid downloadUrl: ${downloadUrl}`
        );
      }
      const filePath = path.join(
        process.cwd(),
        "public",
        downloadUrl.replace(/^\//, "")
      );
      assertExists(filePath, `Download asset for ${item.id}`);
    }
  });

  console.log("Catalog verification passed");
}

try {
  verifyPages();
  verifyNav();
  verifyAdminUi();
  verifyCatalog();
  console.log("All verifications passed");
} catch (err) {
  console.error("Verification failed:", err.message);
  process.exit(1);
}
