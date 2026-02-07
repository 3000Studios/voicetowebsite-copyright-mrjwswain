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

const renderPreviewHtml = ({ siteId, layout, css }) => {
  const title = layout?.title || "Preview";
  const description = layout?.description || "Generated preview";
  const theme = layout?.theme || "midnight";
  const pages = Array.isArray(layout?.pages) ? layout.pages : [];
  const nav = pages.map((p) => `<a href="#${p.slug || ""}">${p.title || p.slug || "Page"}</a>`).join("");
  const sections = pages
    .map((p) => {
      const blocks = Array.isArray(p.sections) ? p.sections : [];
      const rendered = blocks
        .map((s) => `<section class="vtw-section"><h3>${s.title || ""}</h3><p>${s.body || ""}</p></section>`)
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

  const contentType = request.headers.get("content-type") || "";
  try {
    if (contentType.includes("application/json")) {
      const body = await request.json();
      prompt = String(body?.prompt || "");
      transcript = String(body?.transcript || "");
      tone = String(body?.tone || "");
    } else if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      prompt = String(form.get("prompt") || "");
      tone = String(form.get("tone") || "");
      const audio = form.get("audio");
      if (audio && typeof audio.arrayBuffer === "function") {
        if (!env.AI) return json(501, { error: "Workers AI binding missing (AI)." });
        const buf = await audio.arrayBuffer();
        const bytes = [...new Uint8Array(buf)];
        const whisper = await env.AI.run("@cf/openai/whisper", { audio: bytes });
        transcript = String(whisper?.text || whisper?.result?.text || whisper?.transcription || "");
      }
    } else {
      prompt = String(await request.text());
    }
  } catch (err) {
    return json(400, { error: `Invalid request body: ${err.message}` });
  }

  const siteId = crypto.randomUUID();
  const mergedPrompt = [prompt, transcript].filter(Boolean).join("\n\n").trim();
  if (!mergedPrompt) return json(400, { error: "Missing prompt and transcript." });

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

  const css = layout?.theme ? `:root{--vtw-theme:'${layout.theme}';}` : "";
  const html = renderPreviewHtml({ siteId, layout, css });

  await env.D1.prepare(
    "INSERT INTO sites (id, prompt, transcript, layout_json, html, css, status) VALUES (?,?,?,?,?,?,?)"
  )
    .bind(siteId, prompt, transcript, JSON.stringify(layout), html, css, "draft")
    .run();

  return json(200, {
    ok: true,
    siteId,
    transcript,
    layout,
    previewUrl: `/preview/${siteId}`,
  });
}

export async function handlePreviewApiRequest({ request, env }) {
  if (!env.D1) return json(503, { error: "D1 database not available." });
  await ensureSiteTables(env);
  const url = new URL(request.url);
  const id = url.searchParams.get("id") || "";
  if (!id) return json(400, { error: "Missing id query param." });
  const row = await env.D1.prepare("SELECT id, ts, prompt, transcript, layout_json, status FROM sites WHERE id = ?")
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
  const row = await env.D1.prepare("SELECT html FROM sites WHERE id = ?").bind(siteId).first();
  if (!row?.html) return new Response("Not found", { status: 404 });
  return new Response(row.html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

export async function handlePublishRequest({ request, env }) {
  const isAdmin = await isAdminRequest(request, env);
  if (!isAdmin) return json(401, { error: "Admin required." });
  if (!env.D1) return json(503, { error: "D1 database not available." });
  if (!env.R2) return json(503, { error: "R2 bucket binding missing (R2)." });

  await ensureSiteTables(env);
  let body;
  try {
    body = await request.json();
  } catch (_) {
    body = {};
  }
  const siteId = String(body?.siteId || "");
  if (!siteId) return json(400, { error: "Missing siteId." });

  const row = await env.D1.prepare("SELECT id, html, css, layout_json FROM sites WHERE id = ?").bind(siteId).first();
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
    await env.R2.put(asset.key, buf, { httpMetadata: { contentType: asset.contentType } });
    await env.D1.prepare("INSERT INTO site_assets (site_id, kind, r2_key, content_type, size_bytes) VALUES (?,?,?,?,?)")
      .bind(siteId, asset.kind, asset.key, asset.contentType, buf.byteLength)
      .run();
  }

  await env.D1.prepare("UPDATE sites SET status = ? WHERE id = ?").bind("published", siteId).run();

  return json(200, { ok: true, siteId, r2Prefix: base });
}
