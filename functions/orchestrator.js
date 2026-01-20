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

  const escapeHtml = (value) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const updateElementById = (content, id, value) => {
    if (!value) return content;
    const safeValue = escapeHtml(value).replace(/\n/g, "<br />");
    const pattern = new RegExp(`(<[^>]*id=["']${id}["'][^>]*>)([\\s\\S]*?)(</[^>]+>)`, "i");
    if (!pattern.test(content)) return content;
    return content.replace(pattern, `$1${safeValue}$3`);
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

  const revertLastCommit = async () => {
    const { owner, repo } = getRepoParts();
    const headRef = await githubRequest(`/repos/${owner}/${repo}/git/ref/heads/${GITHUB_BASE_BRANCH}`);
    const headSha = headRef.object.sha;
    const headCommit = await githubRequest(`/repos/${owner}/${repo}/git/commits/${headSha}`);
    const parentSha = headCommit.parents?.[0]?.sha;
    if (!parentSha) throw new Error("No parent commit to revert to.");
    const parentCommit = await githubRequest(`/repos/${owner}/${repo}/git/commits/${parentSha}`);
    const revertCommit = await githubRequest(`/repos/${owner}/${repo}/git/commits`, {
      method: "POST",
      body: JSON.stringify({
        message: `Revert: ${headCommit.message || "latest deploy"}`,
        tree: parentCommit.tree.sha,
        parents: [headSha],
      }),
    });
    await githubRequest(`/repos/${owner}/${repo}/git/refs/heads/${GITHUB_BASE_BRANCH}`, {
      method: "PATCH",
      body: JSON.stringify({ sha: revertCommit.sha }),
    });
    return { revertedTo: parentSha, revertCommit: revertCommit.sha };
  };

  const logToDB = async ({ command, actions, files, commit }) => {
    const db = env.D1 || env.DB;
    if (!db) return;
    try {
      await db.prepare(
        `CREATE TABLE IF NOT EXISTS commands (
           id INTEGER PRIMARY KEY AUTOINCREMENT,
           ts DATETIME DEFAULT CURRENT_TIMESTAMP,
           command TEXT,
           actions TEXT,
           files TEXT,
           commit_sha TEXT
         );`
      ).run();
      await db.prepare(
        "INSERT INTO commands (command, actions, files, commit_sha) VALUES (?, ?, ?, ?)"
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
        "update_copy",
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
      if (action.type === "update_copy") {
        if (indexHtml) {
          const target = action.field;
          if (target && allowedFields.includes(target)) {
            indexHtml = updateElementById(indexHtml, target, action.value || "");
          }
        }
        if (appJs) {
          appJs = updateAppState(appJs, action.field, action.value);
        }
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

    if (mode === "rollback_last") {
      const result = await revertLastCommit();
      return new Response(JSON.stringify({ mode, result }), { headers: { "Content-Type": "application/json" } });
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
        if (!fallback.actions.length) {
          throw new Error("Missing OPENAI_API. Set the Cloudflare Worker secret: wrangler secret put OPENAI_API");
        }
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
