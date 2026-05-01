import { baseUrl, BlogPostRow, Env } from "./_shared";

export const onRequestGet = async (context: { env: Env }) => {
  if (!context.env.DB) return new Response("DB binding not configured", { status: 500 });

  const rows = await context.env.DB.prepare(
    "SELECT slug, title, excerpt, published_at FROM blog_posts ORDER BY published_at DESC LIMIT 100",
  ).all<Pick<BlogPostRow, "slug" | "title" | "excerpt" | "published_at">>();

  const site = baseUrl(context.env);
  const items = (rows.results || [])
    .map(
      (row) => `<item>
  <title><![CDATA[${row.title}]]></title>
  <link>${site}/blog/${row.slug}</link>
  <guid>${site}/blog/${row.slug}</guid>
  <pubDate>${new Date(row.published_at).toUTCString()}</pubDate>
  <description><![CDATA[${row.excerpt}]]></description>
</item>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
<channel>
  <title>VoiceToWebsite Blog</title>
  <link>${site}/blog</link>
  <description>AI website growth, SEO, and product strategy</description>
  ${items}
</channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  });
};

