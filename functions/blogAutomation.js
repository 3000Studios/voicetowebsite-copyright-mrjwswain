import { getConfigOverrideKey } from "./contentInventory.js";

export const BLOG_CONFIG_PATH = "/config/blog.json";
const BLOG_OVERRIDE_KEY = getConfigOverrideKey(BLOG_CONFIG_PATH);

const BLOG_IMAGE_POOL = [
  {
    url: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&q=80",
    alt: "Editorial planning board with laptop and notes",
  },
  {
    url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=80",
    alt: "Analytics dashboard on a modern workspace display",
  },
  {
    url: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&q=80",
    alt: "Cloud infrastructure lights in a data center",
  },
  {
    url: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200&q=80",
    alt: "AI robotics and digital assistant concept art",
  },
];

const FALLBACK_TOPICS = [
  {
    theme: "voice conversion funnels",
    title: "Turn Voice Prompts Into Landing Pages That Close Faster",
    excerpt:
      "A practical breakdown of how spoken intent, clean structure, and fast follow-up pages create better conversion flow for service businesses.",
    tags: ["voice", "landing pages", "conversion"],
  },
  {
    theme: "seo clusters",
    title: "Build Search Clusters Around One Strong Offer Page",
    excerpt:
      "How to turn one money page into a network of support content, FAQs, and related proof pages that strengthen rankings and user trust.",
    tags: ["seo", "content clusters", "growth"],
  },
  {
    theme: "workers automation",
    title: "Why Edge Automation Makes Website Operations Easier",
    excerpt:
      "A close look at how scheduled workers, KV overrides, and preview-safe deployments keep a content-heavy site updated without manual busywork.",
    tags: ["cloudflare", "automation", "ops"],
  },
  {
    theme: "brand trust",
    title: "Trust Pages Still Matter More Than Fancy Effects",
    excerpt:
      "Privacy, terms, contact, support, and status pages quietly improve conversions, ad readiness, and crawl quality when they are easy to find.",
    tags: ["trust", "seo", "ux"],
  },
  {
    theme: "store monetization",
    title: "Store Pages Need Content Depth, Not Just Checkout Buttons",
    excerpt:
      "What to add around your pricing and storefront routes so visitors understand the offer, stay longer, and convert with less friction.",
    tags: ["store", "monetization", "content"],
  },
  {
    theme: "ai assistant ux",
    title: "Make Your On-Site Assistant Feel Helpful, Not Distracting",
    excerpt:
      "A grounded design pattern for site assistants: fixed position, fast answers, strong contrast, and clear next actions instead of gimmicks.",
    tags: ["assistant", "ui", "support"],
  },
];

const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

const pickAiText = (result) => {
  if (!result) return "";
  if (typeof result === "string") return result;
  if (typeof result.response === "string") return result.response;
  if (typeof result.text === "string") return result.text;
  if (typeof result.output_text === "string") return result.output_text;
  return "";
};

const buildDefaultBlogFeed = () => ({
  heroTitle: "VoiceToWebsite Blog",
  heroSubtitle:
    "Search-friendly guides, deployment lessons, and monetization tactics for sites built with voice and automation.",
  generatedAt: new Date("2026-03-10T00:00:00.000Z").toISOString(),
  refreshHours: 3,
  posts: [
    {
      id: "voice-search-architecture",
      slug: "voice-search-architecture",
      title: "Build Voice-Led Sites With Search Intent In Mind",
      excerpt:
        "A framework for mapping spoken requests into landing pages, trust pages, and content clusters that rank and convert.",
      date: "2026-03-09T09:00:00.000Z",
      readTime: "6 min read",
      imageUrl: BLOG_IMAGE_POOL[0].url,
      imageAlt: BLOG_IMAGE_POOL[0].alt,
      tags: ["voice", "seo", "architecture"],
      url: "/blog#voice-search-architecture",
    },
    {
      id: "preview-first-rollouts",
      slug: "preview-first-rollouts",
      title: "Preview-First Rollouts Keep Revenue Pages Safe",
      excerpt:
        "Why preview links, inventory views, and route audits matter when your site is changing quickly and still needs to earn trust.",
      date: "2026-03-08T09:00:00.000Z",
      readTime: "5 min read",
      imageUrl: BLOG_IMAGE_POOL[1].url,
      imageAlt: BLOG_IMAGE_POOL[1].alt,
      tags: ["deployment", "trust", "workflow"],
      url: "/blog#preview-first-rollouts",
    },
    {
      id: "edge-content-updates",
      slug: "edge-content-updates",
      title: "Edge-Side Content Updates Without Rebuilding Everything",
      excerpt:
        "KV-backed runtime content lets you update important text and content feeds without creating a second disconnected CMS.",
      date: "2026-03-07T09:00:00.000Z",
      readTime: "5 min read",
      imageUrl: BLOG_IMAGE_POOL[2].url,
      imageAlt: BLOG_IMAGE_POOL[2].alt,
      tags: ["cloudflare", "kv", "content ops"],
      url: "/blog#edge-content-updates",
    },
    {
      id: "assistant-that-stays-useful",
      slug: "assistant-that-stays-useful",
      title: "A Fixed Assistant Feels Better Than A Gimmick",
      excerpt:
        "Why stable positioning, clearer visuals, and real answers beat mouse-chasing avatar behavior on serious revenue pages.",
      date: "2026-03-06T09:00:00.000Z",
      readTime: "4 min read",
      imageUrl: BLOG_IMAGE_POOL[3].url,
      imageAlt: BLOG_IMAGE_POOL[3].alt,
      tags: ["assistant", "ui", "conversion"],
      url: "/blog#assistant-that-stays-useful",
    },
  ],
});

const normalizePost = (post, index = 0) => {
  const image = BLOG_IMAGE_POOL[index % BLOG_IMAGE_POOL.length];
  const rawDate = String(post?.date || new Date().toISOString());
  const isoDate = Number.isNaN(new Date(rawDate).getTime())
    ? new Date().toISOString()
    : new Date(rawDate).toISOString();
  const slug = slugify(post?.slug || post?.title || `post-${index + 1}`);

  return {
    id: slug || `post-${index + 1}`,
    slug,
    title: String(post?.title || "Untitled post").trim(),
    excerpt: String(post?.excerpt || "").trim(),
    date: isoDate,
    readTime: String(post?.readTime || "5 min read").trim(),
    imageUrl: String(post?.imageUrl || post?.hero || image.url).trim(),
    imageAlt: String(post?.imageAlt || image.alt).trim(),
    tags: Array.isArray(post?.tags)
      ? post.tags
          .map((tag) => String(tag).trim())
          .filter(Boolean)
          .slice(0, 5)
      : [],
    url: String(post?.url || `/blog#${slug}`).trim(),
  };
};

export const normalizeBlogFeed = (payload) => {
  const fallback = buildDefaultBlogFeed();
  const posts = Array.isArray(payload?.posts) ? payload.posts : fallback.posts;

  return {
    heroTitle: String(payload?.heroTitle || fallback.heroTitle).trim(),
    heroSubtitle: String(payload?.heroSubtitle || fallback.heroSubtitle).trim(),
    generatedAt: String(
      payload?.generatedAt || new Date().toISOString()
    ).trim(),
    refreshHours:
      Number.isFinite(Number(payload?.refreshHours)) &&
      Number(payload.refreshHours) > 0
        ? Number(payload.refreshHours)
        : 3,
    posts: posts.map((post, index) => normalizePost(post, index)).slice(0, 12),
  };
};

const readStaticBlogFeed = async (assets) => {
  if (!assets) return buildDefaultBlogFeed();
  const response = await assets.fetch(`https://blog.local${BLOG_CONFIG_PATH}`);
  if (!response.ok) return buildDefaultBlogFeed();
  const payload = await response.json().catch(() => null);
  return normalizeBlogFeed(payload);
};

export const loadBlogFeed = async (env, assets) => {
  if (env?.KV) {
    const raw = await env.KV.get(BLOG_OVERRIDE_KEY);
    if (raw) {
      try {
        return normalizeBlogFeed(JSON.parse(raw));
      } catch (_) {
        // Fall back to the static feed below.
      }
    }
  }
  return readStaticBlogFeed(assets);
};

const buildFallbackAutomatedPost = (now, sequence) => {
  const topic = FALLBACK_TOPICS[sequence % FALLBACK_TOPICS.length];
  const image = BLOG_IMAGE_POOL[sequence % BLOG_IMAGE_POOL.length];
  const slugBase = `${slugify(topic.title)}-${now.toISOString().slice(0, 13)}`;

  return normalizePost(
    {
      id: slugBase,
      slug: slugBase,
      title: topic.title,
      excerpt: topic.excerpt,
      date: now.toISOString(),
      readTime: `${4 + (sequence % 4)} min read`,
      imageUrl: image.url,
      imageAlt: image.alt,
      tags: topic.tags,
      url: `/blog#${slugBase}`,
    },
    sequence
  );
};

const buildAiPrompt = (now, sequence) => {
  const topic = FALLBACK_TOPICS[sequence % FALLBACK_TOPICS.length];
  return `You are generating one compact SEO-friendly blog post summary for VoiceToWebsite.
Return JSON only with keys: title, excerpt, tags, readTime.
Constraints:
- Topic focus: ${topic.theme}
- Title: 48 to 66 characters
- Excerpt: 140 to 210 characters
- tags: 3 short lowercase tags
- readTime: use the format "5 min read"
- The content should sound credible, practical, and written for people evaluating website automation, SEO, UX, trust pages, monetization, and Cloudflare-based operations.
- Date context: ${now.toISOString()}
- Avoid hype, emojis, markdown, or quotation marks around the values.`;
};

const generateAiPost = async (env, now, sequence) => {
  if (!env?.AI) return null;
  try {
    const result = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
      prompt: buildAiPrompt(now, sequence),
      max_tokens: 350,
      temperature: 0.7,
    });
    const raw = pickAiText(result).trim();
    if (!raw) return null;
    const jsonText = raw
      .replace(/^```json\s*/i, "")
      .replace(/```$/i, "")
      .trim();
    const parsed = JSON.parse(jsonText);
    const image = BLOG_IMAGE_POOL[sequence % BLOG_IMAGE_POOL.length];
    const slugBase = `${slugify(parsed.title)}-${now.toISOString().slice(0, 13)}`;
    return normalizePost(
      {
        id: slugBase,
        slug: slugBase,
        title: parsed.title,
        excerpt: parsed.excerpt,
        date: now.toISOString(),
        readTime: parsed.readTime,
        imageUrl: image.url,
        imageAlt: image.alt,
        tags: parsed.tags,
        url: `/blog#${slugBase}`,
      },
      sequence
    );
  } catch (_) {
    return null;
  }
};

export const generateBlogFeedUpdate = async ({
  env,
  assets,
  now = new Date(),
}) => {
  const currentFeed = await loadBlogFeed(env, assets);
  const sequence = currentFeed.posts.length;
  const candidate =
    (await generateAiPost(env, now, sequence)) ||
    buildFallbackAutomatedPost(now, sequence);

  const seen = new Set();
  const nextPosts = [candidate, ...currentFeed.posts]
    .map((post, index) => normalizePost(post, index))
    .filter((post) => {
      const key = `${post.slug}:${post.date.slice(0, 13)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 12);

  return normalizeBlogFeed({
    ...currentFeed,
    generatedAt: now.toISOString(),
    refreshHours: 3,
    posts: nextPosts,
  });
};

export const storeBlogFeed = async (env, payload) => {
  if (!env?.KV) {
    throw new Error("KV binding is required for blog automation.");
  }
  await env.KV.put(
    BLOG_OVERRIDE_KEY,
    JSON.stringify(normalizeBlogFeed(payload))
  );
};
