import { baseUrl, Env, nowIso, slugify } from "./_shared";

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

// gemini-flash-latest auto-tracks the current stable model. See
// memory/gemini-pitfalls.md for the deprecation history.
const GEMINI_MODEL = "gemini-flash-latest";
const COOLDOWN_HOURS = 23; // ~daily, slightly under 24 to allow drift

const CATEGORY_POOL = [
  "AI & Technology",
  "Website Building",
  "Business Growth",
  "SEO & Marketing",
  "Conversion & UX",
  "Small Business",
];

const TOPIC_POOL = [
  "how voice-first website builders are changing solo founder workflows",
  "the new SEO playbook for landing pages built in under 60 seconds",
  "what local businesses actually need on a homepage to convert",
  "why agency owners are switching to AI-generated client sites",
  "comparing AI website builders on speed, copy quality, and export",
  "the case for a free preview funnel before asking for a credit card",
  "five conversion-killing mistakes on small business homepages",
  "how Stripe Checkout pairs with AI-generated landing pages",
  "writing hero copy that converts for service businesses",
  "the cost of a 6-week web project versus a 60-second AI build",
  "voice search optimization for small business websites in 2026",
  "running a one-person marketing agency on AI tooling",
  "what to put in the about section of an AI-generated site",
  "from voice memo to live homepage: a founder's 60-second loop",
  "schema markup that actually moves the needle for local SEO",
];

const PROFANITY = ["shit", "fuck", "bitch", "damn"];

function validatePayload(payload: GeneratedPayload) {
  if (!payload.title || payload.title.length < 20) return "Title too short";
  if (!payload.excerpt || payload.excerpt.length < 90) return "Excerpt too short";
  if (!payload.html || payload.html.length < 600) return "Content too short";
  if (payload.qualityScore < 70) return "Quality score below threshold";
  const text = `${payload.title} ${payload.excerpt} ${payload.html}`.toLowerCase();
  if (PROFANITY.some((word) => text.includes(word))) return "Profanity detected";
  return null;
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderBlock(block: string): string {
  const trimmed = block.trim();
  if (!trimmed) return "";
  // Heading: leading #{1,3}, take only the first line as heading text
  const headingMatch = trimmed.match(/^(#{1,3})\s+([^\n]+)\n?([\s\S]*)$/);
  if (headingMatch) {
    const level = headingMatch[1]!.length;
    const headingText = headingMatch[2]!.trim();
    const rest = headingMatch[3]!.trim();
    const tag = level >= 3 ? "h4" : level === 2 ? "h3" : "h2";
    const heading = `<${tag}>${escapeHtml(headingText)}</${tag}>`;
    return rest ? `${heading}\n${renderBlock(rest)}` : heading;
  }
  // Bullet list — every line starts with - or *
  const lines = trimmed.split("\n");
  if (lines.every((line) => /^\s*[-*]\s+/.test(line))) {
    const items = lines
      .map((line) => line.replace(/^\s*[-*]\s+/, "").trim())
      .filter(Boolean)
      .map((line) => `<li>${escapeHtml(line)}</li>`)
      .join("");
    return `<ul>${items}</ul>`;
  }
  // Otherwise paragraph; internal newlines become <br>
  return `<p>${escapeHtml(trimmed).replace(/\n/g, "<br/>")}</p>`;
}

function paragraphsToHtml(value: string): string {
  // Split on blank lines, then each block is rendered (and headings nested
  // inside a block get extracted properly).
  return value
    .split(/\n\s*\n/)
    .map(renderBlock)
    .filter(Boolean)
    .join("\n");
}

type GeminiOutput = {
  title: string;
  excerpt: string;
  body: string;
  category: string;
  tags: string[];
  keywords: string[];
  metaDescription: string;
};

async function callGemini(env: Env, topic: string): Promise<GeminiOutput | null> {
  if (!env.GEMINI_API_KEY) return null;

  const instruction = `You are writing an SEO article for VoiceToWebsite.com, an AI website builder that turns a 60-second business brief into a hosted homepage. The audience is solo founders, local business owners, and digital agencies. Pricing is $9.99 / $19.99 / $49.99 a month.

Topic: ${topic}

Write a 700-1100 word article. Output STRICT JSON only, no prose around it. Schema:

{
  "title": string,
  "excerpt": string,
  "body": string,
  "category": string,
  "tags": string[],
  "keywords": string[],
  "metaDescription": string
}

Constraints:
- title: 55-70 characters, includes the primary keyword, not clickbait, no emojis.
- excerpt: 120-180 characters, no markdown.
- body: plain text with paragraph breaks (\\n\\n). Use ## for section headings. Use - for bullet points where useful. No HTML, no markdown links. Include 4-6 sections.
- category: one of ${CATEGORY_POOL.map((c) => `"${c}"`).join(", ")}.
- tags: 3-5 short tags (single or two-word).
- keywords: 5-8 SEO keywords matching real search intent.
- metaDescription: 140-160 characters, includes primary keyword, ends with a clear value statement.
- Tone: practical, specific, no fluff, no AI-self-references. Write for someone shipping a site this week.
- Mention VoiceToWebsite.com naturally once or twice when relevant, never spammy.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 28000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: instruction }] }],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: "application/json",
        },
      }),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;
    const parsed = JSON.parse(text) as Partial<GeminiOutput>;
    if (
      typeof parsed.title !== "string" ||
      typeof parsed.excerpt !== "string" ||
      typeof parsed.body !== "string" ||
      typeof parsed.metaDescription !== "string"
    ) {
      return null;
    }
    return {
      title: parsed.title.slice(0, 160),
      excerpt: parsed.excerpt.slice(0, 280),
      body: parsed.body.slice(0, 12000),
      category: typeof parsed.category === "string" ? parsed.category : pick(CATEGORY_POOL),
      tags: Array.isArray(parsed.tags) ? parsed.tags.filter((t): t is string => typeof t === "string").slice(0, 6) : [],
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords.filter((k): k is string => typeof k === "string").slice(0, 10) : [],
      metaDescription: parsed.metaDescription.slice(0, 200),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function generateWithGemini(env: Env): Promise<GeneratedPayload | null> {
  const topic = pick(TOPIC_POOL);
  const out = await callGemini(env, topic);
  if (!out) return null;
  const html = paragraphsToHtml(out.body);
  return {
    title: out.title,
    excerpt: out.excerpt,
    html,
    category: out.category && CATEGORY_POOL.includes(out.category) ? out.category : pick(CATEGORY_POOL),
    tags: out.tags.length ? out.tags : ["AI", "Website Builder", "SEO"],
    keywords: out.keywords.length ? out.keywords : ["ai website builder", "voicetowebsite", topic],
    metaDescription: out.metaDescription,
    sourceMode: "original",
    citations: [],
    qualityScore: 85,
    ogImage: pickOgImage(out.category),
  };
}

function pickOgImage(category: string) {
  const map: Record<string, string> = {
    "AI & Technology": "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1600&auto=format&fit=crop",
    "Website Building": "https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=1600&auto=format&fit=crop",
    "Business Growth": "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=1600&auto=format&fit=crop",
    "SEO & Marketing": "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?q=80&w=1600&auto=format&fit=crop",
    "Conversion & UX": "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?q=80&w=1600&auto=format&fit=crop",
    "Small Business": "https://images.unsplash.com/photo-1556761175-b413da4baf72?q=80&w=1600&auto=format&fit=crop",
  };
  return map[category] || map["AI & Technology"];
}

function generateFallback(): GeneratedPayload {
  // Used when GEMINI_API_KEY is missing OR Gemini returns nothing OR billing
  // depleted. Returns a static-but-usable post so the publisher still ships.
  const topic = pick(TOPIC_POOL);
  const dateStamp = new Date().toISOString().slice(0, 10);
  const category = pick(CATEGORY_POOL);
  const title = `${topic.charAt(0).toUpperCase()}${topic.slice(1)} (${dateStamp})`;
  const excerpt = `A practical look at ${topic} for founders, local businesses, and agencies shipping with AI website builders.`;
  const body = `Most homepages fail in the first five seconds because they answer the wrong question. Visitors want to know what you do, who it's for, and why they should care — in that order. The rest is decoration.

## What actually converts
Specific copy beats clever copy. A homepage that says "Online ordering for Brooklyn coffee shops" outperforms "Crafted hospitality redefined" every time. The first names the customer, the offer, and the location. The second is a brand exercise.

## The 60-second loop
- Speak the business brief
- Get a hosted draft
- Ship before the meeting ends
That loop is the difference between a website project and a website.

## Cost of slow
A 6-week agency project costs $5,000-$15,000 and assumes you know what works on day one. A 60-second AI draft costs $9.99 and gives you something to test against real visitors this week.

## What to keep, what to skip
Keep: hero with a clear offer, a services section, social proof, pricing, and a way to contact you.
Skip: stock-photo carousels, "our story" essays nobody reads, four versions of the same CTA.

## Action checklist
- Write a one-sentence brief for your business
- Generate a draft with VoiceToWebsite
- Publish it within an hour
- Watch what visitors click — iterate from there

The compounding effect of weekly iteration on a live site beats a single perfect launch every time.`;
  return {
    title,
    excerpt,
    html: paragraphsToHtml(body),
    category,
    tags: ["AI", "Website Builder", "SEO", "Conversion"],
    keywords: ["ai website builder", "voicetowebsite", topic, "small business website", "homepage conversion"],
    metaDescription: excerpt.slice(0, 156),
    sourceMode: "original",
    citations: [],
    qualityScore: 78,
    ogImage: pickOgImage(category),
  };
}

export async function publishNextPost(env: Env) {
  const last = await env.DB.prepare(
    "SELECT published_at FROM blog_posts ORDER BY published_at DESC LIMIT 1",
  ).first<{ published_at: string }>();
  if (last && Date.now() - new Date(last.published_at).getTime() < COOLDOWN_HOURS * 60 * 60 * 1000) {
    return { status: "skipped" as const, reason: "cooldown" };
  }

  const geminiPayload = await generateWithGemini(env);
  const payload = geminiPayload || generateFallback();
  const validationError = validatePayload(payload);
  if (validationError) {
    return { status: "failed" as const, reason: validationError };
  }

  let slug = slugify(payload.title);
  if (!slug) slug = `ai-update-${Date.now()}`;
  const duplicate = await env.DB.prepare(
    "SELECT id FROM blog_posts WHERE slug = ? OR title = ? LIMIT 1",
  ).bind(slug, payload.title).first<{ id: string }>();
  if (duplicate) slug = `${slug}-${Date.now().toString().slice(-5)}`;

  const id = `blog_${crypto.randomUUID()}`;
  const createdAt = nowIso();
  const publishedAt = nowIso();
  const canonical = `${baseUrl(env)}/blog/${slug}`;
  const relatedRows = await env.DB.prepare(
    "SELECT slug FROM blog_posts WHERE slug != ? ORDER BY published_at DESC LIMIT 4",
  ).bind(slug).all<{ slug: string }>();
  const relatedSlugs = (relatedRows.results || []).map((row) => row.slug);

  await env.DB.prepare(
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

  return {
    status: "published" as const,
    id,
    slug,
    title: payload.title,
    geminiUsed: !!geminiPayload,
  };
}
