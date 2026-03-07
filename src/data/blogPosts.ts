export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  imageUrl: string;
  imageAlt: string;
  tags: string[];
  slug: string;
}

const BASE = "https://images.unsplash.com";

export const BLOG_POSTS: BlogPost[] = [
  {
    id: "1",
    slug: "voice-to-website-launch",
    title: "Voice to Website: From Idea to Live in Minutes",
    excerpt:
      "How we built a pipeline that turns spoken intent into deployable sites. We walk through architecture, intent parsing, and preview-first publishing.",
    date: "2025-03-01",
    readTime: "6 min read",
    imageUrl: `${BASE}/photo-1485827404703-89b55fcc595e?w=600&q=80`,
    imageAlt: "Voice and technology",
    tags: ["Product", "Architecture", "Voice"],
  },
  {
    id: "2",
    slug: "adsense-ready-sites",
    title: "Making Every Generated Site AdSense-Ready",
    excerpt:
      "Policy-friendly structure, content-to-ad balance, and clear navigation. How we keep generated pages compliant and attractive to ad networks.",
    date: "2025-02-28",
    readTime: "5 min read",
    imageUrl: `${BASE}/photo-1460925895917-afdab827c52f?w=600&q=80`,
    imageAlt: "Analytics and ads",
    tags: ["Monetization", "AdSense", "Policy"],
  },
  {
    id: "3",
    slug: "cloudflare-workers-edge",
    title: "Running at the Edge with Cloudflare Workers",
    excerpt:
      "Why we chose Workers for the VoiceToWebsite API and how we use D1, KV, and R2 for persistence and media. Latency and cost wins.",
    date: "2025-02-25",
    readTime: "7 min read",
    imageUrl: `${BASE}/photo-1558494949-ef010cbdcc31?w=600&q=80`,
    imageAlt: "Cloud and edge",
    tags: ["Infrastructure", "Cloudflare", "Edge"],
  },
  {
    id: "4",
    slug: "stripe-paypal-checkout",
    title: "Unified Checkout: Stripe and PayPal in One Flow",
    excerpt:
      "Single cart, multiple payment methods. How we integrated Stripe and PayPal so users can choose at checkout without leaving the experience.",
    date: "2025-02-20",
    readTime: "5 min read",
    imageUrl: `${BASE}/photo-1556742049-0cfed4f6a45d?w=600&q=80`,
    imageAlt: "Payments",
    tags: ["Payments", "Stripe", "PayPal"],
  },
  {
    id: "5",
    slug: "preview-first-publishing",
    title: "Preview-First Publishing and Rollback",
    excerpt:
      "No deploy without a preview. We show how every change is previewed first and how one-click rollback keeps production safe.",
    date: "2025-02-15",
    readTime: "4 min read",
    imageUrl: `${BASE}/photo-1551288049-bebda4e38f71?w=600&q=80`,
    imageAlt: "Preview and deploy",
    tags: ["Deployment", "Safety", "Workflow"],
  },
  {
    id: "6",
    slug: "design-system-strata",
    title: "Introducing Strata: Our Design System",
    excerpt:
      "Typography, spacing, and components that make every generated site consistent and accessible. Strata is built for readability and conversion.",
    date: "2025-02-10",
    readTime: "6 min read",
    imageUrl: `${BASE}/photo-1561070791-2526d31fe5dc?w=600&q=80`,
    imageAlt: "Design system",
    tags: ["Design", "Accessibility", "UI"],
  },
];
