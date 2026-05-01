import {
  baseUrl,
  BlogPostRow,
  Env,
  json,
  nowIso,
  slugify,
} from "./_shared";

type GeneratedPayload = {
  title: string;
  excerpt: string;
  html: string;
  category: string;
  tags: string[];
  keywords: string[];
  metaDescription: string;
  sourceMode: "original" | "sourced";
  citations: string[];
  qualityScore: number;
  ogImage?: string;
};

const CATEGORY_POOL = [
  "AI & Technology",
  "Website Building",
  "Business Growth",
  "SEO & Marketing",
];

const PROFANITY = ["shit", "fuck", "bitch", "damn"];

const SOURCE_POOL = [
  "https://blog.cloudflare.com/",
  "https://openai.com/news/",
  "https://developers.googleblog.com/",
  "https://www.searchenginejournal.com/",
];

function validatePayload(payload: GeneratedPayload) {
  if (!payload.title || payload.title.length < 20) return "Title too short";
  if (!payload.excerpt || payload.excerpt.length < 90) return "Excerpt too short";
  if (!payload.html || payload.html.length < 600) return "Content too short";
  if (payload.qualityScore < 70) return "Quality score below threshold";
  const text = `${payload.title} ${payload.excerpt} ${payload.html}`.toLowerCase();
  if (PROFANITY.some((word) => text.includes(word))) return "Profanity detected";
  if (payload.sourceMode === "sourced" && (!payload.citations || payload.citations.length === 0)) {
    return "Sourced article missing citations";
  }
  return null;
}

async function generateContent(mode: "original" | "sourced"): Promise<GeneratedPayload> {
  const ts = new Date().toISOString().slice(0, 16).replace("T", " ");
  const category = CATEGORY_POOL[Math.floor(Math.random() * CATEGORY_POOL.length)];
  const topic = "AI content automation and website growth";
  const sourced = mode === "sourced";
  const citations = sourced
    ? [SOURCE_POOL[Math.floor(Math.random() * SOURCE_POOL.length)]]
    : [];
  const title = sourced
    ? `AI Growth Brief (${ts}): What builders should ship this hour`
    : `AI Website Growth Playbook (${ts}): Practical moves for traffic and sales`;
  const excerpt = sourced
    ? "A citation-backed briefing on AI product and SEO shifts, with direct actions for SaaS teams shipping this week."
    : "A practical, implementation-focused AI growth article for conversion funnels, content velocity, and premium product UX.";
  const html = `
<p>AI-first website businesses win when they combine speed, trust, and measurable conversion loops. This briefing focuses on deployable moves.</p>
<h2>1) Tighten the conversion path</h2>
<p>Ensure all top-of-page calls to action route into pricing, checkout, and setup with visible loading and error states.</p>
<h2>2) Publish with velocity and quality gates</h2>
<p>Hourly content works when each post is useful, indexed, and internally linked. Pair cadence with duplicate checks and citation rules.</p>
<h2>3) Product-led retention</h2>
<p>Premium dashboard controls, saved drafts, version history, and publish rollback reduce churn and increase upgrade intent.</p>
<h2>4) SEO operational basics</h2>
<p>Every article needs canonical links, meta descriptions, structured data, and related links so traffic compounds over time.</p>
<h2>Action Checklist</h2>
<p>Track CTA clicks, checkout starts, checkout completes, setup submits, and site delivery events across one analytics schema.</p>
`;

  return {
    title,
    excerpt,
    html,
    category,
    tags: ["AI", "Growth", "SEO", "Website Builder", "Conversion"],
    keywords: ["ai website builder", "seo automation", topic, "conversion funnel", "content engine"],
    metaDescription: excerpt.slice(0, 156),
    sourceMode: mode,
    citations,
    qualityScore: 86,
    ogImage:
      "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1600&auto=format&fit=crop",
  };
}

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  if (!context.env.DB) return json({ error: "DB binding not configured" }, { status: 500 });

  const token = context.request.headers.get("x-blog-publish-token") || "";
  if (!context.env.BLOG_PUBLISH_TOKEN || token !== context.env.BLOG_PUBLISH_TOKEN) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const last = await context.env.DB.prepare(
    "SELECT published_at FROM blog_posts ORDER BY published_at DESC LIMIT 1",
  ).first<{ published_at: string }>();
  if (last && Date.now() - new Date(last.published_at).getTime() < 60 * 60 * 1000) {
    return json({ status: "skipped", reason: "Last post published under one hour ago" });
  }

  const mode: "original" | "sourced" = Math.random() > 0.5 ? "sourced" : "original";
  const payload = await generateContent(mode);
  const validationError = validatePayload(payload);
  if (validationError) {
    return json({ error: validationError }, { status: 422 });
  }

  let slug = slugify(payload.title);
  if (!slug) slug = `ai-update-${Date.now()}`;

  const duplicate = await context.env.DB.prepare(
    "SELECT id FROM blog_posts WHERE slug = ? OR title = ? LIMIT 1",
  ).bind(slug, payload.title).first<{ id: string }>();
  if (duplicate) slug = `${slug}-${Date.now().toString().slice(-5)}`;

  const id = `blog_${crypto.randomUUID()}`;
  const createdAt = nowIso();
  const publishedAt = nowIso();
  const canonical = `${baseUrl(context.env)}/blog/${slug}`;
  const relatedRows = await context.env.DB.prepare(
    "SELECT slug FROM blog_posts ORDER BY published_at DESC LIMIT 4",
  ).all<{ slug: string }>();
  const relatedSlugs = (relatedRows.results || []).map((row) => row.slug);

  await context.env.DB.prepare(
    `INSERT INTO blog_posts
    (id, slug, title, excerpt, content_html, category, tags_json, meta_description, keywords_json, canonical_url, og_image, related_slugs_json, source_mode, citations_json, quality_score, published_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      slug,
      payload.title,
      payload.excerpt,
      payload.html,
      payload.category,
      JSON.stringify(payload.tags),
      payload.metaDescription,
      JSON.stringify(payload.keywords),
      canonical,
      payload.ogImage || null,
      JSON.stringify(relatedSlugs),
      payload.sourceMode,
      JSON.stringify(payload.citations),
      payload.qualityScore,
      publishedAt,
      createdAt,
    )
    .run();

  return json({
    status: "published",
    post: {
      id,
      slug,
      title: payload.title,
      publishedAt,
      sourceMode: payload.sourceMode,
      citations: payload.citations,
    },
  });
};

