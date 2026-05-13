const DEFAULT_SITE_TITLE =
  "VoiceToWebsite | AI Website Builder, SEO, Storefront, and Automation";
const DEFAULT_SITE_DESCRIPTION =
  "VoiceToWebsite helps you launch AI-assisted websites with strong SEO structure, trust pages, monetization, and admin control from one system.";

/** @typedef {{ href: string, label: string, description: string, fullReload?: boolean }} FooterLink */
/** @typedef {{ id: string, title: string, description: string, links: FooterLink[] }} FooterGroup */

/** @type {FooterGroup[]} */
export const SITE_FOOTER_GROUPS = [
  {
    id: "core",
    title: "Core Pages",
    description:
      "Primary conversion and decision pages that explain the product clearly.",
    links: [
      {
        href: "/",
        label: "Home",
        description:
          "Main entry point for the AI website builder, pricing path, and launch workflow.",
      },
      {
        href: "/features",
        label: "Features",
        description:
          "Product capabilities, generation flow, and publishing controls.",
      },
      {
        href: "/pricing",
        label: "Pricing",
        description: "Plans, commercial positioning, and buying options.",
      },
      {
        href: "/demo",
        label: "Demo",
        description: "Hands-on preview of the voice-to-website experience.",
      },
      {
        href: "/how-it-works",
        label: "How It Works",
        description:
          "Step-by-step overview of generation, preview, and deploy.",
      },
      {
        href: "/store",
        label: "Store",
        description: "Checkout-ready page for plans, add-ons, and paid offers.",
      },
      {
        href: "/appstore",
        label: "App Store",
        description:
          "Extension and app discovery surface for the product ecosystem.",
      },
    ],
  },
  {
    id: "trust",
    title: "Support And Trust",
    description:
      "Trust, compliance, contact, and support routes that help with SEO and ad readiness.",
    links: [
      {
        href: "/about",
        label: "About",
        description: "Company story, mission, and product positioning.",
      },
      {
        href: "/contact",
        label: "Contact",
        description:
          "Direct contact surface for leads, support, and partnerships.",
      },
      {
        href: "/support",
        label: "Support",
        description: "Help resources and escalation paths.",
      },
      {
        href: "/trust",
        label: "Trust Center",
        description: "Security, availability, and operational trust content.",
      },
      {
        href: "/status",
        label: "Status",
        description: "Service health and operational updates.",
      },
      {
        href: "/privacy",
        label: "Privacy",
        description: "Privacy practices and user data handling details.",
      },
      {
        href: "/terms",
        label: "Terms",
        description: "Terms of service and platform usage rules.",
      },
      {
        href: "/legal",
        label: "Legal",
        description: "Legal information and policy index.",
      },
      {
        href: "/license",
        label: "License",
        description: "Ownership, licensing, and transfer details.",
      },
      {
        href: "/copyrights",
        label: "Copyrights",
        description: "Copyright and intellectual property notices.",
      },
    ],
  },
  {
    id: "content",
    title: "Content And Discovery",
    description:
      "Pages that expand topical authority, internal linking depth, and crawl coverage.",
    links: [
      {
        href: "/blog",
        label: "Blog",
        description:
          "Auto-refreshed blog feed for search coverage and product education.",
      },
      {
        href: "/gallery",
        label: "Gallery",
        description: "Showcase content and examples built with the platform.",
      },
      {
        href: "/templates",
        label: "Templates",
        description:
          "Template catalog for faster launches and internal linking.",
      },
      {
        href: "/partners",
        label: "Partners",
        description: "Integration and partner-facing content.",
      },
      {
        href: "/referrals",
        label: "Referrals",
        description: "Referral program information and growth content.",
      },
      {
        href: "/projects",
        label: "Projects",
        description: "Case studies, projects, and implementation examples.",
      },
      {
        href: "/search",
        label: "Search",
        description: "Site discovery surface for docs, pages, and guides.",
      },
      {
        href: "/livestream",
        label: "Livestream",
        description: "Events, demos, and live audience programming.",
      },
    ],
  },
  {
    id: "archive",
    title: "Archive And Experiments",
    description:
      "Lower-priority and experimental pages collected in one structured archive instead of the main navigation.",
    links: [
      {
        href: "/studio3000",
        label: "Studio3000",
        description: "Creative studio and product lab page.",
      },
      {
        href: "/the3000",
        label: "The3000",
        description: "Collective and organization background page.",
      },
      {
        href: "/webforge",
        label: "Webforge",
        description: "Browser-based builder and experimentation page.",
      },
      {
        href: "/cursor-demo",
        label: "Cursor Demo",
        description: "Editor integration and demonstration content.",
      },
      {
        href: "/sandbox",
        label: "Sandbox",
        description: "Safe preview and testing environment page.",
      },
      {
        href: "/api-documentation",
        label: "API Documentation",
        description: "Developer integration docs and endpoint overview.",
      },
      {
        href: "/neural-engine",
        label: "Neural Engine",
        description: "AI generation and orchestration explainer page.",
      },
      {
        href: "/strata-design-system",
        label: "Strata Design System",
        description: "Design system and interface standards page.",
      },
      {
        href: "/lexicon-pro",
        label: "Lexicon Pro",
        description: "Intent and vocabulary modeling page.",
      },
      {
        href: "/voice-to-json",
        label: "Voice To JSON",
        description: "Structured voice-to-data workflow page.",
      },
      {
        href: "/geological-studies",
        label: "Geological Studies",
        description: "Specialized research and archive content.",
      },
      {
        href: "/project-planning-hub.html",
        label: "Project Planning Hub",
        description: "Legacy planning tool page kept in the footer archive.",
        fullReload: true,
      },
      {
        href: "/rush-percussion.html",
        label: "Rush Percussion",
        description:
          "Legacy static experience page kept outside primary navigation.",
        fullReload: true,
      },
    ],
  },
];

const SEO_PAGE_OVERRIDES = {
  "/": {
    title: DEFAULT_SITE_TITLE,
    description:
      "Launch AI-assisted websites with built-in SEO structure, checkout, trust pages, and Cloudflare-powered deployment from VoiceToWebsite.",
  },
  "/blog": {
    title: "VoiceToWebsite Blog | SEO, Automation, And Deployment Guides",
    description:
      "Read VoiceToWebsite guides on SEO structure, website automation, conversion pages, trust content, and Cloudflare deployment workflows.",
  },
  "/rush-percussion": {
    title: "Rush Percussion | VoiceToWebsite Interactive Demo",
    description:
      "Rush Percussion is an interactive demo experience published through the VoiceToWebsite platform.",
  },
};

const SEO_ROUTE_ALIASES = {
  "/features-enhanced": "/features",
  "/pricing-enhanced": "/pricing",
  "/contact-enhanced": "/contact",
  "/search-enhanced": "/search",
  "/index": "/",
  "/blog.html": "/blog",
};

const buildDefaultPageTitle = (label) => `${label} | VoiceToWebsite`;

const allSeoEntries = SITE_FOOTER_GROUPS.flatMap((group) =>
  group.links
    .filter((link) => !link.fullReload)
    .map((link) => [
      link.href,
      {
        title: buildDefaultPageTitle(link.label),
        description: link.description,
      },
    ])
);

export const SITE_SEO_BY_PATH = {
  ...Object.fromEntries(allSeoEntries),
  ...SEO_PAGE_OVERRIDES,
};

export const SITE_SEO_PATHS = new Set(Object.keys(SITE_SEO_BY_PATH));

export const normalizeSeoPath = (path) => {
  const normalized =
    String(path || "/")
      .trim()
      .replace(/\/+$/, "") || "/";
  return SEO_ROUTE_ALIASES[normalized] || normalized;
};

export const getSeoCopyForPath = (path) =>
  SITE_SEO_BY_PATH[normalizeSeoPath(path)] || {
    title: DEFAULT_SITE_TITLE,
    description: DEFAULT_SITE_DESCRIPTION,
  };

export const buildDocumentTitle = (pageTitle) => {
  const cleanTitle = String(pageTitle || "").trim();
  if (!cleanTitle) return DEFAULT_SITE_TITLE;
  return cleanTitle.includes("VoiceToWebsite")
    ? cleanTitle
    : `${cleanTitle} | VoiceToWebsite`;
};

export const DEFAULT_SEO_DESCRIPTION = DEFAULT_SITE_DESCRIPTION;
