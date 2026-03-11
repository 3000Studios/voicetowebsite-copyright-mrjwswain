export type MarketingCard = {
  title: string;
  eyebrow: string;
  copy: string;
  points: string[];
};

export type Testimonial = {
  name: string;
  role: string;
  quote: string;
};

export type ExperiencePanel = {
  title: string;
  copy: string;
  href: string;
  label: string;
};

export const HOME_FEATURES: MarketingCard[] = [
  {
    eyebrow: "Voice Capture",
    title: "Speak the product brief once and keep momentum.",
    copy: "The system turns intent into sections, SEO structure, pricing paths, and trust content without making you assemble the site by hand.",
    points: [
      "Voice-to-page architecture with preview-first publishing.",
      "Readable information hierarchy built for mobile and desktop.",
      "Structured metadata and canonical paths from the first pass.",
    ],
  },
  {
    eyebrow: "Launch Control",
    title: "Deploy on the edge with a reviewable release path.",
    copy: "Every generated experience stays tied to preview, publish, analytics, and governance steps so production changes stay understandable.",
    points: [
      "Cloudflare-backed delivery with fast global response times.",
      "Measured CTA placement and revenue-event instrumentation.",
      "Recovery-friendly workflow with admin inspection surfaces.",
    ],
  },
  {
    eyebrow: "Trust Layer",
    title: "Keep compliance, support, and monetization in the design.",
    copy: "The site shell keeps policy pages, contact surfaces, archive routes, and crawl paths discoverable without crowding the main journey.",
    points: [
      "Support, legal, privacy, and status pages stay connected.",
      "Footer archive catches lower-priority and legacy surfaces.",
      "Content density stays stronger than ad density by design.",
    ],
  },
];

export const HOME_PROCESS = [
  {
    step: "01",
    title: "Describe the site in plain language.",
    copy: "Capture the headline, audience, and commercial goal without opening a builder first.",
  },
  {
    step: "02",
    title: "Review the generated preview before it ships.",
    copy: "Check copy, pages, and conversion flow in a contained preview instead of editing directly in production.",
  },
  {
    step: "03",
    title: "Publish into a system that is already organized.",
    copy: "Pricing, store, app surfaces, blog content, and trust routes stay mapped into a clean public structure.",
  },
];

export const HOME_EXPERIENCES: ExperiencePanel[] = [
  {
    title: "App Store",
    copy: "Show extensions, tools, and packaged experiences in one searchable destination.",
    href: "/appstore",
    label: "Browse apps",
  },
  {
    title: "Store",
    copy: "Route directly into plans, add-ons, and revenue paths without losing the premium shell.",
    href: "/store",
    label: "Open store",
  },
  {
    title: "Livestream",
    copy: "Promote launch sessions, demos, and live programming with dedicated content surfaces.",
    href: "/livestream",
    label: "View live",
  },
];

export const HOME_TESTIMONIALS: Testimonial[] = [
  {
    name: "Avery Chen",
    role: "Founder, product studio",
    quote:
      "We went from vague idea to a publishable site architecture in one session, with the trust pages and pricing path already in place.",
  },
  {
    name: "Jordan Malik",
    role: "Growth lead, SaaS team",
    quote:
      "The useful part was not just the design. It was seeing the site, store, blog, and support surfaces connected instead of scattered.",
  },
  {
    name: "Sam Rivera",
    role: "Independent builder",
    quote:
      "The preview loop feels high-end, but the bigger win is clarity. I can finally tell what is live, what is secondary, and where content belongs.",
  },
];
