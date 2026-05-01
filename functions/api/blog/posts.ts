import { BlogPostRow, Env, json, toPublicPost } from "./_shared";
import { publishNextPost } from "./_publisher";

export const onRequestGet = async (context: {
  request: Request;
  env: Env;
}) => {
  if (!context.env.DB) {
    return json({ error: "DB binding not configured" }, { status: 500 });
  }

  await publishNextPost(context.env);

  const url = new URL(context.request.url);
  const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
  const pageSize = Math.max(
    1,
    Math.min(50, Number(url.searchParams.get("pageSize") || "12")),
  );
  const offset = (page - 1) * pageSize;
  const category = (url.searchParams.get("category") || "").trim();
  const tag = (url.searchParams.get("tag") || "").trim().toLowerCase();
  const from = (url.searchParams.get("from") || "").trim();
  const to = (url.searchParams.get("to") || "").trim();

  const filters: string[] = [];
  const params: (string | number)[] = [];
  if (category) {
    filters.push("category = ?");
    params.push(category);
  }
  if (from) {
    filters.push("published_at >= ?");
    params.push(from);
  }
  if (to) {
    filters.push("published_at <= ?");
    params.push(to);
  }
  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  const rowsQuery = `SELECT * FROM blog_posts ${where} ORDER BY published_at DESC LIMIT ? OFFSET ?`;
  const countQuery = `SELECT COUNT(*) AS count FROM blog_posts ${where}`;

  const rowsRes = await context.env.DB.prepare(rowsQuery)
    .bind(...params, pageSize, offset)
    .all<BlogPostRow>();
  const countRes = await context.env.DB.prepare(countQuery)
    .bind(...params)
    .first<{ count: number }>();

  let posts = (rowsRes.results || []).map(toPublicPost);
  if (tag) {
    posts = posts.filter((post) => post.tags.some((t) => t.toLowerCase() === tag));
  }

  return json({
    posts,
    pagination: {
      page,
      pageSize,
      total: Number(countRes?.count || 0),
      hasNext: page * pageSize < Number(countRes?.count || 0),
    },
  });
};
