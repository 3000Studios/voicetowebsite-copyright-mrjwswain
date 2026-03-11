export type PricingTier = {
  id: string;
  name: string;
  pages: string;
  price: string;
  desc: string;
  highlight?: boolean;
  features: string[];
};

export const PRICING_TIERS: PricingTier[] = [
  {
    id: "starter",
    name: "Launch One",
    pages: "1 premium page",
    price: "$29",
    desc: "A focused launch page built from your voice brief, tuned for speed, SEO basics, and fast publishing.",
    features: [
      "1 conversion-focused page",
      "Voice-led revisions",
      "Hosting and SSL included",
      "Fast launch support",
    ],
  },
  {
    id: "growth",
    name: "Growth Stack",
    pages: "Up to 5 pages",
    price: "$79",
    desc: "A small business site with room for pricing, trust pages, lead capture, and a cleaner content path.",
    highlight: true,
    features: [
      "Up to 5 branded pages",
      "Custom domain hookup",
      "Lead capture and analytics",
      "Priority update queue",
    ],
  },
  {
    id: "enterprise",
    name: "Commerce System",
    pages: "Up to 12 pages",
    price: "$149",
    desc: "A larger voice-built website with storefront structure, launch guidance, and stronger conversion coverage.",
    features: [
      "Up to 12 public pages",
      "Storefront and checkout launch",
      "Content architecture guidance",
      "White-glove launch review",
    ],
  },
];

export const PRICING_SUPPORT_POINTS = [
  "Domain connection guidance is included on paid launch packages.",
  "Database-backed signup and custom workflows are available as part of larger growth engagements.",
  "Registrar partnership and one-stop-shop domain resale stays a revenue roadmap item until the partner flow is finalized.",
];
