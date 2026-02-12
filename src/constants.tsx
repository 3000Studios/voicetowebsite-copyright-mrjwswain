import { NavigationLink } from "./types";

export const BACKGROUND_TUNNEL = "https://pub-6293369f8afa4d849c26002fd232f5ac.r2.dev/looping%20tunnel.mp4";
export const INTRO_SONG = "https://media.voicetowebsite.com/Intro%20funk.mp3";

export const NAV_LINKS: NavigationLink[] = [
  {
    id: "demo",
    label: "WATCH DEMO",
    videoUrl: "https://media.voicetowebsite.com/homenavigation.mp4",
    description: "60-second explainer + interactive funnel.",
    themeColor: "rgba(56, 189, 248, 0.5)",
    url: "/demo#video",
  },
  {
    id: "voice",
    label: "TRY VOICE",
    videoUrl: "https://media.voicetowebsite.com/livenavigation.mp4",
    description: "Speak or type commands and preview in seconds.",
    themeColor: "rgba(34, 211, 238, 0.5)",
    url: "/demo",
  },
  {
    id: "real",
    label: "REAL BUILDS",
    videoUrl: "https://media.voicetowebsite.com/adminnavigation.mp4",
    description: "Case videos, replays, and SEO pages.",
    themeColor: "rgba(148, 163, 184, 0.5)",
    url: "/blog#cases",
  },
  {
    id: "pricing",
    label: "PRICING",
    videoUrl: "https://media.voicetowebsite.com/storenavigation.mp4",
    description: "Free to Enterprise, with yearly savings.",
    themeColor: "rgba(245, 158, 11, 0.5)",
    url: "/pricing",
  },
  {
    id: "appstore",
    label: "APP STORE",
    videoUrl: "https://media.voicetowebsite.com/appstore.mp4",
    description: "Templates, integrations, and automation kits.",
    themeColor: "rgba(34, 197, 94, 0.5)",
    url: "/appstore",
  },
];

export const INTRO_VIDEO = "https://cdn.pixabay.com/video/2024/02/10/199890-911494511_tiny.mp4";

export const USE_CASES = {
  creators: {
    label: "Creators",
    prompt: "Build a creator portfolio with a reel section and email capture.",
    bullets: ["Publish faster", "Capture emails", "Monetize content"],
    template: "Creator Portfolio",
    integration: "YouTube + Newsletter",
  },
  agencies: {
    label: "Agencies",
    prompt: "Create an agency homepage with services, case studies, and a contact form.",
    bullets: ["Ship client sites", "Reuse templates", "Reduce revisions"],
    template: "Agency Landing",
    integration: "CRM + Scheduling",
  },
  local: {
    label: "Local",
    prompt: "Create a landing page for a barber shop with booking and pricing.",
    bullets: ["Rank locally", "Drive calls", "Book appointments"],
    template: "Local Service",
    integration: "Maps + Booking",
  },
  ecommerce: {
    label: "Ecommerce",
    prompt: "Design an ecommerce storefront with bundles, reviews, and FAQs.",
    bullets: ["Bundles + upsells", "Fast pages", "Trust-first checkout"],
    template: "Storefront",
    integration: "Stripe + PayPal",
  },
  wordpress: {
    label: "WordPress",
    prompt: "Create a WordPress migration landing page with SEO checklist and pricing.",
    bullets: ["Migration plan", "SEO cleanup", "Performance lift"],
    template: "WP Migration",
    integration: "Analytics + Redirects",
  },
} as const;

export type UseCase = keyof typeof USE_CASES;

export const DEMO_PRESETS = {
  saas: {
    label: "SaaS",
    placeholder: "Build a landing page for an AI customer support tool with pricing, FAQ, and integrations...",
    chips: ["B2B SaaS landing with pricing", "Add integrations + security", "Make it minimal and fast"],
  },
  local: {
    label: "Local",
    placeholder: "Create a website for a mobile car wash with booking, pricing, and service areas...",
    chips: ["Mobile car wash + booking", "Add service areas + reviews", "Make it bold and conversion-first"],
  },
  ecommerce: {
    label: "Ecommerce",
    placeholder: "Create a storefront for premium coffee beans with bundles, subscriptions, and FAQs...",
    chips: ["Coffee store + bundles", "Add subscriptions + upsells", "Make it luxury black + gold"],
  },
  creator: {
    label: "Creator",
    placeholder: "Build a creator homepage with a reel, newsletter capture, and brand partnerships...",
    chips: ["Creator reel + newsletter", "Add brand kit + partnerships", "Make it playful neon"],
  },
  portfolio: {
    label: "Portfolio",
    placeholder: "Create a portfolio for a UI designer with case studies and a contact form...",
    chips: ["Designer portfolio + case studies", "Add testimonials + process", "Make it clean and minimal"],
  },
  agency: {
    label: "Agency",
    placeholder: "Create an agency homepage with services, case studies, and an inquiry form...",
    chips: ["Agency + services + case studies", "Add lead magnet + booking", "Make it bold and premium"],
  },
} as const;

export type DemoCategory = keyof typeof DEMO_PRESETS;
