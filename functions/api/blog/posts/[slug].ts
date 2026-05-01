import { BlogPostRow, Env, json, parseJsonArray, toPublicPost } from "../_shared";

export const onRequestGet = async (context: {
  params: { slug?: string };
  env: Env;
}) => {
  if (!context.env.DB) {
    return json({ error: "DB binding not configured" }, { status: 500 });
  }
  const slug = (context.params.slug || "").trim();
  if (!slug) return json({ error: "Missing slug" }, { status: 400 });

  const row = await context.env.DB.prepare("SELECT * FROM blog_posts WHERE slug = ? LIMIT 1")
    .bind(slug)
    .first<BlogPostRow>();
  if (!row) return json({ error: "Post not found" }, { status: 404 });

  const post = toPublicPost(row);
  const relatedSlugs = parseJsonArray(row.related_slugs_json);
  let related: ReturnType<typeof toPublicPost>[] = [];
  if (relatedSlugs.length) {
    const placeholders = relatedSlugs.map(() => "?").join(",");
    const relatedRows = await context.env.DB.prepare(
      `SELECT * FROM blog_posts WHERE slug IN (${placeholders}) ORDER BY published_at DESC LIMIT 4`,
    )
      .bind(...relatedSlugs)
      .all<BlogPostRow>();
    related = (relatedRows.results || []).map(toPublicPost);
  } else {
    const fallbackRows = await context.env.DB.prepare(
      "SELECT * FROM blog_posts WHERE slug != ? ORDER BY published_at DESC LIMIT 4",
    )
      .bind(slug)
      .all<BlogPostRow>();
    related = (fallbackRows.results || []).map(toPublicPost);
  }

  return json({ post, related });
};

