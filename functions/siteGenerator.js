import { isAdminRequest } from "./adminAuth.js";

const json = (status, payload, headers = {}) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });

const extractJsonObject = (text) => {
  const raw = String(text || "").trim();
  if (!raw) throw new Error("AI response was empty.");
  if (raw.startsWith("{") && raw.endsWith("}")) return JSON.parse(raw);
  const fenced = raw.match(/```json\s*([\s\S]*?)\s*```/i);
  if (fenced) return JSON.parse(fenced[1]);
  const first = raw.indexOf("{");
  const last = raw.lastIndexOf("}");
  if (first >= 0 && last > first) return JSON.parse(raw.slice(first, last + 1));
  throw new Error("Failed to parse JSON response.");
};

const pickAiText = (result) => {
  if (!result) return "";
  if (typeof result === "string") return result;
  if (typeof result.response === "string") return result.response;
  if (typeof result.text === "string") return result.text;
  if (typeof result.output_text === "string") return result.output_text;
  if (Array.isArray(result?.choices) && result.choices[0]?.message?.content)
    return String(result.choices[0].message.content);
  return JSON.stringify(result);
};

const ensureSiteTables = async (env) => {
  if (!env.D1) return;
  await env.D1.prepare(
    `CREATE TABLE IF NOT EXISTS sites (
      id TEXT PRIMARY KEY,
      ts DATETIME DEFAULT CURRENT_TIMESTAMP,
      prompt TEXT,
      transcript TEXT,
      layout_json TEXT,
      html TEXT,
      css TEXT,
      status TEXT DEFAULT 'draft'
    );`
  ).run();
  await env.D1.prepare(
    `CREATE TABLE IF NOT EXISTS site_assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      site_id TEXT NOT NULL,
      ts DATETIME DEFAULT CURRENT_TIMESTAMP,
      kind TEXT NOT NULL,
      r2_key TEXT NOT NULL,
      content_type TEXT,
      size_bytes INTEGER
    );`
  ).run();
};

const STYLE_PACK_LIBRARY = [
  {
    id: "glass-ui",
    name: "Glass UI",
    category: "surface",
    description: "Frosted cards, soft borders, and subtle blur.",
    css: `.vtw-section{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:18px;backdrop-filter:blur(8px);}`,
  },
  {
    id: "neon-edges",
    name: "Neon Edges",
    category: "surface",
    description: "Neon borders and glow accents.",
    css: `.vtw-section{box-shadow:0 0 0 1px rgba(56,189,248,.45),0 0 24px rgba(56,189,248,.2);} h1,h2{color:#7dd3fc;}`,
  },
  {
    id: "rounded-xl",
    name: "Rounded XL",
    category: "layout",
    description: "Larger corner radii and softer geometry.",
    css: `.vtw-section,.vtw-page{border-radius:22px;} .vtw-page{padding:20px;}`,
  },
  {
    id: "compact-density",
    name: "Compact Density",
    category: "layout",
    description: "Reduced spacing for denser dashboards.",
    css: `.vtw-wrap{max-width:980px;padding:18px 14px;} .vtw-page{padding:10px 0;} .vtw-section{padding:8px 0;}`,
  },
  {
    id: "spacious-density",
    name: "Spacious Density",
    category: "layout",
    description: "More breathing room and larger spacing.",
    css: `.vtw-wrap{max-width:1180px;padding:36px 24px;} .vtw-page{padding:26px 0;} .vtw-section{padding:16px 0;}`,
  },
  {
    id: "bold-headings",
    name: "Bold Headings",
    category: "typography",
    description: "Heavier headline weight and tighter tracking.",
    css: `h1,h2,h3{font-weight:900;letter-spacing:-.02em;}`,
  },
  {
    id: "editorial-serif",
    name: "Editorial Serif",
    category: "typography",
    description: "Serif forward look for premium landing pages.",
    css: `h1,h2,h3{font-family:Georgia,'Times New Roman',serif;} p{font-family:system-ui,sans-serif;}`,
  },
  {
    id: "mono-tech",
    name: "Mono Tech",
    category: "typography",
    description: "Monospace technical aesthetic.",
    css: `body{font-family:'IBM Plex Mono','SFMono-Regular',Consolas,monospace;} h1,h2,h3{letter-spacing:.01em;}`,
  },
  {
    id: "ocean-gradient",
    name: "Ocean Gradient",
    category: "color",
    description: "Cool blue/cyan gradient background.",
    css: `body{background:radial-gradient(circle at 20% 10%,#0c4a6e 0%,#020617 45%,#020617 100%);}`,
  },
  {
    id: "sunset-gradient",
    name: "Sunset Gradient",
    category: "color",
    description: "Orange/pink cinematic gradient.",
    css: `body{background:radial-gradient(circle at 15% 10%,#7c2d12 0%,#3f0f46 38%,#09090b 100%);}`,
  },
  {
    id: "mint-gradient",
    name: "Mint Gradient",
    category: "color",
    description: "Mint/teal clean startup palette.",
    css: `body{background:radial-gradient(circle at 30% 12%,#064e3b 0%,#052e2b 35%,#020617 100%);} a{color:#6ee7b7;}`,
  },
  {
    id: "high-contrast",
    name: "High Contrast",
    category: "accessibility",
    description: "Increased text contrast for readability.",
    css: `body{color:#ffffff;} .vtw-meta{opacity:.92;} a{color:#93c5fd;} .vtw-section{border-color:rgba(255,255,255,.24);}`,
  },
  {
    id: "subtle-motion",
    name: "Subtle Motion",
    category: "animation",
    description: "Gentle lift animation on section load.",
    css: `.vtw-section{animation:vtwLift .42s ease both;} @keyframes vtwLift{from{opacity:.2;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}`,
  },
  {
    id: "hover-lift",
    name: "Hover Lift",
    category: "animation",
    description: "Card lift on hover for interactivity.",
    css: `.vtw-section{transition:transform .18s ease,box-shadow .18s ease;} .vtw-section:hover{transform:translateY(-3px);box-shadow:0 10px 26px rgba(2,132,199,.22);}`,
  },
  {
    id: "no-motion",
    name: "No Motion",
    category: "accessibility",
    description: "Disables movement-heavy transitions.",
    css: `*{animation:none!important;transition:none!important;scroll-behavior:auto!important;}`,
  },
  {
    id: "soft-shadow",
    name: "Soft Shadow",
    category: "surface",
    description: "Ambient depth with soft shadows.",
    css: `.vtw-section,.vtw-page{box-shadow:0 12px 28px rgba(0,0,0,.24);}`,
  },
  {
    id: "hard-shadow",
    name: "Hard Shadow",
    category: "surface",
    description: "Sharper graphic shadows for cards.",
    css: `.vtw-section,.vtw-page{box-shadow:8px 8px 0 rgba(30,41,59,.75);}`,
  },
  {
    id: "outline-focus",
    name: "Outline Focus",
    category: "accessibility",
    description: "Strong keyboard focus outlines.",
    css: `a:focus-visible,button:focus-visible,input:focus-visible,textarea:focus-visible{outline:3px solid #f59e0b;outline-offset:2px;border-radius:8px;}`,
  },
  {
    id: "rich-links",
    name: "Rich Links",
    category: "interaction",
    description: "Animated underlines and stronger link affordance.",
    css: `a{position:relative;text-decoration:none;} a::after{content:'';position:absolute;left:0;bottom:-2px;width:0;height:2px;background:currentColor;transition:width .2s ease;} a:hover::after{width:100%;}`,
  },
  {
    id: "large-type",
    name: "Large Type",
    category: "typography",
    description: "Bigger text scale for hero-forward pages.",
    css: `h1{font-size:clamp(2rem,4vw,3.3rem);} h2{font-size:clamp(1.4rem,2.6vw,2.2rem);} p{font-size:1.04rem;}`,
  },
  {
    id: "small-type",
    name: "Small Type",
    category: "typography",
    description: "Tighter text scale for data-dense pages.",
    css: `h1{font-size:clamp(1.6rem,3vw,2.4rem);} h2{font-size:clamp(1.2rem,2vw,1.8rem);} p{font-size:.96rem;}`,
  },
];

const STYLE_PACK_IDS = new Set(STYLE_PACK_LIBRARY.map((pack) => pack.id));
const normalizeStylePackIds = (value) => {
  if (!Array.isArray(value)) return [];
  const unique = [];
  value.forEach((item) => {
    const id = String(item || "").trim();
    if (id && STYLE_PACK_IDS.has(id) && !unique.includes(id)) unique.push(id);
  });
  return unique.slice(0, 24);
};

const getStylePacksByIds = (ids) => {
  const set = new Set(normalizeStylePackIds(ids));
  return STYLE_PACK_LIBRARY.filter((pack) => set.has(pack.id));
};

const renderPreviewHtml = ({ siteId, layout, css }) => {
  const title = layout?.title || "Preview";
  const description = layout?.description || "Generated preview";
  const theme = layout?.theme || "midnight";
  const pages = Array.isArray(layout?.pages) ? layout.pages : [];
  const nav = pages
    .map((p) => `<a href="#${p.slug || ""}">${p.title || p.slug || "Page"}</a>`)
    .join("");
  const sections = pages
    .map((p) => {
      const blocks = Array.isArray(p.sections) ? p.sections : [];
      const rendered = blocks
        .map(
          (s) =>
            `<section class="vtw-section"><h3>${s.title || ""}</h3><p>${s.body || ""}</p></section>`
        )
        .join("");
      return `<article id="${p.slug || ""}" class="vtw-page"><h2>${p.title || ""}</h2>${rendered}</article>`;
    })
    .join("");

  const baseCss = `
    :root{color-scheme:dark}
    body{margin:0;background:#050507;color:#f8fafc;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif}
    .vtw-wrap{max-width:1100px;margin:0 auto;padding:28px 18px}
    header{display:flex;gap:14px;align-items:center;justify-content:space-between;margin-bottom:22px}
    nav{display:flex;gap:12px;flex-wrap:wrap}
    nav a{color:#38bdf8;text-decoration:none;font-weight:600}
    nav a:hover{text-decoration:underline}
    .vtw-meta{opacity:.7;font-size:14px}
    .vtw-page{padding:18px 0;border-top:1px solid rgba(255,255,255,.08)}
    .vtw-section{padding:12px 0}
    .vtw-section h3{margin:0 0 6px 0}
  `;

  return `<!doctype html>
<html lang="en" data-theme="${theme}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <link rel="stylesheet" href="/styles.css" />
    <style>${baseCss}\n${css || ""}</style>
  </head>
  <body>
    <div class="vtw-wrap">
      <header>
        <div>
          <h1 style="margin:0">${title}</h1>
          <div class="vtw-meta">Preview ID: ${siteId}</div>
        </div>
        <nav>${nav}</nav>
      </header>
      ${sections || `<p class="vtw-meta">No pages were generated.</p>`}
    </div>
  </body>
</html>`;
};

export async function handleGenerateRequest({ request, env }) {
  const allowPublic = String(env.PUBLIC_GENERATE || "") === "1";
  if (!allowPublic) {
    const isAdmin = await isAdminRequest(request, env);
    if (!isAdmin) return json(401, { error: "Admin required." });
  }

  if (!env.D1) return json(503, { error: "D1 database not available." });
  await ensureSiteTables(env);

  let prompt = "";
  let transcript = "";
  let tone = "";
  let stylePackIds = [];

  const contentType = request.headers.get("content-type") || "";
  try {
    if (contentType.includes("application/json")) {
      const body = await request.clone().json();
      prompt = String(body?.prompt || "");
      transcript = String(body?.transcript || "");
      tone = String(body?.tone || "");
      stylePackIds = normalizeStylePackIds(body?.stylePackIds || []);
    } else if (contentType.includes("multipart/form-data")) {
      const form = await request.clone().formData();
      prompt = String(form.get("prompt") || "");
      tone = String(form.get("tone") || "");
      const rawStylePacks = String(form.get("stylePackIds") || "")
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
      stylePackIds = normalizeStylePackIds(rawStylePacks);
      const audio = form.get("audio");
      if (audio && typeof audio.arrayBuffer === "function") {
        if (!env.AI)
          return json(501, { error: "Workers AI binding missing (AI)." });
        const buf = await audio.arrayBuffer();
        const bytes = [...new Uint8Array(buf)];
        const whisper = await env.AI.run("@cf/openai/whisper", {
          audio: bytes,
        });
        transcript = String(
          whisper?.text || whisper?.result?.text || whisper?.transcription || ""
        );
      }
    } else {
      prompt = String(await request.clone().text());
    }
  } catch (err) {
    return json(400, { error: `Invalid request body: ${err.message}` });
  }

  const siteId = crypto.randomUUID();
  const mergedPrompt = [prompt, transcript].filter(Boolean).join("\n\n").trim();
  if (!mergedPrompt)
    return json(400, { error: "Missing prompt and transcript." });

  if (!env.AI) return json(501, { error: "Workers AI binding missing (AI)." });

  const system = `
You are an expert product designer and web IA planner.
Return ONLY valid JSON with this schema:
{
  "title": "Site title",
  "description": "One sentence description",
  "theme": "midnight|volt|ember|ocean",
  "pages": [
    {"slug":"home","title":"Home","sections":[{"title":"...","body":"..."}]}
  ]
}
Rules:
- 3-6 pages max.
- Each page: 2-5 sections max.
- Slugs are lowercase, hyphenated, unique.
- Keep copy tight and conversion-oriented.
`.trim();

  const user = `
Tone: ${tone || "default"}
Input:
${mergedPrompt}
`.trim();

  let layout;
  try {
    const result = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.3,
      max_tokens: 900,
    });
    layout = extractJsonObject(pickAiText(result));
  } catch (err) {
    return json(502, { error: `Layout generation failed: ${err.message}` });
  }

  const selectedStylePacks = getStylePacksByIds(stylePackIds);
  const generatedCss = layout?.theme
    ? `:root{--vtw-theme:'${layout.theme}';}`
    : "";
  const css =
    [
      generatedCss,
      ...selectedStylePacks.map(
        (pack) => `/* style-pack:${pack.id} */\n${pack.css}`
      ),
    ]
      .filter(Boolean)
      .join("\n\n") || "";
  const html = renderPreviewHtml({ siteId, layout, css });

  await env.D1.prepare(
    "INSERT INTO sites (id, prompt, transcript, layout_json, html, css, status) VALUES (?,?,?,?,?,?,?)"
  )
    .bind(
      siteId,
      prompt,
      transcript,
      JSON.stringify(layout),
      html,
      css,
      "draft"
    )
    .run();

  return json(200, {
    ok: true,
    siteId,
    transcript,
    layout,
    stylePackIds: selectedStylePacks.map((pack) => pack.id),
    stylePacks: selectedStylePacks.map(
      ({ id, name, category, description }) => ({
        id,
        name,
        category,
        description,
      })
    ),
    previewUrl: `/preview/${siteId}`,
  });
}

export async function handlePreviewApiRequest({ request, env }) {
  if (!env.D1) return json(503, { error: "D1 database not available." });
  await ensureSiteTables(env);
  const url = new URL(request.url);
  const id = url.searchParams.get("id") || "";
  if (!id) return json(400, { error: "Missing id query param." });
  const row = await env.D1.prepare(
    "SELECT id, ts, prompt, transcript, layout_json, status FROM sites WHERE id = ?"
  )
    .bind(id)
    .first();
  if (!row) return json(404, { error: "Not found." });
  return json(200, {
    site: {
      ...row,
      layout: row.layout_json ? JSON.parse(row.layout_json) : null,
    },
  });
}

export async function handlePreviewPageRequest({ request, env }) {
  if (!env.D1) return new Response("D1 not available", { status: 503 });
  await ensureSiteTables(env);
  const url = new URL(request.url);
  const siteId = url.pathname.split("/").pop() || "";
  if (!siteId) return new Response("Missing site id", { status: 400 });
  const row = await env.D1.prepare("SELECT html FROM sites WHERE id = ?")
    .bind(siteId)
    .first();
  if (!row?.html) return new Response("Not found", { status: 404 });
  return new Response(row.html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function handleStylePacksRequest() {
  return json(200, {
    stylePacks: STYLE_PACK_LIBRARY.map(
      ({ id, name, category, description }) => ({
        id,
        name,
        category,
        description,
      })
    ),
    total: STYLE_PACK_LIBRARY.length,
  });
}

export async function handlePublishRequest({ request, env }) {
  const isAdmin = await isAdminRequest(request, env);
  if (!isAdmin) return json(401, { error: "Admin required." });
  if (!env.D1) return json(503, { error: "D1 database not available." });
  if (!env.R2) return json(503, { error: "R2 bucket binding missing (R2)." });

  await ensureSiteTables(env);
  let body;
  try {
    body = await request.clone().json();
  } catch (_) {
    body = {};
  }
  const siteId = String(body?.siteId || "");
  if (!siteId) return json(400, { error: "Missing siteId." });

  const row = await env.D1.prepare(
    "SELECT id, html, css, layout_json FROM sites WHERE id = ?"
  )
    .bind(siteId)
    .first();
  if (!row) return json(404, { error: "Not found." });

  const base = `sites/${siteId}`;
  const assets = [
    {
      kind: "html",
      key: `${base}/index.html`,
      contentType: "text/html; charset=utf-8",
      body: row.html || "",
    },
    {
      kind: "css",
      key: `${base}/styles.css`,
      contentType: "text/css; charset=utf-8",
      body: row.css || "",
    },
    {
      kind: "layout",
      key: `${base}/layout.json`,
      contentType: "application/json",
      body: row.layout_json || "{}",
    },
  ];

  for (const asset of assets) {
    const buf = new TextEncoder().encode(String(asset.body));
    await env.R2.put(asset.key, buf, {
      httpMetadata: { contentType: asset.contentType },
    });
    await env.D1.prepare(
      "INSERT INTO site_assets (site_id, kind, r2_key, content_type, size_bytes) VALUES (?,?,?,?,?)"
    )
      .bind(siteId, asset.kind, asset.key, asset.contentType, buf.byteLength)
      .run();
  }

  await env.D1.prepare("UPDATE sites SET status = ? WHERE id = ?")
    .bind("published", siteId)
    .run();

  return json(200, { ok: true, siteId, r2Prefix: base });
}
