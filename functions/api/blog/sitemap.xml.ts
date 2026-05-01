import { baseUrl, BlogPostRow, Env } from "./_shared";

export const onRequestGet = async (context: { env: Env }) => {
  if (!context.env.DB) return new Response("DB binding not configured", { status: 500 });

  const rows = await context.env.DB.prepare(
    "SELECT slug, published_at FROM blog_posts ORDER BY published_at DESC LIMIT 500",
  ).all<Pick<BlogPostRow, "slug" | "published_at">>();

  const site = baseUrl(context.env);
  const urls = (rows.results || [])
    .map(
      (row) => `<url><loc>${site}/blog/${row.slug}</loc><lastmod>${new Date(row.published_at).toISOString()}</lastmod><changefreq>hourly</changefreq><priority>0.8</priority></url>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url><loc>${site}/blog</loc><changefreq>hourly</changefreq><priority>0.9</priority></url>
${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  });
};

