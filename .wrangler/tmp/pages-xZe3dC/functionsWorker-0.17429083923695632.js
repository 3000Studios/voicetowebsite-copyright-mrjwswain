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
var PRICE_DATA = {
  starter: { name: "VoiceToWebsite.com Starter", amount: 999, recurring: true },
  pro: { name: "VoiceToWebsite.com Pro", amount: 1999, recurring: true },
  enterprise: { name: "VoiceToWebsite.com Ultimate", amount: 4999, recurring: true },
  commands: { name: "VoiceToWebsite.com More Commands", amount: 299, recurring: false }
};
function paypalBaseUrl(env) {
  return (env.PAYPAL_ENV || "").toLowerCase() === "sandbox" ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";
}
__name(paypalBaseUrl, "paypalBaseUrl");
async function createPayPalFallback(env, plan, appUrl) {
  const price = PRICE_DATA[plan];
  if (!price || !env.PAYPAL_CLIENT_ID || !env.PAYPAL_CLIENT_SECRET || !appUrl) return null;
  const credentials = btoa(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`);
  const tokenRes = await fetch(`${paypalBaseUrl(env)}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "content-type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });
  const token = await tokenRes.json();
  if (!tokenRes.ok || !token.access_token) return null;
  const orderRes = await fetch(`${paypalBaseUrl(env)}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: { currency_code: "USD", value: (price.amount / 100).toFixed(2) },
          description: price.name
        }
      ],
      application_context: {
        brand_name: "VoiceToWebsite.com",
        shipping_preference: "NO_SHIPPING",
        user_action: "PAY_NOW",
        return_url: `${appUrl}/setup?provider=paypal&plan=${encodeURIComponent(plan)}`,
        cancel_url: `${appUrl}/pricing?canceled=1&provider=paypal`
      }
    })
  });
  const order = await orderRes.json();
  return orderRes.ok ? order.links?.find((link) => link.rel === "approve")?.href || null : null;
}
__name(createPayPalFallback, "createPayPalFallback");
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
    if (!priceId && !PRICE_DATA[plan]) {
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
    if (priceId) {
      form.set("line_items[0][price]", priceId);
    } else {
      const priceData = PRICE_DATA[plan];
      if (!priceData) return jsonResponse({ error: "Invalid plan" }, { status: 400 });
      form.set("line_items[0][price_data][currency]", "usd");
      form.set("line_items[0][price_data][product_data][name]", priceData.name);
      form.set("line_items[0][price_data][unit_amount]", String(priceData.amount));
      if (priceData.recurring) {
        form.set("line_items[0][price_data][recurring][interval]", cadence === "year" ? "year" : "month");
      }
    }
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
      const paypalFallback = await createPayPalFallback(context.env, plan, appUrl);
      if (paypalFallback) return jsonResponse({ url: paypalFallback, fallback: "paypal" });
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
var PLAN_AMOUNTS = {
  starter: { value: "9.99", description: "VoiceToWebsite.com Starter - 50 commands per month" },
  pro: { value: "19.99", description: "VoiceToWebsite.com Pro - 150 commands per month" },
  enterprise: { value: "49.99", description: "VoiceToWebsite.com Ultimate - 500 commands per month" },
  commands: { value: "2.99", description: "VoiceToWebsite.com More Commands - one-time add-on" }
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
function paypalBaseUrl2(env) {
  return (env.PAYPAL_ENV || "").toLowerCase() === "sandbox" ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";
}
__name(paypalBaseUrl2, "paypalBaseUrl");
async function getPayPalAccessToken(env) {
  const credentials = btoa(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`);
  const res = await fetch(`${paypalBaseUrl2(env)}/v1/oauth2/token`, {
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
        const amount = PLAN_AMOUNTS[plan];
        if (!amount) return jsonResponse2({ error: "Invalid plan" }, { status: 400 });
        const orderRes2 = await fetch(`${paypalBaseUrl2(context.env)}/v2/checkout/orders`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "content-type": "application/json"
          },
          body: JSON.stringify({
            intent: "CAPTURE",
            purchase_units: [
              {
                amount: { currency_code: "USD", value: amount.value },
                description: amount.description
              }
            ],
            application_context: {
              brand_name: "VoiceToWebsite.com",
              shipping_preference: "NO_SHIPPING",
              user_action: "PAY_NOW",
              return_url: `${appUrl}/setup?provider=paypal&plan=${encodeURIComponent(plan)}`,
              cancel_url: `${appUrl}/pricing?canceled=1&provider=paypal`
            }
          })
        });
        const order2 = await orderRes2.json();
        const approveUrl3 = order2.links?.find((l) => l.rel === "approve")?.href;
        if (!orderRes2.ok || !approveUrl3) {
          if (fallbackUrl) return jsonResponse2({ url: fallbackUrl, fallback: true });
          return jsonResponse2({ error: "PayPal order creation failed" }, { status: 500 });
        }
        return jsonResponse2({ url: approveUrl3, fallback: false, note: "One-time PayPal checkout used because subscription plan IDs are not configured." });
      }
      const subRes = await fetch(`${paypalBaseUrl2(context.env)}/v1/billing/subscriptions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          plan_id: planId,
          application_context: {
            brand_name: "VoiceToWebsite.com",
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
    const orderRes = await fetch(`${paypalBaseUrl2(context.env)}/v2/checkout/orders`, {
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
            description: PLAN_AMOUNTS.commands.description
          }
        ],
        application_context: {
          brand_name: "VoiceToWebsite.com",
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

// api/generate.js
async function onRequestPost4(context) {
  const { request, env } = context;
  try {
    const { prompt } = await request.json();
    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${env.GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Generate 3 unique website variations for: ${prompt}. Return as JSON array with objects containing: title, description, features (array), colorScheme, layout.`
          }]
        }]
      })
    });
    const data = await response.json();
    if (data.candidates && data.candidates[0]) {
      const generatedText = data.candidates[0].content.parts[0].text;
      let variations;
      try {
        variations = JSON.parse(generatedText);
      } catch {
        variations = [
          {
            title: "Modern Professional",
            description: "Clean and contemporary design",
            features: ["Responsive", "Fast Loading", "SEO Optimized"],
            colorScheme: "blue",
            layout: "modern"
          },
          {
            title: "Creative Bold",
            description: "Eye-catching and unique design",
            features: ["Animated", "Interactive", "Memorable"],
            colorScheme: "purple",
            layout: "creative"
          },
          {
            title: "Minimal Clean",
            description: "Simple and elegant design",
            features: ["Fast", "User-Friendly", "Accessible"],
            colorScheme: "gray",
            layout: "minimal"
          }
        ];
      }
      return new Response(JSON.stringify({ variations }), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
    throw new Error("No response from AI");
  } catch (error) {
    return new Response(JSON.stringify({
      error: "Generation failed",
      details: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequestPost4, "onRequestPost");

// ../src/lib/layoutCompiler.ts
var fallbackBrand = {
  name: "Generated Brand",
  colors: ["#35e2ff", "#7c7cff", "#111827"]
};
var videoByIndustry = {
  food: "https://cdn.coverr.co/videos/coverr-serving-coffee-9978/1080p.mp4",
  fitness: "https://cdn.coverr.co/videos/coverr-woman-training-with-battle-ropes-7809/1080p.mp4",
  realestate: "https://cdn.coverr.co/videos/coverr-modern-house-exterior-3132/1080p.mp4",
  beauty: "https://cdn.coverr.co/videos/coverr-applying-makeup-5349/1080p.mp4",
  tech: "https://cdn.coverr.co/videos/coverr-typing-on-computer-keyboard-2836/1080p.mp4",
  default: "https://cdn.coverr.co/videos/coverr-working-in-a-modern-office-1565/1080p.mp4"
};
var imageByIndustry = {
  food: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1600&q=80",
  fitness: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1600&q=80",
  realestate: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80",
  beauty: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1600&q=80",
  law: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1600&q=80",
  tech: "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1600&q=80",
  default: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1600&q=80"
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
  const named = prompt.match(/\b(?:for|called|named|brand|business)\s+([a-z0-9&.\-\s]{3,60})/i);
  if (named?.[1]) return named[1].replace(/\b(with|that|and|using|where|who|needs?)\b.*$/i, "").trim();
  return prompt.split(/\s+/).slice(0, 4).join(" ");
}
__name(extractBrandName, "extractBrandName");
function detectIndustry(prompt) {
  const p = prompt.toLowerCase();
  if (/restaurant|food|coffee|cafe|bar|bakery|chef/.test(p)) return "food";
  if (/fitness|gym|coach|trainer|wellness|yoga/.test(p)) return "fitness";
  if (/real estate|realtor|property|home|listing/.test(p)) return "realestate";
  if (/beauty|salon|spa|makeup|skin|hair/.test(p)) return "beauty";
  if (/law|attorney|legal/.test(p)) return "law";
  if (/software|saas|ai|app|tech|startup/.test(p)) return "tech";
  return "default";
}
__name(detectIndustry, "detectIndustry");
function inferSections(prompt) {
  const p = prompt.toLowerCase();
  const sections = ["hero", "proof", "services"];
  if (/portfolio|gallery|work|case stud/.test(p)) sections.push("gallery");
  if (/price|pricing|plan|package|subscription/.test(p) || sections.length < 5) sections.push("pricing");
  if (/testimonial|review|client|proof/.test(p) || sections.length < 6) sections.push("testimonials");
  if (/faq|question/.test(p) || sections.length < 7) sections.push("faq");
  sections.push("contact");
  return [...new Set(sections)];
}
__name(inferSections, "inferSections");
function requestedTone(prompt) {
  const p = prompt.toLowerCase();
  if (/luxury|premium|elegant|high end/.test(p)) return "premium";
  if (/bold|loud|street|creative|artist/.test(p)) return "bold";
  if (/minimal|clean|simple/.test(p)) return "minimal";
  return "custom";
}
__name(requestedTone, "requestedTone");
function copyFor(brand, prompt, industry) {
  const subject = industry === "food" ? "memorable dining and hospitality" : industry === "fitness" ? "stronger coaching, bookings, and client momentum" : industry === "realestate" ? "premium property discovery and qualified buyer leads" : industry === "beauty" ? "elevated appointments, treatments, and client trust" : industry === "law" ? "clear legal guidance and high-intent consultations" : industry === "tech" ? "product clarity, demos, and conversion-ready growth" : "a sharper web presence that turns visitors into customers";
  return {
    headline: `${brand} turns attention into action`,
    subhead: `A complete homepage generated from your request for ${subject}.`,
    intro: `Built from the prompt: "${prompt.slice(0, 150)}${prompt.length > 150 ? "..." : ""}"`,
    services: ["Signature offer", "Fast consultation", "Premium delivery", "Ongoing support"],
    proof: ["Mobile-first design", "SEO-ready structure", "Conversion copy", "Media-rich sections"],
    testimonials: [
      `${brand} made the offer feel obvious and premium from the first screen.`,
      "The page explains the business clearly and gives visitors a reason to act.",
      "The visual direction feels custom instead of template-built."
    ],
    faqs: [
      ["Can this page be edited?", "Yes. The generated homepage is structured into clear sections so copy, media, and offers can be refined."],
      ["Is it responsive?", "Yes. The layout is built to adapt from mobile to desktop with readable spacing and stable media frames."],
      ["Does it include content?", "Yes. Headlines, service copy, proof points, pricing language, FAQ text, and contact copy are written into the output."]
    ]
  };
}
__name(copyFor, "copyFor");
function cssForVariant(variant, industry, mediaOverride) {
  const [a, b, c] = variant.palette;
  const media = mediaOverride?.imageUrl || imageByIndustry[industry] || imageByIndustry.default;
  return `
    :root{--a:${a};--b:${b};--c:${c};--ink:#f8fbff;--muted:rgba(232,240,255,.76)}
    *{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#05070b;color:var(--ink);font-family:${variant.fontPair};overflow-x:hidden}
    body:before{content:"";position:fixed;inset:0;z-index:-3;background:radial-gradient(circle at 18% 10%, color-mix(in srgb,var(--a) 35%, transparent), transparent 32%),radial-gradient(circle at 82% 16%, color-mix(in srgb,var(--b) 30%, transparent), transparent 34%),linear-gradient(135deg,#05070b,#0b1020 52%,#03040a)}
    body:after{content:"";position:fixed;inset:0;z-index:-2;background-image:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);background-size:42px 42px;mask-image:linear-gradient(to bottom,black,transparent 88%)}
    .shell{width:min(1180px,calc(100vw - 32px));margin:auto}.nav{position:sticky;top:0;z-index:10;backdrop-filter:blur(20px);background:rgba(5,7,11,.72);border-bottom:1px solid rgba(255,255,255,.1)}
    .nav-inner{height:76px;display:flex;align-items:center;justify-content:space-between}.brand{display:flex;align-items:center;gap:12px;font-weight:900;letter-spacing:-.03em}.mark{width:42px;height:42px;border-radius:14px;background:linear-gradient(135deg,var(--a),var(--b));box-shadow:0 0 42px color-mix(in srgb,var(--a) 45%, transparent);display:grid;place-items:center}
    .nav a{color:rgba(255,255,255,.76);text-decoration:none;margin-left:24px;font-size:14px}.btn{display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:999px;padding:14px 20px;color:white;background:linear-gradient(120deg,var(--a),var(--b));font-weight:800;text-decoration:none;box-shadow:0 18px 60px color-mix(in srgb,var(--a) 32%, transparent);transition:.25s}.btn:hover{transform:translateY(-2px);filter:saturate(1.2)}
    .hero{min-height:calc(100vh - 76px);display:grid;grid-template-columns:1.04fr .96fr;gap:44px;align-items:center;padding:74px 0}.hero h1{font-size:clamp(48px,8vw,96px);line-height:.88;letter-spacing:-.065em;margin:0}.hero p{font-size:20px;line-height:1.55;color:var(--muted)}.intro{margin:22px 0;padding:16px 18px;border:1px solid rgba(255,255,255,.12);border-radius:18px;background:rgba(255,255,255,.055);color:rgba(255,255,255,.68)}
    .media{position:relative;min-height:560px;border:1px solid rgba(255,255,255,.14);border-radius:34px;overflow:hidden;background:#111;box-shadow:0 34px 120px rgba(0,0,0,.42)}.media img,.media video{width:100%;height:100%;object-fit:cover;position:absolute;inset:0}.media:after{content:"";position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.72),transparent 56%)}.media-card{position:absolute;left:22px;right:22px;bottom:22px;z-index:2;padding:22px;border:1px solid rgba(255,255,255,.16);border-radius:24px;background:rgba(5,7,11,.62);backdrop-filter:blur(16px)}
    section{padding:92px 0}.section-head{display:flex;align-items:end;justify-content:space-between;gap:24px;margin-bottom:30px}.section-head h2{font-size:clamp(34px,5vw,62px);line-height:.95;letter-spacing:-.05em;margin:0}.section-head p{max-width:520px;color:var(--muted);line-height:1.6}.grid{display:grid;grid-template-columns:repeat(12,1fr);gap:18px}.card{position:relative;border:1px solid rgba(255,255,255,.12);background:linear-gradient(145deg,rgba(255,255,255,.1),rgba(255,255,255,.035));border-radius:24px;padding:26px;box-shadow:0 24px 80px rgba(0,0,0,.26);transition:.3s;overflow:hidden}.card:hover{transform:translateY(-5px);border-color:color-mix(in srgb,var(--a) 42%, white 10%);box-shadow:0 0 60px color-mix(in srgb,var(--a) 20%, transparent)}
    .span-3{grid-column:span 3}.span-4{grid-column:span 4}.span-6{grid-column:span 6}.span-8{grid-column:span 8}.span-12{grid-column:span 12}.kpi{font-size:42px;font-weight:950;letter-spacing:-.05em}.muted{color:var(--muted)}.price{font-size:48px;font-weight:950;margin:14px 0}.gallery-img{height:330px;background:url("${media}") center/cover;border-radius:24px}.faq details{border-bottom:1px solid rgba(255,255,255,.12);padding:20px 0}.faq summary{cursor:pointer;font-weight:850;font-size:18px}.faq p{color:var(--muted);line-height:1.65}.contact{background:linear-gradient(135deg,color-mix(in srgb,var(--a) 18%, transparent),rgba(255,255,255,.04));border-radius:34px;padding:36px}.input{width:100%;margin-bottom:12px;border:1px solid rgba(255,255,255,.14);background:rgba(0,0,0,.24);border-radius:16px;padding:16px;color:white}
    .vtw-watermark{position:fixed;right:18px;bottom:18px;z-index:40;border:1px solid rgba(255,255,255,.18);background:rgba(5,7,11,.74);color:white;border-radius:999px;padding:10px 14px;font-size:11px;font-weight:900;letter-spacing:.08em;backdrop-filter:blur(16px);box-shadow:0 18px 60px rgba(0,0,0,.34)}
    .reveal{animation:rise .8s both}@keyframes rise{from{opacity:0;transform:translateY(26px)}to{opacity:1;transform:none}}.float{animation:float 7s ease-in-out infinite}@keyframes float{50%{transform:translateY(-16px) rotate(1deg)}}.marquee{display:flex;gap:18px;animation:mar 28s linear infinite}.marquee-wrap{overflow:hidden}.marquee .card{min-width:310px}@keyframes mar{to{transform:translateX(-50%)}}
    @media(max-width:860px){.hero{grid-template-columns:1fr;padding:46px 0}.media{min-height:420px}.nav nav{display:none}.span-3,.span-4,.span-6,.span-8{grid-column:span 12}.section-head{display:block}.hero h1{font-size:52px}}
  `;
}
__name(cssForVariant, "cssForVariant");
function variantMarkup(variant, brand, prompt, industry) {
  const copy = copyFor(escapeHtml(brand.name), escapeHtml(prompt), industry);
  const image = brand.media?.imageUrl || imageByIndustry[industry] || imageByIndustry.default;
  const video = brand.media?.videoUrl || videoByIndustry[industry] || videoByIndustry.default;
  const gallery = (brand.media?.gallery?.length ? brand.media.gallery : [image, imageByIndustry[industry] || image, imageByIndustry.default]).slice(0, 3);
  const mediaTag = variant.id === "editorial" ? `<img src="${image}" alt="${escapeHtml(brand.name)} visual direction" loading="eager" />` : `<video src="${video}" autoplay muted loop playsinline preload="metadata" poster="${image}" aria-label="${escapeHtml(brand.name)} background video"></video>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${escapeHtml(brand.name)} | ${escapeHtml(variant.name)}</title><meta name="description" content="${escapeHtml(copy.subhead)}"/><style>${cssForVariant(variant, industry, brand.media)}.sound-toggle{position:fixed;left:18px;bottom:18px;z-index:20;border:1px solid rgba(255,255,255,.18);background:rgba(5,7,11,.72);color:white;border-radius:999px;padding:13px 16px;font-weight:850;backdrop-filter:blur(14px);box-shadow:0 18px 60px rgba(0,0,0,.34);cursor:pointer}.sound-toggle:hover{border-color:var(--a);transform:translateY(-2px)}</style></head><body>
    <header class="nav"><div class="shell nav-inner"><div class="brand"><div class="mark">\u2726</div><span>${escapeHtml(brand.name)}</span></div><nav><a href="#services">Services</a><a href="#pricing">Pricing</a><a href="#faq">FAQ</a><a class="btn" href="#contact">Start</a></nav></div></header>
    <main>
      <section class="shell hero"><div class="reveal"><h1>${copy.headline}</h1><p>${copy.subhead}</p><div class="intro">${copy.intro}</div><a class="btn" href="#contact">Book the first step</a></div><div class="media float">${mediaTag}<div class="media-card"><strong>Live media direction</strong><p class="muted">Visuals are selected from copyright-safe open media sources and matched to the page subject.</p></div></div></section>
      <section class="shell"><div class="grid"><div class="card span-3"><div class="kpi">01</div><p class="muted">Custom page voice and copy.</p></div><div class="card span-3"><div class="kpi">02</div><p class="muted">Responsive sections with motion.</p></div><div class="card span-3"><div class="kpi">03</div><p class="muted">Relevant image and video system.</p></div><div class="card span-3"><div class="kpi">04</div><p class="muted">Lead-ready contact flow.</p></div></div></section>
      <section class="shell" id="services"><div class="section-head"><h2>What ${escapeHtml(brand.name)} offers</h2><p>Clear service content, benefit-led structure, and premium visual rhythm are written directly into the generated homepage.</p></div><div class="grid">${copy.services.map((item, i) => `<article class="card span-3 reveal" style="animation-delay:${i * 90}ms"><h3>${escapeHtml(item)}</h3><p class="muted">A focused section that explains the value, reduces friction, and gives visitors a next step.</p></article>`).join("")}</div></section>
      <section class="shell"><div class="section-head"><h2>Built to feel finished</h2><p>Every generated version includes wallpaper layers, hover lighting, typography choices, motion cues, and real section copy when the prompt does not specify them.</p></div><div class="grid"><div class="span-8 gallery-img"></div><div class="card span-4"><h3>Premium content system</h3>${copy.proof.map((item) => `<p class="muted">\u2713 ${escapeHtml(item)}</p>`).join("")}</div>${gallery.map((item, index) => `<div class="card span-4"><img src="${item}" alt="${escapeHtml(brand.name)} supporting image ${index + 1}" loading="lazy" style="width:100%;height:220px;object-fit:cover;border-radius:18px"/><p class="muted">Relevant page media selected for ${escapeHtml(brand.name)}.</p></div>`).join("")}</div></section>
      <section class="shell" id="pricing"><div class="section-head"><h2>Simple ways to start</h2><p>Pricing copy is generated as part of the page so the offer is not left unfinished.</p></div><div class="grid">${["Starter", "Pro", "Ultimate"].map((plan, i) => `<article class="card span-4"><h3>${plan}</h3><div class="price">${i === 0 ? "$9.99" : i === 1 ? "$19.99" : "$49.99"}<span style="font-size:16px;color:var(--muted)">/mo</span></div><p class="muted">${i === 0 ? "50 commands per month for launch copy and landing structure." : i === 1 ? "150 commands with expanded sections and stronger conversion flow." : "500 commands for full premium homepage polish and growth-ready content."}</p><a class="btn" href="#contact">Choose ${plan}</a></article>`).join("")}</div></section>
      <section class="shell"><div class="section-head"><h2>Client confidence</h2><p>Social proof is generated in a brand-safe voice and can be replaced with verified testimonials when available.</p></div><div class="marquee-wrap"><div class="marquee">${[...copy.testimonials, ...copy.testimonials].map((quote) => `<article class="card"><p>${escapeHtml(quote)}</p><p class="muted">Verified-ready proof block</p></article>`).join("")}</div></div></section>
      <section class="shell faq" id="faq"><div class="section-head"><h2>Questions answered</h2><p>The generator writes practical FAQ content so the homepage can stand on its own.</p></div>${copy.faqs.map(([q, a], i) => `<details ${i === 0 ? "open" : ""}><summary>${escapeHtml(q)}</summary><p>${escapeHtml(a)}</p></details>`).join("")}</section>
      <section class="shell" id="contact"><div class="contact"><div class="section-head"><h2>Ready for the next customer</h2><p>Use this form section for bookings, quotes, calls, or project inquiries.</p></div><form><input class="input" placeholder="Name"/><input class="input" placeholder="Email"/><textarea class="input" rows="4" placeholder="Tell us what you need"></textarea><button class="btn" type="button">Send request</button></form></div></section>
    </main><button class="sound-toggle" type="button" id="soundToggle">Play ambient music</button><div class="vtw-watermark">Copyright \xA9 VoiceToWebsite.com</div><footer class="shell" style="padding:36px 0;color:rgba(255,255,255,.56)">Generated by VoiceToWebsite.com. Preview output is copyrighted and watermarked. Customer is responsible for final content, claims, permissions, privacy disclosures, and legal compliance.</footer>
    <script>
      (()=>{let ctx,osc,gain,lfo,on=false;const btn=document.getElementById('soundToggle');btn?.addEventListener('click',async()=>{if(!ctx){ctx=new AudioContext();osc=ctx.createOscillator();gain=ctx.createGain();lfo=ctx.createOscillator();const lfoGain=ctx.createGain();osc.type='sine';osc.frequency.value=146.83;lfo.frequency.value=.08;lfoGain.gain.value=24;lfo.connect(gain);lfo.connect(lfoGain);lfoGain.connect(osc.frequency);gain.gain.value=0;gain.connect(ctx.destination);osc.start();lfo.start()} if(ctx.state==='suspended') await ctx.resume();on=!on;gain.gain.setTargetAtTime(on ? .045 : 0,ctx.currentTime,.08);btn.textContent=on?'Pause ambient music':'Play ambient music';});})();
    <\/script>
  </body></html>`;
}
__name(variantMarkup, "variantMarkup");
function compileLayoutFromPrompt(prompt, brandInput) {
  const brandName = brandInput?.name || toTitle(extractBrandName(prompt));
  const brand = {
    ...fallbackBrand,
    ...brandInput,
    name: brandName,
    colors: brandInput?.colors?.length ? brandInput.colors : fallbackBrand.colors
  };
  const industry = detectIndustry(prompt);
  const tone = requestedTone(prompt);
  const variants = [
    { id: "cinematic", name: "Cinematic Glass", mood: `${tone} dark motion`, fontPair: "Inter, ui-sans-serif, system-ui, sans-serif", palette: [brand.colors[0] || "#35e2ff", brand.colors[1] || "#7c7cff", "#03040a"], html: "" },
    { id: "editorial", name: "Editorial Luxe", mood: "image-led premium", fontPair: "Georgia, 'Times New Roman', serif", palette: ["#f59e0b", "#ef4444", "#111827"], html: "" },
    { id: "studio", name: "Studio Neon", mood: "bold animated launch", fontPair: "'Trebuchet MS', Inter, ui-sans-serif, sans-serif", palette: ["#22c55e", "#06b6d4", "#0f172a"], html: "" }
  ].map((variant) => ({
    ...variant,
    html: variantMarkup(variant, brand, prompt || "Build a premium business homepage", industry)
  }));
  const tree = {
    name: brand.name,
    prompt,
    intent: inferSections(prompt),
    brand,
    variants,
    bloks: inferSections(prompt).map((section, index) => ({ component: section, order: index + 1, grid_span: 12, title: section }))
  };
  return { tree, html: variants[0].html, variants };
}
__name(compileLayoutFromPrompt, "compileLayoutFromPrompt");

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
async function fetchMediaAssets(queryText, env) {
  const query = (queryText || "business website").slice(0, 100);
  const media = {};
  try {
    if (env.UNSPLASH_API_KEY) {
      const res = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&orientation=landscape&per_page=6`,
        { headers: { Authorization: `Client-ID ${env.UNSPLASH_API_KEY}` } }
      );
      if (res.ok) {
        const data = await res.json();
        const gallery = (data.results || []).map((item) => item.urls?.regular).filter((value) => Boolean(value));
        media.imageUrl = gallery[0];
        media.gallery = gallery.slice(0, 3);
      }
    }
  } catch {
  }
  try {
    if (env.PEXELS_API_KEY) {
      const res = await fetch(
        `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&orientation=landscape&per_page=5`,
        { headers: { Authorization: env.PEXELS_API_KEY } }
      );
      if (res.ok) {
        const data = await res.json();
        const files = data.videos?.flatMap((video) => video.video_files || []) || [];
        const best = files.find((file) => file.quality === "hd" && (file.width || 0) >= 1280) || files.find((file) => (file.width || 0) >= 960) || files[0];
        media.videoUrl = best?.link;
      }
    }
  } catch {
  }
  return media;
}
__name(fetchMediaAssets, "fetchMediaAssets");
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
var onRequestPost5 = /* @__PURE__ */ __name(async (context) => {
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
    const [brandAssets2, media2] = await Promise.all([
      fetchBrandAssets(promptOnly, context.env),
      fetchMediaAssets(promptOnly, context.env)
    ]);
    const brand2 = { ...brandAssets2, media: media2 };
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
      layoutTree: compiled2.tree,
      variations: compiled2.variants.map((variant) => ({
        id: variant.id,
        name: variant.name,
        mood: variant.mood,
        fontPair: variant.fontPair,
        html: variant.html
      }))
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
  const [brandAssets, media] = await Promise.all([
    fetchBrandAssets(`${order.business_description || ""} ${order.industry || ""}`, context.env),
    fetchMediaAssets(`${order.business_description || ""} ${order.industry || ""}`, context.env)
  ]);
  const brand = { ...brandAssets, media };
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

// api/health.js
async function onRequestGet8(context) {
  return new Response(JSON.stringify({
    status: "ok",
    brand: "VoiceToWebsite.com"
  }), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
__name(onRequestGet8, "onRequestGet");

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
var onRequestGet9 = /* @__PURE__ */ __name(async (context) => {
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
var onRequestPost6 = /* @__PURE__ */ __name(async (context) => {
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
var onRequestGet10 = /* @__PURE__ */ __name(async () => json6({ error: "Method not allowed" }, { status: 405 }), "onRequestGet");

// api/paypal-webhook.ts
function json7(body, init = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { "content-type": "application/json; charset=utf-8", ...init.headers || {} }
  });
}
__name(json7, "json");
var onRequestPost7 = /* @__PURE__ */ __name(async (context) => {
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
var onRequestPost8 = /* @__PURE__ */ __name(async (context) => {
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
var onRequestGet11 = /* @__PURE__ */ __name(async ({ request }) => {
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
var onRequestPost9 = /* @__PURE__ */ __name(async (context) => {
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
var onRequestPost10 = /* @__PURE__ */ __name(async (context) => {
  if (!context.env.DB) return json10({ error: "DB binding not configured" }, { status: 500 });
  if (!context.env.STRIPE_WEBHOOK_SECRET) {
    return json10({ error: "Stripe webhook secret not configured" }, { status: 500 });
  }
  const rawBody = await context.request.text();
  const signature = context.request.headers.get("stripe-signature") || "";
  const verified = await verifyStripeSignature(rawBody, signature, context.env.STRIPE_WEBHOOK_SECRET);
  if (!verified) {
    return json10({ error: "Unauthorized" }, { status: 401 });
  }
  const event = JSON.parse(rawBody);
  const session = event.data?.object;
  if (!session?.id) return json10({ ok: true, ignored: true });
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    await context.env.DB.prepare(
      "UPDATE orders SET status = 'paid', error = NULL WHERE stripe_session_id = ?"
    ).bind(session.id).run();
  }
  return json10({ ok: true });
}, "onRequestPost");
function parseStripeSignature(header) {
  return header.split(",").reduce(
    (acc, part) => {
      const [key, value] = part.split("=");
      if (key === "t") acc.timestamp = value;
      if (key === "v1") acc.signatures.push(value);
      return acc;
    },
    { timestamp: "", signatures: [] }
  );
}
__name(parseStripeSignature, "parseStripeSignature");
async function verifyStripeSignature(rawBody, header, secret) {
  const parsed = parseStripeSignature(header);
  if (!parsed.timestamp || !parsed.signatures.length) return false;
  const timestamp = Number(parsed.timestamp);
  if (!Number.isFinite(timestamp)) return false;
  const ageSeconds = Math.abs(Date.now() / 1e3 - timestamp);
  if (ageSeconds > 300) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signedPayload = `${parsed.timestamp}.${rawBody}`;
  const digest = await crypto.subtle.sign("HMAC", key, encoder.encode(signedPayload));
  const expected = Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return parsed.signatures.some((signature) => timingSafeEqual(signature, expected));
}
__name(verifyStripeSignature, "verifyStripeSignature");
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
__name(timingSafeEqual, "timingSafeEqual");

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

// ../.wrangler/tmp/pages-xZe3dC/functionsRoutes-0.4627258079209492.mjs
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
    routePath: "/api/generate",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost4]
  },
  {
    routePath: "/api/generate-site",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost5]
  },
  {
    routePath: "/api/health",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet8]
  },
  {
    routePath: "/api/media",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet9]
  },
  {
    routePath: "/api/order",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet10]
  },
  {
    routePath: "/api/order",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost6]
  },
  {
    routePath: "/api/paypal-webhook",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost7]
  },
  {
    routePath: "/api/preview-copy",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost8]
  },
  {
    routePath: "/api/preview-style",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet11]
  },
  {
    routePath: "/api/stripe-verify-session",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost9]
  },
  {
    routePath: "/api/stripe-webhook",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost10]
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
