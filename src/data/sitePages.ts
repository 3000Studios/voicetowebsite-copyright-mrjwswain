import { ContentPageConfig } from "../pages/ContentPage";

const BASE_IMG = "https://images.unsplash.com";
const YT = "https://www.youtube.com/embed/";
// Free relevant videos per topic (public YouTube embeds)
const VID = {
  about: "T2M8hxJfWLA", // Future of work / teams
  features: "UB1O30fR-EE", // Web development overview
  howItWorks: "Rs_rAxEsAvI", // How the Internet works
  demo: "yfoY3QX5OIk", // Web tech in 100 seconds
  pricing: "kIdWeBSEeWU", // Payments / Stripe
  blog: "2DTrkD0Ffzk", // How the web works
  contact: "h8K49dD52WA", // Communication
  support: "Lk3jP2nGs_s", // Customer experience
  privacy: "I4a8A2FsmHQ", // Data privacy
  terms: "8o3e6s-xb6s", // Legal basics
  trust: "9LmdxP1gVEo", // Trust & security
  status: "dH0yz-Osy54", // Cloud computing
  gallery: "n2aH4RUtYho", // Design / creativity
  templates: "Wm6CUgyLu94", // Templates / design
  partners: "FlsY5T-TGMI", // Partnerships
  careers: "T2M8hxJfWLA", // Future of work
  press: "Lk3jP2nGs_s", // Media
  legal: "8o3e6s-xb6s", // Legal
  license: "kIdWeBSEeWU", // Licensing
  referrals: "FlsY5T-TGMI", // Referrals / growth
  copyrights: "8o3e6s-xb6s", // Copyright
  apiDocs: "8pDqJVdNa44", // APIs explained
  neural: "mSTCzNgDJyY", // AI explained
  designSystem: "Wm6CUgyLu94", // Design systems
  lexicon: "mSTCzNgDJyY", // AI / NLP
  voiceToJson: "mSTCzNgDJyY", // Voice / AI
  geological: "uYH8X2n5tsU", // Science / earth
  livestream: "n2aH4RUtYho", // Live / streaming
  search: "8pDqJVdNa44", // Search / tech
  projects: "UB1O30fR-EE", // Projects
  the3000: "T2M8hxJfWLA", // Team / culture
  studio3000: "n2aH4RUtYho", // Studio / creative
  webforge: "UB1O30fR-EE", // Building / dev
  cursorDemo: "8pDqJVdNa44", // Dev tools
  sandbox: "yfoY3QX5OIk", // Dev / sandbox
  store: "kIdWeBSEeWU", // E‑commerce
  appstore: "Wm6CUgyLu94", // Apps / design
} as const;
const videoUrl = (id: string) => `${YT}${id}?autoplay=0`;

export const SITE_PAGES: Record<string, ContentPageConfig> = {
  about: {
    title: "About VoiceToWebsite",
    subtitle: "We build the future of autonomous web engineering.",
    wallpaper: "about",
    imageUrl: `${BASE_IMG}/photo-1522071820081-009f0129c71c?w=800&q=80`,
    imageAlt: "Team collaboration and innovation",
    videoUrl: videoUrl(VID.about),
    videoTitle: "VoiceToWebsite overview",
    paragraphs: [
      "VoiceToWebsite turns spoken intent into performant, deployable sites. Our mission is to make autonomous engineering accessible to every creator by wrapping complex infrastructure—Cloudflare Workers, Stripe/PayPal, SEO, analytics—into a simple conversational flow.",
      "We believe the best digital work is a blend of voice, automation, and expert stewardship. Codex, Gemini, and human reviewers orchestrate design, tests, and deployment while you stay focused on the big idea.",
      "We ship updates daily, log every action, and guard production with a safety-first rollback plan so teams can experiment fearlessly.",
    ],
    cards: [
      {
        title: "Mission",
        body: "Democratize autonomous web engineering and one-click deployment.",
      },
      {
        title: "Vision",
        body: "Every creator can ship production sites from voice and intent.",
      },
      {
        title: "Values",
        body: "Safety first, transparency, and measurable outcomes.",
      },
    ],
  },
  features: {
    title: "Features",
    subtitle: "Everything you need to build, deploy, and monetize from voice.",
    wallpaper: "features",
    imageUrl: `${BASE_IMG}/photo-1551434678-e076c223a692?w=800&q=80`,
    imageAlt: "Development and feature building",
    videoUrl: videoUrl(VID.features),
    videoTitle: "Features walkthrough",
    paragraphs: [
      "Voice-to-page architecture maps user intent to pages, sections, metadata, and conversion targets while preserving responsive structure. Intent parsing chooses page and section strategy; preview-first publishing protects production quality.",
      "AdSense readiness is built in: we keep a clear separation between editorial content and ads, mark all ad zones, and keep navigational trust pages easy to discover. Revenue actions are evaluated alongside user experience signals.",
    ],
    cards: [
      {
        title: "Voice-to-page",
        body: "Intent parsing, section strategy, and mobile-first blocks.",
      },
      {
        title: "Ad-ready",
        body: "Labeled ad blocks, policy pages, and density controls.",
      },
      {
        title: "Monetization",
        body: "Stripe, PayPal, and analytics-backed iteration.",
      },
    ],
  },
  "how-it-works": {
    title: "How It Works",
    subtitle: "From voice command to live site in minutes.",
    wallpaper: "how-it-works",
    imageUrl: `${BASE_IMG}/photo-1516321318423-f06f85e504b3?w=800&q=80`,
    imageAlt: "Workflow and process",
    videoUrl: videoUrl(VID.howItWorks),
    videoTitle: "How it works demo",
    paragraphs: [
      "You speak your intent—a landing page, a store, a blog—and our pipeline parses it, generates structure and copy, applies a design system, and runs tests. Preview first, then publish when you're ready.",
      "Cloudflare Workers run at the edge for low latency. D1, KV, and R2 power persistence and media. Every action is logged and reversible.",
    ],
    cards: [
      {
        title: "1. Speak",
        body: "Describe your site or change in plain language.",
      },
      {
        title: "2. Preview",
        body: "Review the generated site before it goes live.",
      },
      {
        title: "3. Publish",
        body: "Deploy with one click; rollback if needed.",
      },
    ],
  },
  demo: {
    title: "Demo",
    subtitle: "Try the voice-to-website flow yourself.",
    wallpaper: "demo",
    imageUrl: `${BASE_IMG}/photo-1591115765373-5207764f72e7?w=800&q=80`,
    imageAlt: "Demo and trial",
    videoUrl: videoUrl(VID.demo),
    videoTitle: "Demo video",
    paragraphs: [
      "The demo lets you run a full voice build: speak a prompt, confirm, and watch the system generate a preview. You can iterate on the result or publish when satisfied.",
      "Head to the home page and use the main voice CTA to start a build. No signup required for the demo flow.",
    ],
  },
  pricing: {
    title: "Pricing",
    subtitle: "Clear tiers for every stage of your project.",
    wallpaper: "pricing",
    imageUrl: `${BASE_IMG}/photo-1554224155-6726b3ff858f?w=800&q=80`,
    imageAlt: "Pricing and value",
    videoUrl: videoUrl(VID.pricing),
    videoTitle: "Pricing overview",
    paragraphs: [
      "Solo tier gives you one page, custom domain, SSL, and basic SEO. Business adds advanced analytics, priority support, and API access. Enterprise unlocks white-label options, dedicated support, and SLA guarantees.",
      "All tiers include Cloudflare-backed deployment, preview-first workflow, and checkout so you can sell your products.",
    ],
    cards: [
      { title: "Solo", body: "1 page, custom domain, SSL, basic SEO — $49." },
      {
        title: "Business",
        body: "5 pages, analytics, API, priority support — $199.",
      },
      {
        title: "Enterprise",
        body: "Unlimited pages, white-label, SLA — $499.",
      },
    ],
  },
  blog: {
    title: "Blog",
    subtitle: "Updates, tutorials, and ideas from the VoiceToWebsite team.",
    wallpaper: "blog",
    imageUrl: `${BASE_IMG}/photo-1499750310107-5fef28a66643?w=800&q=80`,
    imageAlt: "Blog and content",
    videoUrl: videoUrl(VID.blog),
    videoTitle: "Latest updates",
    paragraphs: [
      "We write about voice-driven development, autonomous deployment, and how to get the most out of VoiceToWebsite. New posts are added regularly.",
      "Topics include AdSense readiness, Cloudflare Workers tips, Stripe and PayPal integration, and real-world case studies.",
    ],
  },
  contact: {
    title: "Contact",
    subtitle: "Get in touch for support, partnerships, or feedback.",
    wallpaper: "contact",
    imageUrl: `${BASE_IMG}/photo-1423666639041-f56000c27a9a?w=800&q=80`,
    imageAlt: "Contact and communication",
    videoUrl: videoUrl(VID.contact),
    videoTitle: "Contact info",
    paragraphs: [
      "For general inquiries, support, or partnership opportunities, reach out via the channels listed on this page. We aim to respond within one business day.",
      "Include your use case and any relevant details so we can route your message to the right team.",
    ],
    cards: [
      {
        title: "Support",
        body: "support@voicetowebsite.com for product help.",
      },
      {
        title: "Partnerships",
        body: "partners@voicetowebsite.com for business inquiries.",
      },
      {
        title: "Feedback",
        body: "We read every message and use it to improve.",
      },
    ],
  },
  support: {
    title: "Support",
    subtitle: "Help and resources when you need them.",
    wallpaper: "support",
    imageUrl: `${BASE_IMG}/photo-1587563871167-1a67a6733f7d?w=800&q=80`,
    imageAlt: "Support and help",
    videoUrl: videoUrl(VID.support),
    videoTitle: "Support overview",
    paragraphs: [
      "Our support team is available to help with setup, deployment, and troubleshooting. Check the documentation and FAQ first; then contact us if you're stuck.",
      "Business and Enterprise tiers include priority support and faster response times.",
    ],
  },
  privacy: {
    title: "Privacy Policy",
    subtitle: "How we collect, use, and protect your data.",
    wallpaper: "privacy",
    imageUrl: `${BASE_IMG}/photo-1563986768609-322dc135aaca?w=800&q=80`,
    imageAlt: "Privacy and security",
    videoUrl: videoUrl(VID.privacy),
    videoTitle: "Privacy overview",
    paragraphs: [
      "We collect only what is necessary to provide the service: account data, usage metrics, and payment information. We do not sell your personal data. Data is stored securely and processed in line with applicable privacy laws.",
      "You can request access, correction, or deletion of your data by contacting us. Our full privacy policy is available on request and is updated as our practices change.",
    ],
  },
  terms: {
    title: "Terms of Service",
    subtitle: "Rules of use for VoiceToWebsite.",
    wallpaper: "terms",
    imageUrl: `${BASE_IMG}/photo-1507003211169-0a1dd7228f2d?w=800&q=80`,
    imageAlt: "Terms and agreement",
    videoUrl: videoUrl(VID.terms),
    videoTitle: "Terms overview",
    paragraphs: [
      "By using VoiceToWebsite you agree to use the service lawfully, not to abuse or overload our systems, and to comply with our acceptable use policy. We reserve the right to suspend or terminate accounts that violate these terms.",
      'We provide the service "as is" and are not liable for indirect or consequential damages. Limitation of liability is set out in the full terms.',
    ],
  },
  trust: {
    title: "Trust Center",
    subtitle: "Security, compliance, and transparency.",
    wallpaper: "trust",
    imageUrl: `${BASE_IMG}/photo-1563013544-824ae1b704d3?w=800&q=80`,
    imageAlt: "Trust and security",
    videoUrl: videoUrl(VID.trust),
    videoTitle: "Trust center",
    paragraphs: [
      "We take security seriously. Infrastructure runs on Cloudflare; data is encrypted in transit and at rest. We follow best practices for access control, logging, and incident response.",
      "Our trust center documents our approach to availability, privacy, and compliance so you can assess us for your use case.",
    ],
  },
  status: {
    title: "Status",
    subtitle: "Service availability and incidents.",
    wallpaper: "status",
    imageUrl: `${BASE_IMG}/photo-1551288049-bebda4e38f71?w=800&q=80`,
    imageAlt: "Status and uptime",
    videoUrl: videoUrl(VID.status),
    videoTitle: "Status overview",
    paragraphs: [
      "VoiceToWebsite runs on Cloudflare's global network for high availability. We post updates here and via status pages when there are incidents or planned maintenance.",
      "For real-time status, check Cloudflare's status page and our own status dashboard when available.",
    ],
  },
  gallery: {
    title: "Gallery",
    subtitle: "Sites and experiences built with VoiceToWebsite.",
    wallpaper: "gallery",
    imageUrl: `${BASE_IMG}/photo-1467232004584-a241de8bcf5d?w=800&q=80`,
    imageAlt: "Gallery of projects",
    videoUrl: videoUrl(VID.gallery),
    videoTitle: "Gallery showcase",
    paragraphs: [
      "Browse examples of landing pages, stores, and blogs created with VoiceToWebsite. Each example is built from voice commands and can be customized further.",
      "Use these as inspiration for your own builds or as starting templates.",
    ],
  },
  templates: {
    title: "Templates",
    subtitle: "Ready-made layouts and themes.",
    wallpaper: "templates",
    imageUrl: `${BASE_IMG}/photo-1558655146-d09347e92766?w=800&q=80`,
    imageAlt: "Templates and themes",
    videoUrl: videoUrl(VID.templates),
    videoTitle: "Templates overview",
    paragraphs: [
      "Choose from a set of responsive templates for landing pages, portfolios, and stores. Each template is optimized for performance and AdSense-ready structure.",
      "Templates can be applied during the voice build or switched later from the command center.",
    ],
  },
  partners: {
    title: "Partners",
    subtitle: "Integrations and partner ecosystem.",
    wallpaper: "partners",
    imageUrl: `${BASE_IMG}/photo-1522071820081-009f0129c71c?w=800&q=80`,
    imageAlt: "Partners and integrations",
    videoUrl: videoUrl(VID.partners),
    videoTitle: "Partners",
    paragraphs: [
      "We integrate with Cloudflare, Stripe, PayPal, and major ad networks. Partner with us to offer VoiceToWebsite to your clients or to build on our API.",
      "Contact our partnerships team for technical and commercial details.",
    ],
  },
  careers: {
    title: "Careers",
    subtitle: "Join the VoiceToWebsite team.",
    wallpaper: "careers",
    imageUrl: `${BASE_IMG}/photo-1523240795612-9a054b0db644?w=800&q=80`,
    imageAlt: "Careers and team",
    videoUrl: videoUrl(VID.careers),
    videoTitle: "Careers",
    paragraphs: [
      "We're a small team focused on autonomous web engineering and developer experience. If you're excited about voice-driven development and edge computing, we'd like to hear from you.",
      "Open roles are posted here and on our job board. We're fully remote and value async communication and ownership.",
    ],
  },
  press: {
    title: "Press",
    subtitle: "News, press kit, and media contacts.",
    wallpaper: "press",
    imageUrl: `${BASE_IMG}/photo-1504711434969-e33886168f5c?w=800&q=80`,
    imageAlt: "Press and media",
    videoUrl: videoUrl(VID.press),
    videoTitle: "Press",
    paragraphs: [
      "For press inquiries, logos, and approved messaging, contact our press team. We're happy to provide interviews, quotes, and technical background.",
      "VoiceToWebsite is built by 3000 Studios. All press releases and updates are linked from this page.",
    ],
  },
  legal: {
    title: "Legal",
    subtitle: "Policies and legal information.",
    wallpaper: "legal",
    imageUrl: `${BASE_IMG}/photo-1589829545856-d10d557cf95f?w=800&q=80`,
    imageAlt: "Legal",
    videoUrl: videoUrl(VID.legal),
    videoTitle: "Legal",
    paragraphs: [
      "This section links to our Terms of Service, Privacy Policy, and other legal documents. By using VoiceToWebsite you agree to these terms.",
    ],
  },
  license: {
    title: "License & Ownership",
    subtitle: "Claim ownership of your generated sites.",
    wallpaper: "license",
    imageUrl: `${BASE_IMG}/photo-1450101499163-c8848c66ca85?w=800&q=80`,
    imageAlt: "License",
    videoUrl: videoUrl(VID.license),
    videoTitle: "License",
    paragraphs: [
      "When you publish a site with VoiceToWebsite, you retain ownership of the content you provide. Our platform license covers use of the generator and deployment services. For full ownership transfer and custom terms, contact sales.",
    ],
  },
  referrals: {
    title: "Referrals",
    subtitle: "Refer friends and earn rewards.",
    wallpaper: "referrals",
    imageUrl: `${BASE_IMG}/photo-1556742049-0cfed4f6a45d?w=800&q=80`,
    imageAlt: "Referrals",
    videoUrl: videoUrl(VID.referrals),
    videoTitle: "Referrals",
    paragraphs: [
      "Share VoiceToWebsite with your network and earn credits or rewards when they sign up and subscribe. Your referral link is available in your account dashboard.",
    ],
  },
  copyrights: {
    title: "Copyrights",
    subtitle: "Copyright and IP information.",
    wallpaper: "copyrights",
    imageUrl: `${BASE_IMG}/photo-1475721027785-f74eccf877e2?w=800&q=80`,
    imageAlt: "Copyrights",
    videoUrl: videoUrl(VID.copyrights),
    videoTitle: "Copyrights",
    paragraphs: [
      "VoiceToWebsite and its branding are © 3000 Studios. User-generated content remains the property of the user. We respond to valid DMCA and IP notices as required by law.",
    ],
  },
  "api-documentation": {
    title: "API Documentation",
    subtitle: "Integrate with VoiceToWebsite programmatically.",
    wallpaper: "api-docs",
    imageUrl: `${BASE_IMG}/photo-1555066931-4365d14bab8c?w=800&q=80`,
    imageAlt: "API and code",
    videoUrl: videoUrl(VID.apiDocs),
    videoTitle: "API docs",
    paragraphs: [
      "Our API lets you trigger builds, manage sites, and read analytics. Authenticate with an API key from the command center. Endpoints are RESTful and return JSON.",
      "Rate limits and usage are documented per endpoint. For high-volume or custom needs, contact us.",
    ],
    cards: [
      { title: "Generate", body: "POST /api/generate — start a voice build." },
      { title: "Preview", body: "GET /api/preview — fetch preview URL." },
      { title: "Publish", body: "POST /api/publish — deploy to production." },
    ],
  },
  "neural-engine": {
    title: "Neural Engine",
    subtitle: "AI-powered generation and orchestration.",
    wallpaper: "neural-engine",
    imageUrl: `${BASE_IMG}/photo-1677442136019-21780ecad995?w=800&q=80`,
    imageAlt: "AI and neural",
    videoUrl: videoUrl(VID.neural),
    videoTitle: "Neural engine",
    paragraphs: [
      "The neural engine powers intent parsing, content generation, and layout decisions. It combines large-language models with rule-based pipelines for reliability and policy compliance.",
    ],
  },
  "strata-design-system": {
    title: "Strata Design System",
    subtitle: "Consistent, accessible components and patterns.",
    wallpaper: "design-system",
    imageUrl: `${BASE_IMG}/photo-1561070791-2526d31fe5dc?w=800&q=80`,
    imageAlt: "Design system",
    videoUrl: videoUrl(VID.designSystem),
    videoTitle: "Design system",
    paragraphs: [
      "Strata is our internal design system: typography, spacing, colors, and components. All generated sites use Strata for consistency and accessibility.",
    ],
  },
  "lexicon-pro": {
    title: "Lexicon Pro",
    subtitle: "Vocabulary and intent expansion.",
    wallpaper: "lexicon",
    imageUrl: `${BASE_IMG}/photo-1516116216624-53e697fedbea?w=800&q=80`,
    imageAlt: "Lexicon",
    videoUrl: videoUrl(VID.lexicon),
    videoTitle: "Lexicon Pro",
    paragraphs: [
      "Lexicon Pro extends the vocabulary and intent models used by the voice pipeline. Custom terms and entities improve recognition for your domain.",
    ],
  },
  "voice-to-json": {
    title: "Voice to JSON",
    subtitle: "Structured output from voice input.",
    wallpaper: "voice-to-json",
    imageUrl: `${BASE_IMG}/photo-1544197158-b65472ed7bb5?w=800&q=80`,
    imageAlt: "Voice to JSON",
    videoUrl: videoUrl(VID.voiceToJson),
    videoTitle: "Voice to JSON",
    paragraphs: [
      "Voice to JSON turns spoken or typed commands into structured data (JSON) for forms, APIs, and automation. Use it standalone or inside the full build pipeline.",
    ],
  },
  "geological-studies": {
    title: "Geological Studies",
    subtitle: "Specialized content and research.",
    wallpaper: "geological",
    imageUrl: `${BASE_IMG}/photo-1611273426858-450d8e3c9fce?w=800&q=80`,
    imageAlt: "Geological studies",
    videoUrl: videoUrl(VID.geological),
    videoTitle: "Geological studies",
    paragraphs: [
      "Dedicated space for geological and earth-science content. Part of our broader content and research initiatives.",
    ],
  },
  livestream: {
    title: "Livestream",
    subtitle: "Watch live builds and events.",
    wallpaper: "livestream",
    imageUrl: `${BASE_IMG}/photo-1557804506-669a67965ba0?w=800&q=80`,
    imageAlt: "Livestream",
    videoUrl: videoUrl(VID.livestream),
    videoTitle: "Livestream",
    paragraphs: [
      "Tune in for live demos, build sessions, and Q&A. Schedule is posted on the home page and in our newsletter.",
    ],
  },
  search: {
    title: "Search",
    subtitle: "Find pages, docs, and content.",
    wallpaper: "search",
    imageUrl: `${BASE_IMG}/photo-1451187580459-43490279c0e6?w=800&q=80`,
    imageAlt: "Search",
    videoUrl: videoUrl(VID.search),
    videoTitle: "Search",
    paragraphs: [
      "Use the site search to find documentation, blog posts, and feature pages. Search is available in the header and footer.",
    ],
  },
  projects: {
    title: "Projects",
    subtitle: "Portfolio of builds and case studies.",
    wallpaper: "projects",
    imageUrl: `${BASE_IMG}/photo-1460925895917-afdab827c52f?w=800&q=80`,
    imageAlt: "Projects",
    videoUrl: videoUrl(VID.projects),
    videoTitle: "Projects",
    paragraphs: [
      "A collection of projects built with VoiceToWebsite: landing pages, stores, and custom experiences. Each project highlights the voice-to-deploy workflow.",
    ],
  },
  the3000: {
    title: "The3000",
    subtitle: "The collective behind VoiceToWebsite.",
    wallpaper: "the3000",
    imageUrl: `${BASE_IMG}/photo-1522071820081-009f0129c71c?w=800&q=80`,
    imageAlt: "The3000",
    videoUrl: videoUrl(VID.the3000),
    videoTitle: "The3000",
    paragraphs: [
      "The3000 is the creative and technical collective that builds VoiceToWebsite. We focus on autonomous systems and voice interfaces.",
    ],
  },
  studio3000: {
    title: "Studio3000",
    subtitle: "Creative studio and product lab.",
    wallpaper: "studio3000",
    imageUrl: `${BASE_IMG}/photo-1497366216548-37526070297c?w=800&q=80`,
    imageAlt: "Studio3000",
    videoUrl: videoUrl(VID.studio3000),
    videoTitle: "Studio3000",
    paragraphs: [
      "Studio3000 is our product and design studio. We ship VoiceToWebsite and experiment with new tools for creators and developers.",
    ],
  },
  webforge: {
    title: "Webforge",
    subtitle: "Build and experiment in the browser.",
    wallpaper: "webforge",
    imageUrl: `${BASE_IMG}/photo-1555066931-4365d14bab8c?w=800&q=80`,
    imageAlt: "Webforge",
    videoUrl: videoUrl(VID.webforge),
    videoTitle: "Webforge",
    paragraphs: [
      "Webforge is our in-browser builder and playground. Prototype sites and components without leaving the tab.",
    ],
  },
  "cursor-demo": {
    title: "Cursor Demo",
    subtitle: "VoiceToWebsite inside Cursor.",
    wallpaper: "sandbox",
    imageUrl: `${BASE_IMG}/photo-1517694712202-14dd9538aa97?w=800&q=80`,
    imageAlt: "Cursor demo",
    videoUrl: videoUrl(VID.cursorDemo),
    videoTitle: "Cursor demo",
    paragraphs: [
      "See how VoiceToWebsite integrates with Cursor for a seamless voice-to-code and voice-to-site workflow. Commands and previews run inside your editor.",
    ],
  },
  sandbox: {
    title: "Sandbox",
    subtitle: "Safe environment to try VoiceToWebsite.",
    wallpaper: "sandbox",
    imageUrl: `${BASE_IMG}/photo-1504639725590-34d0984388bd?w=800&q=80`,
    imageAlt: "Sandbox",
    videoUrl: videoUrl(VID.sandbox),
    videoTitle: "Sandbox",
    paragraphs: [
      "The sandbox lets you run voice builds and previews without affecting production. Perfect for testing and demos.",
    ],
  },
  store: {
    title: "Store",
    subtitle: "Plans, add-ons, and merchandise.",
    wallpaper: "store",
    imageUrl: `${BASE_IMG}/photo-1556742049-0cfed4f6a45d?w=800&q=80`,
    imageAlt: "Store",
    videoUrl: videoUrl(VID.store),
    videoTitle: "Store",
    paragraphs: [
      "Purchase plans, add-ons, and VoiceToWebsite-branded items. Checkout is powered by Stripe and PayPal for your security.",
    ],
  },
  appstore: {
    title: "App Store",
    subtitle: "Apps and extensions for VoiceToWebsite.",
    wallpaper: "appstore",
    imageUrl: `${BASE_IMG}/photo-1512941937669-90a1b58e7e9c?w=800&q=80`,
    imageAlt: "App store",
    videoUrl: videoUrl(VID.appstore),
    videoTitle: "App store",
    paragraphs: [
      "Browse and install apps that extend VoiceToWebsite: themes, integrations, and productivity tools from our team and community.",
    ],
  },
};

const ROUTE_ALIASES: Record<string, string> = {
  "features-enhanced": "features",
  "pricing-enhanced": "pricing",
  "contact-enhanced": "contact",
  "search-enhanced": "search",
  "features-enhanced": "features",
  "pricing-enhanced": "pricing",
};

export function getPageConfig(path: string): ContentPageConfig | undefined {
  let normalized = path.replace(/^\//, "").replace(/\/$/, "") || "about";
  normalized = ROUTE_ALIASES[normalized] ?? normalized;
  return SITE_PAGES[normalized];
}
