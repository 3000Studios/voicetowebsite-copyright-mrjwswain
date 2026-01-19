# Copyright Deposit Excerpt
First 25 pages (approx. 55 lines/page):

```text
===== BEGIN worker.js =====
import { onRequestPost as handleOrchestrator } from "./functions/orchestrator.js";

const jsonResponse = (status, payload) =>
  addSecurityHeaders(
    new Response(JSON.stringify(payload), {
      status,
      headers: { "Content-Type": "application/json" },
    })
  );

const addSecurityHeaders = (response) => {
  const headers = new Headers(response.headers);
  headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "SAMEORIGIN");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "geolocation=(), microphone=(self), camera=(self)");

  // Preserve status + statusText; clone body to avoid locking the original response stream.
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const cleanPath = url.pathname.replace(/\/$/, "");

    if (!env.ASSETS) {
      return jsonResponse(500, { error: "ASSETS binding is missing on this Worker route." });
    }

    // Orchestrator API (primary: /api/orchestrator; legacy: /.netlify/functions/orchestrator)
    if (url.pathname === "/api/orchestrator" || url.pathname === "/.netlify/functions/orchestrator") {
      if (request.method !== "POST") {
        return jsonResponse(405, { error: "Method not allowed." });
      }
      // Delegate to the Cloudflare function implementation for orchestration.
      const res = await handleOrchestrator({ request, env, ctx });
      return addSecurityHeaders(res);
    }

    // Admin activity logs (read-only)
    if (url.pathname === "/admin/logs" && request.method === "GET") {
      if (!env.DB) {
        return jsonResponse(503, { error: "D1 database not available." });
      }
      try {
        await env.DB.prepare(
          `CREATE TABLE IF NOT EXISTS commands (
             id INTEGER PRIMARY KEY AUTOINCREMENT,
             ts DATETIME DEFAULT CURRENT_TIMESTAMP,
             command TEXT,
             actions TEXT,
             files TEXT,
             commit TEXT
           );`
        ).run();

        const data = await env.DB.prepare(
          "SELECT id, ts, command, actions, files, commit FROM commands ORDER BY ts DESC LIMIT 20"
        ).all();

        return jsonResponse(200, { logs: data.results || [] });
      } catch (err) {
        return jsonResponse(500, { error: err.message });
      }
    }

    if (url.pathname === "/admin" || url.pathname.startsWith("/admin/")) {
      const adminUrl = new URL("/admin/index.html", url.origin);
      const res = await env.ASSETS.fetch(new Request(adminUrl, request));
      return addSecurityHeaders(res);
    }

    if (cleanPath && !cleanPath.includes(".") && cleanPath !== "/") {
      const htmlUrl = new URL(`${cleanPath}.html`, url.origin);
      const htmlRes = await env.ASSETS.fetch(new Request(htmlUrl, request));
      if (htmlRes.status !== 404) {
        return addSecurityHeaders(htmlRes);
      }
    }

    // Default: serve the built static assets from ./dist with optional placeholder injection.
    const assetRes = await env.ASSETS.fetch(request);
    const contentType = assetRes.headers.get("Content-Type") || "";
    if (contentType.includes("text/html")) {
      const text = await assetRes.text();
      const injected = text
        .replace(/__PAYPAL_CLIENT_ID__/g, env.PAYPAL_CLIENT_ID_PROD || "")
        .replace(/__ADSENSE_PUBLISHER__/g, env.ADSENSE_PUBLISHER || env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID || "")
        .replace(/__ADSENSE_SLOT__/g, env.ADSENSE_SLOT || "");
      const headers = new Headers(assetRes.headers);
      headers.set("Content-Type", "text/html; charset=utf-8");
      headers.set("Cache-Control", "no-store");
      return addSecurityHeaders(
        new Response(injected, {
          status: assetRes.status,
          headers,
        })
      );
    }
    return addSecurityHeaders(assetRes);
  },
};
===== END worker.js =====
===== BEGIN functions/orchestrator.js =====
export async function onRequestPost(context) {
  const { request, env } = context;
  const OPENAI_API = env.OPENAI_API;
  const OPENAI_MODEL = env.OPENAI_MODEL || "gpt-4o-mini";
  const GITHUB_TOKEN = env.GITHUB_TOKEN || env.GH_TOKEN || env.GH_BOT_TOKEN;
  const GITHUB_REPO = env.GITHUB_REPO || env.GH_REPO;
  const GITHUB_BASE_BRANCH = env.GITHUB_BASE_BRANCH || env.GH_BASE_BRANCH || "main";
  const ADMIN_ROLE = env.ADMIN_ROLE;

  const allowedFields = ["eyebrow", "headline", "subhead", "cta", "price", "metric1", "metric2", "metric3"];
  const positiveWords = ["apply now", "ship it", "go ahead", "do it", "yes", "confirm", "send it"];

  const toSafeJsString = (v) => v.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

  const extractJson = (text) => {
    const trimmed = text.trim();
    if (trimmed.startsWith("{")) return JSON.parse(trimmed);
    const match = trimmed.match(/```json\s*([\s\S]*?)\s*```/i);
    if (match) return JSON.parse(match[1]);
    throw new Error("Failed to parse JSON response.");
  };

  const slugify = (value) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const buildFallbackPlan = (command) => {
    const actions = [];
    const text = command.toLowerCase();
    const urlMatch = command.match(/https?:\/\/\S+/);
    const url = urlMatch ? urlMatch[0] : "";
    const sayMatch = command.match(/make .*say (.+)/i) || command.match(/say (.+)/i);
    const headlineMatch = command.match(/headline(?:\s+to|\s+is)?\s+(.+)/i);
    const subheadMatch = command.match(/subhead(?:\s+to|\s+is)?\s+(.+)/i);
    const ctaMatch = command.match(/(cta|button)(?:\s+to|\s+is)?\s+(.+)/i);
    const titleMatch = command.match(/title(?:\s+to|\s+is)?\s+(.+)/i);
    const descMatch = command.match(/description(?:\s+to|\s+is)?\s+(.+)/i);
    const fontMatch = command.match(/font(?:\s+to|\s+is)?\s+([a-zA-Z0-9\s-]+)/i);
    const themeMatch = command.match(/theme(?:\s+to|\s+is)?\s+(ember|ocean|volt|midnight)/i);

    if (sayMatch) {
      actions.push({ type: "update_copy", field: "headline", value: sayMatch[1].trim() });
    } else if (headlineMatch) {
      actions.push({ type: "update_copy", field: "headline", value: headlineMatch[1].trim() });
    }
    if (subheadMatch) {
      actions.push({ type: "update_copy", field: "subhead", value: subheadMatch[1].trim() });
    }
    if (ctaMatch) {
      actions.push({ type: "update_copy", field: "cta", value: ctaMatch[2].trim() });
    }
    if (titleMatch || descMatch) {
      actions.push({
        type: "update_meta",
        title: titleMatch ? titleMatch[1].trim() : undefined,
        description: descMatch ? descMatch[1].trim() : undefined,
      });
    }
    if (themeMatch) {
      actions.push({ type: "update_theme", theme: themeMatch[1] });
    }
    if (text.includes("background video") && url) {
      actions.push({ type: "update_background_video", src: url });
    }
    if ((text.includes("wallpaper") || text.includes("background image")) && url) {
      actions.push({ type: "update_wallpaper", src: url });
    }
    if (text.includes("avatar") && url) {
      actions.push({ type: "update_avatar", src: url });
    }
    if ((text.includes("video") || text.includes("music video")) && url) {
      actions.push({ type: "insert_video", src: url, title: "Featured Video" });
    }
    if ((text.includes("livestream") || text.includes("stream")) && url) {
      actions.push({ type: "insert_stream", url, title: "Live Stream" });
    }
    if (text.includes("add page")) {
      const name = command.replace(/.*add page/i, "").trim();
      if (name) {
        actions.push({
          type: "add_page",
          slug: slugify(name),
          title: name,
          headline: name,
          body: "Details coming soon.",
        });
      }
    }
    if (text.includes("add product")) {
      actions.push({
        type: "add_product",
        name: "New Product",
        price: "",
        description: "Added from voice command.",
        image: url,
      });
    }
    if (fontMatch) {
      actions.push({
        type: "inject_css",
        css: `body { font-family: '${fontMatch[1].trim()}', 'Playfair Display', serif; } h1,h2,h3 { font-family: '${fontMatch[1].trim()}', 'Playfair Display', serif; }`,
      });
    }

    return {
      summary: "Fallback plan",
      commitMessage: `Fallback update: ${command.slice(0, 60)}`,
      actions,
    };
  };

  const githubRequest = async (path, options = {}) => {
    if (!GITHUB_TOKEN || !GITHUB_REPO) throw new Error("Missing GITHUB_TOKEN or GITHUB_REPO.");
    const res = await fetch(`https://api.github.com${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        "User-Agent": "VoiceToWebsite-Cloudflare",
        ...(options.headers || {}),
      },
    });
    if (!res.ok) throw new Error(`GitHub error: ${await res.text()}`);
    return res.json();
  };

  const getRepoParts = () => {
    const [owner, repo] = (GITHUB_REPO || "").split("/");
    if (!owner || !repo) throw new Error("GITHUB_REPO must be owner/repo.");
    return { owner, repo };
  };

  const getFileContent = async (path, ref) => {
    const { owner, repo } = getRepoParts();
    const data = await githubRequest(`/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${ref}`);
    return atob(data.content);
  };

  const updateAppState = (content, field, value) => {
    if (!allowedFields.includes(field)) return content;
    const safeValue = toSafeJsString(value);
    const pattern = new RegExp(`${field}:\\s*'[^']*'`);
    return content.replace(pattern, `${field}: '${safeValue}'`);
  };

  const updateTheme = (content, theme) => {
    const safeValue = toSafeJsString(theme);
    return content.replace(/theme:\s*'[^']*'/, `theme: '${safeValue}'`);
  };

  const updateMeta = (content, title, description) => {
    let updated = content;
    if (title) {
      updated = updated.replace(/<title>.*<\/title>/, `<title>${title}</title>`);
    }
    if (description) {
      updated = updated.replace(
        /<meta name="description" content="[^"]*"\s*\/>/,
        `<meta name="description" content="${description}" />`
      );
    }
    return updated;
  };

  const addNavLink = (content, slug, title) => {
    const link = `<a href="${slug}.html">${title}</a>`;
    if (content.includes(link)) return content;
    return content.replace("</nav>", `  ${link}\n    </nav>`);
  };

  const addFooterLink = (content, slug, title) => {
    const link = `<a href="${slug}.html">${title}</a>`;
    if (content.includes(link)) return content;
    return content.replace("</div>\n  </footer>", `  ${link}\n    </div>\n  </footer>`);
  };

  const insertMonetization = (content, headline, description, cta) => {
    if (content.includes('id="monetization"')) return content;
    const block = `
    <section class="section monetization" id="monetization">
      <h2>${headline}</h2>
      <p>${description}</p>
      <button class="primary">${cta}</button>
    </section>
  `;
    return content.replace("</main>", `${block}\n  </main>`);
  };

  const ensureMonetizationStyles = (content) => {
    if (content.includes(".monetization")) return content;
    return `${content}\n\n.monetization {\n  background: linear-gradient(180deg, rgba(255, 255, 255, 0.05), transparent);\n  border-top: 1px solid rgba(255, 255, 255, 0.06);\n}\n`;
  };

  const updateBackgroundVideo = (content, src) => {
    if (!src) return content;
    return content.replace(/<video[^>]*src="[^"]*"[^>]*>/, (match) => match.replace(/src="[^"]*"/, `src="${src}"`));
  };

  const updateWallpaper = (stylesContent, src) => {
    if (!src) return stylesContent;
    if (stylesContent.includes("background-image: url(")) {
      return stylesContent.replace(/background-image:\s*url\([^)]*\)/, `background-image: url("${src}")`);
    }
    return `${stylesContent}\nbody { background-image: url("${src}"); background-size: cover; background-repeat: no-repeat; }\n`;
  };

  const updateAvatar = (content, src) => {
    if (!src) return content;
    return content.replace(/<div class="avatar"[^>]*>\s*<img[^>]*src="[^"]*"/, (match) =>
      match.replace(/src="[^"]*"/, `src="${src}"`)
    );
  };

  const insertSection = (content, section) => {
    const { id = "custom-block", title = "New Section", body = "Details here." } = section;
    const block = `
    <section class="section custom-block" id="${id}">
      <h2>${title}</h2>
      <p>${body}</p>
    </section>`;
    if (content.includes(`id="${id}"`)) return content;
    return content.replace("</main>", `${block}\n  </main>`);
  };

  const ensureStoreSection = (content) => {
    if (content.includes('id="store"')) return content;
    const block = `
    <section class="section" id="store">
      <h2>Store</h2>
      <div class="store-grid"></div>
    </section>`;
    return content.replace("</main>", `${block}\n  </main>`);
  };

  const addProductCard = (content, product) => {
    const { name = "New Product", price = "", description = "", image = "" } = product;
    const card = `
        <div class="product-card">
          <div class="product-media" style="background-image:url('${image}')"></div>
          <h3>${name}</h3>
          <p>${description}</p>
          <strong>${price}</strong>
          <button class="primary">Buy</button>
        </div>`;
    if (!content.includes('class="store-grid"')) return content;
    return content.replace('</div>\n    </section>', `${card}\n      </div>\n    </section>`);
  };

  const insertVideoSection = (content, video) => {
    const { id = "video-block", title = "Featured Video", src = "", poster = "" } = video;
    const block = `
    <section class="section video-block" id="${id}">
      <h2>${title}</h2>
      <video controls playsinline ${poster ? `poster="${poster}"` : ""} style="width:100%;border-radius:16px;">
        <source src="${src}" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </section>`;
    if (content.includes(`id="${id}"`)) return content;
    return content.replace("</main>", `${block}\n  </main>`);
  };

  const insertStreamSection = (content, stream) => {
    const { id = "livestream", title = "Live Stream", url = "" } = stream;
    const block = `
    <section class="section livestream" id="${id}">
      <h2>${title}</h2>
      <div class="embed">
        <iframe src="${url}" allow="autoplay; encrypted-media" allowfullscreen style="width:100%;height:360px;border:0;border-radius:16px;"></iframe>
      </div>
    </section>`;
    if (content.includes(`id="${id}"`)) return content;
    return content.replace("</main>", `${block}\n  </main>`);
  };

  const appendCustomStyles = (stylesContent, css) => {
    if (!css) return stylesContent;
    return `${stylesContent}\n\n/* Voice-injected styles */\n${css}\n`;
  };

  const buildPageTemplate = ({ title, headline, body }) => {
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <meta name="description" content="${title}" />
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <div class="bg-noise" aria-hidden="true"></div>
  <header class="site-header">
    <div class="brand">
      <span class="brand-mark">VW</span>
      <div class="brand-text">
        <strong>VoiceToWebsite</strong>
        <span>Revenue Engine</span>
      </div>
    </div>
    <nav class="nav">
      <a href="index.html">Home</a>
    </nav>
    <button class="ghost-button">Book a Demo</button>
  </header>
  <main class="page">
    <section class="section">
      <h1>${headline}</h1>
      <p>${body}</p>
    </section>
  </main>
  <footer class="footer">
    <div>
      <strong>VoiceToWebsite</strong>
      <p>Revenue systems that never sleep.</p>
    </div>
    <div class="footer-links">
      <a href="index.html">Home</a>
    </div>
  </footer>
</body>
</html>`;
  };

  const createCommitOnMain = async (updates, message) => {
    const { owner, repo } = getRepoParts();
    const baseRef = await githubRequest(`/repos/${owner}/${repo}/git/ref/heads/${GITHUB_BASE_BRANCH}`);
    const baseCommitSha = baseRef.object.sha;
    const baseCommit = await githubRequest(`/repos/${owner}/${repo}/git/commits/${baseCommitSha}`);
    const baseTreeSha = baseCommit.tree.sha;

    const treeItems = [];
    for (const [path, content] of Object.entries(updates)) {
      const blob = await githubRequest(`/repos/${owner}/${repo}/git/blobs`, {
        method: "POST",
        body: JSON.stringify({ content, encoding: "utf-8" }),
      });
      treeItems.push({ path, mode: "100644", type: "blob", sha: blob.sha });
    }

    const newTree = await githubRequest(`/repos/${owner}/${repo}/git/trees`, {
      method: "POST",
      body: JSON.stringify({ base_tree: baseTreeSha, tree: treeItems }),
    });

    const newCommit = await githubRequest(`/repos/${owner}/${repo}/git/commits`, {
      method: "POST",
      body: JSON.stringify({
        message,
        tree: newTree.sha,
        parents: [baseCommitSha],
      }),
    });

    await githubRequest(`/repos/${owner}/${repo}/git/refs/heads/${GITHUB_BASE_BRANCH}`, {
      method: "PATCH",
      body: JSON.stringify({ sha: newCommit.sha }),
    });

    return { commitSha: newCommit.sha };
  };

  const logToDB = async ({ command, actions, files, commit }) => {
    if (!env.DB) return;
    try {
      await env.DB.prepare(
        `CREATE TABLE IF NOT EXISTS commands (
           id INTEGER PRIMARY KEY AUTOINCREMENT,
           ts DATETIME DEFAULT CURRENT_TIMESTAMP,
           command TEXT,
           actions TEXT,
           files TEXT,
           commit TEXT
         );`
      ).run();
      await env.DB.prepare(
        "INSERT INTO commands (command, actions, files, commit) VALUES (?, ?, ?, ?)"
      )
        .bind(command, JSON.stringify(actions || []), JSON.stringify(files || []), commit || "")
        .run();
    } catch (_) {
      // ignore logging errors
    }
  };

  const applyActions = async (actions, command) => {
    const updates = {};
    let indexHtml = null;
    let appJs = null;
    let styles = null;
    const auditLog = [];

    const needsIndex = actions.some((action) =>
      [
        "update_meta",
        "add_page",
        "insert_monetization",
        "update_background_video",
        "update_avatar",
        "insert_section",
        "add_product",
        "insert_video",
        "insert_stream",
      ].includes(action.type)
    );
    const needsApp = actions.some((action) =>
      ["update_copy", "update_theme"].includes(action.type)
    );
    const needsStyles = actions.some(
      (action) =>
        action.type === "insert_monetization" ||
        action.type === "update_wallpaper" ||
        action.type === "inject_css"
    );

    if (needsIndex) indexHtml = await getFileContent("index.html", GITHUB_BASE_BRANCH);
    if (needsApp) appJs = await getFileContent("app.js", GITHUB_BASE_BRANCH);
    if (needsStyles) styles = await getFileContent("styles.css", GITHUB_BASE_BRANCH);

    const newPages = [];

    for (const action of actions) {
      auditLog.push(action.type);
      if (action.type === "update_copy" && appJs) {
        appJs = updateAppState(appJs, action.field, action.value);
      }
      if (action.type === "update_theme" && appJs) {
        appJs = updateTheme(appJs, action.theme);
      }
      if (action.type === "update_meta" && indexHtml) {
        indexHtml = updateMeta(indexHtml, action.title, action.description);
      }
      if (action.type === "add_page" && indexHtml) {
        const slug = action.slug || "new-page";
        const title = action.title || "New Page";
        const headline = action.headline || title;
        const body = action.body || "Details coming soon.";
        newPages.push({
          path: `${slug}.html`,
          content: buildPageTemplate({ title, headline, body }),
          slug,
          title,
        });
        indexHtml = addNavLink(indexHtml, slug, title);
        indexHtml = addFooterLink(indexHtml, slug, title);
      }
      if (action.type === "insert_monetization" && indexHtml) {
        indexHtml = insertMonetization(
          indexHtml,
          action.headline || "Monetize this page",
          action.description || "Add a revenue block to capture leads or offers.",
          action.cta || "Get the offer"
        );
        if (styles) {
          styles = ensureMonetizationStyles(styles);
        }
      }
      if (action.type === "update_background_video" && indexHtml) {
        indexHtml = updateBackgroundVideo(indexHtml, action.src);
      }
      if (action.type === "update_wallpaper" && styles) {
        styles = updateWallpaper(styles, action.src);
      }
      if (action.type === "update_avatar" && indexHtml) {
        indexHtml = updateAvatar(indexHtml, action.src);
      }
      if (action.type === "insert_section" && indexHtml) {
        indexHtml = insertSection(indexHtml, action);
      }
      if (action.type === "add_product" && indexHtml) {
        indexHtml = ensureStoreSection(indexHtml);
        indexHtml = addProductCard(indexHtml, action);
      }
      if (action.type === "insert_video" && indexHtml) {
        indexHtml = insertVideoSection(indexHtml, action);
      }
      if (action.type === "insert_stream" && indexHtml) {
        indexHtml = insertStreamSection(indexHtml, action);
      }
      if (action.type === "inject_css" && styles) {
        styles = appendCustomStyles(styles, action.css);
      }
    }

    if (indexHtml) updates["index.html"] = indexHtml;
    if (appJs) updates["app.js"] = appJs;
    if (styles) updates["styles.css"] = styles;
    newPages.forEach((page) => {
      updates[page.path] = page.content;
    });

    const message = `Live update: ${command.slice(0, 60)}`;
    const { commitSha } = await createCommitOnMain(updates, message);

    // Log to D1 if available; fallback to KV
    await logToDB({ command, actions: auditLog, files: Object.keys(updates), commit: commitSha });

    // Optional: log to KV if binding exists
    if (env.LEARN && typeof env.LEARN.put === "function") {
      try {
        const key = `cmd:${Date.now()}`;
        await env.LEARN.put(
          key,
          JSON.stringify({
            command,
            actions: auditLog,
            files: Object.keys(updates),
            commit: commitSha,
          }),
          { expirationTtl: 60 * 60 * 24 * 7 } // 7 days
        );
      } catch (_) {
        // ignore logging failures
      }
    }

    return { commitSha, files: Object.keys(updates) };
  };

  try {
    const payload = await request.json();
    const mode = payload.mode || "plan";
    const command = payload.command || "";

    if (!OPENAI_API) {
      throw new Error("Missing OPENAI_API. Set the Cloudflare Worker secret: wrangler secret put OPENAI_API");
    }

    if (mode === "rollback") {
      throw new Error("Rollback disabled for live apply mode.");
    }

    if (!command && mode !== "rollback") {
      throw new Error("Missing command.");
    }

    let plan = payload.plan;
    if (!plan) {
      if (!OPENAI_API) {
        const fallback = buildFallbackPlan(command);
        if (!fallback.actions.length) throw new Error("Missing OPENAI_API.");
        plan = fallback;
      } else {
        try {
          const res = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${OPENAI_API}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: OPENAI_MODEL,
              messages: [
                {
                  role: "system",
                  content: `
You are a site editor for a static HTML/CSS/JS site.
Return ONLY valid JSON with this schema:
{
  "summary": "short summary",
  "commitMessage": "short git commit message",
  "actions": [
    {"type":"update_copy","field":"headline","value":"..."},
    {"type":"update_meta","title":"...","description":"..."},
    {"type":"update_theme","theme":"ember|ocean|volt|midnight"},
    {"type":"add_page","slug":"partners","title":"Partners","headline":"...","body":"..."},
    {"type":"insert_monetization","headline":"...","description":"...","cta":"..."},
    {"type":"update_background_video","src":"https://...mp4"},
    {"type":"update_wallpaper","src":"https://...jpg"},
    {"type":"update_avatar","src":"https://...jpg"},
    {"type":"insert_section","id":"custom","title":"...","body":"..."},
    {"type":"add_product","name":"...","price":"...","description":"...","image":"https://..."},
    {"type":"insert_video","id":"music-video","title":"...","src":"https://...mp4","poster":"https://...jpg"},
    {"type":"insert_stream","id":"livestream","title":"...","url":"https://..."},
    {"type":"inject_css","css":".class { color: red; }"}
  ]
}
Only include supported actions. Keep values concise and suitable for production.
                  `.trim(),
                },
                { role: "user", content: command },
              ],
              temperature: 0.2,
            }),
          });
          const raw = await res.text();
          if (!res.ok) {
            throw new Error(`OpenAI error ${res.status}: ${raw}`);
          }
          const data = JSON.parse(raw);
          const content = data?.choices?.[0]?.message?.content;
          if (!content) {
            throw new Error(`OpenAI response missing content: ${raw}`);
          }
          plan = extractJson(content);
        } catch (err) {
          const fallback = buildFallbackPlan(command);
          if (!fallback.actions.length) throw err;
          plan = fallback;
        }
      }
    }

    if (mode === "plan") {
      return new Response(JSON.stringify({ mode, command, plan }), { headers: { "Content-Type": "application/json" } });
    }

    const actions = plan.actions || [];
    const applied = await applyActions(actions, command);
    return new Response(JSON.stringify({ mode, command, plan, ...applied }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
===== END functions/orchestrator.js =====
===== BEGIN admin/admin.js =====
const statusEl = document.getElementById("status");
const micStateEl = document.getElementById("mic-state");
const commandEl = document.getElementById("command");
const responseEl = document.getElementById("response");
const startBtn = document.getElementById("start");
const stopBtn = document.getElementById("stop");
const planBtn = document.getElementById("plan");
const applyBtn = document.getElementById("apply");
const lockScreen = document.getElementById("lock-screen");
const lockInput = document.getElementById("lock-input");
const lockButton = document.getElementById("lock-button");
const lockError = document.getElementById("lock-error");
const adminShell = document.querySelector(".admin-shell");
const previewReset = document.getElementById("preview-reset");
const previewSpeak = document.getElementById("preview-speak");
const previewExtras = document.getElementById("preview-extras");
const previewFrame = document.getElementById("preview-frame");
const activityList = document.getElementById("activity-list");
const activityStatus = document.getElementById("activity-status");
const refreshLogs = document.getElementById("refresh-logs");

let recognition;
let listening = false;
let inactivityTimer = null;
let lastPlan = null;

const PASSCODE = "5555";
const UNLOCK_KEY = "yt-admin-unlocked";
const positiveWords = [
  "apply now",
  "ship it",
  "go ahead",
  "do it",
  "yes",
  "confirm",
  "send it",
  "ok",
  "okay",
  "looks good",
  "sounds good",
  "go for it",
  "approved",
];

const setStatus = (text) => {
  if (statusEl) statusEl.textContent = text;
};

const setResponse = (payload) => {
  if (responseEl) responseEl.textContent = JSON.stringify(payload, null, 2);
};

const speak = (text) => {
  if (!("speechSynthesis" in window)) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 1;
  speechSynthesis.cancel();
  speechSynthesis.speak(utter);
};

const clickSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 520;
    gain.gain.value = 0.06;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.06);
  } catch (_) {
    // ignore
  }
};

const getFrameDoc = () => previewFrame?.contentDocument || previewFrame?.contentWindow?.document;

const setFrameText = (selector, value) => {
  if (!value) return;
  const doc = getFrameDoc();
  if (!doc) return;
  const el = doc.querySelector(selector);
  if (el) el.textContent = value;
};

const setFrameStyle = (selector, styles) => {
  const doc = getFrameDoc();
  if (!doc) return;
  const el = doc.querySelector(selector);
  if (!el) return;
  Object.entries(styles).forEach(([key, value]) => {
    if (value !== undefined && value !== null) el.style[key] = value;
  });
};

const setFrameTheme = (theme) => {
  const doc = getFrameDoc();
  if (!doc) return;
  if (!theme || theme === "ember") {
    doc.documentElement.removeAttribute("data-theme");
    return;
  }
  doc.documentElement.dataset.theme = theme;
};

const resetPreview = () => {
  if (previewExtras) previewExtras.innerHTML = "";
  const doc = getFrameDoc();
  if (doc && doc.body) {
    doc.body.style.backgroundImage = "";
    doc.documentElement.removeAttribute("data-theme");
  }
};

const applyLocalPreview = (command) => {
  if (!command) return;
  const doc = getFrameDoc();
  if (!doc) return;
  const text = command.toLowerCase();
  const urlMatch = command.match(/https?:\/\/\S+/);
  const hexMatch = command.match(/#([0-9a-fA-F]{3,6})/);
  const sayMatch = command.match(/say\s+(.+)/i);
  const fontMatch = command.match(/font\s+(to|is|=)?\s*([a-zA-Z0-9\s-]+)/i);

  if (sayMatch) setFrameText("#headline", sayMatch[1].trim());
  if (text.includes("headline")) setFrameText("#headline", command);
  if (text.includes("subhead")) setFrameText("#subhead", command);
  if (text.includes("cta")) setFrameText("#cta", command);

  if (hexMatch) setFrameStyle("#headline", { color: `#${hexMatch[1]}` });
  if (fontMatch) {
    setFrameStyle("#headline", { fontFamily: `'${fontMatch[2].trim()}', "Playfair Display", serif` });
  }

  if (text.includes("blue")) {
    doc.body.style.backgroundImage = "linear-gradient(135deg, rgba(80,120,255,0.15), rgba(20,30,60,0.6))";
  }

  if (previewExtras) previewExtras.innerHTML = "";
  if (previewExtras && urlMatch) {
    const block = document.createElement("div");
    block.className = "preview-extra-card";
    block.innerHTML = `<h4>Media</h4><p>${command}</p>`;
    previewExtras.appendChild(block);
  }
};

const clearExtras = () => {
  if (previewExtras) previewExtras.innerHTML = "";
};

const applyActionsPreview = (actions = []) => {
  clearExtras();
  const doc = getFrameDoc();
  actions.forEach((action) => {
    if (action.type === "update_copy") {
      if (action.field === "headline") setFrameText("#headline", action.value);
      if (action.field === "subhead") setFrameText("#subhead", action.value);
      if (action.field === "cta") setFrameText("#cta", action.value);
    }
    if (action.type === "update_meta" && action.title && doc) {
      doc.title = action.title;
    }
    if (action.type === "update_theme") {
      setFrameTheme(action.theme);
    }
    if (action.type === "update_background_video") {
      const video = doc?.querySelector(".video-bg video");
      if (video) {
        video.src = action.src;
        video.load?.();
      }
    }
    if (action.type === "update_wallpaper") {
      if (doc?.body) {
        doc.body.style.backgroundImage = `url('${action.src}')`;
        doc.body.style.backgroundSize = "cover";
        doc.body.style.backgroundRepeat = "no-repeat";
      }
    }
    if (action.type === "update_avatar") {
      const avatarImg = doc?.querySelector(".avatar img");
      if (avatarImg) avatarImg.src = action.src;
    }
    if (action.type === "insert_section" && previewExtras) {
      const block = document.createElement("div");
      block.className = "preview-extra-card";
      block.innerHTML = `<h4>${action.title || action.id || "Section"}</h4><p>${action.body || ""}</p>`;
      previewExtras.appendChild(block);
    }
    if (action.type === "insert_video" && previewExtras) {
      const block = document.createElement("div");
      block.className = "preview-extra-card";
      block.innerHTML = `<h4>${action.title || "Video"}</h4><video controls muted playsinline style="width:100%;border-radius:12px;"><source src="${action.src}" type="video/mp4"></video>`;
      previewExtras.appendChild(block);
    }
    if (action.type === "insert_stream" && previewExtras) {
      const block = document.createElement("div");
      block.className = "preview-extra-card";
      block.innerHTML = `<h4>${action.title || "Livestream"}</h4><div class="embed"><iframe src="${action.url}" style="width:100%;height:200px;border:0;border-radius:12px;" allowfullscreen></iframe></div>`;
      previewExtras.appendChild(block);
    }
    if (action.type === "add_product" && previewExtras) {
      const block = document.createElement("div");
      block.className = "preview-extra-card";
      block.innerHTML = `<h4>${action.name || "Product"}</h4><p>${action.description || ""}</p><strong>${action.price || ""}</strong>`;
      previewExtras.appendChild(block);
    }
    if (action.type === "insert_monetization" && previewExtras) {
      const block = document.createElement("div");
      block.className = "preview-extra-card";
      block.innerHTML = `<h4>${action.headline || "Monetize"}</h4><p>${action.description || ""}</p><button class="primary">${action.cta || "Get the offer"}</button>`;
      previewExtras.appendChild(block);
    }
  });
  speak("Preview updated");
};

const logActivity = async () => {
  if (!activityStatus) return;
  activityStatus.textContent = "Loading history...";
  try {
    const res = await fetch("/admin/logs");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const logs = data.logs || [];
    if (activityList) activityList.innerHTML = "";
    if (!logs.length) {
      activityStatus.textContent = "No history yet.";
      return;
    }
    logs.forEach((row) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <div class="cmd">${row.command || "(no command)"}</div>
        <div class="meta">Actions: ${row.actions || "[]"} | Files: ${row.files || "[]"} | Commit: ${row.commit || ""} | ${row.ts || ""}</div>
      `;
      if (activityList) activityList.appendChild(li);
    });
    activityStatus.textContent = `Loaded ${logs.length} entries.`;
  } catch (err) {
    activityStatus.textContent = `History unavailable (${err.message}).`;
  }
};

const callOrchestrator = async (payload) => {
  const res = await fetch("/api/orchestrator", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch (_) {
    data = { error: text || "Request failed" };
  }
  if (!res.ok) {
    throw new Error(data.error || text || "Request failed");
  }
  return data;
};

const isUnlocked = () => sessionStorage.getItem(UNLOCK_KEY) === "true";

const setLockedUI = (locked) => {
  lockScreen.style.display = locked ? "grid" : "none";
  adminShell.style.filter = locked ? "blur(8px)" : "none";
  [startBtn, stopBtn, planBtn, applyBtn, commandEl].forEach((el) => {
    if (el) el.disabled = locked;
  });
  setStatus(locked ? "Locked" : "Unlocked");
};

const initPasscodeGate = () => {
  const unlocked = sessionStorage.getItem(UNLOCK_KEY) === "true";
  setLockedUI(!unlocked);

  const unlock = () => {
    if (lockInput.value.trim() === PASSCODE) {
      sessionStorage.setItem(UNLOCK_KEY, "true");
      lockError.textContent = "";
      setLockedUI(false);
      speak("Controls unlocked");
      logActivity();
      return;
    }
    lockError.textContent = "Incorrect code.";
    speak("Incorrect code");
  };

  lockButton.addEventListener("click", unlock);
  lockInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") unlock();
  });
};

const initSpeech = () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    micStateEl.textContent = "Speech recognition not supported in this browser.";
    return;
  }

  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.lang = "en-US";
  recognition.interimResults = false;

  const scheduleInactivity = () => {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      stopBtn.click();
    }, 5000);
  };

  recognition.onresult = (event) => {
    if (!event.results || event.results.length === 0) return;
    const last = event.results[event.results.length - 1];
    if (!last || !last.isFinal || !last[0]) return;
    const transcript = last[0].transcript.trim();
    commandEl.value = transcript;
    micStateEl.textContent = `Captured: "${transcript}"`;
    applyLocalPreview(transcript);
    if (listening) scheduleInactivity();

    const lower = transcript.toLowerCase();
    if (positiveWords.some((p) => lower.includes(p)) && lastPlan) {
      applyBtn.click();
    }
  };

  recognition.onerror = (event) => {
    micStateEl.textContent = `Mic error: ${event.error}`;
  };

  recognition.onend = () => {
    if (listening) {
      recognition.start();
    }
  };

  return { scheduleInactivity };
};

const speechController = initSpeech();

startBtn.addEventListener("click", () => {
  if (!recognition) return;
  listening = true;
  recognition.start();
  if (speechController?.scheduleInactivity) speechController.scheduleInactivity();
  micStateEl.textContent = "Listening...";
});

stopBtn.addEventListener("click", () => {
  if (!recognition) return;
  listening = false;
  recognition.stop();
  micStateEl.textContent = "Microphone idle.";
  if (inactivityTimer) clearTimeout(inactivityTimer);
});

commandEl.addEventListener("input", () => {
  const command = commandEl.value.trim();
  if (!command) return;
  applyLocalPreview(command);
});

planBtn.addEventListener("click", async () => {
  try {
    if (!isUnlocked()) {
      setResponse({ error: "Unlock with the access code before generating a plan." });
      speak("Unlock required");
      return;
    }
    const command = commandEl.value.trim();
    if (!command) return;
    setResponse({ status: "Planning..." });
    applyLocalPreview(command);
    const data = await callOrchestrator({ mode: "plan", command });
    lastPlan = data;
    setResponse(data);
    if (data.plan?.actions) {
      applyActionsPreview(data.plan.actions);
    }
    speak("Plan ready. Say apply now to ship it.");
  } catch (err) {
    setResponse({ error: err.message });
    speak("Planning failed");
  }
});

applyBtn.addEventListener("click", async () => {
  try {
    speak("Hell ya Boss man, I'm making those changes for you right now");
    if (!isUnlocked()) {
      setResponse({ error: "Unlock with the access code before applying changes." });
      speak("Unlock required");
      return;
    }
    if (!lastPlan) {
      const fallbackCommand = commandEl.value.trim();
      if (!fallbackCommand) {
        setResponse({ error: "Provide a command first." });
        return;
      }
      const data = await callOrchestrator({ mode: "plan", command: fallbackCommand });
      lastPlan = data;
    }
    setResponse({ status: "Applying live to production..." });
    const data = await callOrchestrator({ mode: "apply", plan: lastPlan.plan, command: lastPlan.command });
    setResponse(data);
    logActivity();
  } catch (err) {
    setResponse({ error: err.message });
    speak("Apply failed");
  }
});

if (previewReset) {
  previewReset.addEventListener("click", () => resetPreview());
}

if (previewSpeak) {
  previewSpeak.addEventListener("click", () => {
    const summary = commandEl.value ? commandEl.value : "No command yet.";
    speak(summary);
  });
}

if (previewFrame) {
  previewFrame.addEventListener("load", () => {
    if (lastPlan?.plan?.actions) {
      applyActionsPreview(lastPlan.plan.actions);
    }
  });
}

if (refreshLogs) {
  refreshLogs.addEventListener("click", () => logActivity());
}

document.addEventListener("click", (event) => {
  if (event.target.closest("button, a")) {
    clickSound();
  }
});

initPasscodeGate();
===== END admin/admin.js =====
===== BEGIN app.js =====
const state = {
  eyebrow: '',
  headline: 'Hi Tiger',
  subhead: '',
  cta: 'Start Now',
  price: '',
  metric1: '',
  metric2: '',
  metric3: '',
  theme: 'ember',
  testimonialsVisible: true,
};

// Bump the storage key to flush stale cached values (CTA was blank for some users).
const storageKey = 'youtuneai-state-v2';
const controlKey = 'youtuneai-control-unlocked';
const controlPassword = '5555';
const audioTracks = [
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3',
];

const elements = {
  eyebrow: document.getElementById('eyebrow'),
  headline: document.getElementById('headline'),
  subhead: document.getElementById('subhead'),
  cta: document.getElementById('cta'),
  price: document.getElementById('price'),
  metric1: document.getElementById('metric1'),
  metric2: document.getElementById('metric2'),
  metric3: document.getElementById('metric3'),
  testimonials: document.getElementById('testimonials'),
  transcript: document.getElementById('transcript'),
  contactModal: document.getElementById('contact-modal'),
  contactClose: document.getElementById('contact-close'),
  contactLink: document.getElementById('contact-link'),
  contactFooter: document.getElementById('contact-footer'),
  contactLinkMobile: document.getElementById('contact-link-mobile'),
  cursorDot: document.getElementById('cursor-dot'),
  ticker: document.getElementById('ticker'),
  tickerData: document.getElementById('ticker-data'),
  avatar: document.getElementById('avatar'),
  menuToggle: document.getElementById('menu-toggle'),
  mobileDrawer: document.getElementById('mobile-drawer'),
  mobileLinks: document.querySelectorAll('.mobile-drawer a'),
  controlLock: document.getElementById('control-lock'),
  controlGrid: document.getElementById('control-grid'),
  controlPassword: document.getElementById('control-password'),
  controlUnlock: document.getElementById('unlock-control'),
  controlNote: document.getElementById('control-lock-note'),
  inputs: {
    headline: document.getElementById('headline-input'),
    subhead: document.getElementById('subhead-input'),
    cta: document.getElementById('cta-input'),
    price: document.getElementById('price-input'),
    theme: document.getElementById('theme-input'),
    metric1: document.getElementById('metric1-input'),
    metric2: document.getElementById('metric2-input'),
    metric3: document.getElementById('metric3-input'),
  },
};

const setText = (el, value) => {
  if (el) el.textContent = value;
};

const setInputValue = (el, value) => {
  if (el) el.value = value;
};

const applyTheme = (theme) => {
  document.documentElement.dataset.theme = theme === 'ember' ? '' : theme;
};

const isControlUnlocked = () => sessionStorage.getItem(controlKey) === 'true';

const setControlVisibility = () => {
  const unlocked = isControlUnlocked();
  if (elements.controlLock) elements.controlLock.style.display = unlocked ? 'none' : 'block';
  if (elements.controlGrid) elements.controlGrid.style.display = unlocked ? 'grid' : 'none';
};

const applyState = () => {
  setText(elements.eyebrow, state.eyebrow);
  setText(elements.headline, state.headline);
  setText(elements.subhead, state.subhead);
  setText(elements.cta, state.cta);
  setText(elements.price, state.price);
  setText(elements.metric1, state.metric1);
  setText(elements.metric2, state.metric2);
  setText(elements.metric3, state.metric3);
  if (elements.testimonials) {
    elements.testimonials.style.display = state.testimonialsVisible ? 'grid' : 'none';
  }
  applyTheme(state.theme);

  setInputValue(elements.inputs.headline, state.headline);
  setInputValue(elements.inputs.subhead, state.subhead);
  setInputValue(elements.inputs.cta, state.cta);
  setInputValue(elements.inputs.price, state.price);
  setInputValue(elements.inputs.theme, state.theme);
  setInputValue(elements.inputs.metric1, state.metric1);
  setInputValue(elements.inputs.metric2, state.metric2);
  setInputValue(elements.inputs.metric3, state.metric3);
};

const persistState = () => {
  localStorage.setItem(storageKey, JSON.stringify(state));
};

const loadState = () => {
  const saved = localStorage.getItem(storageKey);
  if (!saved) return;
  try {
    const parsed = JSON.parse(saved);
    Object.assign(state, parsed);
  } catch (err) {
    console.warn('Failed to parse saved state', err);
  }
};

const setValue = (key, value) => {
  if (!value) return;
  state[key] = value.trim();
  applyState();
  persistState();
};

const logTranscript = (text) => {
  if (elements.transcript) {
    elements.transcript.textContent = text;
  }
};

const updateFromInputs = () => {
  const read = (input, fallback) => (input ? input.value.trim() || fallback : fallback);
  state.headline = read(elements.inputs.headline, state.headline);
  state.subhead = read(elements.inputs.subhead, state.subhead);
  state.cta = read(elements.inputs.cta, state.cta);
  state.price = read(elements.inputs.price, state.price);
  state.theme = elements.inputs.theme?.value || state.theme;
  state.metric1 = read(elements.inputs.metric1, state.metric1);
  state.metric2 = read(elements.inputs.metric2, state.metric2);
  state.metric3 = read(elements.inputs.metric3, state.metric3);
  applyState();
  persistState();
};

const parseCommand = (command) => {
  const text = command.toLowerCase();

  if (text.includes('hide testimonials')) {
    state.testimonialsVisible = false;
    applyState();
    persistState();
    return;
  }
  if (text.includes('show testimonials')) {
    state.testimonialsVisible = true;
    applyState();
    persistState();
    return;
  }

  const mappings = [
    { regex: /headline to (.*)/, key: 'headline' },
    { regex: /subhead to (.*)/, key: 'subhead' },
    { regex: /cta to (.*)/, key: 'cta' },
    { regex: /price to (.*)/, key: 'price' },
    { regex: /metric one to (.*)/, key: 'metric1' },
    { regex: /metric two to (.*)/, key: 'metric2' },
    { regex: /metric three to (.*)/, key: 'metric3' },
    { regex: /theme to (ember|ocean|volt|midnight)/, key: 'theme' },
  ];

  for (const mapping of mappings) {
    const match = command.match(mapping.regex);
    if (match && match[1]) {
      setValue(mapping.key, match[1]);
      return;
    }
  }
```

Last 25 pages (approx. 55 lines/page):

```text
  align-items: center;
}

.list {
  padding-left: 1.2rem;
  color: var(--muted);
}

.milestone-card {
  background: var(--surface-2);
  border-radius: 24px;
  padding: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: grid;
  gap: 1.5rem;
}

.milestone-label {
  margin: 0 0 0.4rem;
  color: var(--muted);
  font-size: 0.85rem;
}

.cases {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.03), transparent);
}

.cases-header {
  display: flex;
  justify-content: space-between;
  gap: 2rem;
  align-items: center;
  margin-bottom: 2rem;
}

.cases-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.case-card {
  background: var(--surface);
  padding: 1.6rem;
  border-radius: 22px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.case-metric {
  display: inline-flex;
  margin-top: 1rem;
  color: var(--accent);
  font-weight: 600;
}

.testimonials {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}

.quote {
  background: rgba(14, 18, 25, 0.85);
  padding: 1.5rem;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.highlight {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.03), transparent);
}

.pricing-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
}

.pricing-grid {
  margin-top: 2rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 1.5rem;
}

.price-card {
  background: var(--surface);
  padding: 2rem;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.price-card.featured {
  background: linear-gradient(
    140deg,
    rgba(241, 179, 90, 0.16),
    rgba(255, 255, 255, 0.04)
  );
  border: 1px solid var(--ring);
}

.price {
  font-size: 2rem;
  font-weight: 600;
}

.control {
  background: var(--bg-alt);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.control-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 2rem;
}

.control-lock {
  background: var(--surface);
  border-radius: 24px;
  padding: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  margin-bottom: 2rem;
  display: none;
}

.control-lock-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 1rem;
}

.control-lock input {
  background: #0f141c;
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: var(--text);
  padding: 0.7rem 0.9rem;
  border-radius: 12px;
  font-family: inherit;
  min-width: 220px;
}

.control-lock-note {
  margin-top: 0.8rem;
  color: var(--muted);
  font-size: 0.9rem;
}

.control-panel {
  background: var(--surface);
  border-radius: 24px;
  padding: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.panel-actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.panel-section {
  display: grid;
  gap: 0.4rem;
  margin-bottom: 1rem;
}

.panel-section input,
.panel-section textarea,
.panel-section select {
  background: #0f141c;
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: var(--text);
  padding: 0.6rem 0.8rem;
  border-radius: 12px;
  font-family: inherit;
}

.metrics-grid {
  display: grid;
  gap: 0.6rem;
}

.control-log {
  background: var(--surface-2);
  border-radius: 24px;
  padding: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.control-log ul {
  padding-left: 1.2rem;
  color: var(--muted);
}

.ticker {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 35;
  background: rgba(0, 0, 0, 0.65);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding: 0.35rem 1rem;
  color: var(--text);
  font-size: 0.9rem;
  display: flex;
  gap: 1.5rem;
  overflow: hidden;
}

.ticker span {
  white-space: nowrap;
}

.avatar {
  position: fixed;
  right: 18px;
  bottom: 110px;
  width: 140px;
  height: 220px;
  z-index: 34;
  cursor: grab;
  transition:
    transform 0.2s ease,
    filter 0.2s ease,
    box-shadow 0.2s ease;
  user-select: none;
  border-radius: 22px;
  overflow: hidden;
  box-shadow:
    0 16px 40px rgba(0, 0, 0, 0.55),
    0 0 0 1px rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(2px);
  background: linear-gradient(
    160deg,
    rgba(255, 255, 255, 0.06),
    rgba(241, 179, 90, 0.14)
  );
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
}

.avatar:hover {
  filter: drop-shadow(0 0 16px rgba(241, 179, 90, 0.35));
  box-shadow:
    0 18px 44px rgba(0, 0, 0, 0.6),
    0 0 0 1px rgba(241, 179, 90, 0.28);
}

@media (max-width: 900px) {
  .avatar {
    position: absolute;
    inset: auto 50% auto auto;
    transform: translateX(50%);
    width: 120px;
    height: 190px;
  }
}

.footer {
  display: flex;
  justify-content: space-between;
  padding: 3rem 6vw;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.footer-links {
  display: flex;
  gap: 1.5rem;
}

.footer a {
  color: var(--muted);
  text-decoration: none;
}

.reveal {
  opacity: 0;
  transform: translateY(20px);
  transition:
    opacity 0.7s ease,
    transform 0.7s ease;
}

.reveal.visible {
  opacity: 1;
  transform: translateY(0);
}

.modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: none;
  align-items: center;
  justify-content: center;
  z-index: 40;
  padding: 1rem;
}

.modal.show {
  display: flex;
}

.modal-inner {
  background: var(--surface);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 2rem;
  width: min(520px, 90vw);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.35);
}

.modal-close {
  background: transparent;
  border: none;
  color: var(--text);
  font-size: 1.4rem;
  float: right;
  cursor: pointer;
}

.contact-form {
  display: grid;
  gap: 0.9rem;
}

.contact-form label {
  display: grid;
  gap: 0.4rem;
  font-size: 0.95rem;
}

.contact-form input,
.contact-form textarea {
  background: #0f141c;
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: var(--text);
  padding: 0.7rem 0.9rem;
  border-radius: 12px;
  font-family: inherit;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(18px);
  }
}

@keyframes perimeter {
  0% {
    box-shadow:
      0 0 20px rgba(242, 196, 109, 0.3),
      inset 0 0 20px rgba(255, 255, 255, 0.05);
  }
  100% {
    box-shadow:
      0 0 35px rgba(242, 196, 109, 0.55),
      inset 0 0 30px rgba(255, 255, 255, 0.12);
  }
}

@keyframes ticker {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}

@keyframes skate-in {
  from {
    transform: translateX(-40px) skewX(-6deg);
    opacity: 0;
  }
  to {
    transform: translateX(0) skewX(0deg);
    opacity: 1;
  }
}

@keyframes pulse-color {
  0% {
    color: var(--text);
  }
  33% {
    color: #7ad0ff;
  }
  66% {
    color: #7ff5c2;
  }
  100% {
    color: var(--text);
  }
}

@media (max-width: 960px) {
  .nav {
    display: none;
  }
  .menu-toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }
  .site-header {
    flex-wrap: wrap;
    gap: 1rem;
  }
  .pricing-header,
  .cases-header {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 700px) {
  .hero {
    padding-top: 2rem;
  }
  .hero-metrics {
    gap: 1rem;
  }
  .footer {
    flex-direction: column;
    gap: 1rem;
  }
}


/* Voice-injected styles */
body { animation: scrollColors 10s infinite; } @keyframes scrollColors { 0% { background-color: blue; } 16.67% { background-color: red; } 33.33% { background-color: orange; } 50% { background-color: pink; } 66.67% { background-color: purple; } 83.33% { background-color: yellow; } 100% { background-color: green; } }


/* Voice-injected styles */
@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } } .high-tiger { animation: bounce 1s infinite; }
===== END styles.css =====
===== BEGIN nav.js =====
(() => {
  const beep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 880;
      gain.gain.value = 0.08;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (_) {
      // ignore
    }
  };

  const links = document.querySelectorAll("nav a");
  links.forEach((link) => {
    link.addEventListener("mouseenter", beep);
  });
})();
===== END nav.js =====
===== BEGIN netlify/functions/orchestrator.js =====
// Legacy Netlify function (not used in current Cloudflare deploy). Keep for reference only.
const OPENAI_API = process.env.OPENAI_API;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || process.env.GH_BOT_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO || process.env.GH_REPO;
const GITHUB_BASE_BRANCH = process.env.GITHUB_BASE_BRANCH || process.env.GH_BASE_BRANCH || "main";
const ADMIN_ROLE = process.env.ADMIN_ROLE;

const allowedFields = [
  "eyebrow",
  "headline",
  "subhead",
  "cta",
  "price",
  "metric1",
  "metric2",
  "metric3",
];

const jsonResponse = (statusCode, payload) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});

const requireUser = (context) => {
  const user = context?.clientContext?.user;
  if (!user) {
    return null;
  }
  if (ADMIN_ROLE) {
    const roles = user?.app_metadata?.roles || [];
    if (!roles.includes(ADMIN_ROLE)) {
      return null;
    }
  }
  return user;
};

const toSafeJsString = (value) => value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

const extractJson = (text) => {
  const trimmed = text.trim();
  if (trimmed.startsWith("{")) {
    return JSON.parse(trimmed);
  }
  const match = trimmed.match(/```json\s*([\s\S]*?)\s*```/i);
  if (match) {
    return JSON.parse(match[1]);
  }
  throw new Error("Failed to parse JSON response.");
};

const callOpenAI = async (command) => {
  if (!OPENAI_API) {
    throw new Error("Missing OPENAI_API. Set the Cloudflare Worker secret: wrangler secret put OPENAI_API");
  }

  const systemPrompt = `
You are a site editor for a static HTML/CSS/JS site.
Return ONLY valid JSON with this schema:
{
  "summary": "short summary",
  "commitMessage": "short git commit message",
  "actions": [
    {"type":"update_copy","field":"headline","value":"..."},
    {"type":"update_meta","title":"...","description":"..."},
    {"type":"update_theme","theme":"ember|ocean|volt|midnight"},
    {"type":"add_page","slug":"partners","title":"Partners","headline":"...","body":"..."},
    {"type":"insert_monetization","headline":"...","description":"...","cta":"..."}
  ]
}
Only include supported actions. Keep values concise and suitable for production.
`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: systemPrompt.trim() },
        { role: "user", content: command },
      ],
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`OpenAI error: ${detail}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content || "";
  return extractJson(content);
};

const githubRequest = async (path, options = {}) => {
  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    throw new Error("Missing GITHUB_TOKEN or GITHUB_REPO.");
  }
  const response = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub error: ${text}`);
  }
  return response.json();
};

const getRepoParts = () => {
  const [owner, repo] = (GITHUB_REPO || "").split("/");
  if (!owner || !repo) {
    throw new Error("GITHUB_REPO must be in the form owner/repo.");
  }
  return { owner, repo };
};

const getFileContent = async (path, ref) => {
  const { owner, repo } = getRepoParts();
  const data = await githubRequest(
    `/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${ref}`
  );
  const content = Buffer.from(data.content, data.encoding).toString("utf-8");
  return content;
};

const updateAppState = (content, field, value) => {
  if (!allowedFields.includes(field)) return content;
  const safeValue = toSafeJsString(value);
  const pattern = new RegExp(`${field}:\\s*'[^']*'`);
  return content.replace(pattern, `${field}: '${safeValue}'`);
};

const updateTheme = (content, theme) => {
  const safeValue = toSafeJsString(theme);
  return content.replace(/theme:\s*'[^']*'/, `theme: '${safeValue}'`);
};

const updateMeta = (content, title, description) => {
  let updated = content;
  if (title) {
    updated = updated.replace(/<title>.*<\/title>/, `<title>${title}</title>`);
  }
  if (description) {
    updated = updated.replace(
      /<meta name="description" content="[^"]*"\s*\/>/,
      `<meta name="description" content="${description}" />`
    );
  }
  return updated;
};

const addNavLink = (content, slug, title) => {
  const link = `<a href="${slug}.html">${title}</a>`;
  if (content.includes(link)) return content;
  return content.replace("</nav>", `  ${link}\n    </nav>`);
};

const addFooterLink = (content, slug, title) => {
  const link = `<a href="${slug}.html">${title}</a>`;
  if (content.includes(link)) return content;
  return content.replace("</div>\n  </footer>", `  ${link}\n    </div>\n  </footer>`);
};

const insertMonetization = (content, headline, description, cta) => {
  if (content.includes('id="monetization"')) return content;
  const block = `
    <section class="section monetization" id="monetization">
      <h2>${headline}</h2>
      <p>${description}</p>
      <button class="primary">${cta}</button>
    </section>
  `;
  return content.replace("</main>", `${block}\n  </main>`);
};

const ensureMonetizationStyles = (content) => {
  if (content.includes(".monetization")) return content;
  return `${content}\n\n.monetization {\n  background: linear-gradient(180deg, rgba(255, 255, 255, 0.05), transparent);\n  border-top: 1px solid rgba(255, 255, 255, 0.06);\n}\n`;
};

const buildPageTemplate = ({ title, headline, body }) => {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <meta name="description" content="${title}" />
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <div class="bg-noise" aria-hidden="true"></div>
  <header class="site-header">
    <div class="brand">
      <span class="brand-mark">VW</span>
      <div class="brand-text">
        <strong>VoiceToWebsite</strong>
        <span>Revenue Engine</span>
      </div>
    </div>
    <nav class="nav">
      <a href="index.html">Home</a>
    </nav>
    <button class="ghost-button">Book a Demo</button>
  </header>
  <main class="page">
    <section class="section">
      <h1>${headline}</h1>
      <p>${body}</p>
    </section>
  </main>
  <footer class="footer">
    <div>
      <strong>VoiceToWebsite</strong>
      <p>Revenue systems that never sleep.</p>
    </div>
    <div class="footer-links">
      <a href="index.html">Home</a>
    </div>
  </footer>
</body>
</html>`;
};

const createCommit = async (updates, message) => {
  const { owner, repo } = getRepoParts();
  const baseRef = await githubRequest(`/repos/${owner}/${repo}/git/ref/heads/${GITHUB_BASE_BRANCH}`);
  const baseCommitSha = baseRef.object.sha;
  const baseCommit = await githubRequest(`/repos/${owner}/${repo}/git/commits/${baseCommitSha}`);
  const baseTreeSha = baseCommit.tree.sha;

  const branchName = `voice/${Date.now()}`;
  await githubRequest(`/repos/${owner}/${repo}/git/refs`, {
    method: "POST",
    body: JSON.stringify({
      ref: `refs/heads/${branchName}`,
      sha: baseCommitSha,
    }),
  });

  const treeItems = [];
  for (const [path, content] of Object.entries(updates)) {
    const blob = await githubRequest(`/repos/${owner}/${repo}/git/blobs`, {
      method: "POST",
      body: JSON.stringify({ content, encoding: "utf-8" }),
    });
    treeItems.push({ path, mode: "100644", type: "blob", sha: blob.sha });
  }

  const newTree = await githubRequest(`/repos/${owner}/${repo}/git/trees`, {
    method: "POST",
    body: JSON.stringify({ base_tree: baseTreeSha, tree: treeItems }),
  });

  const newCommit = await githubRequest(`/repos/${owner}/${repo}/git/commits`, {
    method: "POST",
    body: JSON.stringify({
      message,
      tree: newTree.sha,
      parents: [baseCommitSha],
    }),
  });

  await githubRequest(`/repos/${owner}/${repo}/git/refs/heads/${branchName}`, {
    method: "PATCH",
    body: JSON.stringify({ sha: newCommit.sha }),
  });

  return { branchName, commitSha: newCommit.sha };
};

const createPullRequest = async (branchName, title, body) => {
  const { owner, repo } = getRepoParts();
  const pr = await githubRequest(`/repos/${owner}/${repo}/pulls`, {
    method: "POST",
    body: JSON.stringify({
      title,
      head: branchName,
      base: GITHUB_BASE_BRANCH,
      body,
    }),
  });
  return pr;
};

const applyActions = async (actions, command) => {
  const updates = {};
  let indexHtml = null;
  let appJs = null;
  let styles = null;

  const needsIndex = actions.some((action) =>
    ["update_meta", "add_page", "insert_monetization"].includes(action.type)
  );
  const needsApp = actions.some((action) =>
    ["update_copy", "update_theme"].includes(action.type)
  );
  const needsStyles = actions.some((action) => action.type === "insert_monetization");

  if (needsIndex) indexHtml = await getFileContent("index.html", GITHUB_BASE_BRANCH);
  if (needsApp) appJs = await getFileContent("app.js", GITHUB_BASE_BRANCH);
  if (needsStyles) styles = await getFileContent("styles.css", GITHUB_BASE_BRANCH);

  const newPages = [];

  for (const action of actions) {
    if (action.type === "update_copy" && appJs) {
      appJs = updateAppState(appJs, action.field, action.value);
    }
    if (action.type === "update_theme" && appJs) {
      appJs = updateTheme(appJs, action.theme);
    }
    if (action.type === "update_meta" && indexHtml) {
      indexHtml = updateMeta(indexHtml, action.title, action.description);
    }
    if (action.type === "add_page" && indexHtml) {
      const slug = action.slug || "new-page";
      const title = action.title || "New Page";
      const headline = action.headline || title;
      const body = action.body || "Details coming soon.";
      newPages.push({
        path: `${slug}.html`,
        content: buildPageTemplate({ title, headline, body }),
        slug,
        title,
      });
      indexHtml = addNavLink(indexHtml, slug, title);
      indexHtml = addFooterLink(indexHtml, slug, title);
    }
    if (action.type === "insert_monetization" && indexHtml) {
      indexHtml = insertMonetization(
        indexHtml,
        action.headline || "Monetize this page",
        action.description || "Add a revenue block to capture leads or offers.",
        action.cta || "Get the offer"
      );
      if (styles) {
        styles = ensureMonetizationStyles(styles);
      }
    }
  }

  if (indexHtml) updates["index.html"] = indexHtml;
  if (appJs) updates["app.js"] = appJs;
  if (styles) updates["styles.css"] = styles;
  newPages.forEach((page) => {
    updates[page.path] = page.content;
  });

  const message = `Voice update: ${command.slice(0, 60)}`;
  const { branchName } = await createCommit(updates, message);
  const pr = await createPullRequest(
    branchName,
    "Voice update",
    `Command: ${command}\n\nActions:\n${actions.map((a) => `- ${a.type}`).join("\n")}`
  );

  return { prUrl: pr.html_url, branchName };
};

const createRollbackPR = async () => {
  const { owner, repo } = getRepoParts();
  const baseRef = await githubRequest(`/repos/${owner}/${repo}/git/ref/heads/${GITHUB_BASE_BRANCH}`);
  const headSha = baseRef.object.sha;
  const headCommit = await githubRequest(`/repos/${owner}/${repo}/git/commits/${headSha}`);
  const parentSha = headCommit.parents?.[0]?.sha;
  if (!parentSha) {
    throw new Error("No parent commit available for rollback.");
  }
  const parentCommit = await githubRequest(`/repos/${owner}/${repo}/git/commits/${parentSha}`);
  const branchName = `rollback/${Date.now()}`;

  await githubRequest(`/repos/${owner}/${repo}/git/refs`, {
    method: "POST",
    body: JSON.stringify({
      ref: `refs/heads/${branchName}`,
      sha: headSha,
    }),
  });

  const rollbackCommit = await githubRequest(`/repos/${owner}/${repo}/git/commits`, {
    method: "POST",
    body: JSON.stringify({
      message: "Rollback last commit",
      tree: parentCommit.tree.sha,
      parents: [headSha],
    }),
  });

  await githubRequest(`/repos/${owner}/${repo}/git/refs/heads/${branchName}`, {
    method: "PATCH",
    body: JSON.stringify({ sha: rollbackCommit.sha }),
  });

  const pr = await createPullRequest(
    branchName,
    "Rollback last commit",
    "Reverts the latest commit on main."
  );
  return { prUrl: pr.html_url, branchName };
};

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed." });
  }

  const user = requireUser(context);
  if (!user) {
    return jsonResponse(401, { error: "Unauthorized." });
  }

  try {
    const payload = JSON.parse(event.body || "{}");
    const mode = payload.mode || "plan";

    if (mode === "rollback") {
      const rollback = await createRollbackPR();
      return jsonResponse(200, { mode, ...rollback });
    }

    const command = payload.command || "";
    if (!command && mode !== "rollback") {
      return jsonResponse(400, { error: "Missing command." });
    }

    let plan = payload.plan;
    if (!plan) {
      plan = await callOpenAI(command);
    }

    if (mode === "plan") {
      return jsonResponse(200, { mode, command, plan });
    }

    const actions = plan.actions || [];
    const applied = await applyActions(actions, command);
    return jsonResponse(200, { mode, command, plan, ...applied });
  } catch (err) {
    return jsonResponse(500, { error: err.message });
  }
};
===== END netlify/functions/orchestrator.js =====
===== BEGIN api/orchestrator.js =====
// Legacy API handler (not used in current Cloudflare deploy). Keep for reference only.
const OPENAI_API = process.env.OPENAI_API;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || process.env.GH_BOT_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO || process.env.GH_REPO;
const GITHUB_BASE_BRANCH = process.env.GITHUB_BASE_BRANCH || process.env.GH_BASE_BRANCH || "main";
const ADMIN_ROLE = process.env.ADMIN_ROLE;

const allowedFields = [
  "eyebrow",
  "headline",
  "subhead",
  "cta",
  "price",
  "metric1",
  "metric2",
  "metric3",
];

const toSafeJsString = (value) => value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");


const extractJson = (text) => {
  const trimmed = text.trim();
  if (trimmed.startsWith("{")) {
    return JSON.parse(trimmed);
  }
  const match = trimmed.match(/```json\s*([\s\S]*?)\s*```/i);
  if (match) {
    return JSON.parse(match[1]);
  }
  throw new Error("Failed to parse JSON response.");
};

const callOpenAI = async (command) => {
  if (!OPENAI_API) {
    throw new Error("Missing OPENAI_API. Set the Cloudflare Worker secret: wrangler secret put OPENAI_API");
  }

  const systemPrompt = `
You are a site editor for a static HTML/CSS/JS site.
Return ONLY valid JSON with this schema:
{
  "summary": "short summary",
  "commitMessage": "short git commit message",
  "actions": [
    {"type":"update_copy","field":"headline","value":"..."},
    {"type":"update_meta","title":"...","description":"..."},
    {"type":"update_theme","theme":"ember|ocean|volt|midnight"},
    {"type":"add_page","slug":"partners","title":"Partners","headline":"...","body":"..."},
    {"type":"insert_monetization","headline":"...","description":"...","cta":"..."}
  ]
}
Only include supported actions. Keep values concise and suitable for production.
`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: systemPrompt.trim() },
        { role: "user", content: command },
      ],
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`OpenAI error: ${detail}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content || "";
  return extractJson(content);
};

const githubRequest = async (path, options = {}) => {
  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    throw new Error("Missing GITHUB_TOKEN or GITHUB_REPO.");
  }
  const response = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub error: ${text}`);
  }
  return response.json();
};

const getRepoParts = () => {
  const [owner, repo] = (GITHUB_REPO || "").split("/");
  if (!owner || !repo) {
    throw new Error("GITHUB_REPO must be in the form owner/repo.");
  }
  return { owner, repo };
};

const getFileContent = async (path, ref) => {
  const { owner, repo } = getRepoParts();
  const data = await githubRequest(
    `/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${ref}`
  );
  const content = Buffer.from(data.content, data.encoding).toString("utf-8");
  return content;
};

const updateAppState = (content, field, value) => {
  if (!allowedFields.includes(field)) return content;
  const safeValue = toSafeJsString(value);
  const pattern = new RegExp(`${field}:\\s*'[^']*'`);
  return content.replace(pattern, `${field}: '${safeValue}'`);
};

const updateTheme = (content, theme) => {
  const safeValue = toSafeJsString(theme);
  return content.replace(/theme:\s*'[^']*'/, `theme: '${safeValue}'`);
};

const updateMeta = (content, title, description) => {
  let updated = content;
  if (title) {
    updated = updated.replace(/<title>.*<\/title>/, `<title>${title}</title>`);
  }
  if (description) {
    updated = updated.replace(
      /<meta name="description" content="[^"]*"\s*\/>/,
      `<meta name="description" content="${description}" />`
    );
  }
  return updated;
};

const addNavLink = (content, slug, title) => {
  const link = `<a href="${slug}.html">${title}</a>`;
  if (content.includes(link)) return content;
  return content.replace("</nav>", `  ${link}\n    </nav>`);
};

const addFooterLink = (content, slug, title) => {
  const link = `<a href="${slug}.html">${title}</a>`;
  if (content.includes(link)) return content;
  return content.replace("</div>\n  </footer>", `  ${link}\n    </div>\n  </footer>`);
};

const insertMonetization = (content, headline, description, cta) => {
  if (content.includes('id="monetization"')) return content;
  const block = `
    <section class="section monetization" id="monetization">
      <h2>${headline}</h2>
      <p>${description}</p>
      <button class="primary">${cta}</button>
    </section>
  `;
  return content.replace("</main>", `${block}\n  </main>`);
};

const ensureMonetizationStyles = (content) => {
  if (content.includes(".monetization")) return content;
  return `${content}\n\n.monetization {\n  background: linear-gradient(180deg, rgba(255, 255, 255, 0.05), transparent);\n  border-top: 1px solid rgba(255, 255, 255, 0.06);\n}\n`;
};

const buildPageTemplate = ({ title, headline, body }) => {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <meta name="description" content="${title}" />
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <div class="bg-noise" aria-hidden="true"></div>
  <header class="site-header">
    <div class="brand">
      <span class="brand-mark">VW</span>
      <div class="brand-text">
        <strong>VoiceToWebsite</strong>
        <span>Revenue Engine</span>
      </div>
    </div>
    <nav class="nav">
      <a href="index.html">Home</a>
    </nav>
    <button class="ghost-button">Book a Demo</button>
  </header>
  <main class="page">
    <section class="section">
      <h1>${headline}</h1>
      <p>${body}</p>
    </section>
  </main>
  <footer class="footer">
    <div>
      <strong>VoiceToWebsite</strong>
      <p>Revenue systems that never sleep.</p>
    </div>
    <div class="footer-links">
      <a href="index.html">Home</a>
    </div>
  </footer>
</body>
</html>`;
};

const createCommit = async (updates, message) => {
  const { owner, repo } = getRepoParts();
  const baseRef = await githubRequest(`/repos/${owner}/${repo}/git/ref/heads/${GITHUB_BASE_BRANCH}`);
  const baseCommitSha = baseRef.object.sha;
  const baseCommit = await githubRequest(`/repos/${owner}/${repo}/git/commits/${baseCommitSha}`);
  const baseTreeSha = baseCommit.tree.sha;

  const branchName = `voice/${Date.now()}`;
  await githubRequest(`/repos/${owner}/${repo}/git/refs`, {
    method: "POST",
    body: JSON.stringify({
      ref: `refs/heads/${branchName}`,
      sha: baseCommitSha,
    }),
  });

  const treeItems = [];
  for (const [path, content] of Object.entries(updates)) {
    const blob = await githubRequest(`/repos/${owner}/${repo}/git/blobs`, {
      method: "POST",
      body: JSON.stringify({ content, encoding: "utf-8" }),
    });
    treeItems.push({ path, mode: "100644", type: "blob", sha: blob.sha });
  }

  const newTree = await githubRequest(`/repos/${owner}/${repo}/git/trees`, {
    method: "POST",
    body: JSON.stringify({ base_tree: baseTreeSha, tree: treeItems }),
  });

  const newCommit = await githubRequest(`/repos/${owner}/${repo}/git/commits`, {
    method: "POST",
    body: JSON.stringify({
      message,
      tree: newTree.sha,
      parents: [baseCommitSha],
    }),
  });

  await githubRequest(`/repos/${owner}/${repo}/git/refs/heads/${branchName}`, {
    method: "PATCH",
    body: JSON.stringify({ sha: newCommit.sha }),
  });

  return { branchName, commitSha: newCommit.sha };
};

const createPullRequest = async (branchName, title, body) => {
  const { owner, repo } = getRepoParts();
  const pr = await githubRequest(`/repos/${owner}/${repo}/pulls`, {
    method: "POST",
    body: JSON.stringify({
      title,
      head: branchName,
      base: GITHUB_BASE_BRANCH,
      body,
    }),
  });
  return pr;
};

const applyActions = async (actions, command) => {
  const updates = {};
  let indexHtml = null;
  let appJs = null;
  let styles = null;

  const needsIndex = actions.some((action) =>
    ["update_meta", "add_page", "insert_monetization"].includes(action.type)
  );
  const needsApp = actions.some((action) =>
    ["update_copy", "update_theme"].includes(action.type)
  );
  const needsStyles = actions.some((action) => action.type === "insert_monetization");

  if (needsIndex) indexHtml = await getFileContent("index.html", GITHUB_BASE_BRANCH);
  if (needsApp) appJs = await getFileContent("app.js", GITHUB_BASE_BRANCH);
  if (needsStyles) styles = await getFileContent("styles.css", GITHUB_BASE_BRANCH);

  const newPages = [];

  for (const action of actions) {
    if (action.type === "update_copy" && appJs) {
      appJs = updateAppState(appJs, action.field, action.value);
    }
    if (action.type === "update_theme" && appJs) {
      appJs = updateTheme(appJs, action.theme);
    }
    if (action.type === "update_meta" && indexHtml) {
      indexHtml = updateMeta(indexHtml, action.title, action.description);
    }
    if (action.type === "add_page" && indexHtml) {
      const slug = action.slug || "new-page";
      const title = action.title || "New Page";
      const headline = action.headline || title;
      const body = action.body || "Details coming soon.";
      newPages.push({
        path: `${slug}.html`,
        content: buildPageTemplate({ title, headline, body }),
        slug,
        title,
      });
      indexHtml = addNavLink(indexHtml, slug, title);
      indexHtml = addFooterLink(indexHtml, slug, title);
    }
    if (action.type === "insert_monetization" && indexHtml) {
      indexHtml = insertMonetization(
        indexHtml,
        action.headline || "Monetize this page",
        action.description || "Add a revenue block to capture leads or offers.",
        action.cta || "Get the offer"
      );
      if (styles) {
        styles = ensureMonetizationStyles(styles);
      }
    }
  }

  if (indexHtml) updates["index.html"] = indexHtml;
  if (appJs) updates["app.js"] = appJs;
  if (styles) updates["styles.css"] = styles;
  newPages.forEach((page) => {
    updates[page.path] = page.content;
  });

  const message = `Voice update: ${command.slice(0, 60)}`;
  const { branchName } = await createCommit(updates, message);
  const pr = await createPullRequest(
    branchName,
    "Voice update",
    `Command: ${command}\n\nActions:\n${actions.map((a) => `- ${a.type}`).join("\n")}`
  );

  return { prUrl: pr.html_url, branchName };
};

const createRollbackPR = async () => {
  const { owner, repo } = getRepoParts();
  const baseRef = await githubRequest(`/repos/${owner}/${repo}/git/ref/heads/${GITHUB_BASE_BRANCH}`);
  const headSha = baseRef.object.sha;
  const headCommit = await githubRequest(`/repos/${owner}/${repo}/git/commits/${headSha}`);
  const parentSha = headCommit.parents?.[0]?.sha;
  if (!parentSha) {
    throw new Error("No parent commit available for rollback.");
  }
  const parentCommit = await githubRequest(`/repos/${owner}/${repo}/git/commits/${parentSha}`);
  const branchName = `rollback/${Date.now()}`;

  await githubRequest(`/repos/${owner}/${repo}/git/refs`, {
    method: "POST",
    body: JSON.stringify({
      ref: `refs/heads/${branchName}`,
      sha: headSha,
    }),
  });

  const rollbackCommit = await githubRequest(`/repos/${owner}/${repo}/git/commits`, {
    method: "POST",
    body: JSON.stringify({
      message: "Rollback last commit",
      tree: parentCommit.tree.sha,
      parents: [headSha],
    }),
  });

  await githubRequest(`/repos/${owner}/${repo}/git/refs/heads/${branchName}`, {
    method: "PATCH",
    body: JSON.stringify({ sha: rollbackCommit.sha }),
  });

  const pr = await createPullRequest(
    branchName,
    "Rollback last commit",
    "Reverts the latest commit on main."
  );
  return { prUrl: pr.html_url, branchName };
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  // Shim for Netlify context (using env vars since clientContext isn't available on Vercel)
  // On Vercel, we'll assume the user is authorized if the request comes through, 
  // but for production you'd use Vercel Auth or a custom middleware.
  const context = { clientContext: { user: { app_metadata: { roles: [ADMIN_ROLE] } } } };

  try {
    const payload = req.body || {};
    const mode = payload.mode || "plan";

    if (mode === "rollback") {
      const rollback = await createRollbackPR();
      res.status(200).json({ mode, ...rollback });
      return;
    }

    const command = payload.command || "";
    if (!command && mode !== "rollback") {
      res.status(400).json({ error: "Missing command." });
      return;
    }

    let plan = payload.plan;
    if (!plan) {
      plan = await callOpenAI(command);
    }

    if (mode === "plan") {
      res.status(200).json({ mode, command, plan });
      return;
    }

    const actions = plan.actions || [];
    const applied = await applyActions(actions, command);
    res.status(200).json({ mode, command, plan, ...applied });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
===== END api/orchestrator.js =====
```
