const PRODUCT = {
  name: "AI Website Operating System",
  shortName: "AI-WOS",
  version: "1.0.0",
  runtime: "Cloudflare Worker + React/Vite control surface",
  deploymentModel: "main-only Wrangler deployment",
  commandEndpoint: "/api/execute",
  dashboardRoute: "/admin/mission",
  actionSchemaPath: "ops/contracts/openapi.execute.json",
};

const SECTION_DEFINITIONS = [
  {
    id: "modules",
    title: "Runtime Modules",
    description:
      "Core engines that interpret commands, mutate content, and ship changes.",
  },
  {
    id: "commands",
    title: "Command Surface",
    description:
      "Natural-language command groups supported by the execution layer.",
  },
  {
    id: "blueprints",
    title: "Site Blueprints",
    description:
      "Vertical templates the platform can use as starting points for automated site generation.",
  },
  {
    id: "themes",
    title: "Theme Packs",
    description:
      "Named theme modes and design token directions available to the AI layer.",
  },
  {
    id: "automation",
    title: "Autopilot",
    description:
      "Scheduled or repeatable automation tasks that keep the site operating.",
  },
  {
    id: "sites",
    title: "Site Topology",
    description:
      "Live surfaces and generation workspaces currently tracked by the platform.",
  },
  {
    id: "security",
    title: "Security Model",
    description:
      "Auth, validation, idempotency, and rollout safeguards that gate production changes.",
  },
  {
    id: "deployment",
    title: "Deployment Flow",
    description:
      "Source-of-truth release path and environment signals used to go live.",
  },
  {
    id: "docs",
    title: "Docs And Contracts",
    description:
      "Operational references for dashboard users, Custom GPT actions, and deploy safety.",
  },
];

const buildItems = (env) => {
  const autoDeployReady = Boolean(
    String(env.CF_DEPLOY_HOOK_URL || "").trim() ||
    String(env.CF_WORKERS_BUILDS_AUTO_DEPLOY || "").trim() === "1"
  );
  const orchReady = Boolean(
    String(
      env.ORCH_TOKEN || env.X_ORCH_TOKEN || env["x-orch-token"] || ""
    ).trim()
  );

  return [
    {
      id: "module-command-router",
      kind: "module",
      section: "modules",
      title: "AI Command Router",
      subtitle:
        "Canonical execution surface for Custom GPT, voice control, and admin tools.",
      status: "live",
      description:
        "Routes `auto`, `preview`, `apply`, `deploy`, `rollback`, `list_pages`, and `read_page` requests through one authenticated Worker endpoint.",
      badges: ["/api/execute", "idempotent", "production"],
      files: [
        "functions/execute.js",
        "ops/contracts/openapi.execute.json",
        "CUSTOM_GPT_SETUP.md",
      ],
      commands: [
        "Change homepage hero headline",
        "Update pricing copy on all pages",
        "List all pages",
        "Read the current store page",
      ],
      details: [
        "Primary auth: x-orch-token header or signed admin cookie.",
        "Supports auto mode for single-call plan + apply + deploy.",
        "Rejects unsafe page targets such as admin paths.",
      ],
      links: [
        { label: "Execute API", href: "/api/execute" },
        { label: "Capabilities", href: "/api/capabilities" },
      ],
    },
    {
      id: "module-intent-interpreter",
      kind: "module",
      section: "modules",
      title: "Intent Interpreter",
      subtitle: "AI + fallback parser for natural-language website operations.",
      status: "live",
      description:
        "Uses orchestrator planning with regex fallbacks so text and voice instructions resolve into concrete content, theme, media, and page actions.",
      badges: ["AI-assisted", "fallback parser"],
      files: ["functions/orchestrator.js", "functions/godmode.js"],
      commands: [
        "Change theme to midnight",
        "Add page About with headline About Us",
        "Insert video https://example.com/demo.mp4",
      ],
      details: [
        "Falls back to deterministic parsing when model output is unavailable.",
        "Generates structured action plans before apply/deploy steps.",
      ],
      links: [],
    },
    {
      id: "module-content-engine",
      kind: "module",
      section: "modules",
      title: "Content Engine",
      subtitle: "Structured runtime content plus file-backed source inventory.",
      status: "live",
      description:
        "Combines JSON runtime config, TypeScript content modules, and admin runtime overrides so customer-facing copy can be changed without blind file edits.",
      badges: ["JSON", "runtime overrides", "inventory"],
      files: [
        "public/config/home.json",
        "public/config/products.json",
        "src/content/homeContent.ts",
        "functions/contentInventory.js",
      ],
      commands: [
        "Update CTA copy",
        "Change store products",
        "Edit blog feed content",
      ],
      details: [
        "Content inventory distinguishes live, orphaned, missing, and protected assets.",
        "JSON-backed sources can be overridden safely through admin tooling.",
      ],
      links: [
        { label: "Content Inventory", href: "/api/admin/content-inventory" },
      ],
    },
    {
      id: "module-page-generator",
      kind: "module",
      section: "modules",
      title: "Page Generator",
      subtitle: "AI-assisted layout, section, and asset generation engine.",
      status: "live",
      description:
        "Generates page layouts, style-pack selections, HTML, CSS, and asset manifests for new site concepts and generated web properties.",
      badges: ["style packs", "site generation", "D1/R2 ready"],
      files: ["functions/siteGenerator.js", "tests/siteGenerator.test.js"],
      commands: [
        "Build me a restaurant website",
        "Generate a dentist site with booking",
        "Create a new landing page",
      ],
      details: [
        "Persists generated site records in D1 when the database binding is present.",
        "Includes reusable style packs for surface, typography, motion, and color.",
      ],
      links: [],
    },
    {
      id: "module-design-engine",
      kind: "module",
      section: "modules",
      title: "Design Engine",
      subtitle:
        "Theme-aware UI system with cinematic backgrounds and motion layers.",
      status: "live",
      description:
        "Coordinates the design system, section layouts, wallpapers, card treatments, reveal animations, and premium visual components used across the public site.",
      badges: ["themes", "wallpaper", "glass UI"],
      files: [
        "src/design-system.css",
        "src/layout-system.css",
        "src/styles/obsidian-kinetic-flow.css",
        "src/components/ParallaxWallpaper.tsx",
      ],
      commands: [
        "Change theme to ocean",
        "Update wallpaper treatment",
        "Add stronger card glow",
      ],
      details: [
        "Supports animated backgrounds, scroll reveal, and responsive premium layout patterns.",
        "Keeps design work inside the current React/Vite runtime rather than a second frontend stack.",
      ],
      links: [],
    },
    {
      id: "module-media-engine",
      kind: "module",
      section: "modules",
      title: "Media Engine",
      subtitle:
        "Media library, asset discovery, and embedded rich content handling.",
      status: "live",
      description:
        "Manages images, video, audio, and embedded content across the storefront, landing pages, and live command center flows.",
      badges: ["media", "R2", "embed"],
      files: [
        "functions/imageSearch.js",
        "public/media/vtw-home-wallpaper.mp4",
        "src/utils/imageDiscovery.js",
      ],
      commands: [
        "Add hero image",
        "Insert a YouTube livestream",
        "Update background video",
      ],
      details: [
        "Supports rich media inventory through existing media and audio manager surfaces.",
        "Ready for cloud storage-backed media workflows when R2 is bound.",
      ],
      links: [],
    },
    {
      id: "module-voice-control",
      kind: "module",
      section: "modules",
      title: "Voice Control",
      subtitle: "Speech-driven command capture and operator control.",
      status: "live",
      description:
        "Captures browser speech input and routes it into the same execute/orchestrator path used by typed commands and Custom GPT actions.",
      badges: ["Web Speech API", "voice center"],
      files: [
        "admin/voice-commands.html",
        "src/webforge/components/VoiceInput.tsx",
      ],
      commands: [
        "Speak a site update",
        "Run a deploy command by voice",
        "Preview a content change",
      ],
      details: [
        "Voice tooling uses the same canonical execute surface as external GPT callers.",
        "Keeps command history inside the admin operating surface.",
      ],
      links: [{ label: "Voice Command Center", href: "/admin/vcc" }],
    },
    {
      id: "module-deployment-engine",
      kind: "module",
      section: "modules",
      title: "Deployment Engine",
      subtitle:
        "Locked release pipeline with verify, ship, and Wrangler deploy.",
      status: "live",
      description:
        "Enforces the repository deployment policy so all automation routes through verify + production deploy rather than ad hoc scripts.",
      badges: ["wrangler", "main-only", "verify-first"],
      files: ["scripts/deploy-unified.mjs", "scripts/ship.mjs", "AGENTS.md"],
      commands: [
        "Deploy latest changes",
        "Check deployment status",
        "Rollback last production change",
      ],
      details: [
        "Single deploy path is `npm run deploy:live`.",
        "GitHub Actions deployment is intentionally not the source of truth.",
      ],
      links: [],
    },
    {
      id: "module-analytics-engine",
      kind: "module",
      section: "modules",
      title: "Analytics Engine",
      subtitle: "Traffic, revenue, and deployment telemetry surfaces.",
      status: "live",
      description:
        "Provides analytics endpoints and dashboard surfaces for traffic, product activity, and operational health.",
      badges: ["analytics", "revenue", "observability"],
      files: [
        "src/utils/revenueTracking.ts",
        "admin/analytics.html",
        "tests/commandCenterAnalytics.test.js",
      ],
      commands: [
        "Check site analytics",
        "Inspect deployment health",
        "Review store activity",
      ],
      details: [
        "Supports Cloudflare analytics integration when tokens are configured.",
        "Feeds both public runtime tracking and admin reporting.",
      ],
      links: [{ label: "Analytics", href: "/admin/analytics" }],
    },
    {
      id: "module-multi-site-foundation",
      kind: "module",
      section: "modules",
      title: "Multi-site Foundation",
      subtitle: "Generated site workspace persistence and asset indexing.",
      status: "foundation",
      description:
        "Stores generated site layouts and asset manifests in D1/R2, providing the foundation for a future tenant-aware multi-site product model.",
      badges: ["multi-site", "foundation"],
      files: ["functions/siteGenerator.js", "database/migrations"],
      commands: [
        "Create a new generated site workspace",
        "Persist site assets",
      ],
      details: [
        "The current live product operates one primary production site plus generated site records.",
        "Full customer self-serve tenant provisioning is a next-phase build, not yet a live public workflow.",
      ],
      links: [],
    },
    {
      id: "commands-copy",
      kind: "command-category",
      section: "commands",
      title: "Copy And Messaging",
      subtitle: "Headlines, subheads, CTA text, and section copy.",
      status: "live",
      description:
        "Updates textual content for heroes, features, pricing blocks, and supporting sections.",
      badges: ["low risk", "content"],
      files: ["functions/orchestrator.js", "public/config/home.json"],
      commands: [
        "Update homepage headline to Welcome",
        "Change CTA to Start Now",
        "Rewrite the pricing subhead",
      ],
      details: [
        "Best handled through `action: auto` for quick production changes.",
      ],
      links: [],
    },
    {
      id: "commands-theme",
      kind: "command-category",
      section: "commands",
      title: "Theme And Styling",
      subtitle: "Theme packs, CSS injections, fonts, and visual tuning.",
      status: "live",
      description:
        "Applies theme switches and style-level adjustments without changing the deployment model.",
      badges: ["medium risk", "design"],
      files: ["functions/orchestrator.js", "src/design-system.css"],
      commands: [
        "Change theme to midnight",
        "Inject custom CSS for the hero",
        "Update card glow styling",
      ],
      details: [
        "Use preview/apply/deploy for large structural visual changes when human review is needed.",
      ],
      links: [],
    },
    {
      id: "commands-pages",
      kind: "command-category",
      section: "commands",
      title: "Pages And Sections",
      subtitle:
        "Create pages, add sections, and insert structured content blocks.",
      status: "live",
      description:
        "Creates or reshapes landing pages, support pages, and feature sections from natural language.",
      badges: ["structural"],
      files: ["functions/orchestrator.js", "functions/siteGenerator.js"],
      commands: [
        "Add page About with headline About Us",
        "Insert a testimonials section",
        "Build me a restaurant website",
      ],
      details: [
        "Large structural changes may require confirmation phrases in preview/apply mode.",
      ],
      links: [],
    },
    {
      id: "commands-commerce",
      kind: "command-category",
      section: "commands",
      title: "Commerce And Products",
      subtitle:
        "Storefront copy, pricing tiers, products, and offer packaging.",
      status: "live",
      description:
        "Supports editing products, plan messaging, store sections, and monetization surfaces.",
      badges: ["store", "pricing"],
      files: ["public/config/products.json", "src/pages/StorePage.tsx"],
      commands: [
        "Add a product to the store",
        "Lower pricing",
        "Update storefront hero messaging",
      ],
      details: [
        "Runtime product data is JSON-backed and safe to audit through inventory tooling.",
      ],
      links: [{ label: "Store Manager", href: "/admin/store" }],
    },
    {
      id: "commands-seo",
      kind: "command-category",
      section: "commands",
      title: "SEO And Metadata",
      subtitle:
        "Meta titles, descriptions, and page-level search optimization.",
      status: "live",
      description:
        "Updates titles, descriptions, and SEO-aware page content in the live runtime.",
      badges: ["seo", "metadata"],
      files: ["src/shared/siteManifest.js", "src/functions/seoInjection.js"],
      commands: [
        "Optimize SEO for the homepage",
        "Update the pricing meta description",
      ],
      details: [
        "Structured metadata is handled inside the existing React/Worker surface rather than a separate CMS.",
      ],
      links: [],
    },
    {
      id: "commands-media",
      kind: "command-category",
      section: "commands",
      title: "Media And Live Content",
      subtitle: "Images, videos, livestreams, wallpapers, and avatar assets.",
      status: "live",
      description:
        "Adds or swaps hero media, embedded streams, and rich content across public pages.",
      badges: ["video", "audio", "livestream"],
      files: ["functions/orchestrator.js", "public/media"],
      commands: [
        "Insert a YouTube livestream",
        "Change the wallpaper video",
        "Add a hero image",
      ],
      details: [
        "Rich embeds resolve through orchestrator actions like `insert_video` and `insert_stream`.",
      ],
      links: [{ label: "Live Stream", href: "/admin/live" }],
    },
    {
      id: "commands-ops",
      kind: "command-category",
      section: "commands",
      title: "Operations And Deploy",
      subtitle:
        "Command-center operations using `ops:` and explicit API calls.",
      status: "live",
      description:
        "Runs deploys, audits, file inspections, governance checks, and other backend operations from the same execute surface.",
      badges: ["ops:", "backend"],
      files: ["functions/commandCenterApi.js", "functions/execute.js"],
      commands: [
        "ops: run env audit",
        "ops: deploy now",
        "ops: list store products",
      ],
      details: [
        "Explicit backend calls can be sent via `parameters.api`.",
        "Deploy-type commands require a confirmation phrase.",
      ],
      links: [],
    },
    {
      id: "commands-recovery",
      kind: "command-category",
      section: "commands",
      title: "Recovery And Audit",
      subtitle: "Rollback, status checks, and production inspection.",
      status: "live",
      description:
        "Lets operators read pages, inspect status, and revert changes using the execution event model.",
      badges: ["rollback", "status", "audit"],
      files: ["functions/execute.js", "functions/contentInventory.js"],
      commands: ["Check site status", "Read the homepage", "Undo last change"],
      details: [
        "Rollback uses the same protected confirmation-token flow as other sensitive operations.",
      ],
      links: [],
    },
    {
      id: "blueprint-restaurant",
      kind: "blueprint",
      section: "blueprints",
      title: "Restaurant",
      subtitle:
        "Menu-first local business site with reservations and social proof.",
      status: "foundation",
      description:
        "Blueprint for restaurants, cafes, and hospitality brands that need conversion-focused local presence.",
      badges: ["booking", "local SEO"],
      files: ["functions/siteGenerator.js", "AI_WOS_ARCHITECTURE.md"],
      commands: ["Build me a restaurant website"],
      details: [
        "Suggested routes: home, menu, about, reviews, booking, contact.",
        "Suggested sections: hero, signature dishes, hours, location, reservation CTA.",
      ],
      links: [],
    },
    {
      id: "blueprint-dentist",
      kind: "blueprint",
      section: "blueprints",
      title: "Dentist",
      subtitle:
        "Trust-first healthcare site with services, team, and appointment flow.",
      status: "foundation",
      description:
        "Blueprint for local healthcare practices that need authority, reassurance, and booking conversion.",
      badges: ["services", "appointments"],
      files: ["functions/siteGenerator.js", "AI_WOS_ARCHITECTURE.md"],
      commands: ["Build me a dentist website"],
      details: [
        "Suggested routes: home, services, about, insurance, booking, contact.",
        "Suggested sections: hero, treatment grid, testimonials, provider bios, CTA.",
      ],
      links: [],
    },
    {
      id: "blueprint-saas",
      kind: "blueprint",
      section: "blueprints",
      title: "SaaS",
      subtitle:
        "Premium product marketing site with feature narrative and pricing.",
      status: "foundation",
      description:
        "Blueprint for software products with product demos, proof points, and plan packaging.",
      badges: ["pricing", "demo"],
      files: ["functions/siteGenerator.js", "src/pages/PricingPage.tsx"],
      commands: ["Build me a SaaS website"],
      details: [
        "Suggested routes: home, features, pricing, security, docs, contact.",
        "Suggested sections: hero, feature cards, product demo, testimonials, CTA rail.",
      ],
      links: [],
    },
    {
      id: "blueprint-creator",
      kind: "blueprint",
      section: "blueprints",
      title: "Creator / Streamer",
      subtitle:
        "Audience-focused site with media embeds, store, and live stream surface.",
      status: "foundation",
      description:
        "Blueprint for creators who need content hubs, monetization, and live engagement features.",
      badges: ["livestream", "store"],
      files: ["functions/siteGenerator.js", "admin/live-stream.html"],
      commands: ["Build me a creator website"],
      details: [
        "Suggested routes: home, media, livestream, store, memberships, contact.",
        "Suggested sections: hero, featured stream, merch, clips, CTA.",
      ],
      links: [],
    },
    {
      id: "blueprint-local-service",
      kind: "blueprint",
      section: "blueprints",
      title: "Local Service",
      subtitle:
        "Lead-generation site for contractors, consultants, and service teams.",
      status: "foundation",
      description:
        "Blueprint for plumbers, roofers, cleaners, and other service businesses focused on calls and forms.",
      badges: ["lead gen", "contact forms"],
      files: ["functions/siteGenerator.js", "AI_WOS_ARCHITECTURE.md"],
      commands: ["Build me a local service website"],
      details: [
        "Suggested routes: home, services, service-area, reviews, quote, contact.",
        "Suggested sections: hero, problem/solution, trust badges, reviews, CTA.",
      ],
      links: [],
    },
    {
      id: "theme-midnight",
      kind: "theme",
      section: "themes",
      title: "Midnight",
      subtitle: "High-contrast cinematic dark theme.",
      status: "live",
      description:
        "Premium dark surface built for SaaS-style pages with glow accents and glass UI.",
      badges: ["theme", "dark"],
      files: ["functions/orchestrator.js", "src/design-system.css"],
      commands: ["Change theme to midnight"],
      details: [
        "Best fit for premium product, AI, and cinematic brand presentations.",
      ],
      links: [],
    },
    {
      id: "theme-ocean",
      kind: "theme",
      section: "themes",
      title: "Ocean",
      subtitle: "Cool blue/cyan startup palette.",
      status: "live",
      description:
        "A cleaner blue-forward visual mode for modern SaaS and service sites.",
      badges: ["theme", "blue"],
      files: ["functions/orchestrator.js", "functions/siteGenerator.js"],
      commands: ["Change theme to ocean"],
      details: ["Pairs well with dashboards, fintech, and platform messaging."],
      links: [],
    },
    {
      id: "theme-ember",
      kind: "theme",
      section: "themes",
      title: "Ember",
      subtitle: "Warm high-energy contrast for offers and conversion pages.",
      status: "live",
      description:
        "A bold theme for launches, campaigns, and landing pages that need more urgency.",
      badges: ["theme", "warm"],
      files: ["functions/orchestrator.js"],
      commands: ["Change theme to ember"],
      details: ["Useful for high-intent landing pages and event promotion."],
      links: [],
    },
    {
      id: "theme-volt",
      kind: "theme",
      section: "themes",
      title: "Volt",
      subtitle: "Electric high-energy accent mode.",
      status: "live",
      description:
        "A sharper visual mode built for experimental product demos and app-heavy surfaces.",
      badges: ["theme", "electric"],
      files: ["functions/orchestrator.js"],
      commands: ["Change theme to volt"],
      details: [
        "Useful when the product should feel more technical or energetic.",
      ],
      links: [],
    },
    {
      id: "theme-neon",
      kind: "theme",
      section: "themes",
      title: "Neon",
      subtitle:
        "Requested future theme pack with stronger electric glow direction.",
      status: "planned",
      description:
        "Reserved for a more aggressive neon treatment beyond the current live theme set.",
      badges: ["future"],
      files: ["AI_WOS_ARCHITECTURE.md"],
      commands: ["Change theme to neon"],
      details: [
        "Documented as a next-pack direction; not currently a canonical execute theme.",
      ],
      links: [],
    },
    {
      id: "automation-blog",
      kind: "automation",
      section: "automation",
      title: "Blog Feed Autopilot",
      subtitle: "Scheduled blog post generation every 3 hours.",
      status: "live",
      description:
        "Generates and stores runtime blog feed updates on a recurring Cloudflare schedule.",
      badges: ["cron", "content"],
      files: ["functions/blogAutomation.js", "public/config/blog.json"],
      commands: ["Generate blog content"],
      details: ["Current schedule: `0 */3 * * *`."],
      links: [],
    },
    {
      id: "automation-audit",
      kind: "automation",
      section: "automation",
      title: "Environment And Governance Audits",
      subtitle: "Repeatable operational checks for env, links, and governance.",
      status: "live",
      description:
        "Uses repo verification and command-center audit routes to keep deployment assumptions and control-plane rules visible.",
      badges: ["audit", "ops"],
      files: ["scripts/verify.mjs", "functions/commandCenterApi.js"],
      commands: ["ops: run env audit", "ops: run governance check"],
      details: [
        "These checks are wired into the locked deploy path as well as admin tooling.",
      ],
      links: [],
    },
    {
      id: "automation-seo",
      kind: "automation",
      section: "automation",
      title: "SEO Improvement Autopilot",
      subtitle: "Planned recurring metadata and weak-copy improvement loop.",
      status: "foundation",
      description:
        "Designated slot for daily SEO enhancement tasks using the existing execute/orchestrator command surface.",
      badges: ["planned workflow"],
      files: ["AI_WOS_ARCHITECTURE.md"],
      commands: ["Improve SEO", "Rewrite weak headlines"],
      details: [
        "The execution primitives exist; recurring scheduling and scoring logic are still a next-phase build.",
      ],
      links: [],
    },
    {
      id: "automation-conversion",
      kind: "automation",
      section: "automation",
      title: "Conversion Variant Testing",
      subtitle: "Planned CTA and offer-variant experimentation loop.",
      status: "planned",
      description:
        "Reserved for future CTA variant generation, testing, and promotion decisions.",
      badges: ["future"],
      files: ["AI_WOS_ARCHITECTURE.md"],
      commands: ["Improve conversions", "Test CTA variants"],
      details: [
        "Not yet wired into the live product as an autonomous scheduled workflow.",
      ],
      links: [],
    },
    {
      id: "site-primary",
      kind: "site",
      section: "sites",
      title: "Primary Production Site",
      subtitle:
        "Public marketing, product, store, and blog experience at voicetowebsite.com.",
      status: "live",
      description:
        "Main public web surface that the AI command system currently operates in production.",
      badges: ["production", "public"],
      files: ["src/App.tsx", "worker.js"],
      commands: ["Update homepage", "Change store", "Deploy live"],
      details: [
        "This is the authoritative customer-facing surface for the current platform.",
      ],
      links: [
        { label: "Home", href: "/" },
        { label: "Store", href: "/store" },
      ],
    },
    {
      id: "site-admin",
      kind: "site",
      section: "sites",
      title: "Admin Operating Surface",
      subtitle:
        "Protected mission control, analytics, store, and voice command tooling.",
      status: "live",
      description:
        "Operator interface for monitoring, content inventory, store management, analytics, and voice-driven commands.",
      badges: ["admin", "protected"],
      files: ["src/admin-dashboard/App.tsx", "admin/integrated-dashboard.html"],
      commands: ["Inspect inventory", "Run voice commands", "Review analytics"],
      details: ["Protected by access code and signed admin session cookie."],
      links: [{ label: "Mission Control", href: "/admin/mission" }],
    },
    {
      id: "site-generated-workspace",
      kind: "site",
      section: "sites",
      title: "Generated Site Workspace",
      subtitle:
        "Persisted generated layouts and assets for future multi-site expansion.",
      status: "foundation",
      description:
        "Generation workspace that captures site output and assets without yet exposing full self-serve tenant provisioning.",
      badges: ["generation", "foundation"],
      files: ["functions/siteGenerator.js"],
      commands: ["Generate a site workspace"],
      details: [
        "Backed by `sites` and `site_assets` tables when D1 is configured.",
      ],
      links: [],
    },
    {
      id: "security-orchestrator-token",
      kind: "security",
      section: "security",
      title: "Orchestrator Token Gate",
      subtitle: orchReady
        ? "Configured for external action callers."
        : "Missing production secret for external action callers.",
      status: orchReady ? "live" : "foundation",
      description:
        "Custom GPT and other remote callers authenticate to the execute surface with `x-orch-token`.",
      badges: ["x-orch-token"],
      files: ["functions/execute.js", "CUSTOM_GPT_SETUP.md"],
      commands: ["Check execute auth"],
      details: [
        "Set `ORCH_TOKEN` in Worker secrets and mirror it in Custom GPT Action auth.",
      ],
      links: [{ label: "Capabilities", href: "/api/capabilities" }],
    },
    {
      id: "security-admin-cookie",
      kind: "security",
      section: "security",
      title: "Admin Session Cookie",
      subtitle: "Signed cookie access for protected dashboard APIs.",
      status: "live",
      description:
        "Browser-based admin flows use an access code / control password and a signed `vtw_admin` cookie.",
      badges: ["admin auth", "cookie"],
      files: ["functions/adminAuth.js", "admin/access.html"],
      commands: ["Login to admin"],
      details: [
        "Protected APIs validate the cookie before serving dashboard data.",
      ],
      links: [{ label: "Admin Access", href: "/admin/access" }],
    },
    {
      id: "security-validation",
      kind: "security",
      section: "security",
      title: "Validation And Idempotency",
      subtitle: "Schema checks, rate limiting, and confirm-token protections.",
      status: "live",
      description:
        "Protects execute requests with validation, rate limits, token confirmation for sensitive actions, and event logging.",
      badges: ["schema", "rate limit", "confirmToken"],
      files: [
        "functions/schema-validator.js",
        "functions/rate-limiter.js",
        "functions/execute.js",
      ],
      commands: ["Preview change", "Apply change", "Rollback change"],
      details: [
        "High-risk operations require confirmation tokens or confirmation phrases.",
      ],
      links: [],
    },
    {
      id: "deployment-locked-path",
      kind: "deployment",
      section: "deployment",
      title: "Locked Production Deploy Path",
      subtitle: "Verify first, then ship and deploy from main only.",
      status: "live",
      description:
        "The production release path is fixed to `npm run deploy:live` with Node 20 and Wrangler.",
      badges: ["main", "wrangler", "verify"],
      files: ["AGENTS.md", "scripts/deploy-unified.mjs", "wrangler.toml"],
      commands: ["Deploy live", "Verify", "Rollback"],
      details: [
        "Source of truth is Cloudflare Workers + Wrangler.",
        "No alternate branch or deployment platform is allowed by default.",
      ],
      links: [],
    },
    {
      id: "deployment-auto-trigger",
      kind: "deployment",
      section: "deployment",
      title: "Execute-To-Deploy Trigger",
      subtitle: autoDeployReady
        ? "Deployment trigger path is available."
        : "Enable deploy hook or Workers Builds auto-deploy for one-call live execution.",
      status: autoDeployReady ? "live" : "foundation",
      description:
        "External command execution can queue live deployment when a deploy hook or Workers Builds trigger is configured.",
      badges: ["deploy hook", "workers builds"],
      files: ["functions/orchestrator.js", "CUSTOM_GPT_SETUP.md"],
      commands: ["ops: deploy now"],
      details: [
        "Set `CF_DEPLOY_HOOK_URL` or `CF_WORKERS_BUILDS_AUTO_DEPLOY=1` to guarantee live deployment from execute flows.",
      ],
      links: [],
    },
    {
      id: "docs-custom-gpt",
      kind: "doc",
      section: "docs",
      title: "Custom GPT Execute Setup",
      subtitle: "Action schema, auth header, and one-call auto mode.",
      status: "live",
      description:
        "Defines the production OpenAPI schema and action instructions for Custom GPT integrations.",
      badges: ["OpenAPI", "Custom GPT"],
      files: [
        "ops/contracts/openapi.execute.json",
        "CUSTOM_GPT_SETUP.md",
        "CUSTOM_GPT_INSTRUCTIONS_CLEAN.txt",
      ],
      commands: ["Connect a Custom GPT"],
      details: [
        "This is the canonical setup for external AI operators on this repo.",
      ],
      links: [],
    },
    {
      id: "docs-dashboard",
      kind: "doc",
      section: "docs",
      title: "Dashboard Wiring",
      subtitle: "Protected admin surfaces and API map.",
      status: "live",
      description:
        "Maps dashboard modules to the Worker endpoints they require so the control plane stays inspectable.",
      badges: ["dashboard", "api map"],
      files: ["admin/DASHBOARD_WIRING.md"],
      commands: ["Review admin wiring"],
      details: [
        "Covers mission control, analytics, store, media, live manager, and voice command center.",
      ],
      links: [],
    },
    {
      id: "docs-ai-wos",
      kind: "doc",
      section: "docs",
      title: "AI-WOS Architecture Blueprint",
      subtitle:
        "This platform layer translated into the current Cloudflare stack.",
      status: "live",
      description:
        "Explains how the AI Website Operating System model maps onto the repo’s existing runtime, command system, and deployment policy.",
      badges: ["architecture", "blueprint"],
      files: ["AI_WOS_ARCHITECTURE.md"],
      commands: ["Review AI-WOS architecture"],
      details: [
        "Keeps the architecture honest about which capabilities are live, foundation, or planned.",
      ],
      links: [],
    },
  ];
};

const buildSections = (items) =>
  SECTION_DEFINITIONS.map((section) => ({
    ...section,
    itemCount: items.filter((item) => item.section === section.id).length,
  }));

const countCommands = (items) =>
  items.reduce((count, item) => count + (item.commands?.length || 0), 0);

export const getAiWosManifest = (env = {}) => {
  const items = buildItems(env);
  const sections = buildSections(items);
  const liveItems = items.filter((item) => item.status === "live").length;
  const foundationItems = items.filter(
    (item) => item.status === "foundation"
  ).length;
  const plannedItems = items.filter((item) => item.status === "planned").length;
  const blueprintCount = items.filter(
    (item) => item.kind === "blueprint"
  ).length;
  const themeCount = items.filter((item) => item.kind === "theme").length;
  const automationCount = items.filter(
    (item) => item.kind === "automation"
  ).length;

  return {
    generatedAt: new Date().toISOString(),
    product: PRODUCT,
    summary: {
      totalItems: items.length,
      liveItems,
      foundationItems,
      plannedItems,
      commandCount: countCommands(items),
      blueprintCount,
      themeCount,
      automationCount,
      recommendations: [
        "Route most customer-editable copy through runtime JSON or manifest-backed sources so AI changes remain deterministic.",
        'Use `action: "auto"` for normal site changes and reserve preview/apply/deploy for risky structural work.',
        "Keep `ORCH_TOKEN` and a live deploy trigger configured so external AI operators can execute safely end to end.",
      ],
    },
    sections,
    items,
  };
};

export const getAiWosCapabilitySummary = (env = {}) => {
  const manifest = getAiWosManifest(env);
  return {
    name: PRODUCT.shortName,
    version: PRODUCT.version,
    manifestEndpoint: "/api/ai-wos/manifest",
    adminManifestEndpoint: "/api/admin/ai-wos/manifest",
    runtime: PRODUCT.runtime,
    commandEndpoint: PRODUCT.commandEndpoint,
    totals: {
      items: manifest.summary.totalItems,
      live: manifest.summary.liveItems,
      foundation: manifest.summary.foundationItems,
      planned: manifest.summary.plannedItems,
      blueprints: manifest.summary.blueprintCount,
      themes: manifest.summary.themeCount,
      automation: manifest.summary.automationCount,
    },
  };
};
