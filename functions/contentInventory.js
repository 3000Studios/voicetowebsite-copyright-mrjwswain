const LIVE_PUBLIC_ROUTE_DEFINITIONS = [
  ["home", "Home", "/", "src/App.tsx", "live-runtime"],
  [
    "features",
    "Features",
    "/features",
    "src/data/sitePages.ts",
    "live-runtime",
  ],
  [
    "how-it-works",
    "How It Works",
    "/how-it-works",
    "src/data/sitePages.ts",
    "live-runtime",
  ],
  ["demo", "Demo", "/demo", "src/data/sitePages.ts", "live-runtime"],
  ["pricing", "Pricing", "/pricing", "src/data/sitePages.ts", "live-runtime"],
  ["blog", "Blog", "/blog", "src/pages/BlogPage.tsx", "live-runtime"],
  ["contact", "Contact", "/contact", "src/data/sitePages.ts", "live-runtime"],
  ["support", "Support", "/support", "src/data/sitePages.ts", "live-runtime"],
  ["privacy", "Privacy", "/privacy", "src/data/sitePages.ts", "live-runtime"],
  ["terms", "Terms", "/terms", "src/data/sitePages.ts", "live-runtime"],
  ["trust", "Trust Center", "/trust", "src/data/sitePages.ts", "live-runtime"],
  ["status", "Status", "/status", "worker.js", "worker-alias"],
  ["about", "About", "/about", "src/data/sitePages.ts", "live-runtime"],
  ["gallery", "Gallery", "/gallery", "src/data/sitePages.ts", "live-runtime"],
  [
    "templates",
    "Templates",
    "/templates",
    "src/data/sitePages.ts",
    "live-runtime",
  ],
  [
    "partners",
    "Partners",
    "/partners",
    "src/data/sitePages.ts",
    "live-runtime",
  ],
  [
    "referrals",
    "Referrals",
    "/referrals",
    "src/data/sitePages.ts",
    "live-runtime",
  ],
  [
    "projects",
    "Projects",
    "/projects",
    "src/data/sitePages.ts",
    "live-runtime",
  ],
  ["the3000", "The3000", "/the3000", "src/data/sitePages.ts", "live-runtime"],
  [
    "studio3000",
    "Studio3000",
    "/studio3000",
    "src/data/sitePages.ts",
    "live-runtime",
  ],
  [
    "webforge",
    "Webforge",
    "/webforge",
    "src/data/sitePages.ts",
    "live-runtime",
  ],
  [
    "cursor-demo",
    "Cursor Demo",
    "/cursor-demo",
    "src/data/sitePages.ts",
    "live-runtime",
  ],
  ["sandbox", "Sandbox", "/sandbox", "src/data/sitePages.ts", "live-runtime"],
  ["license", "License", "/license", "src/data/sitePages.ts", "live-runtime"],
  ["legal", "Legal", "/legal", "src/data/sitePages.ts", "live-runtime"],
  [
    "copyrights",
    "Copyrights",
    "/copyrights",
    "src/data/sitePages.ts",
    "live-runtime",
  ],
  [
    "api-documentation",
    "API Documentation",
    "/api-documentation",
    "src/data/sitePages.ts",
    "live-runtime",
  ],
  [
    "neural-engine",
    "Neural Engine",
    "/neural-engine",
    "src/data/sitePages.ts",
    "live-runtime",
  ],
  [
    "strata-design-system",
    "Strata Design System",
    "/strata-design-system",
    "src/data/sitePages.ts",
    "live-runtime",
  ],
  [
    "lexicon-pro",
    "Lexicon Pro",
    "/lexicon-pro",
    "src/data/sitePages.ts",
    "live-runtime",
  ],
  [
    "voice-to-json",
    "Voice to JSON",
    "/voice-to-json",
    "src/data/sitePages.ts",
    "live-runtime",
  ],
  [
    "geological-studies",
    "Geological Studies",
    "/geological-studies",
    "src/data/sitePages.ts",
    "live-runtime",
  ],
  [
    "livestream",
    "Livestream",
    "/livestream",
    "src/data/sitePages.ts",
    "live-runtime",
  ],
  ["search", "Search", "/search", "src/data/sitePages.ts", "live-runtime"],
  ["store", "Store", "/store", "src/data/sitePages.ts", "live-runtime"],
  [
    "appstore",
    "App Store",
    "/appstore",
    "src/data/sitePages.ts",
    "live-runtime",
  ],
  [
    "apps-category",
    "Apps Category Route",
    "/apps/category/:name",
    "src/pages/CategoryPage.tsx",
    "live-runtime",
  ],
];

const SHARED_NAV_ITEMS = [
  ["/", "Home", false],
  ["/features", "Features", false],
  ["/how-it-works", "How It Works", false],
  ["/demo", "Demo", false],
  ["/pricing", "Pricing", false],
  ["/store", "Store", false],
  ["/appstore", "App Store", false],
  ["/blog", "Blog", false],
  ["/livestream", "Livestream", false],
  ["/support", "Support", false],
  ["/contact", "Contact", false],
  ["/about", "About", false],
  ["/status", "Status", false],
  ["/search", "Search", false],
  ["/gallery", "Gallery", false],
  ["/templates", "Templates", false],
  ["/partners", "Partners", false],
  ["/trust", "Trust Center", false],
  ["/referrals", "Referrals", false],
  ["/projects", "Projects", false],
  ["/the3000", "The3000", false],
  ["/studio3000", "Studio3000", false],
  ["/webforge", "Webforge", false],
  ["/cursor-demo", "Cursor Demo", false],
  ["/sandbox", "Sandbox", false],
  ["/license", "License", false],
  ["/privacy", "Privacy", false],
  ["/terms", "Terms", false],
  ["/legal", "Legal", false],
  ["/copyrights", "Copyrights", false],
  ["/api-documentation", "API Docs", false],
  ["/neural-engine", "Neural Engine", false],
  ["/strata-design-system", "Design System", false],
  ["/lexicon-pro", "Lexicon Pro", false],
  ["/voice-to-json", "Voice to JSON", false],
  ["/geological-studies", "Geological Studies", false],
  ["/admin/login.html", "Admin Login", true],
  ["/admin/access.html", "Admin Panel", true],
  ["/admin/mission", "Dashboard", true],
  ["/admin/store", "Store Manager", true],
  ["/admin/app-store-manager.html", "App Store Manager", true],
  ["/admin/analytics", "Analytics", true],
  ["/admin/vcc", "Voice Commands", true],
  ["/admin/live-room-test.html", "Live Room Test", true],
  ["/admin/media", "Media Manager", true],
  ["/admin/settings", "Settings", true],
];

const RUNTIME_CONFIG_SOURCES = [
  [
    "config-home",
    "Home runtime content",
    "/config/home.json",
    "public/config/home.json",
    ["/"],
    true,
  ],
  [
    "config-nav",
    "Navigation config",
    "/config/nav.json",
    "public/config/nav.json",
    ["admin inventory", "legacy navigation"],
    true,
  ],
  [
    "config-blog",
    "Blog config",
    "/config/blog.json",
    "public/config/blog.json",
    ["/blog"],
    true,
  ],
  [
    "config-products",
    "Products config",
    "/config/products.json",
    "public/config/products.json",
    ["/store"],
    true,
  ],
  [
    "config-redirects",
    "Redirect rules",
    "/config/redirects.json",
    "public/config/redirects.json",
    ["worker routing"],
    true,
  ],
  [
    "config-registry",
    "Route registry",
    "/config/registry.json",
    "public/config/registry.json",
    ["worker routing", "inventory audit"],
    true,
  ],
  [
    "config-assets",
    "Asset registry",
    "/config/assets.json",
    "public/config/assets.json",
    ["runtime assets"],
    true,
  ],
  [
    "config-progress",
    "Progress config",
    "/config/progress.json",
    "public/config/progress.json",
    ["admin progress"],
    true,
  ],
  [
    "config-materials",
    "Materials config",
    "/config/materials.json",
    "public/config/materials.json",
    ["content ops"],
    true,
  ],
  [
    "config-monetization-roadmap",
    "Monetization roadmap",
    "/config/monetization-roadmap.json",
    "public/config/monetization-roadmap.json",
    ["monetization ops"],
    true,
  ],
  [
    "config-affiliates",
    "Affiliates config",
    "/config/affiliates.json",
    "public/config/affiliates.json",
    ["affiliate pages"],
    true,
  ],
  [
    "config-adsense",
    "AdSense config",
    "/config/adsense.json",
    "public/config/adsense.json",
    ["ad placements"],
    true,
  ],
  [
    "data-storefront-apps",
    "Storefront apps data",
    "/data/storefront-apps.json",
    "public/data/storefront-apps.json",
    ["/store", "/appstore"],
    false,
  ],
];

const ADMIN_ROUTE_DEFINITIONS = [
  ["admin-access", "Admin Access", "/admin/access.html", "admin/access.html"],
  ["admin-login", "Admin Login", "/admin/login.html", "admin/login.html"],
  ["admin-index", "Admin Shell", "/admin/index.html", "admin/index.html"],
  [
    "admin-integrated-dashboard",
    "Integrated Dashboard",
    "/admin/integrated-dashboard.html",
    "admin/integrated-dashboard.html",
  ],
  [
    "admin-analytics",
    "Analytics",
    "/admin/analytics.html",
    "admin/analytics.html",
  ],
  [
    "admin-analytics-enhanced",
    "Analytics Enhanced",
    "/admin/analytics-enhanced.html",
    "admin/analytics-enhanced.html",
  ],
  [
    "admin-bot-command-center",
    "Bot Command Center",
    "/admin/bot-command-center.html",
    "admin/bot-command-center.html",
  ],
  [
    "admin-customer-chat",
    "Customer Chat",
    "/admin/customer-chat.html",
    "admin/customer-chat.html",
  ],
  [
    "admin-live-stream",
    "Live Stream",
    "/admin/live-stream.html",
    "admin/live-stream.html",
  ],
  [
    "admin-live-stream-enhanced",
    "Live Stream Enhanced",
    "/admin/live-stream-enhanced.html",
    "admin/live-stream-enhanced.html",
  ],
  [
    "admin-store-manager",
    "Store Manager",
    "/admin/store-manager.html",
    "admin/store-manager.html",
  ],
  [
    "admin-app-store-manager",
    "App Store Manager",
    "/admin/app-store-manager.html",
    "admin/app-store-manager.html",
  ],
  [
    "admin-voice-commands",
    "Voice Commands",
    "/admin/voice-commands.html",
    "admin/voice-commands.html",
  ],
  ["admin-progress", "Progress", "/admin/progress.html", "admin/progress.html"],
  ["admin-nexus", "Nexus", "/admin/nexus.html", "admin/nexus.html"],
  [
    "admin-clean-route-mission",
    "Mission Control Route",
    "/admin/mission",
    "admin/integrated-dashboard.html",
  ],
  [
    "admin-clean-route-store",
    "Store Route",
    "/admin/store",
    "admin/store-manager.html",
  ],
  [
    "admin-clean-route-analytics",
    "Analytics Route",
    "/admin/analytics",
    "admin/analytics.html",
  ],
  [
    "admin-clean-route-vcc",
    "Voice Command Route",
    "/admin/vcc",
    "admin/voice-commands.html",
  ],
  [
    "admin-clean-route-media",
    "Media Route",
    "/admin/media",
    "admin/index.html",
  ],
  [
    "admin-clean-route-settings",
    "Settings Route",
    "/admin/settings",
    "admin/index.html",
  ],
];

const LEGACY_STATIC_HTML_FILES = [
  "about.html",
  "admin-auth-system.html",
  "api-documentation.html",
  "appstore-new.html",
  "appstore.html",
  "blog.html",
  "color-synth.html",
  "comprehensive-footer.html",
  "contact-enhanced.html",
  "contact.html",
  "copyrights.html",
  "cursor-demo.html",
  "cyber-blog.html",
  "demo.html",
  "disclosure.html",
  "enhanced-hamburger-nav.html",
  "enhanced-navigation.html",
  "features-enhanced.html",
  "features.html",
  "focus-timer.html",
  "gallery.html",
  "geological-studies.html",
  "how-it-works.html",
  "index.html",
  "legal.html",
  "lexicon-pro.html",
  "license.html",
  "livestream.html",
  "memory-matrix.html",
  "neon-snake.html",
  "neural-engine.html",
  "partners.html",
  "paypal-setup.html",
  "phosphor-nav.html",
  "pricing-enhanced.html",
  "pricing.html",
  "privacy.html",
  "project-planning-hub.html",
  "projects.html",
  "referrals.html",
  "rush-percussion.html",
  "sandbox.html",
  "search-enhanced.html",
  "search.html",
  "seo-template.html",
  "status.html",
  "store.html",
  "strata-design-system.html",
  "stripe-connect-dashboard.html",
  "stripe-connect-storefront.html",
  "studio3000.html",
  "support.html",
  "templates.html",
  "terms.html",
  "the3000-gallery.html",
  "the3000.html",
  "trust.html",
  "voice-to-json.html",
  "webforge.html",
  "zen-particles.html",
];

const APP_BUNDLES = [
  "src/apps/analytics-dashboard.html",
  "src/apps/api-tester.html",
  "src/apps/audio-mixer.html",
  "src/apps/budget-planner.html",
  "src/apps/calendar-scheduler.html",
  "src/apps/chatbot-builder.html",
  "src/apps/code-editor.html",
  "src/apps/color-palette.html",
  "src/apps/contact-form-builder.html",
  "src/apps/crm-system.html",
  "src/apps/database-manager.html",
  "src/apps/email-marketing.html",
  "src/apps/expense-tracker.html",
  "src/apps/file-converter.html",
  "src/apps/fitness-tracker.html",
  "src/apps/font-finder.html",
  "src/apps/habit-tracker.html",
  "src/apps/image-editor.html",
  "src/apps/inventory-manager.html",
  "src/apps/invoice-generator.html",
  "src/apps/learning-platform.html",
  "src/apps/logo-maker.html",
  "src/apps/mind-mapper.html",
  "src/apps/note-taking-app.html",
  "src/apps/password-manager.html",
  "src/apps/pdf-tools.html",
  "src/apps/pomodoro-timer.html",
  "src/apps/presentation-builder.html",
  "src/apps/qr-code-generator.html",
  "src/apps/recipe-manager.html",
  "src/apps/screenshot-capture.html",
  "src/apps/security-scanner.html",
  "src/apps/seo-optimizer.html",
  "src/apps/social-media-manager.html",
  "src/apps/survey-builder.html",
  "src/apps/task-manager.html",
  "src/apps/text-analyzer.html",
  "src/apps/time-tracker.html",
  "src/apps/translation-tool.html",
  "src/apps/video-editor.html",
  "src/apps/weather-dashboard.html",
  "src/apps/website-builder.html",
];

const ASSET_DEFINITIONS = [
  [
    "asset-footer-html",
    "Footer partial",
    "/footer.html",
    "public/footer.html",
    "asset",
  ],
  [
    "asset-nav-js",
    "Public navigation script",
    "/nav.js",
    "public/nav.js",
    "asset",
  ],
  [
    "asset-footer-js",
    "Footer script",
    "/footer.js",
    "public/footer.js",
    "asset",
  ],
  ["asset-blog-js", "Blog script", "/blog.js", "public/blog.js", "asset"],
  [
    "asset-search-js",
    "Search script",
    "/search.js",
    "public/search.js",
    "asset",
  ],
  [
    "asset-vtw-wallpaper",
    "Wallpaper",
    "/vtw-wallpaper.png",
    "public/vtw-wallpaper.png",
    "asset",
  ],
  [
    "asset-opener-video",
    "Opener video",
    "/media/vtw-opener.mp4",
    "public/media/vtw-opener.mp4",
    "asset",
  ],
  [
    "asset-admin-video",
    "Admin dashboard video",
    "/media/vtw-admin-dashboard.mp4",
    "public/media/vtw-admin-dashboard.mp4",
    "asset",
  ],
  [
    "asset-home-video",
    "Home wallpaper video",
    "/media/vtw-home-wallpaper.mp4",
    "public/media/vtw-home-wallpaper.mp4",
    "asset",
  ],
  [
    "download-demo-kit",
    "Demo kit",
    "/downloads/vtw-demo-kit.html",
    "public/downloads/vtw-demo-kit.html",
    "download",
  ],
  [
    "download-ui-generator",
    "UI generator",
    "/downloads/ui-generator.html",
    "public/downloads/ui-generator.html",
    "download",
  ],
  [
    "download-project-planning-hub",
    "Project planning hub zip",
    "/downloads/project-planning-hub.zip",
    "public/downloads/project-planning-hub.zip",
    "download",
  ],
  [
    "download-audioboost",
    "AudioBoost Pro AI zip",
    "/downloads/audioboost-pro-ai.zip",
    "public/downloads/audioboost-pro-ai.zip",
    "download",
  ],
];

const CONFIG_OVERRIDE_PREFIX = "content-inventory:config-override:";
const ROUTE_ALIAS_MAP = {
  "/contact-enhanced": "/contact",
  "/search-enhanced": "/search",
  "/features-enhanced": "/features",
  "/pricing-enhanced": "/pricing",
  "/index": "/",
};

const toRouteFromHtml = (fileName) => {
  if (!fileName.endsWith(".html")) return `/${fileName}`;
  const name = fileName.replace(/\.html$/i, "");
  return name === "index" ? "/" : `/${name}`;
};

const fileExists = async (assets, path) => {
  if (!assets) return false;
  const response = await assets.fetch(`https://inventory.local${path}`);
  return response.status !== 404;
};

const dedupeWarnings = (warnings) => {
  const seen = new Set();
  return warnings.filter((warning) => {
    const key = JSON.stringify(warning);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const liveRouteEntries = LIVE_PUBLIC_ROUTE_DEFINITIONS.map(
  ([id, title, route, sourcePath, authority]) => ({
    id,
    title,
    route,
    sourcePath,
    authority,
    sourceType: "react-route",
  })
);

const navEntries = SHARED_NAV_ITEMS.map(([href, label, requiresAuth]) => ({
  href,
  label,
  requiresAuth,
}));

const configEntries = RUNTIME_CONFIG_SOURCES.map(
  ([id, title, path, sourcePath, usedBy, editable]) => ({
    id,
    title,
    path,
    sourcePath,
    usedBy,
    editable,
  })
);

const adminEntries = ADMIN_ROUTE_DEFINITIONS.map(
  ([id, title, route, sourcePath]) => ({
    id,
    title,
    route,
    sourcePath,
  })
);

const assetEntries = ASSET_DEFINITIONS.map(
  ([id, title, path, sourcePath, sourceType]) => ({
    id,
    title,
    path,
    sourcePath,
    sourceType,
  })
);

export const EDITABLE_CONFIG_PATHS = configEntries
  .filter((source) => source.editable)
  .map((source) => source.path);

export const isEditableConfigPath = (path) =>
  EDITABLE_CONFIG_PATHS.includes(String(path || "").trim());

export const getConfigOverrideKey = (path) =>
  `${CONFIG_OVERRIDE_PREFIX}${String(path || "").trim()}`;

export const getInventorySourceDescriptor = (path) =>
  configEntries.find((item) => item.path === path) || null;

export const listEditableSources = () =>
  configEntries
    .filter((item) => item.editable)
    .map((item) => ({
      path: item.path,
      title: item.title,
      sourcePath: item.sourcePath,
    }));

export async function buildContentInventory({ assets }) {
  const liveRouteMap = new Map(
    liveRouteEntries.map((item) => [item.route, item])
  );
  const publicNavItems = navEntries.filter((item) => !item.requiresAuth);
  const items = [];
  const warnings = [];

  for (const route of liveRouteEntries) {
    const routeWarnings = [];
    const inNav = publicNavItems.some((item) => item.href === route.route);
    if (!inNav && !route.route.includes(":")) {
      routeWarnings.push({
        code: "live-route-not-in-nav",
        message: `${route.route} is live but not exposed in shared navigation.`,
        route: route.route,
      });
    }

    items.push({
      id: route.id,
      title: route.title,
      route: route.route,
      status: "live",
      section: "live-public-routes",
      sourceType: route.sourceType,
      sourcePath: route.sourcePath,
      authority: route.authority,
      editable: false,
      warnings: routeWarnings,
      details: [`Authority: ${route.authority}`, `Source: ${route.sourcePath}`],
    });
    warnings.push(...routeWarnings);
  }

  for (const navItem of publicNavItems) {
    const normalized = ROUTE_ALIAS_MAP[navItem.href] || navItem.href;
    if (normalized.includes(":")) continue;
    if (!liveRouteMap.has(normalized)) {
      const navWarning = {
        code: "nav-missing-live-route",
        message: `${navItem.href} is in shared navigation but has no live runtime source.`,
        route: navItem.href,
      };
      items.push({
        id: `nav-missing-${navItem.href}`,
        title: navItem.label,
        route: navItem.href,
        status: "missing",
        section: "live-public-routes",
        sourceType: "react-route",
        sourcePath: "src/constants/navigation.ts",
        authority: "navigation-only",
        editable: false,
        warnings: [navWarning],
        details: ["Navigation entry without a matching runtime source."],
      });
      warnings.push(navWarning);
    }
  }

  for (const configSource of configEntries) {
    const exists = await fileExists(assets, configSource.path);
    const configWarnings = [];
    if (!exists) {
      const warning = {
        code: "referenced-config-missing",
        message: `${configSource.path} is referenced but missing from static assets.`,
        route: configSource.path,
      };
      configWarnings.push(warning);
      warnings.push(warning);
    }
    if (!configSource.usedBy.some((value) => String(value).startsWith("/"))) {
      const warning = {
        code: "config-not-linked-live",
        message: `${configSource.path} is not wired directly to a live public route.`,
        route: configSource.path,
      };
      configWarnings.push(warning);
      warnings.push(warning);
    }

    items.push({
      id: configSource.id,
      title: configSource.title,
      route: configSource.path,
      status: exists
        ? configSource.usedBy.some((value) => String(value).startsWith("/"))
          ? "live"
          : "secondary"
        : "missing",
      section: "runtime-config",
      sourceType: "json-config",
      sourcePath: configSource.sourcePath,
      authority: configSource.usedBy.join(", "),
      editable: configSource.editable,
      warnings: configWarnings,
      details: [`Used by: ${configSource.usedBy.join(", ")}`],
    });
  }

  for (const adminPage of adminEntries) {
    const adminWarnings = [];
    const exists = adminPage.route.endsWith(".html")
      ? await fileExists(assets, adminPage.route)
      : true;
    if (!exists) {
      const warning = {
        code: "admin-asset-missing",
        message: `${adminPage.route} is expected in admin routes but the underlying asset is missing.`,
        route: adminPage.route,
      };
      adminWarnings.push(warning);
      warnings.push(warning);
    }

    items.push({
      id: adminPage.id,
      title: adminPage.title,
      route: adminPage.route,
      status: "protected",
      section: "admin-routes",
      sourceType: "admin-page",
      sourcePath: adminPage.sourcePath,
      authority: "admin-auth",
      editable: false,
      warnings: adminWarnings,
      details: ["Protected by admin access."],
    });
  }

  for (const fileName of LEGACY_STATIC_HTML_FILES) {
    const route = toRouteFromHtml(fileName);
    const normalizedRoute = ROUTE_ALIAS_MAP[route] || route;
    const hasLiveRoute = liveRouteMap.has(normalizedRoute);
    const legacyWarnings = [];
    const exists = await fileExists(assets, `/${fileName}`);

    if (!exists) {
      const warning = {
        code: "legacy-html-missing-build-output",
        message: `${fileName} exists in source but is not present in built assets.`,
        route,
      };
      legacyWarnings.push(warning);
      warnings.push(warning);
    }

    const warning = {
      code: hasLiveRoute ? "legacy-html-secondary" : "legacy-html-orphaned",
      message: hasLiveRoute
        ? `${fileName} is a legacy HTML entry for a route owned by the live runtime.`
        : `${fileName} is legacy HTML that is not part of the live runtime route graph.`,
      route,
    };
    legacyWarnings.push(warning);
    warnings.push(warning);

    items.push({
      id: `legacy-${fileName}`,
      title: fileName,
      route,
      status: !exists ? "missing" : hasLiveRoute ? "secondary" : "orphaned",
      section: "legacy-static-html",
      sourceType: "static-html",
      sourcePath: fileName,
      authority: hasLiveRoute ? "legacy-secondary" : "legacy-orphaned",
      editable: false,
      warnings: legacyWarnings,
      details: ["Legacy root HTML entry point."],
    });
  }

  for (const filePath of APP_BUNDLES) {
    const fileName = filePath.split("/").pop() || filePath;
    const appWarnings = [
      {
        code: "app-bundle-orphaned",
        message: `${fileName} is present in src/apps but not wired into the live route inventory.`,
        route: filePath,
      },
    ];
    warnings.push(...appWarnings);
    items.push({
      id: `app-bundle-${fileName}`,
      title: fileName,
      route: filePath,
      status: "orphaned",
      section: "app-bundles",
      sourceType: "asset",
      sourcePath: filePath,
      authority: "source-only",
      editable: false,
      warnings: appWarnings,
      details: ["Standalone app bundle source file."],
    });
  }

  for (const asset of assetEntries) {
    const exists = await fileExists(assets, asset.path);
    const assetWarnings = [];
    if (!exists) {
      const warning = {
        code: "referenced-asset-missing",
        message: `${asset.path} is listed in the inventory but missing from assets.`,
        route: asset.path,
      };
      assetWarnings.push(warning);
      warnings.push(warning);
    }

    items.push({
      id: asset.id,
      title: asset.title,
      route: asset.path,
      status: exists ? "secondary" : "missing",
      section: "assets-and-downloads",
      sourceType: asset.sourceType,
      sourcePath: asset.sourcePath,
      authority: "static-asset",
      editable: false,
      warnings: assetWarnings,
      details: ["Static asset or downloadable content."],
    });
  }

  const summary = {
    totalItems: items.length,
    totalLivePages: items.filter((item) => item.status === "live").length,
    totalHiddenOrOrphaned: items.filter(
      (item) => item.status === "orphaned" || item.status === "secondary"
    ).length,
    totalMissingReferences: items.filter((item) => item.status === "missing")
      .length,
    totalProtected: items.filter((item) => item.status === "protected").length,
    recommendations: [],
  };

  if (summary.totalMissingReferences > 0) {
    summary.recommendations.push(
      "Review missing config or asset entries first. They block the cleanest path to trustworthy content inventory."
    );
  }
  if (
    items.some((item) =>
      item.warnings.some((warning) => warning.code === "nav-missing-live-route")
    )
  ) {
    summary.recommendations.push(
      "Resolve navigation entries that point to routes without a live runtime source."
    );
  }
  if (
    items.some((item) =>
      item.warnings.some(
        (warning) =>
          warning.code === "legacy-html-secondary" ||
          warning.code === "legacy-html-orphaned"
      )
    )
  ) {
    summary.recommendations.push(
      "Consolidate or remove legacy HTML pages that duplicate or bypass the current runtime."
    );
  }
  if (summary.recommendations.length === 0) {
    summary.recommendations.push(
      "No critical gaps detected. Use this view to confirm source ownership before editing content."
    );
  }

  const sectionTitles = {
    "live-public-routes": "Live Public Routes",
    "runtime-config": "Runtime Config",
    "admin-routes": "Admin Routes",
    "legacy-static-html": "Legacy Static HTML",
    "app-bundles": "App Bundles",
    "assets-and-downloads": "Assets And Downloads",
  };

  const sections = Object.keys(sectionTitles).map((id) => ({
    id,
    title: sectionTitles[id],
    itemCount: items.filter((item) => item.section === id).length,
    warningCount: items
      .filter((item) => item.section === id)
      .reduce((sum, item) => sum + item.warnings.length, 0),
  }));

  return {
    generatedAt: new Date().toISOString(),
    summary,
    sections,
    items,
    warnings: dedupeWarnings(warnings),
    editableSources: listEditableSources(),
  };
}
