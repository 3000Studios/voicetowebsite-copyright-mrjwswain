import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OPS_DIR = path.join(ROOT, "ops", "site");
const PUBLIC_DIR = path.join(ROOT, "public");
const ENV_FILES = [path.join(ROOT, ".env"), path.join(ROOT, ".env.local")];
const ADMIN_SHELL_PATH = path.join(ROOT, "admin", "integrated-dashboard.html");
const ADMIN_ROUTER_PATH = path.join(ROOT, "admin", "ccos.js");
const WORKER_PATH = path.join(ROOT, "worker.js");
const ENV_SCHEMA_PATH = path.join(ROOT, "ENV_SCHEMA.md");
const COMMAND_CENTER_API_PATH = path.join(
  ROOT,
  "functions",
  "commandCenterApi.js"
);

const requiredFiles = [
  path.join(OPS_DIR, "pages.json"),
  path.join(OPS_DIR, "redirects.json"),
  path.join(OPS_DIR, "patch-allowlist.json"),
  ADMIN_SHELL_PATH,
  ADMIN_ROUTER_PATH,
  WORKER_PATH,
  ENV_SCHEMA_PATH,
  COMMAND_CENTER_API_PATH,
];

const loadJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));

const normalizeRoute = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return raw;
  if (raw === "/") return raw;
  return raw.replace(/\/+$/, "");
};

const looksLikeLiveSecretLeak = (contents) => {
  const text = String(contents || "");
  // Keep this intentionally narrow to avoid breaking local dev while still catching high-risk mistakes.
  // If any of these are present with real values, rotate them immediately.
  const patterns = [
    /(^|\r?\n)[ \t]*STRIPE_SECRET_KEY[ \t]*=[ \t]*sk_live_[^ \t\r\n#]+/i,
    /(^|\r?\n)[ \t]*STRIPE_WEBHOOK_SECRET[ \t]*=[ \t]*whsec_[^ \t\r\n#]+/i,
    /(^|\r?\n)[ \t]*PAYPAL_CLIENT_SECRET(?:_PROD)?[ \t]*=[ \t]*[^ \t\r\n#]+/i,
    /(^|\r?\n)[ \t]*LICENSE_SECRET[ \t]*=[ \t]*[^ \t\r\n#]+/i,
  ];
  return patterns.some((re) => re.test(text));
};

const main = () => {
  const failures = [];

  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      failures.push(`missing required file: ${path.relative(ROOT, file)}`);
    }
  }

  for (const envFile of ENV_FILES) {
    if (!fs.existsSync(envFile)) continue;
    try {
      const contents = fs.readFileSync(envFile, "utf8");
      if (looksLikeLiveSecretLeak(contents)) {
        failures.push(
          `${path.relative(ROOT, envFile)}: appears to contain live secrets (rotate keys and remove values from local env files)`
        );
      }
    } catch (error) {
      failures.push(
        `${path.relative(ROOT, envFile)}: unable to read (${error?.message || "unknown error"})`
      );
    }
  }

  if (failures.length) {
    console.error("governance: FAIL");
    for (const msg of failures) console.error(`- ${msg}`);
    process.exit(1);
  }

  try {
    const adminShell = fs.readFileSync(ADMIN_SHELL_PATH, "utf8");
    const shellIds = [
      'id="sidebar"',
      'id="topbar"',
      'id="dashboard-content"',
      'id="deploy-rail"',
    ];
    for (const id of shellIds) {
      if (!adminShell.includes(id)) {
        failures.push(
          `admin shell integrity: missing ${id} in admin/integrated-dashboard.html`
        );
      }
    }
  } catch (error) {
    failures.push(
      `admin shell integrity: unable to read admin/integrated-dashboard.html (${error?.message || "unknown"})`
    );
  }

  try {
    const router = fs.readFileSync(ADMIN_ROUTER_PATH, "utf8");
    if (!router.includes("history.pushState")) {
      failures.push(
        "admin router integrity: history.pushState not found in admin/ccos.js"
      );
    }
    if (!router.includes("popstate")) {
      failures.push(
        "admin router integrity: popstate handler not found in admin/ccos.js"
      );
    }
    if (!router.includes("dashboard-content")) {
      failures.push(
        "admin router integrity: dashboard-content target not found in admin/ccos.js"
      );
    }
  } catch (error) {
    failures.push(
      `admin router integrity: unable to read admin/ccos.js (${error?.message || "unknown"})`
    );
  }

  try {
    const worker = fs.readFileSync(WORKER_PATH, "utf8");
    if (!worker.includes("handleCommandCenterRequest")) {
      failures.push(
        "worker routing integrity: command center handler is not wired in worker.js"
      );
    }
    if (!worker.includes("/admin/integrated-dashboard.html")) {
      failures.push(
        "worker routing integrity: admin shell route is not wired to integrated-dashboard.html"
      );
    }
  } catch (error) {
    failures.push(
      `worker routing integrity: unable to read worker.js (${error?.message || "unknown"})`
    );
  }

  try {
    const commandApi = fs.readFileSync(COMMAND_CENTER_API_PATH, "utf8");
    if (!commandApi.includes("/api/preview/build")) {
      failures.push(
        "preview integrity: /api/preview/build not implemented in command center API"
      );
    }
    if (
      !commandApi.includes("/api/deploy/run") ||
      !commandApi.includes("/api/deploy/logs")
    ) {
      failures.push(
        "deploy integrity: /api/deploy/run or /api/deploy/logs not implemented in command center API"
      );
    }
    if (
      !commandApi.includes("/preview/") ||
      !commandApi.includes("PREVIEW - SHADOW STATE")
    ) {
      failures.push(
        "preview integrity: shadow preview route/watermark missing in command center API"
      );
    }
    const densityMatch = commandApi.match(/adDensityCap:\s*(\d+)/);
    if (!densityMatch) {
      failures.push(
        "monetization density guard: adDensityCap default not found"
      );
    } else {
      const cap = Number(densityMatch[1]);
      if (!Number.isFinite(cap) || cap > 6) {
        failures.push(
          `monetization density guard: adDensityCap default out of range (${densityMatch[1]})`
        );
      }
    }
  } catch (error) {
    failures.push(
      `command center API integrity: unable to read functions/commandCenterApi.js (${error?.message || "unknown"})`
    );
  }

  try {
    const envSchema = fs.readFileSync(ENV_SCHEMA_PATH, "utf8");
    if (!envSchema.includes("# ENV Schema")) {
      failures.push(
        "env schema integrity: ENV_SCHEMA.md missing required header"
      );
    }
    if (!envSchema.includes("## Key Matrix")) {
      failures.push(
        "env schema integrity: ENV_SCHEMA.md missing key matrix section"
      );
    }
  } catch (error) {
    failures.push(
      `env schema integrity: unable to read ENV_SCHEMA.md (${error?.message || "unknown"})`
    );
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
