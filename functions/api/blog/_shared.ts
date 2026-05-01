export interface Env {
  DB: D1Database;
  APP_URL?: string;
  BLOG_PUBLISH_TOKEN?: string;
  GEMINI_API_KEY?: string;
}

export type BlogPostRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content_html: string;
  category: string;
  tags_json: string;
  meta_description: string;
  keywords_json: string;
  canonical_url: string;
  og_image: string | null;
  related_slugs_json: string;
  source_mode: "original" | "sourced";
  citations_json: string;
  quality_score: number;
  published_at: string;
  created_at: string;
};

export function json(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init.headers || {}),
    },
  });
}

export function parseJsonArray(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const value = JSON.parse(raw) as string[];
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function baseUrl(env: Env) {
  return (env.APP_URL || "https://voicetowebsite.com").replace(/\/+$/, "");
}

export function toPublicPost(row: BlogPostRow) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content_html,
    category: row.category,
    tags: parseJsonArray(row.tags_json),
    publishedAt: row.published_at,
    readTime: `${Math.max(3, Math.round(row.content_html.replace(/<[^>]+>/g, "").split(/\s+/).length / 220))} min`,
    metaDescription: row.meta_description,
    keywords: parseJsonArray(row.keywords_json),
    canonicalUrl: row.canonical_url,
    ogImage: row.og_image,
    sourceMode: row.source_mode,
    citations: parseJsonArray(row.citations_json),
    relatedSlugs: parseJsonArray(row.related_slugs_json),
  };
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export function nowIso() {
  return new Date().toISOString();
}

