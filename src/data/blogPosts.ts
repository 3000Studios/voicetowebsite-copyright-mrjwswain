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
  url?: string;
}

export interface BlogFeed {
  heroTitle: string;
  heroSubtitle: string;
  generatedAt: string;
  refreshHours: number;
  posts: BlogPost[];
}

const BASE = "https://images.unsplash.com";

const DEFAULT_BLOG_POSTS: BlogPost[] = [
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
    url: "/blog#voice-to-website-launch",
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
    url: "/blog#adsense-ready-sites",
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
    url: "/blog#cloudflare-workers-edge",
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
    url: "/blog#stripe-paypal-checkout",
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
    url: "/blog#preview-first-publishing",
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
    url: "/blog#design-system-strata",
  },
];

export const DEFAULT_BLOG_FEED: BlogFeed = {
  heroTitle: "VoiceToWebsite Blog",
  heroSubtitle:
    "Updates, tutorials, and search-friendly content that explain how this site builds, sells, and scales.",
  generatedAt: "2026-03-10T00:00:00.000Z",
  refreshHours: 3,
  posts: DEFAULT_BLOG_POSTS,
};

const toValidDate = (value: string): string => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? new Date().toISOString()
    : parsed.toISOString();
};

const normalizePost = (post: Partial<BlogPost>, index: number): BlogPost => {
  const fallback = DEFAULT_BLOG_POSTS[index % DEFAULT_BLOG_POSTS.length];
  const slug =
    String(post.slug || post.id || fallback.slug)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "") || fallback.slug;

  return {
    id: String(post.id || slug || fallback.id).trim(),
    slug,
    title: String(post.title || fallback.title).trim(),
    excerpt: String(post.excerpt || fallback.excerpt).trim(),
    date: toValidDate(String(post.date || fallback.date)),
    readTime: String(post.readTime || fallback.readTime).trim(),
    imageUrl: String(post.imageUrl || fallback.imageUrl).trim(),
    imageAlt: String(post.imageAlt || fallback.imageAlt).trim(),
    tags: Array.isArray(post.tags)
      ? post.tags
          .map((tag) => String(tag).trim())
          .filter(Boolean)
          .slice(0, 5)
      : fallback.tags,
    url: String(post.url || `/blog#${slug}`).trim(),
  };
};

export const normalizeBlogFeedPayload = (payload: unknown): BlogFeed => {
  const data =
    payload && typeof payload === "object"
      ? (payload as Partial<BlogFeed>)
      : DEFAULT_BLOG_FEED;
  const posts = Array.isArray(data.posts)
    ? data.posts
    : DEFAULT_BLOG_FEED.posts;

  return {
    heroTitle: String(data.heroTitle || DEFAULT_BLOG_FEED.heroTitle).trim(),
    heroSubtitle: String(
      data.heroSubtitle || DEFAULT_BLOG_FEED.heroSubtitle
    ).trim(),
    generatedAt: toValidDate(
      String(data.generatedAt || new Date().toISOString())
    ),
    refreshHours:
      Number.isFinite(Number(data.refreshHours)) &&
      Number(data.refreshHours) > 0
        ? Number(data.refreshHours)
        : DEFAULT_BLOG_FEED.refreshHours,
    posts: posts.map((post, index) => normalizePost(post, index)).slice(0, 12),
  };
};

export const BLOG_POSTS = DEFAULT_BLOG_FEED.posts;
