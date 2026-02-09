const FALLBACK_REGEX = {
  url: /https?:\/\/\S+/,
  say: /make .*say (.+)/i,
  sayAlt: /say (.+)/i,
  headline: /headline(?:\s+to|\s+is)?\s+(.+)/i,
  subhead: /subhead(?:\s+to|\s+is)?\s+(.+)/i,
  cta: /(cta|button)(?:\s+to|\s+is)?\s+(.+)/i,
  title: /title(?:\s+to|\s+is)?\s+(.+)/i,
  description: /description(?:\s+to|\s+is)?\s+(.+)/i,
  font: /font(?:\s+to|\s+is)?\s+([a-zA-Z0-9\s-]+)/i,
  theme: /theme(?:\s+to|\s+is)?\s+(ember|ocean|volt|midnight)/i,
};

export async function onRequestPost(context) {
  const { request, env } = context;
  const OPENAI_API = env.OPENAI_API || env.OPENAI_API_KEY || env.OPENAI_API_KEY3;
  const OPENAI_MODEL = env.OPENAI_MODEL || "gpt-4o-mini";
  const WORKERS_AI = env.AI;
  const GITHUB_TOKEN =
    env.GITHUB_TOKEN ||
    env.GH_TOKEN ||
    env.GH_BOT_TOKEN ||
    env.PERSONAL_ACCESS_TOKEN_API ||
    env.PERSONAL_ACCESS_TOKEN ||
    env.GITHUB_PAT;
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
  const pickAiText = (result) => {
    if (!result) return "";
    if (typeof result === "string") return result;
    if (typeof result.response === "string") return result.response;
    if (typeof result.text === "string") return result.text;
    if (typeof result.output_text === "string") return result.output_text;
    return JSON.stringify(result);
  };
  const slugify = (value) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  const buildFallbackPlan = (command) => {
    const actions = [];
    const text = command.toLowerCase();
    const urlMatch = command.match(FALLBACK_REGEX.url);
    const url = urlMatch ? urlMatch[0] : "";
    const sayMatch = command.match(FALLBACK_REGEX.say) || command.match(FALLBACK_REGEX.sayAlt);
    const headlineMatch = command.match(FALLBACK_REGEX.headline);
    const subheadMatch = command.match(FALLBACK_REGEX.subhead);
    const ctaMatch = command.match(FALLBACK_REGEX.cta);
    const titleMatch = command.match(FALLBACK_REGEX.title);
    const descMatch = command.match(FALLBACK_REGEX.description);
    const fontMatch = command.match(FALLBACK_REGEX.font);
    const themeMatch = command.match(FALLBACK_REGEX.theme);
    if (sayMatch) {
      actions.push({
        type: "update_copy",
        field: "headline",
        value: sayMatch[1].trim(),
      });
    } else if (headlineMatch) {
      actions.push({
        type: "update_copy",
        field: "headline",
        value: headlineMatch[1].trim(),
      });
    }
    if (subheadMatch) {
      actions.push({
        type: "update_copy",
        field: "subhead",
        value: subheadMatch[1].trim(),
      });
    }
    if (ctaMatch) {
      actions.push({
        type: "update_copy",
        field: "cta",
        value: ctaMatch[2].trim(),
      });
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
  const SANDBOX_HTML = "sandbox.html";
  const SITE_HTML = "index.html";
  const SITE_CONFIG = "src/site-config.json";

  const SANDBOX_ALLOWED_ACTIONS = new Set([
    "update_copy",
    "update_meta",
    "update_theme",
    "update_background_video",
    "update_avatar",
    "insert_section",
    "insert_video",
    "insert_stream",
    "insert_monetization",
    "inject_css",
  ]);

  const getActionFileMap = (target) => {
    if (target === "sandbox") {
      return {
        update_copy: [SANDBOX_HTML],
        update_meta: [SANDBOX_HTML],
        update_theme: [SANDBOX_HTML],
        insert_monetization: [SANDBOX_HTML],
        update_background_video: [SANDBOX_HTML],
        update_avatar: [SANDBOX_HTML],
        insert_section: [SANDBOX_HTML],
        insert_video: [SANDBOX_HTML],
        insert_stream: [SANDBOX_HTML],
        inject_css: [SANDBOX_HTML],
      };
    }
    return {
      update_copy: [SITE_CONFIG],
      update_meta: [SITE_HTML],
      update_theme: [SITE_CONFIG],
      add_page: [SITE_HTML],
      insert_monetization: [SITE_HTML, "styles.css"],
      update_background_video: [SITE_HTML],
      update_wallpaper: ["styles.css"],
      update_avatar: [SITE_HTML],
      insert_section: [SITE_HTML],
      add_product: [SITE_HTML],
      insert_video: [SITE_HTML],
      insert_stream: [SITE_HTML],
      inject_css: ["styles.css"],
    };
  };
  const structuralActions = new Set([
    "add_page",
    "insert_monetization",
    "insert_section",
    "insert_video",
    "insert_stream",
    "add_product",
    "update_wallpaper",
    "update_background_video",
    "inject_css",
  ]);
  const buildActionPreview = (action) => {
    switch (action.type) {
      case "update_copy":
        return `Update ${action.field || "copy"} to "${action.value || ""}"`;
      case "update_meta":
        return `Update meta title/description`;
      case "update_theme":
        return `Set theme to ${action.theme}`;
      case "add_page":
        return `Add page ${action.title || action.slug}`;
      case "insert_monetization":
        return `Insert monetization block`;
      case "update_background_video":
        return `Update background video`;
      case "update_wallpaper":
        return `Update wallpaper image`;
      case "update_avatar":
        return `Update avatar image`;
      case "insert_section":
        return `Insert section ${action.title || action.id}`;
      case "add_product":
        return `Add product ${action.name || "New Product"}`;
      case "insert_video":
        return `Insert video ${action.title || "Video"}`;
      case "insert_stream":
        return `Insert livestream ${action.title || "Live Stream"}`;
      case "inject_css":
        return `Inject custom CSS`;
      default:
        return `Apply ${action.type}`;
    }
  };
  const getActionScope = (action, target) => {
    const actionFileMap = getActionFileMap(target);
    const files = new Set(actionFileMap[action.type] || []);
    if (action.type === "add_page" && action.slug) {
      files.add(`${action.slug}.html`);
    }
    const sections = [];
    if (action.type === "update_copy" && action.field) sections.push(action.field);
    if (["insert_section", "insert_video", "insert_stream"].includes(action.type)) {
      sections.push(action.id || action.title || action.type);
    }
    if (action.type === "insert_monetization") sections.push("monetization");
    if (action.type === "add_product") sections.push("store");
    return { files: Array.from(files), sections };
  };
  const buildIntent = (plan, command, target) => {
    const actions = plan.actions || [];
    const actionTypes = actions.map((action) => action.type);
    const scope = { files: [], sections: [], components: [] };
    const previewItems = [];
    const diffLines = [];
    let requiresConfirmation = false;
    actions.forEach((action) => {
      const actionScope = getActionScope(action, target);
      scope.files.push(...actionScope.files);
      scope.sections.push(...actionScope.sections);
      if (structuralActions.has(action.type)) requiresConfirmation = true;
      const previewText = buildActionPreview(action);
      previewItems.push({
        action: action.type,
        summary: previewText,
        files: actionScope.files,
      });
      const fileTargets = actionScope.files.length ? actionScope.files.join(", ") : "(no file changes)";
      diffLines.push(`+ ${fileTargets}: ${previewText}`);
    });
    const safetyLevel = requiresConfirmation ? "high" : actions.length ? "medium" : "low";
    const safetyRationale = requiresConfirmation
      ? "Structural/layout changes detected; explicit confirmation required."
      : "Content or configuration update.";
    return {
      actionTypes: Array.from(new Set(actionTypes)),
      scope: {
        files: Array.from(new Set(scope.files)),
        sections: Array.from(new Set(scope.sections)),
        components: Array.from(new Set(scope.components)),
      },
      preview: {
        summary: plan.summary || "Planned updates",
        changes: previewItems,
        diff: diffLines.join("\n"),
      },
      safety: { level: safetyLevel, rationale: safetyRationale },
      confirmation: { required: requiresConfirmation, phrase: "ship it" },
      rollback: { supported: true, mode: "rollback_last" },
      command,
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
  const escapeHtml = (value) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
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
  const updateHtmlTheme = (content, theme) => {
    const t = String(theme || "").trim();
    if (!t) return content;
    if (/<html[^>]*\bdata-theme=/i.test(content)) {
      return content.replace(/(<html[^>]*\bdata-theme=["'])([^"']*)(["'])/i, `$1${t}$3`);
    }
    return content.replace(/<html(\s[^>]*)?>/i, (match) => {
      if (match.includes("data-theme")) return match;
      return match.replace(/>$/, ` data-theme="${t}">`);
    });
  };
  const injectCssIntoHtml = (content, css) => {
    if (!css) return content;
    const safe = String(css);
    if (content.includes('id="vtw-sandbox-injected"')) {
      return content.replace(
        /<style\b[^>]*id=["']vtw-sandbox-injected["'][^>]*>([\s\S]*?)<\/style>/i,
        (_m, existing) => `<style id="vtw-sandbox-injected">\n${existing}\n${safe}\n</style>`
      );
    }
    if (content.includes("</head>")) {
      return content.replace("</head>", `<style id="vtw-sandbox-injected">\n${safe}\n</style>\n</head>`);
    }
    return `${content}\n<style id="vtw-sandbox-injected">\n${safe}\n</style>\n`;
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
    const block = `    <section class="section monetization" id="monetization">      <h2>${headline}</h2>      <p>${description}</p>      <button class="primary">${cta}</button>    </section>  `;
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
    const block = `    <section class="section custom-block" id="${id}">      <h2>${title}</h2>      <p>${body}</p>    </section>`;
    if (content.includes(`id="${id}"`)) return content;
    return content.replace("</main>", `${block}\n  </main>`);
  };
  const ensureStoreSection = (content) => {
    if (content.includes('id="store"')) return content;
    const block = `    <section class="section" id="store">      <h2>Store</h2>      <div class="store-grid"></div>    </section>`;
    return content.replace("</main>", `${block}\n  </main>`);
  };
  const addProductCard = (content, product) => {
    const { name = "New Product", price = "", description = "", image = "" } = product;
    const card = `        <div class="product-card">          <div class="product-media" style="background-image:url('${image}')"></div>          <h3>${name}</h3>          <p>${description}</p>          <strong>${price}</strong>          <button class="primary">Buy</button>        </div>`;
    if (!content.includes('class="store-grid"')) return content;
    return content.replace("</div>\n    </section>", `${card}\n      </div>\n    </section>`);
  };
  const insertVideoSection = (content, video) => {
    const { id = "video-block", title = "Featured Video", src = "", poster = "" } = video;
    const block = `    <section class="section video-block" id="${id}">      <h2>${title}</h2>      <video controls playsinline ${poster ? `poster="${poster}"` : ""} style="width:100%;border-radius:16px;">        <source src="${src}" type="video/mp4" />        Your browser does not support the video tag.      </video>    </section>`;
    if (content.includes(`id="${id}"`)) return content;
    return content.replace("</main>", `${block}\n  </main>`);
  };
  const insertStreamSection = (content, stream) => {
    const { id = "livestream", title = "Live Stream", url = "" } = stream;
    const block = `    <section class="section livestream" id="${id}">      <h2>${title}</h2>      <div class="embed">        <iframe src="${url}" allow="autoplay; encrypted-media" allowfullscreen style="width:100%;height:360px;border:0;border-radius:16px;"></iframe>      </div>    </section>`;
    if (content.includes(`id="${id}"`)) return content;
    return content.replace("</main>", `${block}\n  </main>`);
  };
  const appendCustomStyles = (stylesContent, css) => {
    if (!css) return stylesContent;
    return `${stylesContent}\n\n/* Voice-injected styles */\n${css}\n`;
  };
  const buildPageTemplate = ({ title, headline, body }) => {
    return `<!doctype html><html lang="en"><head>  <meta charset="utf-8" />  <meta name="viewport" content="width=device-width, initial-scale=1" />  <title>${title}</title>  <meta name="description" content="${title}" />  <link rel="stylesheet" href="styles.css" /></head><body>  <div class="bg-noise" aria-hidden="true"></div>  <header class="site-header">    <div class="brand">      <span class="brand-mark">VW</span>      <div class="brand-text">        <strong>VoiceToWebsite</strong>        <span>Revenue Engine</span>      </div>    </div>    <nav class="nav">      <a href="index.html">Home</a>    </nav>    <button class="ghost-button">Book a Demo</button>  </header>  <main class="page">    <section class="section">      <h1>${headline}</h1>      <p>${body}</p>    </section>  </main>  <footer class="footer">    <div>      <strong>VoiceToWebsite</strong>      <p>Revenue systems that never sleep.</p>    </div>    <div class="footer-links">      <a href="index.html">Home</a>    </div>  </footer></body></html>`;
  };
  const createCommitOnMain = async (updates, message) => {
    const { owner, repo } = getRepoParts();
    const baseRef = await githubRequest(`/repos/${owner}/${repo}/git/ref/heads/${GITHUB_BASE_BRANCH}`);
    const baseCommitSha = baseRef.object.sha;
    const baseCommit = await githubRequest(`/repos/${owner}/${repo}/git/commits/${baseCommitSha}`);
    const baseTreeSha = baseCommit.tree.sha;
    const entries = Object.entries(updates);
    const blobs = await Promise.all(
      entries.map(([, content]) =>
        githubRequest(`/repos/${owner}/${repo}/git/blobs`, {
          method: "POST",
          body: JSON.stringify({ content, encoding: "utf-8" }),
        })
      )
    );
    const treeItems = entries.map(([path], idx) => ({
      path,
      mode: "100644",
      type: "blob",
      sha: blobs[idx].sha,
    }));
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
  const logToDB = async ({ command, actions, files, commit, intent, deployment }) => {
    const db = env.D1 || env.DB;
    if (!db) return;
    try {
      await db
        .prepare(
          "INSERT INTO commands (command, actions, files, commit_sha, intent_json, deployment_id, deployment_status, deployment_message) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(
          command,
          JSON.stringify(actions || []),
          JSON.stringify(files || []),
          commit || "",
          JSON.stringify(intent || {}),
          deployment?.deploymentId || "",
          deployment?.status || "",
          deployment?.message || ""
        )
        .run();
    } catch (_) {
      // ignore logging errors
    }
  };
  const triggerDeployment = async (commitSha, intent) => {
    const hookUrl = env.CF_DEPLOY_HOOK_URL || env.CF_PAGES_DEPLOY_HOOK;
    if (!hookUrl) {
      return {
        status: "skipped",
        deploymentId: "",
        message: "No deploy hook configured.",
      };
    }
    try {
      const res = await fetch(hookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commit: commitSha, intent }),
      });
      const text = await res.text();
      let deploymentId = "";
      try {
        const parsed = text ? JSON.parse(text) : {};
        deploymentId = parsed?.id || parsed?.deploymentId || parsed?.deployment_id || "";
      } catch (_) {
        deploymentId = res.headers.get("cf-ray") || "";
      }
      return {
        status: res.ok ? "triggered" : "failed",
        deploymentId,
        message: text.slice(0, 300),
      };
    } catch (err) {
      return { status: "failed", deploymentId: "", message: err.message };
    }
  };
  const applyActions = async (actions, command, intent, target) => {
    if (target === "sandbox") {
      for (const action of actions || []) {
        if (!SANDBOX_ALLOWED_ACTIONS.has(action?.type)) {
          throw new Error(`Action not allowed in sandbox mode: ${action?.type}`);
        }
      }
    }
    const updates = {};
    const htmlPath = target === "sandbox" ? SANDBOX_HTML : SITE_HTML;
    let indexHtml = null;
    let siteConfig = null;
    let styles = null;
    const auditLog = [];
    const needsIndex = actions.some((action) =>
      (target === "sandbox"
        ? [
            "update_copy",
            "update_meta",
            "update_theme",
            "add_page",
            "insert_monetization",
            "update_background_video",
            "update_avatar",
            "insert_section",
            "add_product",
            "insert_video",
            "insert_stream",
          ]
        : [
            "update_meta",
            "add_page",
            "insert_monetization",
            "update_background_video",
            "update_avatar",
            "insert_section",
            "add_product",
            "insert_video",
            "insert_stream",
          ]
      ).includes(action.type)
    );
    const needsSiteConfig =
      target !== "sandbox" && actions.some((action) => ["update_copy", "update_theme"].includes(action.type));
    const needsStyles =
      target !== "sandbox" &&
      actions.some(
        (action) =>
          action.type === "insert_monetization" || action.type === "update_wallpaper" || action.type === "inject_css"
      );
    const [indexHtmlResult, siteConfigResult, stylesResult] = await Promise.all([
      needsIndex ? getFileContent(htmlPath, GITHUB_BASE_BRANCH) : Promise.resolve(null),
      needsSiteConfig ? getFileContent(SITE_CONFIG, GITHUB_BASE_BRANCH) : Promise.resolve(null),
      needsStyles ? getFileContent("styles.css", GITHUB_BASE_BRANCH) : Promise.resolve(null),
    ]);
    indexHtml = indexHtmlResult;
    siteConfig = siteConfigResult ? JSON.parse(siteConfigResult) : null;
    styles = stylesResult;
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
        if (siteConfig && action.field && allowedFields.includes(action.field)) {
          siteConfig.copy = siteConfig.copy || {};
          siteConfig.copy[action.field] = String(action.value || "");
        }
      }
      if (action.type === "update_theme") {
        if (target === "sandbox" && indexHtml) {
          indexHtml = updateHtmlTheme(indexHtml, action.theme);
        }
        if (siteConfig) {
          siteConfig.theme = siteConfig.theme || {};
          siteConfig.theme.default = action.theme;
        }
      }
      if (action.type === "update_meta" && indexHtml) {
        indexHtml = updateMeta(indexHtml, action.title, action.description);
      }
      if (action.type === "add_page" && indexHtml) {
        if (target === "sandbox") {
          throw new Error("add_page is not supported in sandbox mode.");
        }
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
      if (action.type === "inject_css" && target === "sandbox" && indexHtml) {
        indexHtml = injectCssIntoHtml(indexHtml, action.css);
      }
    }
    if (indexHtml) updates[htmlPath] = indexHtml;
    if (siteConfig) updates[SITE_CONFIG] = `${JSON.stringify(siteConfig, null, 2)}\n`;
    if (styles) updates["styles.css"] = styles;
    newPages.forEach((page) => {
      updates[page.path] = page.content;
    });
    const message = `Live update: ${command.slice(0, 60)}`;
    const { commitSha } = await createCommitOnMain(updates, message);
    const deployment = await triggerDeployment(commitSha, intent);
    // Log to D1 if available; fallback to KV
    await logToDB({
      command,
      actions: auditLog,
      files: Object.keys(updates),
      commit: commitSha,
      intent,
      deployment,
    });
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
          { expirationTtl: 60 * 60 * 24 * 7 }
          // 7 days
        );
      } catch (_) {
        // ignore logging failures
      }
    }
    return { commitSha, files: Object.keys(updates), deployment };
  };
  try {
    const payload = await request.json();
    const mode = payload.mode || "plan";
    const command = payload.command || "";
    const target = payload.target === "sandbox" ? "sandbox" : "site";
    if (mode === "rollback_last") {
      const result = await revertLastCommit();
      return new Response(JSON.stringify({ mode, result }), {
        headers: { "Content-Type": "application/json" },
      });
    }
    if (mode === "rollback") {
      throw new Error("Rollback disabled for live apply mode.");
    }
    if (!command && mode !== "rollback") {
      throw new Error("Missing command.");
    }
    let plan = payload.plan;
    if (!plan) {
      if (!OPENAI_API && WORKERS_AI) {
        try {
          const systemPrompt =
            `You are a site editor for a static HTML/CSS/JS site.Return ONLY valid JSON with this schema:{  "summary": "short summary",  "commitMessage": "short git commit message",  "actions": [    {"type":"update_copy","field":"headline","value":"..."},    {"type":"update_meta","title":"...","description":"..."},    {"type":"update_theme","theme":"ember|ocean|volt|midnight"},    {"type":"add_page","slug":"partners","title":"Partners","headline":"...","body":"..."},    {"type":"insert_monetization","headline":"...","description":"...","cta":"..."},    {"type":"update_background_video","src":"https://...mp4"},    {"type":"update_wallpaper","src":"https://...jpg"},    {"type":"update_avatar","src":"https://...jpg"},    {"type":"insert_section","id":"custom","title":"...","body":"..."},    {"type":"add_product","name":"...","price":"...","description":"...","image":"https://..."},    {"type":"insert_video","id":"music-video","title":"...","src":"https://...mp4","poster":"https://...jpg"},    {"type":"insert_stream","id":"livestream","title":"...","url":"https://..."},    {"type":"inject_css","css":".class { color: red; }"}  ]}Only include supported actions. Keep values concise and suitable for production.`.trim();
          const result = await WORKERS_AI.run("@cf/meta/llama-3.1-8b-instruct", {
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: command },
            ],
            temperature: 0.2,
            max_tokens: 900,
          });
          plan = extractJson(pickAiText(result));
        } catch (err) {
          const fallback = buildFallbackPlan(command);
          if (!fallback.actions.length) throw err;
          plan = fallback;
        }
      } else if (OPENAI_API) {
        try {
          const res = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${OPENAI_API}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: OPENAI_MODEL,
              messages: [
                {
                  role: "system",
                  content:
                    `You are a site editor for a static HTML/CSS/JS site.Return ONLY valid JSON with this schema:{  "summary": "short summary",  "commitMessage": "short git commit message",  "actions": [    {"type":"update_copy","field":"headline","value":"..."},    {"type":"update_meta","title":"...","description":"..."},    {"type":"update_theme","theme":"ember|ocean|volt|midnight"},    {"type":"add_page","slug":"partners","title":"Partners","headline":"...","body":"..."},    {"type":"insert_monetization","headline":"...","description":"...","cta":"..."},    {"type":"update_background_video","src":"https://...mp4"},    {"type":"update_wallpaper","src":"https://...jpg"},    {"type":"update_avatar","src":"https://...jpg"},    {"type":"insert_section","id":"custom","title":"...","body":"..."},    {"type":"add_product","name":"...","price":"...","description":"...","image":"https://..."},    {"type":"insert_video","id":"music-video","title":"...","src":"https://...mp4","poster":"https://...jpg"},    {"type":"insert_stream","id":"livestream","title":"...","url":"https://..."},    {"type":"inject_css","css":".class { color: red; }"}  ]}Only include supported actions. Keep values concise and suitable for production.                  `.trim(),
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
      } else {
        const fallback = buildFallbackPlan(command);
        if (!fallback.actions.length) {
          throw new Error('No AI configured. Bind Workers AI (wrangler.toml [ai] binding = "AI") or set OPENAI_API.');
        }
        plan = fallback;
      }
    }
    const intent = buildIntent(plan, command, target);
    plan.intent = intent;
    if (mode === "plan") {
      return new Response(JSON.stringify({ mode, command, target, plan }), {
        headers: { "Content-Type": "application/json" },
      });
    }
    const actions = plan.actions || [];
    if (intent?.confirmation?.required && payload.confirmation !== intent.confirmation.phrase) {
      throw new Error(`Confirmation required. Send confirmation phrase: ${intent.confirmation.phrase}`);
    }
    const applied = await applyActions(actions, command, intent, target);
    return new Response(JSON.stringify({ mode, command, target, plan, ...applied }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
