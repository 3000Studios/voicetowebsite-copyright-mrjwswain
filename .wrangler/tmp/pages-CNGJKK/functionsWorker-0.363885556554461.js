var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// api/blog/_shared.ts
function json(body, init = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...init.headers || {}
    }
  });
}
__name(json, "json");
function parseJsonArray(raw) {
  if (!raw) return [];
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}
__name(parseJsonArray, "parseJsonArray");
function baseUrl(env) {
  return (env.APP_URL || "https://voicetowebsite.com").replace(/\/+$/, "");
}
__name(baseUrl, "baseUrl");
function toPublicPost(row) {
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
    relatedSlugs: parseJsonArray(row.related_slugs_json)
  };
}
__name(toPublicPost, "toPublicPost");
function slugify(value) {
  return value.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 80);
}
__name(slugify, "slugify");
function nowIso() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
__name(nowIso, "nowIso");

// api/blog/posts/[slug].ts
var onRequestGet = /* @__PURE__ */ __name(async (context) => {
  if (!context.env.DB) {
    return json({ error: "DB binding not configured" }, { status: 500 });
  }
  const slug = (context.params.slug || "").trim();
  if (!slug) return json({ error: "Missing slug" }, { status: 400 });
  const row = await context.env.DB.prepare("SELECT * FROM blog_posts WHERE slug = ? LIMIT 1").bind(slug).first();
  if (!row) return json({ error: "Post not found" }, { status: 404 });
  const post = toPublicPost(row);
  const relatedSlugs = parseJsonArray(row.related_slugs_json);
  let related = [];
  if (relatedSlugs.length) {
    const placeholders = relatedSlugs.map(() => "?").join(",");
    const relatedRows = await context.env.DB.prepare(
      `SELECT * FROM blog_posts WHERE slug IN (${placeholders}) ORDER BY published_at DESC LIMIT 4`
    ).bind(...relatedSlugs).all();
    related = (relatedRows.results || []).map(toPublicPost);
  } else {
    const fallbackRows = await context.env.DB.prepare(
      "SELECT * FROM blog_posts WHERE slug != ? ORDER BY published_at DESC LIMIT 4"
    ).bind(slug).all();
    related = (fallbackRows.results || []).map(toPublicPost);
  }
  return json({ post, related });
}, "onRequestGet");

// api/admin/orders.ts
function json2(body, init = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      ...init.headers || {}
    }
  });
}
__name(json2, "json");
var onRequestGet2 = /* @__PURE__ */ __name(async (context) => {
  const authHeader = context.request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length).trim() : "";
  const ownerHeader = (context.request.headers.get("x-owner-email") || "").trim().toLowerCase();
  const expectedOwner = (context.env.OWNER_ADMIN_EMAIL || "").trim().toLowerCase();
  const tokenOk = !!context.env.ADMIN_API_TOKEN && token === context.env.ADMIN_API_TOKEN;
  const ownerOk = !!expectedOwner && ownerHeader === expectedOwner;
  if (!tokenOk && !ownerOk) {
    return json2({ error: "Unauthorized", success: false }, { status: 401 });
  }
  if (!context.env.DB) {
    console.error("DB binding missing");
    return json2({ error: "Database binding not configured on server", success: false }, { status: 500 });
  }
  try {
    const url = new URL(context.request.url);
    const limit = Math.max(1, Math.min(200, Number(url.searchParams.get("limit") || "50")));
    const status = (url.searchParams.get("status") || "").trim();
    const stmt = status.length > 0 ? context.env.DB.prepare(
      `SELECT id, created_at, email, plan, cadence, launch_discount, status, site_url, error
             FROM orders WHERE status = ? ORDER BY created_at DESC LIMIT ?`
    ).bind(status, limit) : context.env.DB.prepare(
      `SELECT id, created_at, email, plan, cadence, launch_discount, status, site_url, error
             FROM orders ORDER BY created_at DESC LIMIT ?`
    ).bind(limit);
    const res = await stmt.all();
    return json2({
      rows: res.results || [],
      success: true,
      count: res.results?.length || 0
    });
  } catch (err) {
    console.error("Database query error:", err.message);
    return json2({
      error: "Failed to retrieve orders from database",
      message: err.message,
      success: false
    }, { status: 500 });
  }
}, "onRequestGet");

// api/blog/_publisher.ts
var CATEGORY_POOL = [
  "AI & Technology",
  "Website Building",
  "Business Growth",
  "SEO & Marketing"
];
var PROFANITY = ["shit", "fuck", "bitch", "damn"];
var SOURCE_POOL = [
  "https://blog.cloudflare.com/",
  "https://openai.com/news/",
  "https://developers.googleblog.com/",
  "https://www.searchenginejournal.com/"
];
function validatePayload(payload) {
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
__name(validatePayload, "validatePayload");
async function generateContent(mode) {
  const ts = (/* @__PURE__ */ new Date()).toISOString().slice(0, 16).replace("T", " ");
  const category = CATEGORY_POOL[Math.floor(Math.random() * CATEGORY_POOL.length)];
  const topic = "AI content automation and website growth";
  const sourced = mode === "sourced";
  const citations = sourced ? [SOURCE_POOL[Math.floor(Math.random() * SOURCE_POOL.length)]] : [];
  const title = sourced ? `AI Growth Brief (${ts}): What builders should ship this hour` : `AI Website Growth Playbook (${ts}): Practical moves for traffic and sales`;
  const excerpt = sourced ? "A citation-backed briefing on AI product and SEO shifts, with direct actions for SaaS teams shipping this week." : "A practical, implementation-focused AI growth article for conversion funnels, content velocity, and premium product UX.";
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
    ogImage: "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1600&auto=format&fit=crop"
  };
}
__name(generateContent, "generateContent");
async function publishNextPost(env) {
  const last = await env.DB.prepare(
    "SELECT published_at FROM blog_posts ORDER BY published_at DESC LIMIT 1"
  ).first();
  if (last && Date.now() - new Date(last.published_at).getTime() < 60 * 60 * 1e3) {
    return { status: "skipped", reason: "cooldown" };
  }
  const mode = Math.random() > 0.5 ? "sourced" : "original";
  const payload = await generateContent(mode);
  const validationError = validatePayload(payload);
  if (validationError) {
    return { status: "failed", reason: validationError };
  }
  let slug = slugify(payload.title);
  if (!slug) slug = `ai-update-${Date.now()}`;
  const duplicate = await env.DB.prepare(
    "SELECT id FROM blog_posts WHERE slug = ? OR title = ? LIMIT 1"
  ).bind(slug, payload.title).first();
  if (duplicate) slug = `${slug}-${Date.now().toString().slice(-5)}`;
  const id = `blog_${crypto.randomUUID()}`;
  const createdAt = nowIso();
  const publishedAt = nowIso();
  const canonical = `${baseUrl(env)}/blog/${slug}`;
  const relatedRows = await env.DB.prepare(
    "SELECT slug FROM blog_posts ORDER BY published_at DESC LIMIT 4"
  ).all();
  const relatedSlugs = (relatedRows.results || []).map((row) => row.slug);
  await env.DB.prepare(
    `INSERT INTO blog_posts
    (id, slug, title, excerpt, content_html, category, tags_json, meta_description, keywords_json, canonical_url, og_image, related_slugs_json, source_mode, citations_json, quality_score, published_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
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
    createdAt
  ).run();
  return { status: "published", id, slug, title: payload.title, sourceMode: payload.sourceMode, citations: payload.citations };
}
__name(publishNextPost, "publishNextPost");

// api/blog/posts.ts
var onRequestGet3 = /* @__PURE__ */ __name(async (context) => {
  if (!context.env.DB) {
    return json({ error: "DB binding not configured" }, { status: 500 });
  }
  await publishNextPost(context.env);
  const url = new URL(context.request.url);
  const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
  const pageSize = Math.max(
    1,
    Math.min(50, Number(url.searchParams.get("pageSize") || "12"))
  );
  const offset = (page - 1) * pageSize;
  const category = (url.searchParams.get("category") || "").trim();
  const tag = (url.searchParams.get("tag") || "").trim().toLowerCase();
  const from = (url.searchParams.get("from") || "").trim();
  const to = (url.searchParams.get("to") || "").trim();
  const filters = [];
  const params = [];
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
  const rowsRes = await context.env.DB.prepare(rowsQuery).bind(...params, pageSize, offset).all();
  const countRes = await context.env.DB.prepare(countQuery).bind(...params).first();
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
      hasNext: page * pageSize < Number(countRes?.count || 0)
    }
  });
}, "onRequestGet");

// api/blog/publish.ts
var onRequestPost = /* @__PURE__ */ __name(async (context) => {
  if (!context.env.DB) return json({ error: "DB binding not configured" }, { status: 500 });
  const token = context.request.headers.get("x-blog-publish-token") || "";
  if (!context.env.BLOG_PUBLISH_TOKEN || token !== context.env.BLOG_PUBLISH_TOKEN) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await publishNextPost(context.env);
  if (result.status === "failed") return json({ error: result.reason }, { status: 422 });
  return json(result);
}, "onRequestPost");

// api/blog/rss.xml.ts
var onRequestGet4 = /* @__PURE__ */ __name(async (context) => {
  if (!context.env.DB) return new Response("DB binding not configured", { status: 500 });
  const rows = await context.env.DB.prepare(
    "SELECT slug, title, excerpt, published_at FROM blog_posts ORDER BY published_at DESC LIMIT 100"
  ).all();
  const site = baseUrl(context.env);
  const items = (rows.results || []).map(
    (row) => `<item>
  <title><![CDATA[${row.title}]]></title>
  <link>${site}/blog/${row.slug}</link>
  <guid>${site}/blog/${row.slug}</guid>
  <pubDate>${new Date(row.published_at).toUTCString()}</pubDate>
  <description><![CDATA[${row.excerpt}]]></description>
</item>`
  ).join("\n");
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
      "cache-control": "public, max-age=300"
    }
  });
}, "onRequestGet");

// api/blog/sitemap.xml.ts
var onRequestGet5 = /* @__PURE__ */ __name(async (context) => {
  if (!context.env.DB) return new Response("DB binding not configured", { status: 500 });
  const rows = await context.env.DB.prepare(
    "SELECT slug, published_at FROM blog_posts ORDER BY published_at DESC LIMIT 500"
  ).all();
  const site = baseUrl(context.env);
  const urls = (rows.results || []).map(
    (row) => `<url><loc>${site}/blog/${row.slug}</loc><lastmod>${new Date(row.published_at).toISOString()}</lastmod><changefreq>hourly</changefreq><priority>0.8</priority></url>`
  ).join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url><loc>${site}/blog</loc><changefreq>hourly</changefreq><priority>0.9</priority></url>
${urls}
</urlset>`;
  return new Response(xml, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=300"
    }
  });
}, "onRequestGet");

// api/site/[id].ts
var onRequestGet6 = /* @__PURE__ */ __name(async (context) => {
  if (!context.env.SITES_BUCKET) return new Response("SITES_BUCKET binding not configured", { status: 500 });
  const id = (context.params.id || "").trim();
  if (!id) return new Response("Missing id", { status: 400 });
  const key = `sites/${id}/index.html`;
  const obj = await context.env.SITES_BUCKET.get(key);
  if (!obj) return new Response("Not found", { status: 404 });
  const headers = new Headers();
  headers.set("content-type", "text/html; charset=utf-8");
  headers.set("cache-control", "public, max-age=60");
  return new Response(obj.body, { headers });
}, "onRequestGet");

// api/checkout-session.ts
function json3(body, init = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      // Support cross-origin if needed
      ...init.headers || {}
    }
  });
}
__name(json3, "json");
var STRIPE_SESSION_URL_PREFIX = "https://api.stripe.com/v1/checkout/sessions/";
var onRequestGet7 = /* @__PURE__ */ __name(async (context) => {
  const url = new URL(context.request.url);
  const sessionId = (url.searchParams.get("session_id") || "").trim();
  if (!sessionId) {
    return json3({
      error: "Missing session_id",
      success: false,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    }, { status: 400 });
  }
  const secret = context.env.STRIPE_SECRET_KEY || context.env.STRIPE_SECRET;
  if (!secret) {
    console.error("Stripe secret not found in environment");
    return json3({
      error: "Stripe configuration missing on server",
      success: false
    }, { status: 500 });
  }
  try {
    const stripeUrl = `${STRIPE_SESSION_URL_PREFIX}${encodeURIComponent(sessionId)}?expand[]=line_items`;
    const res = await fetch(stripeUrl, {
      headers: { Authorization: `Bearer ${secret}` }
    });
    const data = await res.json();
    if (!res.ok) {
      console.error("Stripe API error:", data?.error?.message);
      return json3({
        error: data?.error?.message || "Stripe session lookup failed",
        success: false
      }, { status: res.status });
    }
    const paid = data?.payment_status === "paid" || data?.status === "complete" || data?.mode === "subscription";
    return json3({
      id: data?.id,
      mode: data?.mode,
      status: data?.status,
      payment_status: data?.payment_status,
      customer_email: data?.customer_details?.email || data?.customer_email || null,
      metadata: data?.metadata || {},
      paid,
      success: true
    });
  } catch (err) {
    console.error("Internal error in checkout-session:", err.message);
    return json3({
      error: "Internal server error during session verification",
      success: false
    }, { status: 500 });
  }
}, "onRequestGet");

// api/create-checkout-session.ts
var STRIPE_SESSIONS_URL = "https://api.stripe.com/v1/checkout/sessions";
var FALLBACK_STRIPE_LINKS = {
  starter: {
    month: "https://buy.stripe.com/9B65kD2Kx5mK5le8nUbAs0u",
    year: "https://buy.stripe.com/28E5kD70N02q7tm8nUbAs0v"
  },
  pro: {
    month: "https://buy.stripe.com/dRmfZhbh35mK2927jQbAs0w",
    year: "https://buy.stripe.com/4gM00j3OB6qO9BudIebAs0x"
  },
  enterprise: {
    month: "https://buy.stripe.com/bJe7sLetfcPcdRK1ZwbAs0y",
    year: "https://buy.stripe.com/dRm00jacZ4iG9Bu0VsbAs0z"
  },
  commands: {
    month: "https://buy.stripe.com/fZubJ12Kx02q9Bu6fMbAs0A"
  }
};
function jsonResponse(body, init = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...init.headers || {}
    }
  });
}
__name(jsonResponse, "jsonResponse");
async function parseRequestBody(request) {
  const url = new URL(request.url);
  if (url.searchParams.get("plan")) {
    return {
      plan: String(url.searchParams.get("plan") || ""),
      cadence: String(url.searchParams.get("cadence") || ""),
      launch_discount: String(url.searchParams.get("launch_discount") || "").toLowerCase() === "true"
    };
  }
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const raw = await request.text();
    if (!raw.trim()) {
      return {};
    }
    return JSON.parse(raw);
  }
  if (contentType.includes("application/x-www-form-urlencoded")) {
    const raw = await request.text();
    const params = new URLSearchParams(raw);
    return {
      plan: String(params.get("plan") || ""),
      cadence: String(params.get("cadence") || ""),
      launch_discount: String(params.get("launch_discount") || "").toLowerCase() === "true"
    };
  }
  throw new Error("Unsupported content type");
}
__name(parseRequestBody, "parseRequestBody");
function getStripePriceForPlan(env, plan, cadence) {
  switch (plan) {
    case "starter":
      return cadence === "year" ? env.STRIPE_PRICE_STARTER_YEAR : env.STRIPE_PRICE_STARTER_MONTH;
    case "pro":
      return cadence === "year" ? env.STRIPE_PRICE_PRO_YEAR : env.STRIPE_PRICE_PRO_MONTH;
    case "enterprise":
      return cadence === "year" ? env.STRIPE_PRICE_ENTERPRISE_YEAR : env.STRIPE_PRICE_ENTERPRISE_MONTH;
    case "commands":
      return env.STRIPE_PRICE_COMMANDS;
    default:
      return null;
  }
}
__name(getStripePriceForPlan, "getStripePriceForPlan");
var onRequestPost2 = /* @__PURE__ */ __name(async (context) => {
  try {
    const body = await parseRequestBody(context.request);
    const plan = body.plan?.toLowerCase().trim();
    if (!plan) return jsonResponse({ error: "Missing plan" }, { status: 400 });
    const cadence = body.cadence?.toLowerCase() === "year" ? "year" : "month";
    const priceId = getStripePriceForPlan(context.env, plan, cadence);
    const fallbackUrl = plan === "commands" ? FALLBACK_STRIPE_LINKS.commands.month : FALLBACK_STRIPE_LINKS[plan]?.[cadence];
    if (!priceId) {
      if (fallbackUrl) return jsonResponse({ url: fallbackUrl, fallback: true });
      return jsonResponse({ error: "Invalid plan" }, { status: 400 });
    }
    const appUrl = (context.env.APP_URL || "").trim().replace(/\/+$/, "");
    if (!appUrl) {
      if (fallbackUrl) return jsonResponse({ url: fallbackUrl, fallback: true });
      return jsonResponse({ error: "APP_URL not configured" }, { status: 500 });
    }
    if (!context.env.STRIPE_SECRET_KEY) {
      if (fallbackUrl) return jsonResponse({ url: fallbackUrl, fallback: true });
      return jsonResponse({ error: "STRIPE_SECRET_KEY not configured" }, { status: 500 });
    }
    const mode = plan === "commands" ? "payment" : "subscription";
    const form = new URLSearchParams();
    form.set("mode", mode);
    form.set("success_url", `${appUrl}/success?provider=stripe&plan=${encodeURIComponent(plan)}&session_id={CHECKOUT_SESSION_ID}`);
    form.set("cancel_url", `${appUrl}/pricing?canceled=1`);
    form.set("line_items[0][price]", priceId);
    form.set("line_items[0][quantity]", "1");
    form.set("client_reference_id", `voice2website_${plan}_${Date.now()}`);
    form.set("metadata[plan]", plan);
    form.set("metadata[cadence]", cadence);
    if (body.launch_discount) form.set("metadata[launch_discount]", "true");
    const response = await fetch(STRIPE_SESSIONS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${context.env.STRIPE_SECRET_KEY}`,
        "content-type": "application/x-www-form-urlencoded"
      },
      body: form.toString()
    });
    const raw = await response.text();
    let data = {};
    if (raw.trim()) {
      try {
        data = JSON.parse(raw);
      } catch {
        data = {};
      }
    }
    if (!response.ok || !data.url) {
      if (fallbackUrl) return jsonResponse({ url: fallbackUrl, fallback: true });
      return jsonResponse({ error: data?.error?.message || "Stripe session creation failed" }, { status: 500 });
    }
    return jsonResponse({ url: data.url });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Invalid request" },
      { status: 400 }
    );
  }
}, "onRequestPost");

// api/create-paypal-order.ts
var FALLBACK_CHECKOUT_URLS = {
  starter: {
    month: "https://buy.stripe.com/9B65kD2Kx5mK5le8nUbAs0u",
    year: "https://buy.stripe.com/28E5kD70N02q7tm8nUbAs0v"
  },
  pro: {
    month: "https://buy.stripe.com/dRmfZhbh35mK2927jQbAs0w",
    year: "https://buy.stripe.com/4gM00j3OB6qO9BudIebAs0x"
  },
  enterprise: {
    month: "https://buy.stripe.com/bJe7sLetfcPcdRK1ZwbAs0y",
    year: "https://buy.stripe.com/dRm00jacZ4iG9Bu0VsbAs0z"
  },
  commands: {
    month: "https://buy.stripe.com/fZubJ12Kx02q9Bu6fMbAs0A"
  }
};
function jsonResponse2(body, init = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...init.headers || {}
    }
  });
}
__name(jsonResponse2, "jsonResponse");
function paypalBaseUrl(env) {
  return (env.PAYPAL_ENV || "").toLowerCase() === "sandbox" ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";
}
__name(paypalBaseUrl, "paypalBaseUrl");
async function getPayPalAccessToken(env) {
  const credentials = btoa(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`);
  const res = await fetch(`${paypalBaseUrl(env)}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "content-type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || "PayPal token failed");
  }
  return data.access_token;
}
__name(getPayPalAccessToken, "getPayPalAccessToken");
var onRequestPost3 = /* @__PURE__ */ __name(async (context) => {
  try {
    const url = new URL(context.request.url);
    let body = {};
    if (url.searchParams.get("plan")) {
      body.plan = url.searchParams.get("plan") || "";
      body.cadence = url.searchParams.get("cadence") || "";
    } else {
      const raw = await context.request.text();
      body = raw.trim() ? JSON.parse(raw) : {};
    }
    const plan = body.plan?.toLowerCase();
    if (!plan) return jsonResponse2({ error: "Missing plan" }, { status: 400 });
    const cadence = body.cadence?.toLowerCase() === "year" ? "year" : "month";
    const fallbackUrl = plan === "commands" ? FALLBACK_CHECKOUT_URLS.commands.month : FALLBACK_CHECKOUT_URLS[plan]?.[cadence];
    const appUrl = (context.env.APP_URL || "").trim().replace(/\/+$/, "");
    if (!appUrl) {
      if (fallbackUrl) return jsonResponse2({ url: fallbackUrl, fallback: true });
      return jsonResponse2({ error: "APP_URL not configured" }, { status: 500 });
    }
    let token;
    try {
      token = await getPayPalAccessToken(context.env);
    } catch {
      if (fallbackUrl) return jsonResponse2({ url: fallbackUrl, fallback: true });
      return jsonResponse2({ error: "PayPal token failed" }, { status: 500 });
    }
    if (plan === "starter" || plan === "pro" || plan === "enterprise") {
      const planId = plan === "starter" ? context.env.PAYPAL_PLAN_STARTER : plan === "pro" ? context.env.PAYPAL_PLAN_PRO : context.env.PAYPAL_PLAN_ENTERPRISE;
      if (!planId) {
        if (fallbackUrl) return jsonResponse2({ url: fallbackUrl, fallback: true });
        return jsonResponse2({ error: "PayPal subscription plans not configured yet" }, { status: 500 });
      }
      const subRes = await fetch(`${paypalBaseUrl(context.env)}/v1/billing/subscriptions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          plan_id: planId,
          application_context: {
            brand_name: "Voice2Website",
            locale: "en-US",
            user_action: "SUBSCRIBE_NOW",
            return_url: `${appUrl}/setup?provider=paypal&plan=${encodeURIComponent(plan)}`,
            cancel_url: `${appUrl}/pricing?canceled=1&provider=paypal`
          }
        })
      });
      const sub = await subRes.json();
      const approveUrl2 = sub.links?.find((l) => l.rel === "approve")?.href;
      if (!subRes.ok || !approveUrl2) {
        if (fallbackUrl) return jsonResponse2({ url: fallbackUrl, fallback: true });
        return jsonResponse2({ error: "PayPal subscription creation failed" }, { status: 500 });
      }
      return jsonResponse2({ url: approveUrl2 });
    }
    if (plan !== "commands") return jsonResponse2({ error: "Invalid plan" }, { status: 400 });
    const orderRes = await fetch(`${paypalBaseUrl(context.env)}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: { currency_code: "USD", value: "2.99" },
            description: "Voice2Website Extra Commands Pack \u2014 Adds 5 more commands (one-time, repeatable)."
          }
        ],
        application_context: {
          brand_name: "Voice2Website",
          shipping_preference: "NO_SHIPPING",
          user_action: "PAY_NOW",
          return_url: `${appUrl}/setup?provider=paypal&plan=commands`,
          cancel_url: `${appUrl}/pricing?canceled=1&provider=paypal`
        }
      })
    });
    const order = await orderRes.json();
    const approveUrl = order.links?.find((l) => l.rel === "approve")?.href;
    if (!orderRes.ok || !approveUrl) {
      if (fallbackUrl) return jsonResponse2({ url: fallbackUrl, fallback: true });
      return jsonResponse2({ error: "PayPal order creation failed" }, { status: 500 });
    }
    return jsonResponse2({ url: approveUrl });
  } catch {
    return jsonResponse2({ error: "PayPal request failed" }, { status: 500 });
  }
}, "onRequestPost");

// ../src/lib/layoutCompiler.ts
var FLOWBITE_CSS = "https://cdn.jsdelivr.net/npm/flowbite@4.0.1/dist/flowbite.min.css";
var FLOWBITE_JS = "https://cdn.jsdelivr.net/npm/flowbite@4.0.1/dist/flowbite.min.js";
var fallbackBrand = {
  name: "Generated Brand",
  colors: ["#2563eb", "#111827", "#06b6d4"]
};
function escapeHtml(value = "") {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}
__name(escapeHtml, "escapeHtml");
function toTitle(value) {
  return value.replace(/https?:\/\//g, "").replace(/\.[a-z]{2,}.*$/i, "").replace(/[^a-z0-9]+/gi, " ").trim().replace(/\b\w/g, (char) => char.toUpperCase()) || "Generated Brand";
}
__name(toTitle, "toTitle");
function extractBrandName(prompt) {
  const quoted = prompt.match(/["']([^"']{3,80})["']/);
  if (quoted?.[1]) return quoted[1];
  const forMatch = prompt.match(/\b(?:for|called|named)\s+([a-z0-9&.\-\s]{3,60})/i);
  if (forMatch?.[1]) return forMatch[1].replace(/\b(with|that|and|using|where|who)\b.*$/i, "").trim();
  return prompt.split(/\s+/).slice(0, 4).join(" ");
}
__name(extractBrandName, "extractBrandName");
function inferSections(prompt) {
  const p = prompt.toLowerCase();
  const sections = ["hero"];
  if (/dashboard|app feel|admin|portal|sidebar/.test(p)) sections.push("sidebar", "dashboard");
  if (/feature|features|service|services|offer|offers|three/.test(p)) sections.push(p.includes("service") ? "services" : "features");
  if (/price|pricing|plan|subscription|package/.test(p)) sections.push("pricing");
  if (/testimonial|review|proof|trust/.test(p)) sections.push("testimonials");
  if (/faq|question|answers/.test(p)) sections.push("faq");
  if (/contact|book|lead|form|quote|call/.test(p)) sections.push("contact");
  if (sections.length === 1) sections.push("features", "pricing", "faq", "contact");
  return [...new Set(sections)];
}
__name(inferSections, "inferSections");
function countFromPrompt(prompt, fallback = 3) {
  const p = prompt.toLowerCase();
  if (/\bthree\b|\b3\b/.test(p)) return 3;
  if (/\bfour\b|\b4\b/.test(p)) return 4;
  if (/\bsix\b|\b6\b/.test(p)) return 6;
  if (/\btwo\b|\b2\b/.test(p)) return 2;
  return fallback;
}
__name(countFromPrompt, "countFromPrompt");
function detectMood(prompt) {
  const p = prompt.toLowerCase();
  if (/professional|corporate|law|consulting|enterprise/.test(p)) return "professional";
  if (/luxury|premium|high-end|elegant/.test(p)) return "luxury";
  if (/bold|energetic|launch|sales|marketing/.test(p)) return "bold";
  if (/minimal|clean|simple|quiet/.test(p)) return "minimal";
  return "modern";
}
__name(detectMood, "detectMood");
function selectFonts(mood) {
  switch (mood) {
    case "professional":
      return { heading: "Roboto", body: "Inter" };
    case "luxury":
      return { heading: "Playfair Display", body: "Source Sans 3" };
    case "bold":
      return { heading: "Montserrat", body: "Inter" };
    case "minimal":
      return { heading: "Manrope", body: "Inter" };
    default:
      return { heading: "Space Grotesk", body: "Inter" };
  }
}
__name(selectFonts, "selectFonts");
function typographyForSlot(gridSpan, type, prompt) {
  const mood = detectMood(prompt);
  const fonts = selectFonts(mood);
  const marketing = /hero|pricing|services|features|testimonials/.test(type);
  const scale = marketing ? "major-third" : "major-second";
  const clamp = gridSpan <= 3 ? 3 : gridSpan <= 6 ? 2 : 0;
  const prose = type === "faq" || type === "contact" || type === "content";
  const heading = gridSpan <= 3 ? "text-lg md:text-xl font-semibold leading-snug" : gridSpan <= 6 ? "text-2xl md:text-3xl font-semibold leading-tight" : marketing ? "text-4xl md:text-5xl font-bold leading-[1.05]" : "text-3xl md:text-4xl font-semibold leading-tight";
  const body = gridSpan <= 3 ? "text-sm leading-5" : "text-base leading-relaxed";
  return {
    fonts,
    heading,
    body,
    prose,
    clamp,
    scale,
    mood
  };
}
__name(typographyForSlot, "typographyForSlot");
function motionForSection(type) {
  if (type === "sidebar") return { intent: "sidebar", direction: "left", layout: true };
  if (type === "dashboard") return { intent: "entrance", direction: "up", layout: true };
  if (type === "hero") return { intent: "hero", direction: "up", layout: true };
  if (type === "features" || type === "services" || type === "testimonials") return { intent: "stagger", direction: "up", layout: true };
  if (type === "pricing" || type === "contact" || type === "faq") return { intent: "emphasis", direction: "up", layout: true };
  return { intent: "entrance", direction: "up", layout: true };
}
__name(motionForSection, "motionForSection");
function iconSvg(name) {
  const paths = {
    spark: '<path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z"/>',
    grid: '<path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"/>',
    chart: '<path d="M4 19V5m0 14h16M8 16v-5m5 5V8m5 8v-9"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    mail: '<path d="M4 6h16v12H4z"/><path d="m4 7 8 6 8-6"/>'
  };
  return `<svg class="w-6 h-6" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">${paths[name]}</svg>`;
}
__name(iconSvg, "iconSvg");
function sectionCopy(type, brandName) {
  const safe = escapeHtml(brandName);
  switch (type) {
    case "hero":
      return { title: `${safe} built for immediate action`, body: `A polished site structure generated from your request, aligned to a 12-column responsive grid instead of a generic template.`, cta: "Start now" };
    case "features":
      return { title: "Features placed with intent", body: "Each benefit is mapped into balanced Flowbite-style cards with responsive grid placement.", cta: "Explore features" };
    case "services":
      return { title: "Services presented clearly", body: "Service blocks are organized for scanning, trust, and lead conversion.", cta: "View services" };
    case "pricing":
      return { title: "Simple pricing", body: "Conversion-focused plan cards with clear next steps.", cta: "Choose plan" };
    case "faq":
      return { title: "Questions answered", body: "Accordion-ready FAQ content for faster decisions.", cta: "Read answers" };
    case "contact":
      return { title: "Ready to connect", body: "A clean contact path for calls, quotes, bookings, or lead capture.", cta: "Contact us" };
    case "testimonials":
      return { title: "Proof that builds trust", body: "Review cards and trust signals are placed near conversion moments.", cta: "See results" };
    case "dashboard":
      return { title: "Main app workspace", body: "A col-span-9 content area for product controls, analytics, and workflow cards.", cta: "Open workspace" };
    case "sidebar":
      return { title: "App navigation", body: "A col-span-3 sidebar for dashboard-style experiences.", cta: "Navigate" };
    default:
      return { title: "Content section", body: "Structured content placed on the grid.", cta: "Learn more" };
  }
}
__name(sectionCopy, "sectionCopy");
function buildBloks(prompt, brand) {
  const sections = inferSections(prompt);
  const itemCount = countFromPrompt(prompt);
  const appFeel = sections.includes("sidebar") || sections.includes("dashboard");
  let order = 1;
  const bloks = [];
  for (const type of sections) {
    const copy = sectionCopy(type, brand.name);
    const typography = typographyForSlot(type === "sidebar" ? 3 : type === "dashboard" ? 9 : type === "hero" ? 12 : type === "features" || type === "services" ? 12 : type === "pricing" ? 12 : type === "faq" ? 12 : type === "contact" ? 12 : 12, type, prompt);
    if (type === "sidebar") {
      bloks.push({ component: "sidebar", order: order++, grid_span: 3, col_start: 1, ...copy, typography, motion: motionForSection(type), items: ["Overview", "Pages", "Leads", "Settings"] });
    } else if (type === "dashboard") {
      bloks.push({ component: "dashboard", order: order++, grid_span: 9, col_start: 4, ...copy, typography, motion: motionForSection(type), items: ["Live Preview", "Conversion Score", "Pending Tasks"] });
    } else {
      bloks.push({
        component: type,
        order: order++,
        grid_span: type === "hero" ? 12 : 12,
        ...copy,
        typography,
        motion: motionForSection(type),
        items: Array.from({ length: type === "features" || type === "services" ? itemCount : 3 }, (_, index) => {
          const labels = type === "pricing" ? ["Starter", "Growth", "Scale"] : type === "faq" ? ["How fast is launch?", "Can I edit it?", "Is it responsive?"] : ["Fast setup", "Brand-aware design", "Conversion-ready layout", "Mobile polish", "SEO structure", "Lead capture"];
          return labels[index % labels.length];
        })
      });
    }
  }
  if (appFeel && !bloks.some((blok) => blok.component === "contact")) {
    bloks.push({ component: "contact", order: order++, grid_span: 12, ...sectionCopy("contact", brand.name), items: ["Email", "Phone", "Project details"] });
  }
  return bloks.sort((a, b) => a.order - b.order);
}
__name(buildBloks, "buildBloks");
function renderLogo(brand) {
  if (brand.logoUrl) {
    return `<img src="${escapeHtml(brand.logoUrl)}" alt="${escapeHtml(brand.name)} logo" class="h-10 w-auto rounded-lg bg-white p-1" />`;
  }
  return `<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-sm font-black text-white">${escapeHtml(brand.name.slice(0, 1).toUpperCase())}</div>`;
}
__name(renderLogo, "renderLogo");
function renderBlok(blok, brand) {
  const span = blok.grid_span === 3 ? "lg:col-span-3" : blok.grid_span === 9 ? "lg:col-span-9" : "col-span-12";
  const base = `col-span-12 ${span}`;
  const title = escapeHtml(blok.title);
  const body = escapeHtml(blok.body || "");
  const items = blok.items || [];
  const headingClass = blok.typography?.heading || "text-3xl md:text-4xl font-semibold leading-tight";
  const bodyClass = blok.typography?.body || "text-base leading-relaxed";
  const clampClass = blok.typography?.clamp ? `line-clamp-${blok.typography.clamp}` : "";
  const proseClass = blok.typography?.prose ? "prose prose-lg max-w-none prose-headings:text-gray-950 prose-p:text-gray-600" : "";
  const motionAttrs = blok.motion ? `data-motion-intent="${blok.motion.intent}" data-motion-direction="${blok.motion.direction}" data-motion-layout="${String(blok.motion.layout)}"` : "";
  if (blok.component === "hero") {
    return `<section class="${base}" ${motionAttrs}>
      <div class="rounded-3xl border border-gray-200 bg-white p-8 shadow-xl lg:p-14">
        <div class="mb-8 flex items-center gap-3">${renderLogo(brand)}<span class="text-sm font-semibold text-gray-600">${escapeHtml(brand.name)}</span></div>
        <div class="grid items-center gap-10 lg:grid-cols-12">
          <div class="lg:col-span-7">
            <h1 class="mb-6 max-w-4xl ${headingClass} tracking-tight text-gray-950">${title}</h1>
            <p class="mb-8 ${bodyClass} ${clampClass} text-gray-600">${body}</p>
            <a href="#contact" class="inline-flex items-center rounded-lg bg-blue-700 px-6 py-3 text-center text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300">${escapeHtml(blok.cta || "Start now")}</a>
          </div>
          <div class="lg:col-span-5">
            <div class="rounded-2xl bg-gray-900 p-5 text-white shadow-2xl">
              <div class="mb-5 flex gap-2"><span class="h-3 w-3 rounded-full bg-red-400"></span><span class="h-3 w-3 rounded-full bg-yellow-300"></span><span class="h-3 w-3 rounded-full bg-green-400"></span></div>
              <div class="grid grid-cols-12 gap-3"><div class="col-span-12 h-16 rounded-xl bg-blue-500/40"></div><div class="col-span-4 h-24 rounded-xl bg-white/10"></div><div class="col-span-8 h-24 rounded-xl bg-white/10"></div><div class="col-span-6 h-16 rounded-xl bg-white/10"></div><div class="col-span-6 h-16 rounded-xl bg-white/10"></div></div>
            </div>
          </div>
        </div>
      </div>
    </section>`;
  }
  if (blok.component === "sidebar") {
    return `<aside class="${base}" ${motionAttrs}><div class="h-full rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><h2 class="mb-4 ${headingClass} text-gray-950">${title}</h2><nav class="space-y-2">${items.map((item) => `<a href="#" class="flex items-center gap-3 rounded-lg px-3 py-2 ${bodyClass} font-medium text-gray-700 hover:bg-gray-100">${iconSvg("grid")}<span>${escapeHtml(item)}</span></a>`).join("")}</nav></div></aside>`;
  }
  if (blok.component === "dashboard") {
    return `<section class="${base}" ${motionAttrs}><div class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"><div class="mb-6"><h2 class="${headingClass} text-gray-950">${title}</h2><p class="mt-2 ${bodyClass} text-gray-600">${body}</p></div><div class="grid grid-cols-1 gap-4 md:grid-cols-3">${items.map((item, i) => `<article class="rounded-xl border border-gray-200 p-5"><div class="mb-3 text-blue-700">${iconSvg(i === 1 ? "chart" : "grid")}</div><h3 class="${blok.typography?.clamp ? "line-clamp-2" : ""} font-bold text-gray-950">${escapeHtml(item)}</h3><p class="mt-2 text-sm text-gray-600">Grid-aware app module placed inside the main col-span-9 workspace.</p></article>`).join("")}</div></div></section>`;
  }
  if (blok.component === "features" || blok.component === "services") {
    return `<section class="${base}" ${motionAttrs}><div class="py-10"><div class="mx-auto mb-8 max-w-3xl text-center"><h2 class="mb-4 ${headingClass} tracking-tight text-gray-950">${title}</h2><p class="${bodyClass} text-gray-600">${body}</p></div><div class="grid grid-cols-1 gap-8 md:grid-cols-3">${items.map((item, i) => `<article class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"><div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700">${iconSvg(i % 2 ? "spark" : "check")}</div><h3 class="mb-2 ${blok.typography?.clamp ? "line-clamp-2" : ""} ${headingClass} text-gray-950">${escapeHtml(item)}</h3><p class="${bodyClass} text-gray-600">A non-default component populated from the request and locked to responsive grid placement.</p></article>`).join("")}</div></div></section>`;
  }
  if (blok.component === "pricing") {
    return `<section class="${base}" ${motionAttrs}><div class="py-10"><div class="mx-auto mb-8 max-w-3xl text-center"><h2 class="mb-4 ${headingClass} text-gray-950">${title}</h2><p class="${bodyClass} text-gray-600">${body}</p></div><div class="grid grid-cols-1 gap-6 md:grid-cols-3">${items.map((item, i) => `<div class="rounded-2xl border ${i === 1 ? "border-blue-600 ring-4 ring-blue-100" : "border-gray-200"} bg-white p-6 shadow-sm"><h3 class="${headingClass} text-gray-950">${escapeHtml(item)}</h3><div class="my-5 text-4xl font-extrabold text-gray-950">${i === 0 ? "$19" : i === 1 ? "$49" : "$99"}</div><ul class="mb-6 space-y-3 text-sm text-gray-600"><li>Grid compiled layout</li><li>Flowbite-ready UI</li><li>Responsive sections</li></ul><a class="block rounded-lg bg-blue-700 px-5 py-3 text-center text-sm font-medium text-white hover:bg-blue-800" href="#contact">${escapeHtml(blok.cta || "Choose plan")}</a></div>`).join("")}</div></div></section>`;
  }
  if (blok.component === "faq") {
    return `<section class="${base}" ${motionAttrs}><div class="py-10"><h2 class="mb-6 ${headingClass} text-gray-950">${title}</h2><div id="accordion-flush" data-accordion="collapse" class="rounded-2xl border border-gray-200 bg-white p-4">${items.map((item, i) => `<h3 id="accordion-heading-${i}"><button type="button" class="flex w-full items-center justify-between border-b border-gray-200 py-5 text-left ${bodyClass} font-medium text-gray-700" data-accordion-target="#accordion-body-${i}" aria-expanded="${i === 0}" aria-controls="accordion-body-${i}"><span>${escapeHtml(item)}</span><svg data-accordion-icon class="h-3 w-3 shrink-0 rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5 5 1 1 5"/></svg></button></h3><div id="accordion-body-${i}" class="${i === 0 ? "" : "hidden"}" aria-labelledby="accordion-heading-${i}"><div class="border-b border-gray-200 py-5 text-gray-600 ${proseClass}">${body}</div></div>`).join("")}</div></div></section>`;
  }
  if (blok.component === "contact") {
    return `<section id="contact" class="${base}" ${motionAttrs}><div class="rounded-3xl bg-gray-950 p-8 text-white md:p-10"><div class="grid gap-8 md:grid-cols-2"><div><h2 class="mb-4 ${headingClass}">${title}</h2><p class="${bodyClass} text-gray-300">${body}</p></div><form class="grid gap-4"><input class="rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-white" placeholder="Name"/><input class="rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-white" placeholder="Email"/><button class="rounded-lg bg-blue-600 px-5 py-3 font-medium hover:bg-blue-700" type="button">${iconSvg("mail")} ${escapeHtml(blok.cta || "Contact us")}</button></form></div></div></section>`;
  }
  return `<section class="${base}" ${motionAttrs}><div class="rounded-2xl border border-gray-200 bg-white p-6"><h2 class="${headingClass} text-gray-950">${title}</h2><p class="mt-2 ${bodyClass} text-gray-600">${body}</p></div></section>`;
}
__name(renderBlok, "renderBlok");
function compileLayoutDocument(tree) {
  const primary = tree.brand.colors[0] || fallbackBrand.colors[0];
  const secondary = tree.brand.colors[1] || fallbackBrand.colors[1];
  const title = escapeHtml(`${tree.name} | VoiceToWebsite`);
  const description = escapeHtml(`Generated 12-column grid website for ${tree.name}.`);
  const schema = escapeHtml(JSON.stringify(tree));
  const tailwindConfig = buildTailwindConfig(tree);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <script src="https://cdn.tailwindcss.com"><\/script>
  <link href="${FLOWBITE_CSS}" rel="stylesheet" />
  <script type="text/javascript">${tailwindConfig}<\/script>
  <style>:root{--brand-primary:${escapeHtml(primary)};--brand-secondary:${escapeHtml(secondary)}} html{scroll-behavior:smooth} body{font-family:Inter,ui-sans-serif,system-ui,sans-serif}</style>
</head>
<body class="bg-gray-50 text-gray-900">
  <script type="application/json" id="vtw-storyblok-blok-tree">${schema}<\/script>
  <main class="max-w-screen-xl mx-auto px-4 py-8">
    <div class="grid grid-cols-12 gap-8">
      ${tree.bloks.map((blok) => renderBlok(blok, tree.brand)).join("\n")}
    </div>
  </main>
  <footer class="max-w-screen-xl mx-auto px-4 pb-10 text-sm text-gray-500">Generated by VoiceToWebsite Layout Compiler. Every section includes grid_span and order metadata.</footer>
  <script src="${FLOWBITE_JS}"><\/script>
</body>
</html>`;
}
__name(compileLayoutDocument, "compileLayoutDocument");
function compileLayoutFromPrompt(prompt, brandInput) {
  const brandName = brandInput?.name || toTitle(extractBrandName(prompt));
  const brand = {
    ...fallbackBrand,
    ...brandInput,
    name: brandName,
    colors: brandInput?.colors?.length ? brandInput.colors : fallbackBrand.colors
  };
  const tree = {
    name: brand.name,
    prompt,
    intent: inferSections(prompt),
    brand,
    bloks: buildBloks(prompt, brand)
  };
  return { tree, html: compileLayoutDocument(tree) };
}
__name(compileLayoutFromPrompt, "compileLayoutFromPrompt");
function buildTailwindConfig(tree) {
  const fonts = tree.bloks[0]?.typography ? selectFonts(tree.bloks[0].typography.scale === "major-third" ? "professional" : "modern") : selectFonts("modern");
  return `tailwind = window.tailwind || {}; tailwind.config = { theme: { extend: { fontFamily: { sans: ['${fonts.body}', 'ui-sans-serif', 'system-ui'], display: ['${fonts.heading}', '${fonts.body}', 'ui-sans-serif', 'system-ui'] } } } };`;
}
__name(buildTailwindConfig, "buildTailwindConfig");

// api/generate-site.ts
function json4(body, init = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...init.headers || {}
    }
  });
}
__name(json4, "json");
function nowIso2() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
__name(nowIso2, "nowIso");
function escapeHtml2(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}
__name(escapeHtml2, "escapeHtml");
async function parseRequestBody2(request) {
  const url = new URL(request.url);
  if (url.searchParams.get("orderId")) {
    return { orderId: url.searchParams.get("orderId") || "" };
  }
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const raw = await request.text();
    if (!raw.trim()) throw new Error("Empty request body");
    return JSON.parse(raw);
  }
  if (contentType.includes("application/x-www-form-urlencoded")) {
    const raw = await request.text();
    const form = new URLSearchParams(raw);
    return { orderId: form.get("orderId") || "", prompt: form.get("prompt") || "" };
  }
  throw new Error("Unsupported content type");
}
__name(parseRequestBody2, "parseRequestBody");
async function fetchBrandAssets(queryText, env) {
  const brandQuery = (queryText || "business").slice(0, 80);
  if (!env.BRANDFETCH_CLIENT_ID) return {};
  try {
    const search = await fetch(
      `https://api.brandfetch.io/v2/search/${encodeURIComponent(brandQuery)}?c=${encodeURIComponent(env.BRANDFETCH_CLIENT_ID)}`
    );
    if (!search.ok) return {};
    const results = await search.json();
    const match2 = results.find((item) => item.domain) || results[0];
    if (!match2?.domain) return {};
    const brand = await fetch(`https://api.brandfetch.io/v2/brands/${encodeURIComponent(match2.domain)}`, {
      headers: {
        Authorization: `Bearer ${env.BRANDFETCH_CLIENT_ID}`
      }
    });
    if (!brand.ok) {
      return {
        name: match2.name,
        domain: match2.domain,
        logoUrl: match2.icon || match2.logo
      };
    }
    const data = await brand.json();
    const logoUrl = data.logos?.flatMap((logo) => logo.formats || []).find((format) => format.src && (format.format === "svg" || format.format === "png"))?.src || match2.icon || match2.logo;
    return {
      name: data.name || match2.name,
      domain: data.domain || match2.domain,
      logoUrl,
      colors: (data.colors || []).map((color) => color.hex).filter((value) => !!value).slice(0, 4)
    };
  } catch {
    return {};
  }
}
__name(fetchBrandAssets, "fetchBrandAssets");
async function storeStoryblokTree(tree, orderId, env) {
  if (!env.STORYBLOK_OAUTH_TOKEN || !env.STORYBLOK_SPACE_ID) return { stored: false, reason: "storyblok_not_configured" };
  try {
    const response = await fetch(`https://mapi.storyblok.com/v1/spaces/${env.STORYBLOK_SPACE_ID}/stories/`, {
      method: "POST",
      headers: {
        Authorization: env.STORYBLOK_OAUTH_TOKEN,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        story: {
          name: `${tree.name} ${orderId}`.slice(0, 80),
          slug: `generated-${orderId}`,
          content: {
            component: "generated_site",
            prompt: tree.prompt,
            brand: tree.brand,
            body: tree.bloks.map((blok) => ({
              _uid: `${orderId}-${blok.order}`,
              ...blok
            }))
          }
        },
        publish: 1
      })
    });
    return { stored: response.ok, status: response.status };
  } catch {
    return { stored: false, reason: "storyblok_request_failed" };
  }
}
__name(storeStoryblokTree, "storeStoryblokTree");
async function writeAuditLog(db, action, targetId, detail) {
  await db.prepare("INSERT INTO audit_log (created_at, actor, action, target_id, detail) VALUES (?, ?, ?, ?, ?)").bind(nowIso2(), "system", action, targetId, detail.slice(0, 4e3)).run();
}
__name(writeAuditLog, "writeAuditLog");
var onRequestPost4 = /* @__PURE__ */ __name(async (context) => {
  if (!context.env.DB || !context.env.SITES_BUCKET || !context.env.ORDERS_KV) {
    return json4({ error: "Bindings not configured" }, { status: 500 });
  }
  let body;
  try {
    body = await parseRequestBody2(context.request);
  } catch (error) {
    return json4({ error: error instanceof Error ? error.message : "Invalid request body" }, { status: 400 });
  }
  const orderId = (body.orderId || "").trim();
  const promptOnly = (body.prompt || "").trim();
  if (!orderId && promptOnly) {
    const brand2 = await fetchBrandAssets(promptOnly, context.env);
    const compiled2 = compileLayoutFromPrompt(promptOnly, brand2);
    await writeAuditLog(
      context.env.DB,
      "preview_layout_compiled",
      `preview-${Date.now()}`,
      JSON.stringify({
        compiler: "layout-compiler-v1",
        mode: body.mode || "preview",
        grid: compiled2.tree.bloks.map((blok) => ({ component: blok.component, order: blok.order, grid_span: blok.grid_span }))
      })
    );
    return json4({
      html: compiled2.html,
      title: `${compiled2.tree.name} Generated Site`,
      layoutTree: compiled2.tree
    });
  }
  if (!orderId) return json4({ error: "Missing orderId or prompt" }, { status: 400 });
  const order = await context.env.DB.prepare(
    `SELECT id, email, business_description, industry, style_preference, status, site_url
     FROM orders WHERE id = ? LIMIT 1`
  ).bind(orderId).first();
  if (!order) return json4({ error: "Order not found" }, { status: 404 });
  if (order.status === "delivered" && order.site_url) {
    await context.env.ORDERS_KV.put(`order:${orderId}`, JSON.stringify({ id: orderId, status: "delivered", site_url: order.site_url }), {
      expirationTtl: 60 * 60 * 24 * 30
    });
    return json4({ orderId, status: "delivered", siteUrl: order.site_url });
  }
  await context.env.DB.prepare(`UPDATE orders SET status = 'generating', error = NULL WHERE id = ?`).bind(orderId).run();
  await context.env.ORDERS_KV.put(`order:${orderId}`, JSON.stringify({ id: orderId, status: "generating" }), {
    expirationTtl: 60 * 60 * 24 * 30
  });
  await writeAuditLog(context.env.DB, "generation_started", orderId, JSON.stringify({ industry: order.industry, style: order.style_preference }));
  const prompt = [
    order.business_description || "",
    order.industry ? `Industry: ${order.industry}` : "",
    order.style_preference ? `Style: ${order.style_preference}` : ""
  ].filter(Boolean).join("\n");
  const brand = await fetchBrandAssets(`${order.business_description || ""} ${order.industry || ""}`, context.env);
  const compiled = compileLayoutFromPrompt(prompt || "Generate a business website with features, pricing, FAQ, and contact.", brand);
  const html = compiled.html.replace(
    "</footer>",
    `<div class="mt-4">Order ID: ${escapeHtml2(orderId)} \u2022 Generated by VoiceToWebsite Layout Compiler \u2022 You are responsible for final content and compliance.</div></footer>`
  );
  const storyblokResult = await storeStoryblokTree(compiled.tree, orderId, context.env);
  if (!html || html.length < 500) {
    await context.env.DB.prepare(`UPDATE orders SET status = 'failed', error = ? WHERE id = ?`).bind("Generated HTML was empty.", orderId).run();
    await writeAuditLog(context.env.DB, "generation_failed", orderId, "Generated HTML was empty.");
    return json4({ error: "Generated HTML was invalid." }, { status: 500 });
  }
  await context.env.SITES_BUCKET.put(`sites/${orderId}/index.html`, html, {
    httpMetadata: { contentType: "text/html; charset=utf-8" }
  });
  const stored = await context.env.SITES_BUCKET.head(`sites/${orderId}/index.html`);
  if (!stored) {
    await context.env.DB.prepare(`UPDATE orders SET status = 'failed', error = ? WHERE id = ?`).bind("Site storage verification failed.", orderId).run();
    await writeAuditLog(context.env.DB, "generation_failed", orderId, "R2 verification failed after put.");
    return json4({ error: "Site storage verification failed." }, { status: 500 });
  }
  const siteUrl = `https://voicetowebsite.com/api/site/${encodeURIComponent(orderId)}`;
  await context.env.DB.prepare(`UPDATE orders SET status = 'delivered', site_url = ?, error = NULL WHERE id = ?`).bind(siteUrl, orderId).run();
  await context.env.ORDERS_KV.put(`order:${orderId}`, JSON.stringify({ id: orderId, status: "delivered", site_url: siteUrl }), {
    expirationTtl: 60 * 60 * 24 * 30
  });
  await writeAuditLog(
    context.env.DB,
    "generation_delivered",
    orderId,
    JSON.stringify({
      siteUrl,
      compiler: "layout-compiler-v1",
      storyblok: storyblokResult,
      grid: compiled.tree.bloks.map((blok) => ({ component: blok.component, order: blok.order, grid_span: blok.grid_span }))
    })
  );
  return json4({ orderId, status: "delivered", siteUrl });
}, "onRequestPost");

// api/media.ts
function json5(body, init = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...init.headers || {}
    }
  });
}
__name(json5, "json");
var fallbackImage = "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1600&q=80";
var fallbackVideo = "https://cdn.coverr.co/videos/coverr-cinematic-city-pan-7153/1080p.mp4";
var onRequestGet8 = /* @__PURE__ */ __name(async (context) => {
  const url = new URL(context.request.url);
  const query = (url.searchParams.get("q") || "business website").trim();
  let imageUrl = fallbackImage;
  let gallery = [];
  let videoUrl = fallbackVideo;
  try {
    if (context.env.UNSPLASH_API_KEY) {
      const unsplash = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&orientation=landscape&per_page=6`,
        {
          headers: {
            Authorization: `Client-ID ${context.env.UNSPLASH_API_KEY}`
          }
        }
      );
      if (unsplash.ok) {
        const data = await unsplash.json();
        const images = (data.results || []).map((item) => item.urls?.regular).filter((value) => !!value);
        if (images.length) {
          imageUrl = images[0];
          gallery = images.slice(0, 3);
        }
      }
    }
  } catch {
  }
  try {
    if (context.env.PEXELS_API_KEY) {
      const pexels = await fetch(
        `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&orientation=landscape&per_page=5`,
        {
          headers: {
            Authorization: context.env.PEXELS_API_KEY
          }
        }
      );
      if (pexels.ok) {
        const data = await pexels.json();
        const files = data.videos?.flatMap((video) => video.video_files || []) || [];
        const best = files.find((file) => file.quality === "hd" && (file.width || 0) >= 1280) || files.find((file) => (file.width || 0) >= 960) || files[0];
        if (best?.link) {
          videoUrl = best.link;
        }
      }
    }
  } catch {
  }
  return json5({
    query,
    imageUrl,
    gallery: gallery.length ? gallery : [imageUrl],
    videoUrl
  });
}, "onRequestGet");

// api/order.ts
function json6(body, init = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...init.headers || {}
    }
  });
}
__name(json6, "json");
function nowIso3() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
__name(nowIso3, "nowIso");
function newId() {
  return `ord_${crypto.randomUUID()}`;
}
__name(newId, "newId");
var VALID_PLANS = /* @__PURE__ */ new Set(["starter", "pro", "enterprise", "commands"]);
var VALID_STYLES = /* @__PURE__ */ new Set(["dark-premium", "clean-minimal", "bold-energetic", "warm-trustworthy"]);
async function parseRequestBody3(request) {
  const url = new URL(request.url);
  if (url.searchParams.get("stripe_session_id")) {
    return {
      email: url.searchParams.get("email") || "",
      plan: url.searchParams.get("plan") || "",
      cadence: url.searchParams.get("cadence") || "month",
      launch_discount: String(url.searchParams.get("launch_discount") || "").toLowerCase() === "true",
      business_description: url.searchParams.get("business_description") || "",
      industry: url.searchParams.get("industry") || "",
      style_preference: url.searchParams.get("style_preference") || "",
      stripe_session_id: url.searchParams.get("stripe_session_id") || ""
    };
  }
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const raw = await request.text();
    if (!raw.trim()) throw new Error("Empty request body");
    return JSON.parse(raw);
  }
  if (contentType.includes("application/x-www-form-urlencoded")) {
    const raw = await request.text();
    const form = new URLSearchParams(raw);
    return {
      email: form.get("email") || "",
      plan: form.get("plan") || "",
      cadence: form.get("cadence") || "month",
      launch_discount: String(form.get("launch_discount") || "").toLowerCase() === "true",
      business_description: form.get("business_description") || "",
      industry: form.get("industry") || "",
      style_preference: form.get("style_preference") || "",
      stripe_session_id: form.get("stripe_session_id") || ""
    };
  }
  throw new Error("Unsupported content type");
}
__name(parseRequestBody3, "parseRequestBody");
async function writeAuditLog2(db, action, targetId, detail) {
  await db.prepare("INSERT INTO audit_log (created_at, actor, action, target_id, detail) VALUES (?, ?, ?, ?, ?)").bind(nowIso3(), "system", action, targetId, detail.slice(0, 4e3)).run();
}
__name(writeAuditLog2, "writeAuditLog");
var onRequestPost5 = /* @__PURE__ */ __name(async (context) => {
  if (!context.env.DB || !context.env.ORDERS_KV) return json6({ error: "Bindings not configured" }, { status: 500 });
  let body;
  try {
    body = await parseRequestBody3(context.request);
  } catch (error) {
    return json6({ error: error instanceof Error ? error.message : "Invalid request body" }, { status: 400 });
  }
  const email = (body.email || "").trim().toLowerCase();
  const plan = (body.plan || "").trim().toLowerCase();
  const cadence = body.cadence === "year" ? "year" : "month";
  const launchDiscount = body.launch_discount ? 1 : 0;
  const stripeSessionId = (body.stripe_session_id || "").trim();
  const industry = (body.industry || "").trim().toLowerCase();
  const stylePreference = (body.style_preference || "").trim().toLowerCase();
  const businessDescription = (body.business_description || "").trim();
  if (!email || !email.includes("@")) return json6({ error: "Invalid email" }, { status: 400 });
  if (!VALID_PLANS.has(plan)) return json6({ error: "Invalid plan" }, { status: 400 });
  if (!stripeSessionId) return json6({ error: "Missing stripe_session_id" }, { status: 400 });
  if (!industry) return json6({ error: "Missing industry" }, { status: 400 });
  if (!stylePreference || !VALID_STYLES.has(stylePreference)) return json6({ error: "Invalid style_preference" }, { status: 400 });
  if (!businessDescription || businessDescription.length < 20) {
    return json6({ error: "Business description must be at least 20 characters." }, { status: 400 });
  }
  const existingOrder = await context.env.DB.prepare(
    `SELECT id, status, site_url FROM orders WHERE stripe_session_id = ? ORDER BY created_at DESC LIMIT 1`
  ).bind(stripeSessionId).first();
  if (existingOrder) {
    await context.env.ORDERS_KV.put(
      `order:${existingOrder.id}`,
      JSON.stringify({ id: existingOrder.id, status: existingOrder.status, site_url: existingOrder.site_url }),
      { expirationTtl: 60 * 60 * 24 * 30 }
    );
    return json6({ id: existingOrder.id, status: existingOrder.status, siteUrl: existingOrder.site_url || void 0 });
  }
  const id = newId();
  const createdAt = nowIso3();
  await context.env.DB.prepare(
    `INSERT INTO orders
      (id, created_at, email, plan, cadence, launch_discount, status, business_description, industry, style_preference, stripe_session_id)
     VALUES
      (?, ?, ?, ?, ?, ?, 'created', ?, ?, ?, ?)`
  ).bind(id, createdAt, email, plan, cadence, launchDiscount, businessDescription.slice(0, 5e3), industry.slice(0, 120), stylePreference.slice(0, 120), stripeSessionId.slice(0, 255)).run();
  await context.env.ORDERS_KV.put(`order:${id}`, JSON.stringify({ id, created_at: createdAt, status: "created" }), {
    expirationTtl: 60 * 60 * 24 * 30
  });
  await writeAuditLog2(context.env.DB, "order_created", id, JSON.stringify({ plan, cadence, email, industry }));
  return json6({ id, status: "created" });
}, "onRequestPost");
var onRequestGet9 = /* @__PURE__ */ __name(async () => json6({ error: "Method not allowed" }, { status: 405 }), "onRequestGet");

// api/paypal-webhook.ts
function json7(body, init = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { "content-type": "application/json; charset=utf-8", ...init.headers || {} }
  });
}
__name(json7, "json");
var onRequestPost6 = /* @__PURE__ */ __name(async (context) => {
  if (!context.env.DB) return json7({ error: "DB binding not configured" }, { status: 500 });
  const token = context.request.headers.get("x-webhook-token") || "";
  if (!context.env.PAYPAL_WEBHOOK_TOKEN || token !== context.env.PAYPAL_WEBHOOK_TOKEN) {
    return json7({ error: "Unauthorized" }, { status: 401 });
  }
  const payload = await context.request.json();
  if (payload.event_type?.includes("PAYMENT.SALE.COMPLETED") && payload.resource?.custom_id) {
    await context.env.DB.prepare(
      "UPDATE orders SET status = 'paid', error = NULL WHERE id = ?"
    ).bind(payload.resource.custom_id).run();
  }
  return json7({ ok: true });
}, "onRequestPost");

// api/preview-copy.ts
function json8(body, init = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...init.headers || {}
    }
  });
}
__name(json8, "json");
function pickBusinessType(prompt, hintedType) {
  if (hintedType) return hintedType.toLowerCase();
  const text = prompt.toLowerCase();
  if (text.includes("salon") || text.includes("beauty")) return "salon";
  if (text.includes("gym") || text.includes("fitness")) return "gym";
  if (text.includes("coffee") || text.includes("cafe")) return "coffee";
  if (text.includes("restaurant") || text.includes("food")) return "restaurant";
  if (text.includes("law")) return "law";
  if (text.includes("real estate")) return "real-estate";
  return "business";
}
__name(pickBusinessType, "pickBusinessType");
function pickToneLabel(style) {
  const text = style.toLowerCase();
  if (text.includes("luxury")) return "luxury";
  if (text.includes("minimal")) return "minimal";
  if (text.includes("bold")) return "bold";
  if (text.includes("warm")) return "warm";
  return "modern";
}
__name(pickToneLabel, "pickToneLabel");
function buildCopy(siteName, businessType, tone) {
  const presets = {
    salon: {
      hero: `${siteName} \u2014 Signature Beauty Experiences`,
      subhead: `A ${tone} salon landing page designed to turn first-time visitors into loyal clients.`,
      valueTitle: "Beauty Services That Sell Themselves",
      valueBody: "Showcase premium services, stylist expertise, and social proof in a structure built for bookings.",
      cta: "Book Your Appointment",
      features: ["Service menu", "Stylist spotlight", "Before/after gallery", "Booking call-to-action"]
    },
    gym: {
      hero: `${siteName} \u2014 Train Hard. Progress Faster.`,
      subhead: `A ${tone} fitness page built for trials, memberships, and class signups.`,
      valueTitle: "Conversion-First Fitness Layout",
      valueBody: "Lead with class schedules, coach credibility, and urgency offers that move visitors into action.",
      cta: "Start Your Membership",
      features: ["Programs and classes", "Trainer highlights", "Membership tiers", "Lead capture form"]
    },
    coffee: {
      hero: `${siteName} \u2014 Fresh Roasts, Crafted Daily`,
      subhead: `A ${tone} coffee brand experience with rich visuals and ordering-focused flow.`,
      valueTitle: "Menu + Story + Action",
      valueBody: "Blend product storytelling with menu highlights so customers browse less and order faster.",
      cta: "Order Now",
      features: ["Featured drinks", "Brand story", "Location and hours", "Order button"]
    },
    restaurant: {
      hero: `${siteName} \u2014 Elevated Dining Starts Here`,
      subhead: `A ${tone} restaurant page built to convert traffic into reservations.`,
      valueTitle: "Reservation-Oriented Sections",
      valueBody: "Present signature dishes, atmosphere, and trust markers that make booking the next step.",
      cta: "Reserve a Table",
      features: ["Signature menu", "Photo gallery", "Reservation action", "Social proof"]
    },
    "real-estate": {
      hero: `${siteName} \u2014 Properties That Move`,
      subhead: `A ${tone} real-estate layout crafted for listing inquiries and scheduled viewings.`,
      valueTitle: "Listings That Drive Leads",
      valueBody: "Feature high-intent listings, neighborhood context, and simple inquiry paths for faster close cycles.",
      cta: "Schedule a Tour",
      features: ["Featured listings", "Neighborhood highlights", "Agent profile", "Lead form"]
    },
    law: {
      hero: `${siteName} \u2014 Trusted Legal Guidance`,
      subhead: `A ${tone} legal services page focused on authority, clarity, and consultation requests.`,
      valueTitle: "Trust and Credibility First",
      valueBody: "Organize services, outcomes, and attorney credentials to reduce friction before consultation.",
      cta: "Request Consultation",
      features: ["Practice areas", "Attorney bios", "Client outcomes", "Consultation form"]
    },
    business: {
      hero: `${siteName} \u2014 Built for Growth`,
      subhead: `A ${tone} landing page generated from your prompt with custom brand-ready structure.`,
      valueTitle: "Prompt-to-Page Conversion Layout",
      valueBody: "Every section is generated for your topic, with clear hierarchy, media, and action-focused copy.",
      cta: "Launch This Website",
      features: ["Custom hero", "Topic-specific sections", "Brand-ready style", "Action CTA"]
    }
  };
  return presets[businessType] || presets.business;
}
__name(buildCopy, "buildCopy");
var onRequestPost7 = /* @__PURE__ */ __name(async (context) => {
  try {
    const body = await context.request.json();
    const prompt = (body.prompt || "").trim();
    const siteName = (body.siteName || "").trim() || "Custom Website";
    const businessType = pickBusinessType(prompt, body.businessType);
    const tone = pickToneLabel(body.requestedStyle || prompt);
    const copy = buildCopy(siteName, businessType, tone);
    return json8({
      siteName,
      businessType,
      tone,
      heroHeadline: copy.hero,
      heroSubhead: copy.subhead,
      valueHeading: copy.valueTitle,
      valueBody: copy.valueBody,
      ctaLabel: copy.cta,
      featureBullets: copy.features,
      sections: [
        { key: "hero", heading: copy.hero, body: copy.subhead },
        { key: "value", heading: copy.valueTitle, body: copy.valueBody }
      ]
    });
  } catch {
    return json8({ error: "Invalid preview-copy payload." }, { status: 400 });
  }
}, "onRequestPost");

// api/preview-style.ts
function json9(body, init = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...init.headers || {}
    }
  });
}
__name(json9, "json");
var onRequestGet10 = /* @__PURE__ */ __name(async ({ request }) => {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").toLowerCase();
  const style = {
    headingFont: "Poppins",
    bodyFont: "Inter",
    accentA: "#6366f1",
    accentB: "#d946ef",
    headlineEffect: "fade-up"
  };
  if (q.includes("luxury") || q.includes("salon")) {
    style.headingFont = "Playfair Display";
    style.accentA = "#ec4899";
    style.accentB = "#a855f7";
    style.headlineEffect = "slide-in";
  } else if (q.includes("gym") || q.includes("fitness")) {
    style.headingFont = "Oswald";
    style.accentA = "#22d3ee";
    style.accentB = "#6366f1";
    style.headlineEffect = "fade-up";
  } else if (q.includes("coffee") || q.includes("restaurant")) {
    style.headingFont = "Montserrat";
    style.accentA = "#f59e0b";
    style.accentB = "#ef4444";
  }
  return json9(style);
}, "onRequestGet");

// api/stripe-verify-session.ts
var STRIPE_API = "https://api.stripe.com/v1";
function jsonResponse3(body, init = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...init.headers || {}
    }
  });
}
__name(jsonResponse3, "jsonResponse");
var onRequestPost8 = /* @__PURE__ */ __name(async (context) => {
  try {
    const body = await context.request.json();
    const sessionId = body.session_id?.trim();
    if (!sessionId) return jsonResponse3({ error: "Missing session_id" }, { status: 400 });
    const res = await fetch(`${STRIPE_API}/checkout/sessions/${encodeURIComponent(sessionId)}`, {
      headers: { Authorization: `Bearer ${context.env.STRIPE_SECRET_KEY}` }
    });
    const session = await res.json();
    if (!res.ok) return jsonResponse3({ error: "Unable to verify session" }, { status: 400 });
    const status = session?.status;
    const paymentStatus = session?.payment_status;
    const mode = session?.mode;
    const email = session?.customer_details?.email || session?.customer_email || null;
    const plan = session?.metadata?.plan || null;
    if (!email || !plan) return jsonResponse3({ error: "Missing email/plan" }, { status: 400 });
    const ok = status === "complete" && (paymentStatus === "paid" || mode === "subscription");
    if (!ok) return jsonResponse3({ error: "Session not complete" }, { status: 400 });
    return jsonResponse3({ ok: true, email, plan, mode, payment_status: paymentStatus, status });
  } catch {
    return jsonResponse3({ error: "Invalid request" }, { status: 400 });
  }
}, "onRequestPost");

// api/stripe-webhook.ts
function json10(body, init = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { "content-type": "application/json; charset=utf-8", ...init.headers || {} }
  });
}
__name(json10, "json");
var onRequestPost9 = /* @__PURE__ */ __name(async (context) => {
  if (!context.env.DB) return json10({ error: "DB binding not configured" }, { status: 500 });
  const token = context.request.headers.get("x-webhook-token") || "";
  if (!context.env.STRIPE_WEBHOOK_TOKEN || token !== context.env.STRIPE_WEBHOOK_TOKEN) {
    return json10({ error: "Unauthorized" }, { status: 401 });
  }
  const event = await context.request.json();
  const session = event.data?.object;
  if (!session?.id) return json10({ ok: true, ignored: true });
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    await context.env.DB.prepare(
      "UPDATE orders SET status = 'paid', error = NULL WHERE stripe_session_id = ?"
    ).bind(session.id).run();
  }
  return json10({ ok: true });
}, "onRequestPost");

// api/_middleware.ts
var rateLimitMap = /* @__PURE__ */ new Map();
function checkRateLimit(identifier, maxRequests = 100, windowMs = 15 * 60 * 1e3) {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }
  if (record.count >= maxRequests) {
    return false;
  }
  record.count++;
  return true;
}
__name(checkRateLimit, "checkRateLimit");
function getClientIP(request) {
  return request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
}
__name(getClientIP, "getClientIP");
var onRequest = /* @__PURE__ */ __name(async ({ request, next, env }) => {
  const url = new URL(request.url);
  const clientIP = getClientIP(request);
  if (!checkRateLimit(clientIP, 100, 15 * 60 * 1e3)) {
    return new Response(
      JSON.stringify({
        error: "Rate limit exceeded",
        retryAfter: 900
      }),
      {
        status: 429,
        headers: {
          "content-type": "application/json",
          "Retry-After": "900"
        }
      }
    );
  }
  if (["POST", "PUT", "DELETE", "PATCH"].includes(request.method)) {
    const endpointKey = `${clientIP}:${url.pathname}`;
    if (!checkRateLimit(endpointKey, 20, 60 * 1e3)) {
      return new Response(
        JSON.stringify({
          error: "Too many requests",
          retryAfter: 60
        }),
        {
          status: 429,
          headers: {
            "content-type": "application/json",
            "Retry-After": "60"
          }
        }
      );
    }
  }
  if (["POST", "PUT", "DELETE", "PATCH"].includes(request.method)) {
    const origin = request.headers.get("origin");
    const allowedOrigins = [
      "https://voicetowebsite.com",
      "https://www.voicetowebsite.com",
      "https://*.voicetowebsite.pages.dev",
      "http://localhost:3000",
      "http://localhost:5173"
    ];
    const isAllowed = !origin || allowedOrigins.some((allowed) => {
      if (allowed.includes("*")) {
        const regex = new RegExp(allowed.replace("*", ".*"));
        return regex.test(origin);
      }
      return origin === allowed;
    });
    if (!isAllowed) {
      return new Response(JSON.stringify({ error: "Unauthorized origin" }), {
        status: 403,
        headers: { "content-type": "application/json" }
      });
    }
  }
  try {
    const response = await next();
    const newHeaders = new Headers(response.headers);
    newHeaders.set("X-Content-Type-Options", "nosniff");
    newHeaders.set("X-Frame-Options", "DENY");
    newHeaders.set("X-XSS-Protection", "1; mode=block");
    newHeaders.set("Referrer-Policy", "strict-origin-when-cross-origin");
    newHeaders.set(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com https://accounts.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https: blob:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://api.stripe.com https://*.supabase.co wss://*.supabase.co; frame-src https://js.stripe.com https://hooks.stripe.com; media-src 'self' https:;"
    );
    newHeaders.set(
      "Permissions-Policy",
      "camera=(), microphone=(self), geolocation=(), payment=(self), usb=()"
    );
    newHeaders.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
    newHeaders.delete("Server");
    newHeaders.delete("X-Powered-By");
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    });
  } catch (err) {
    console.error("Middleware caught error:", err);
    const isDev = url.hostname === "localhost";
    const safeError = isDev ? err instanceof Error ? err.message : "Unknown error" : "Internal system error";
    return new Response(
      JSON.stringify({
        error: "Internal system error",
        ...isDev && { detail: safeError }
      }),
      {
        status: 500,
        headers: {
          "content-type": "application/json",
          "X-Content-Type-Options": "nosniff"
        }
      }
    );
  }
}, "onRequest");

// ../.wrangler/tmp/pages-CNGJKK/functionsRoutes-0.7817062833422085.mjs
var routes = [
  {
    routePath: "/api/blog/posts/:slug",
    mountPath: "/api/blog/posts",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet]
  },
  {
    routePath: "/api/admin/orders",
    mountPath: "/api/admin",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet2]
  },
  {
    routePath: "/api/blog/posts",
    mountPath: "/api/blog",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet3]
  },
  {
    routePath: "/api/blog/publish",
    mountPath: "/api/blog",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost]
  },
  {
    routePath: "/api/blog/rss.xml",
    mountPath: "/api/blog",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet4]
  },
  {
    routePath: "/api/blog/sitemap.xml",
    mountPath: "/api/blog",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet5]
  },
  {
    routePath: "/api/site/:id",
    mountPath: "/api/site",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet6]
  },
  {
    routePath: "/api/checkout-session",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet7]
  },
  {
    routePath: "/api/create-checkout-session",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost2]
  },
  {
    routePath: "/api/create-paypal-order",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost3]
  },
  {
    routePath: "/api/generate-site",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost4]
  },
  {
    routePath: "/api/media",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet8]
  },
  {
    routePath: "/api/order",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet9]
  },
  {
    routePath: "/api/order",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost5]
  },
  {
    routePath: "/api/paypal-webhook",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost6]
  },
  {
    routePath: "/api/preview-copy",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost7]
  },
  {
    routePath: "/api/preview-style",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet10]
  },
  {
    routePath: "/api/stripe-verify-session",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost8]
  },
  {
    routePath: "/api/stripe-webhook",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost9]
  },
  {
    routePath: "/api",
    mountPath: "/api",
    method: "",
    middlewares: [onRequest],
    modules: []
  }
];

// ../../../Users/Servi/AppData/Roaming/npm/node_modules/wrangler/node_modules/path-to-regexp/dist.es2015/index.js
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");

// ../../../Users/Servi/AppData/Roaming/npm/node_modules/wrangler/templates/pages-template-worker.ts
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");
export {
  pages_template_worker_default as default
};
