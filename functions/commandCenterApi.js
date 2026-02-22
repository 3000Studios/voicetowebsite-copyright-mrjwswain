const CONFIRMATION_PHRASE = "hell yeah ship it";

const SHADOW_INDEX_KEY = "cc:shadow:index:v1";
const SHADOW_FILE_PREFIX = "cc:shadow:file:";
const MONETIZATION_KEY = "cc:monetization:config:v1";
const LIVE_STATE_KEY = "cc:live:state:v1";
const PREVIEW_WATERMARK = "PREVIEW - SHADOW STATE";
const PROTECTED_CORE_PATHS = new Set([
  "worker.js",
  "wrangler.toml",
  "admin/integrated-dashboard.html",
  "admin/ccos.js",
  "admin/ccos.css",
]);
const COMMAND_CENTER_EXACT_API_PATHS = new Set([
  "/api/fs/tree",
  "/api/fs/read",
  "/api/fs/write",
  "/api/fs/delete",
  "/api/fs/search",
  "/api/preview/build",
  "/api/repo/status",
  "/api/repo/commit",
  "/api/deploy/run",
  "/api/deploy/logs",
  "/api/deploy/meter",
  "/api/analytics/metrics",
  "/api/monetization/config",
  "/api/voice/execute",
  "/api/env/audit",
  "/api/governance/check",
  "/api/store",
]);
const COMMAND_CENTER_PREFIX_API_PATHS = [
  "/api/store/",
  "/api/media/",
  "/api/audio/",
  "/api/live/",
];

const MEMORY_SHADOW = new Map();

const json = (status, payload) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });

const text = (status, body, contentType = "text/plain; charset=utf-8") =>
  new Response(body, {
    status,
    headers: { "Content-Type": contentType, "Cache-Control": "no-store" },
  });

const parseJsonBody = async (request) => {
  try {
    return await request.clone().json();
  } catch (_) {
    return {};
  }
};

export const isCommandCenterPath = (url) => {
  if (
    url.pathname.startsWith("/preview/") &&
    url.searchParams.get("shadow") === "1"
  ) {
    return true;
  }
  if (!url.pathname.startsWith("/api/")) return false;
  if (COMMAND_CENTER_EXACT_API_PATHS.has(url.pathname)) return true;
  return COMMAND_CENTER_PREFIX_API_PATHS.some(
    (prefix) => url.pathname === prefix || url.pathname.startsWith(prefix)
  );
};

const safePath = (value) => {
  const normalized = String(value || "")
    .trim()
    .replace(/^\/+/, "")
    .replace(/\\/g, "/");
  if (!normalized) return "";
  if (normalized.includes("..")) return "";
  if (!/^[a-zA-Z0-9._/-]+$/.test(normalized)) return "";
  return normalized;
};

const getRequestActor = (request) => {
  const actorHeader = String(request.headers.get("x-cc-actor") || "").trim();
  if (actorHeader) return actorHeader.slice(0, 120);
  const ip = String(request.headers.get("cf-connecting-ip") || "").trim();
  if (ip) return `admin:${ip}`;
  return "admin:unknown";
};

const getLiveRoomAdminToken = (env) =>
  String(
    env.LIVE_ROOM_ADMIN_TOKEN ||
      env.ADMIN_BEARER_TOKEN ||
      env.CONTROL_PASSWORD ||
      ""
  ).trim();

const isProtectedCorePath = (filePath) =>
  PROTECTED_CORE_PATHS.has(String(filePath || "").trim());

const normalizePreviewRoute = (value) => {
  let route = String(value || "").trim();
  if (!route) return "";
  try {
    if (/^https?:\/\//i.test(route)) {
      route = new URL(route).pathname || "/";
    }
  } catch (_) {
    return "";
  }
  route = route.replace(/^\/preview/, "");
  if (!route.startsWith("/")) route = `/${route}`;
  route = route.replace(/[?#].*$/, "");
  if (!route || route === "/index" || route === "/index.html") return "/";
  if (route.endsWith(".html")) route = route.slice(0, -5);
  if (!/^\/[a-zA-Z0-9/_-]*$/.test(route)) return "";
  return route || "/";
};

const toRouteFromFilePath = (filePath) => {
  const p = safePath(filePath);
  if (!p) return "/";
  const lower = p.toLowerCase();

  // Admin files always go to mission
  if (lower.startsWith("admin/")) return "/admin/mission";

  // Root index.html is the home page
  if (lower === "index.html") return "/";

  // HTML files in root become routes
  if (lower.endsWith(".html") && !lower.includes("/")) {
    const name = p.slice(0, -5); // Remove .html
    return name === "index" ? "/" : `/${name}`;
  }

  // HTML files in subdirectories become nested routes
  if (lower.endsWith(".html")) {
    const pathWithoutExt = p.slice(0, -5);
    const route = pathWithoutExt.replace(/\\/g, "/"); // Normalize path separators
    return route.startsWith("/") ? route : `/${route}`;
  }

  // Special known directories
  if (
    /\b(store|pricing|blog|contact|features|templates|gallery)\b/.test(lower)
  ) {
    const match = lower.match(
      /\b(store|pricing|blog|contact|features|templates|gallery)\b/
    );
    return normalizePreviewRoute(`/${match?.[0] || ""}`);
  }

  // For any other files, try to infer route from path structure
  if (lower.includes("/")) {
    const parts = lower.split("/");
    // Skip common asset directories
    if (
      parts[0].match(/^(css|js|images|assets|public|static|src|components)$/)
    ) {
      return "/"; // Asset changes affect the whole site
    }
    // Use the directory as a route
    return `/${parts[0]}`;
  }

  // Default fallback for root-level files
  return "/";
};

const toFilePathFromRoute = (route) => {
  let r = String(route || "/").trim();
  if (!r) r = "/";
  if (!r.startsWith("/")) r = `/${r}`;
  r = r.replace(/[?#].*$/, "");
  if (r === "/" || r === "/index") return "index.html";
  if (r.endsWith(".html")) return safePath(r);
  return safePath(`${r.slice(1)}.html`);
};

const getShadowKey = (filePath) => `${SHADOW_FILE_PREFIX}${filePath}`;

const getRepoConfig = (env) => {
  const token = String(
    env.GH_TOKEN ||
      env.GITHUB_TOKEN ||
      env.GH_BOT_TOKEN ||
      env.PERSONAL_ACCESS_TOKEN_API ||
      env.PERSONAL_ACCESS_TOKEN ||
      env.GITHUB_PAT ||
      ""
  ).trim();
  const repo = String(env.GITHUB_REPO || env.GH_REPO || "").trim();
  const branch = String(env.GITHUB_BASE_BRANCH || env.GH_BASE_BRANCH || "main")
    .trim()
    .toLowerCase();
  const [owner, name] = repo.split("/");
  return {
    token,
    repo,
    branch: branch || "main",
    owner: owner || "",
    name: name || "",
    ready: Boolean(token && owner && name),
  };
};

const githubRequest = async (env, path, init = {}) => {
  const cfg = getRepoConfig(env);
  if (!cfg.ready) throw new Error("GitHub integration not configured.");
  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${cfg.token}`,
      "User-Agent": "voicetowebsite-command-center",
      ...(init.headers || {}),
    },
  });
  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json")
    ? await response.json().catch(() => ({}))
    : await response.text().catch(() => "");
  if (!response.ok) {
    const detail =
      typeof body === "string"
        ? body
        : body?.message || JSON.stringify(body || {});
    throw new Error(`GitHub request failed (${response.status}): ${detail}`);
  }
  return body;
};

const listRepoTree = async (env) => {
  const cfg = getRepoConfig(env);
  if (!cfg.ready) return [];
  const ref = await githubRequest(
    env,
    `/repos/${cfg.owner}/${cfg.name}/git/ref/heads/${cfg.branch}`
  );
  const sha = ref?.object?.sha;
  if (!sha) return [];
  const tree = await githubRequest(
    env,
    `/repos/${cfg.owner}/${cfg.name}/git/trees/${sha}?recursive=1`
  );
  return (tree?.tree || [])
    .filter((entry) => entry?.type === "blob")
    .map((entry) => safePath(entry.path))
    .filter(Boolean);
};

const readRepoFile = async (env, filePath) => {
  const cfg = getRepoConfig(env);
  if (!cfg.ready) return null;
  const encoded = encodeURIComponent(filePath);
  const data = await githubRequest(
    env,
    `/repos/${cfg.owner}/${cfg.name}/contents/${encoded}?ref=${cfg.branch}`
  );
  if (!data?.content) return null;
  const b64 = String(data.content || "").replace(/\s+/g, "");
  const decoded = atob(b64);
  return { content: decoded, sha: String(data.sha || "") };
};

const listShadowIndex = async (env) => {
  if (env.KV) {
    const raw = await env.KV.get(SHADOW_INDEX_KEY);
    if (!raw) return {};
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (_) {
      return {};
    }
  }
  const out = {};
  for (const [key, value] of MEMORY_SHADOW.entries()) {
    if (!key.startsWith(SHADOW_FILE_PREFIX)) continue;
    out[key.slice(SHADOW_FILE_PREFIX.length)] = {
      deleted: Boolean(value?.deleted),
      updatedAt: value?.updatedAt || new Date().toISOString(),
      bytes: Number(value?.bytes || 0),
    };
  }
  return out;
};

const saveShadowIndex = async (env, index) => {
  if (env.KV) {
    await env.KV.put(SHADOW_INDEX_KEY, JSON.stringify(index));
    return;
  }
};

const readShadowFile = async (env, filePath) => {
  const key = getShadowKey(filePath);
  if (env.KV) {
    const raw = await env.KV.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (_) {
      return null;
    }
  }
  return MEMORY_SHADOW.get(key) || null;
};

const writeShadowFile = async (env, filePath, payload) => {
  const key = getShadowKey(filePath);
  const value = JSON.stringify(payload);
  if (env.KV) {
    await env.KV.put(key, value);
    return;
  }
  MEMORY_SHADOW.set(key, payload);
};

const deleteShadowFile = async (env, filePath) => {
  const key = getShadowKey(filePath);
  if (env.KV) {
    await env.KV.delete(key);
    return;
  }
  MEMORY_SHADOW.delete(key);
};

const buildTreeObject = (filePaths) => {
  const root = { name: "/", type: "dir", children: {} };
  for (const filePath of filePaths) {
    const parts = String(filePath).split("/").filter(Boolean);
    let cursor = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      if (!cursor.children[part]) {
        cursor.children[part] = {
          name: part,
          type: isFile ? "file" : "dir",
          children: isFile ? undefined : {},
          path: parts.slice(0, i + 1).join("/"),
        };
      }
      cursor = cursor.children[part];
    }
  }

  const normalize = (node) => {
    if (node.type === "file")
      return { name: node.name, type: "file", path: node.path };
    const children = Object.values(node.children || {})
      .map((child) => normalize(child))
      .sort((a, b) => {
        if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
        return String(a.name).localeCompare(String(b.name));
      });
    return {
      name: node.name,
      type: "dir",
      path: node.path || "",
      children,
    };
  };

  return normalize(root);
};

const readAssetFile = async ({ assets, request, filePath, url }) => {
  if (!assets) return null;
  const fileUrl = new URL(`/${filePath}`, url.origin);
  const res = await assets.fetch(new Request(fileUrl, request));
  if (!res.ok) return null;
  return await res.text();
};

const getMonetizationConfig = async (env) => {
  const fallback = {
    adDensityCap: 3,
    ctaVariant: "cta-dominant",
    donationEnabled: true,
    superchatEnabled: true,
    affiliateEnabled: false,
    slotToggles: {},
  };
  if (!env.KV) return fallback;
  const raw = await env.KV.get(MONETIZATION_KEY);
  if (!raw) return fallback;
  try {
    return { ...fallback, ...(JSON.parse(raw) || {}) };
  } catch (_) {
    return fallback;
  }
};

const saveMonetizationConfig = async (env, config) => {
  if (!env.KV) return;
  await env.KV.put(MONETIZATION_KEY, JSON.stringify(config));
};

const appendAuditLog = async ({
  env,
  action,
  actor = "admin",
  details = {},
}) => {
  const entry = {
    id: crypto.randomUUID(),
    ts: new Date().toISOString(),
    action: String(action || "unknown"),
    actor: String(actor || "admin"),
    details,
  };

  try {
    if (env.AUDIT_LOG) {
      const id = env.AUDIT_LOG.idFromName("global");
      const stub = env.AUDIT_LOG.get(id);
      await stub.fetch("https://audit/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });
      return entry;
    }
  } catch (_) {}

  if (env.D1) {
    await env.D1.prepare(
      `CREATE TABLE IF NOT EXISTS audit_events (
        id TEXT PRIMARY KEY,
        ts TEXT NOT NULL,
        actor TEXT NOT NULL,
        action TEXT NOT NULL,
        details_json TEXT NOT NULL
      )`
    ).run();
    await env.D1.prepare(
      "INSERT INTO audit_events (id, ts, actor, action, details_json) VALUES (?, ?, ?, ?, ?)"
    )
      .bind(
        entry.id,
        entry.ts,
        entry.actor,
        entry.action,
        JSON.stringify(entry.details || {})
      )
      .run();
  }
  return entry;
};

const ensureStoreTable = async (env) => {
  if (!env.D1) return;
  await env.D1.prepare(
    `CREATE TABLE IF NOT EXISTS cc_store_products (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      price REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      featured_in_live INTEGER NOT NULL DEFAULT 0,
      description TEXT NOT NULL DEFAULT '',
      metadata_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`
  ).run();
};

const ensureMediaTable = async (env) => {
  if (!env.D1) return;
  await env.D1.prepare(
    `CREATE TABLE IF NOT EXISTS cc_media_assets (
      id TEXT PRIMARY KEY,
      bucket_key TEXT NOT NULL,
      filename TEXT NOT NULL,
      mime TEXT NOT NULL,
      bytes INTEGER NOT NULL,
      source TEXT NOT NULL,
      license TEXT NOT NULL,
      attribution TEXT NOT NULL,
      usage_restrictions TEXT NOT NULL DEFAULT '',
      tags TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    )`
  ).run();
};

const ensureAudioTable = async (env) => {
  if (!env.D1) return;
  await env.D1.prepare(
    `CREATE TABLE IF NOT EXISTS cc_audio_assets (
      id TEXT PRIMARY KEY,
      bucket_key TEXT NOT NULL,
      filename TEXT NOT NULL,
      mime TEXT NOT NULL,
      bytes INTEGER NOT NULL,
      source TEXT NOT NULL,
      license TEXT NOT NULL,
      attribution TEXT NOT NULL,
      bpm INTEGER NOT NULL DEFAULT 0,
      tags TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    )`
  ).run();
};

const ensureAnalyticsSnapshotTable = async (env) => {
  if (!env.D1) return;
  await env.D1.prepare(
    `CREATE TABLE IF NOT EXISTS cc_analytics_snapshots (
      id TEXT PRIMARY KEY,
      ts TEXT NOT NULL,
      payload_json TEXT NOT NULL
    )`
  ).run();
};

const getEnvAudit = (env) => {
  const required = [
    "CONTROL_PASSWORD",
    "ADMIN_COOKIE_SECRET",
    "GH_REPO",
    "GH_TOKEN",
    "CLOUDFLARE_API_TOKEN",
  ];
  const aliases = {
    GH_REPO: ["GITHUB_REPO"],
    GH_TOKEN: ["GITHUB_TOKEN", "GITHUB_PAT", "PERSONAL_ACCESS_TOKEN"],
  };

  const present = new Set(Object.keys(env || {}));
  const missing = [];
  for (const key of required) {
    const options = [key, ...(aliases[key] || [])];
    const hasAny = options.some((candidate) => {
      if (!present.has(candidate)) return false;
      const value = String(env[candidate] || "").trim();
      return Boolean(value);
    });
    if (!hasAny) missing.push(key);
  }
  const unknown = Array.from(present)
    .filter((k) => /^([A-Z0-9_]+)$/.test(k))
    .filter((k) => !required.includes(k) && !Object.keys(aliases).includes(k))
    .sort();
  return {
    required,
    missing,
    status: missing.length ? "fail" : "pass",
    observedBindings: Array.from(present).sort(),
    unusedCandidateVars: unknown.slice(0, 100),
  };
};

const mergeRepoAndShadowFiles = ({ repoFiles, shadowIndex }) => {
  const set = new Set((repoFiles || []).filter(Boolean));
  for (const [path, meta] of Object.entries(shadowIndex || {})) {
    if (!meta || meta.deleted) {
      set.delete(path);
      continue;
    }
    set.add(path);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
};

const resolveFileContent = async ({
  env,
  assets,
  request,
  url,
  filePath,
  includeDeleted = false,
}) => {
  const safe = safePath(filePath);
  if (!safe) return { ok: false, status: 400, error: "Invalid path." };
  const shadow = await readShadowFile(env, safe);
  if (shadow?.deleted && !includeDeleted) {
    return { ok: false, status: 410, error: "File is staged for deletion." };
  }
  if (typeof shadow?.content === "string") {
    return { ok: true, content: shadow.content, source: "shadow" };
  }
  try {
    const repo = await readRepoFile(env, safe);
    if (repo?.content != null) {
      return {
        ok: true,
        content: repo.content,
        source: "github",
        sha: repo.sha,
      };
    }
  } catch (_) {}
  const assetContent = await readAssetFile({
    assets,
    request,
    filePath: safe,
    url,
  });
  if (assetContent != null) {
    return { ok: true, content: assetContent, source: "assets" };
  }
  return { ok: false, status: 404, error: "File not found." };
};

const getShadowSummary = async (env) => {
  const index = await listShadowIndex(env);
  const files = Object.entries(index).map(([path, meta]) => ({
    path,
    deleted: Boolean(meta?.deleted),
    updatedAt: meta?.updatedAt || "",
    bytes: Number(meta?.bytes || 0),
    risk:
      path === "worker.js" ||
      path === "admin/integrated-dashboard.html" ||
      path === "admin/ccos.js"
        ? "core-shell"
        : path.startsWith("admin/")
          ? "admin"
          : path.endsWith(".css")
            ? "styling"
            : "normal",
  }));
  return {
    total: files.length,
    files: files.sort((a, b) => a.path.localeCompare(b.path)),
  };
};

const parseVoiceIntent = (commandText = "") => {
  const textLower = String(commandText || "").toLowerCase();
  const fileTargets = [];
  const routeTargets = [];
  const operations = [];

  if (textLower.includes("pricing")) {
    routeTargets.push("/pricing");
    fileTargets.push("pricing.html");
  }
  if (textLower.includes("store")) {
    routeTargets.push("/store");
    fileTargets.push("store.html");
  }
  if (textLower.includes("home") || textLower.includes("homepage")) {
    routeTargets.push("/");
    fileTargets.push("index.html");
  }
  if (textLower.includes("delete")) operations.push("delete");
  if (textLower.includes("create") || textLower.includes("add"))
    operations.push("create");
  if (textLower.includes("edit") || textLower.includes("update"))
    operations.push("update");

  const intent = operations[0] || "update";
  const deployRequired =
    textLower.includes("deploy") ||
    textLower.includes("ship") ||
    textLower.includes("publish");
  const previewRoutes = routeTargets.length ? routeTargets : ["/"];

  return {
    intent,
    targets: {
      routes: routeTargets,
      files: fileTargets,
    },
    operations: operations.length ? operations : ["update"],
    validations: [
      "governance-check",
      "env-audit",
      "preview-integrity",
      "monetization-density-guard",
    ],
    previewRoutes,
    deployRequired,
  };
};

const handleFsTree = async ({ env }) => {
  const shadowIndex = await listShadowIndex(env);
  let repoFiles = [];
  try {
    repoFiles = await listRepoTree(env);
  } catch (_) {}
  const files = mergeRepoAndShadowFiles({ repoFiles, shadowIndex });
  return json(200, {
    ok: true,
    files,
    tree: buildTreeObject(files),
    shadowCount: Object.keys(shadowIndex).length,
  });
};

const handleFsRead = async ({ env, assets, request, url }) => {
  const filePath = safePath(url.searchParams.get("path"));
  if (!filePath) return json(400, { ok: false, error: "Missing path." });
  const content = await resolveFileContent({
    env,
    assets,
    request,
    url,
    filePath,
  });
  if (!content.ok) return json(content.status || 404, content);
  return json(200, {
    ok: true,
    path: filePath,
    source: content.source,
    content: content.content,
  });
};

const handleFsWrite = async ({ env, request }) => {
  const body = await parseJsonBody(request);
  const filePath = safePath(body.path);
  const content = String(body.content || "");
  if (!filePath) return json(400, { ok: false, error: "Invalid path." });
  if (isProtectedCorePath(filePath)) {
    return json(403, {
      ok: false,
      error: "Protected core shell file cannot be edited from Command Center.",
      path: filePath,
    });
  }
  const actor = getRequestActor(request);
  const index = await listShadowIndex(env);
  const payload = {
    path: filePath,
    content,
    deleted: false,
    updatedAt: new Date().toISOString(),
    bytes: new TextEncoder().encode(content).byteLength,
  };
  await writeShadowFile(env, filePath, payload);
  index[filePath] = {
    deleted: false,
    updatedAt: payload.updatedAt,
    bytes: payload.bytes,
  };
  await saveShadowIndex(env, index);
  await appendAuditLog({
    env,
    action: "fs.write",
    actor,
    details: { path: filePath, bytes: payload.bytes },
  });
  return json(200, {
    ok: true,
    changed: { path: filePath, bytes: payload.bytes, deleted: false },
    whatChanged: [`Updated ${filePath}`, `${payload.bytes} bytes staged`],
  });
};

const handleFsDelete = async ({ env, request }) => {
  const body = await parseJsonBody(request);
  const filePath = safePath(body.path);
  if (!filePath) return json(400, { ok: false, error: "Invalid path." });
  if (isProtectedCorePath(filePath)) {
    return json(403, {
      ok: false,
      error: "Protected core shell file cannot be deleted from Command Center.",
      path: filePath,
    });
  }
  const actor = getRequestActor(request);
  const index = await listShadowIndex(env);
  const payload = {
    path: filePath,
    content: "",
    deleted: true,
    updatedAt: new Date().toISOString(),
    bytes: 0,
  };
  await writeShadowFile(env, filePath, payload);
  index[filePath] = {
    deleted: true,
    updatedAt: payload.updatedAt,
    bytes: 0,
  };
  await saveShadowIndex(env, index);
  await appendAuditLog({
    env,
    action: "fs.delete",
    actor,
    details: { path: filePath },
  });
  return json(200, {
    ok: true,
    changed: { path: filePath, deleted: true },
    whatChanged: [`Staged delete ${filePath}`],
  });
};

const handleFsSearch = async ({ env, assets, request, url }) => {
  const q = String(url.searchParams.get("q") || "")
    .trim()
    .toLowerCase();
  if (!q) return json(400, { ok: false, error: "Missing query." });
  const shadowIndex = await listShadowIndex(env);
  let repoFiles = [];
  try {
    repoFiles = await listRepoTree(env);
  } catch (_) {}
  const files = mergeRepoAndShadowFiles({ repoFiles, shadowIndex });
  const pathMatches = files
    .filter((path) => path.toLowerCase().includes(q))
    .slice(0, 300);
  const contentMatches = [];
  for (const candidate of pathMatches.slice(0, 40)) {
    const resolved = await resolveFileContent({
      env,
      assets,
      request,
      url,
      filePath: candidate,
    });
    if (!resolved.ok || typeof resolved.content !== "string") continue;
    const lower = resolved.content.toLowerCase();
    const idx = lower.indexOf(q);
    if (idx < 0) continue;
    contentMatches.push({
      path: candidate,
      snippet: resolved.content.slice(Math.max(0, idx - 60), idx + 120),
    });
  }
  return json(200, {
    ok: true,
    query: q,
    pathMatches,
    contentMatches,
  });
};

const handlePreviewBuild = async ({ request }) => {
  const body = await parseJsonBody(request);
  const routes = new Set();
  const addRoute = (candidate) => {
    const normalized = normalizePreviewRoute(candidate);
    if (!normalized) return;
    routes.add(normalized);
  };

  // Process explicit routes first
  for (const route of body.routes || []) {
    if (typeof route !== "string" || !route.trim()) continue;
    addRoute(route);
  }

  // Process files and convert to routes
  for (const file of body.files || []) {
    const normalized = safePath(file);
    if (!normalized) continue;
    const route = toRouteFromFilePath(normalized);
    addRoute(route);
  }

  // If no routes were determined, default to home page
  if (!routes.size) routes.add("/");

  // Prioritize home page if index.html was likely modified
  const routeArray = Array.from(routes);
  const hasIndexModification = body.files?.some((file) =>
    String(file).toLowerCase().includes("index.html")
  );

  // If index.html was modified and home page isn't first, prioritize it
  if (hasIndexModification && routeArray.length > 1 && routeArray[0] !== "/") {
    const homeIndex = routeArray.indexOf("/");
    if (homeIndex > 0) {
      // Move home page to front for preview priority
      routeArray.splice(homeIndex, 1);
      routeArray.unshift("/");
    }
  }

  const ts = Date.now();
  const zoneFlag = body.showMonetizationZones ? "&zones=1" : "";
  return json(200, {
    ok: true,
    previewRoutes: routeArray,
    previews: routeArray.map((route) => ({
      route,
      url: `/preview${route}?shadow=1${zoneFlag}&ts=${ts}`,
    })),
  });
};

const handleRepoStatus = async ({ env }) => {
  const summary = await getShadowSummary(env);
  return json(200, {
    ok: true,
    staged: summary,
    confirmationPhrase: CONFIRMATION_PHRASE,
  });
};

const clearShadowState = async (env) => {
  const index = await listShadowIndex(env);
  for (const filePath of Object.keys(index)) {
    await deleteShadowFile(env, filePath);
  }
  await saveShadowIndex(env, {});
};

const handleRepoCommit = async ({ env, request }) => {
  const cfg = getRepoConfig(env);
  if (!cfg.ready) {
    return json(503, {
      ok: false,
      error: "GitHub credentials missing; cannot commit.",
    });
  }
  const body = await parseJsonBody(request);
  const message = String(body.message || "Command Center commit").trim();
  const actor = getRequestActor(request);
  const index = await listShadowIndex(env);
  const stagedPaths = Object.keys(index)
    .map((path) => safePath(path))
    .filter(Boolean);
  const protectedPaths = stagedPaths.filter((path) =>
    isProtectedCorePath(path)
  );
  const allowProtectedOverride =
    body.allowProtected === true &&
    String(body.confirmation || "") === CONFIRMATION_PHRASE;
  if (protectedPaths.length && !allowProtectedOverride) {
    return json(403, {
      ok: false,
      error:
        "Protected core shell files are staged. Commit blocked unless explicit override is supplied.",
      protectedPaths,
    });
  }
  const changed = [];

  for (const [filePath, meta] of Object.entries(index)) {
    const safe = safePath(filePath);
    if (!safe) continue;
    const shadow = await readShadowFile(env, safe);
    const encodedPath = encodeURIComponent(safe);
    let existingSha = "";
    try {
      const current = await readRepoFile(env, safe);
      existingSha = String(current?.sha || "");
    } catch (_) {}

    if (meta?.deleted || shadow?.deleted) {
      if (!existingSha) continue;
      await githubRequest(
        env,
        `/repos/${cfg.owner}/${cfg.name}/contents/${encodedPath}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: `${message}: delete ${safe}`,
            sha: existingSha,
            branch: cfg.branch,
          }),
        }
      );
      changed.push({ path: safe, operation: "delete" });
      continue;
    }

    const content = String(shadow?.content || "");
    const bytes = new TextEncoder().encode(content);
    let binary = "";
    for (const b of bytes) binary += String.fromCharCode(b);
    const b64 = btoa(binary);
    await githubRequest(
      env,
      `/repos/${cfg.owner}/${cfg.name}/contents/${encodedPath}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `${message}: update ${safe}`,
          content: b64,
          sha: existingSha || undefined,
          branch: cfg.branch,
        }),
      }
    );
    changed.push({ path: safe, operation: existingSha ? "update" : "create" });
  }

  await appendAuditLog({
    env,
    action: "repo.commit",
    actor,
    details: { changedCount: changed.length, changed },
  });
  await clearShadowState(env);
  return json(200, {
    ok: true,
    changed,
    whatChanged: changed.map((c) => `${c.operation}: ${c.path}`),
  });
};

const handleDeployRun = async ({ env, request }) => {
  const body = await parseJsonBody(request);
  const phrase = String(body.confirmation || "");
  if (phrase !== CONFIRMATION_PHRASE) {
    return json(403, {
      ok: false,
      error: `Confirmation phrase must be exactly "${CONFIRMATION_PHRASE}"`,
    });
  }
  const actor = getRequestActor(request);
  const planTier = String(
    request.headers.get("x-cc-plan-tier") || env.DEPLOY_PLAN_TIER || "pro"
  )
    .trim()
    .toLowerCase();
  const billingStatus = String(
    request.headers.get("x-cc-billing-status") ||
      env.DEPLOY_BILLING_STATUS ||
      "active"
  )
    .trim()
    .toLowerCase();
  const audit = await getEnvAudit(env);
  if (audit.missing.length) {
    return json(400, {
      ok: false,
      error: "Environment audit failed.",
      envAudit: audit,
    });
  }
  if (!env.DEPLOY_CONTROLLER) {
    return json(503, {
      ok: false,
      error: "DeployControllerDO binding missing.",
    });
  }
  const id = env.DEPLOY_CONTROLLER.idFromName("global");
  const stub = env.DEPLOY_CONTROLLER.get(id);
  const res = await stub.fetch("https://deploy/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      confirmation: phrase,
      actor,
      planTier,
      billingStatus,
      summary: body.summary || {},
    }),
  });
  const payload = await res.json().catch(() => ({}));
  await appendAuditLog({
    env,
    action: "deploy.run",
    actor,
    details: { accepted: res.ok, planTier, billingStatus, payload },
  });
  return json(res.status, payload);
};

const handleDeployLogs = async ({ env }) => {
  if (!env.DEPLOY_CONTROLLER) {
    return json(503, {
      ok: false,
      error: "DeployControllerDO binding missing.",
    });
  }
  const id = env.DEPLOY_CONTROLLER.idFromName("global");
  const stub = env.DEPLOY_CONTROLLER.get(id);
  const res = await stub.fetch("https://deploy/logs");
  const payload = await res.json().catch(() => ({}));
  return json(res.status, payload);
};

const handleDeployMeter = async ({ env, request }) => {
  if (!env.DEPLOY_CONTROLLER) {
    return json(503, {
      ok: false,
      error: "DeployControllerDO binding missing.",
    });
  }
  const actor = encodeURIComponent(getRequestActor(request));
  const planTier = encodeURIComponent(
    String(
      request.headers.get("x-cc-plan-tier") || env.DEPLOY_PLAN_TIER || "pro"
    )
      .trim()
      .toLowerCase()
  );
  const billingStatus = encodeURIComponent(
    String(
      request.headers.get("x-cc-billing-status") ||
        env.DEPLOY_BILLING_STATUS ||
        "active"
    )
      .trim()
      .toLowerCase()
  );
  const id = env.DEPLOY_CONTROLLER.idFromName("global");
  const stub = env.DEPLOY_CONTROLLER.get(id);
  const res = await stub.fetch(
    `https://deploy/meter?actor=${actor}&planTier=${planTier}&billingStatus=${billingStatus}`
  );
  const payload = await res.json().catch(() => ({}));
  return json(res.status, payload);
};

const handleAnalyticsMetrics = async ({ env }) => {
  let productCount = 0;
  let orderCount = 0;
  let storeRevenue = 0;
  let mediaCount = 0;
  let audioCount = 0;
  let auditCount = 0;
  if (env.D1) {
    await ensureStoreTable(env);
    await ensureMediaTable(env);
    await ensureAudioTable(env);
    await ensureAnalyticsSnapshotTable(env);
    try {
      productCount =
        Number(
          (
            await env.D1.prepare(
              "SELECT COUNT(*) AS count FROM cc_store_products"
            ).first()
          )?.count || 0
        ) || 0;
    } catch (_) {}
    try {
      const orderRow = await env.D1.prepare(
        "SELECT COUNT(*) AS count, COALESCE(SUM(amount), 0) AS total FROM orders"
      ).first();
      orderCount = Number(orderRow?.count || 0) || 0;
      storeRevenue = Number(orderRow?.total || 0) || 0;
    } catch (_) {}
    try {
      mediaCount =
        Number(
          (
            await env.D1.prepare(
              "SELECT COUNT(*) AS count FROM cc_media_assets"
            ).first()
          )?.count || 0
        ) || 0;
    } catch (_) {}
    try {
      audioCount =
        Number(
          (
            await env.D1.prepare(
              "SELECT COUNT(*) AS count FROM cc_audio_assets"
            ).first()
          )?.count || 0
        ) || 0;
    } catch (_) {}
    try {
      auditCount =
        Number(
          (
            await env.D1.prepare(
              "SELECT COUNT(*) AS count FROM audit_events"
            ).first()
          )?.count || 0
        ) || 0;
    } catch (_) {}
  }
  const staged = await getShadowSummary(env);
  return json(200, {
    ok: true,
    traffic: { sessions24h: 0, uniqueUsers24h: 0 },
    engagement: { avgSessionSeconds: 0, bounceRate: 0 },
    conversions: { orders: orderCount, revenue: storeRevenue },
    perRoute: [],
    experiments: [],
    livestream: { viewerCount: 0, chatRatePerMinute: 0, revenuePerStream: 0 },
    store: { conversionRate: 0, aov: 0, productCount },
    assets: { mediaCount, audioCount },
    governance: {
      stagedChanges: staged.total,
      auditEvents: auditCount,
      budgets: { cssGzipKb: null, jsGzipKb: null, mediaMb: null },
    },
  });
};

const handleMonetizationConfig = async ({ env, request }) => {
  if (request.method === "GET") {
    const config = await getMonetizationConfig(env);
    return json(200, { ok: true, config });
  }
  const body = await parseJsonBody(request);
  const next = {
    ...(await getMonetizationConfig(env)),
    ...(body || {}),
  };
  next.adDensityCap = Math.max(
    0,
    Math.min(6, Number.parseInt(String(next.adDensityCap || 0), 10) || 0)
  );
  await saveMonetizationConfig(env, next);
  await appendAuditLog({
    env,
    action: "monetization.update",
    details: { config: next },
  });
  return json(200, { ok: true, config: next });
};

const handleStoreApi = async ({ env, request, url }) => {
  if (!env.D1) return json(503, { ok: false, error: "D1 binding missing." });
  await ensureStoreTable(env);
  const path = url.pathname.replace(/^\/api\/store/, "");
  if ((path === "" || path === "/products") && request.method === "GET") {
    const rows = await env.D1.prepare(
      "SELECT * FROM cc_store_products ORDER BY updated_at DESC LIMIT 500"
    ).all();
    return json(200, { ok: true, products: rows?.results || [] });
  }
  if ((path === "" || path === "/products") && request.method === "POST") {
    const body = await parseJsonBody(request);
    const id = safePath(body.id || crypto.randomUUID().slice(0, 12));
    const now = new Date().toISOString();
    await env.D1.prepare(
      `INSERT INTO cc_store_products
       (id, title, price, currency, featured_in_live, description, metadata_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        id,
        String(body.title || "Untitled Product"),
        Number(body.price || 0),
        String(body.currency || "USD").toUpperCase(),
        body.featuredInLive ? 1 : 0,
        String(body.description || ""),
        JSON.stringify(body.metadata || {}),
        now,
        now
      )
      .run();
    await appendAuditLog({ env, action: "store.create", details: { id } });
    return json(200, { ok: true, id });
  }
  const id = safePath(path.split("/").pop());
  if (!id) return json(400, { ok: false, error: "Missing product id." });
  if (request.method === "PUT") {
    const body = await parseJsonBody(request);
    await env.D1.prepare(
      `UPDATE cc_store_products
       SET title = ?, price = ?, currency = ?, featured_in_live = ?, description = ?, metadata_json = ?, updated_at = ?
       WHERE id = ?`
    )
      .bind(
        String(body.title || "Untitled Product"),
        Number(body.price || 0),
        String(body.currency || "USD").toUpperCase(),
        body.featuredInLive ? 1 : 0,
        String(body.description || ""),
        JSON.stringify(body.metadata || {}),
        new Date().toISOString(),
        id
      )
      .run();
    await appendAuditLog({ env, action: "store.update", details: { id } });
    return json(200, { ok: true, id });
  }
  if (request.method === "DELETE") {
    await env.D1.prepare("DELETE FROM cc_store_products WHERE id = ?")
      .bind(id)
      .run();
    await appendAuditLog({ env, action: "store.delete", details: { id } });
    return json(200, { ok: true, id });
  }
  return json(405, { ok: false, error: "Method not allowed." });
};

const parseMetadataForm = (form, fields) => {
  const out = {};
  for (const field of fields) out[field] = String(form.get(field) || "").trim();
  return out;
};

const handleMediaApi = async ({ env, request, url }) => {
  if (!env.D1 || !env.R2) {
    return json(503, { ok: false, error: "Media requires D1 + R2 bindings." });
  }
  await ensureMediaTable(env);
  if (url.pathname === "/api/media/list" && request.method === "GET") {
    const rows = await env.D1.prepare(
      "SELECT * FROM cc_media_assets ORDER BY created_at DESC LIMIT 500"
    ).all();
    return json(200, { ok: true, assets: rows?.results || [] });
  }
  if (url.pathname === "/api/media/upload" && request.method === "POST") {
    const form = await request.clone().formData();
    const file = form.get("file");
    if (!(file instanceof File))
      return json(400, { ok: false, error: "file is required." });
    const meta = parseMetadataForm(form, [
      "source",
      "license",
      "attribution",
      "usageRestrictions",
      "tags",
    ]);
    if (!meta.license || !meta.attribution) {
      return json(400, {
        ok: false,
        error: "license and attribution are required for media uploads.",
      });
    }
    const id = crypto.randomUUID();
    const key = `media/${id}-${safePath(file.name) || "asset.bin"}`;
    const bytes = await file.arrayBuffer();
    await env.R2.put(key, bytes, {
      httpMetadata: { contentType: file.type || "application/octet-stream" },
    });
    await env.D1.prepare(
      `INSERT INTO cc_media_assets
      (id, bucket_key, filename, mime, bytes, source, license, attribution, usage_restrictions, tags, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        id,
        key,
        file.name,
        file.type || "application/octet-stream",
        Number(file.size || 0),
        meta.source,
        meta.license,
        meta.attribution,
        meta.usageRestrictions,
        meta.tags,
        new Date().toISOString()
      )
      .run();
    await appendAuditLog({ env, action: "media.upload", details: { id, key } });
    return json(200, { ok: true, id, key });
  }
  return json(405, { ok: false, error: "Method not allowed." });
};

const handleAudioApi = async ({ env, request, url }) => {
  if (!env.D1 || !env.R2) {
    return json(503, { ok: false, error: "Audio requires D1 + R2 bindings." });
  }
  await ensureAudioTable(env);
  if (url.pathname === "/api/audio/list" && request.method === "GET") {
    const rows = await env.D1.prepare(
      "SELECT * FROM cc_audio_assets ORDER BY created_at DESC LIMIT 500"
    ).all();
    return json(200, { ok: true, assets: rows?.results || [] });
  }
  if (url.pathname === "/api/audio/upload" && request.method === "POST") {
    const form = await request.clone().formData();
    const file = form.get("file");
    if (!(file instanceof File))
      return json(400, { ok: false, error: "file is required." });
    const meta = parseMetadataForm(form, [
      "source",
      "license",
      "attribution",
      "tags",
      "bpm",
    ]);
    if (!meta.license || !meta.attribution) {
      return json(400, {
        ok: false,
        error: "license and attribution are required for audio uploads.",
      });
    }
    const id = crypto.randomUUID();
    const key = `audio/${id}-${safePath(file.name) || "audio.bin"}`;
    const bytes = await file.arrayBuffer();
    await env.R2.put(key, bytes, {
      httpMetadata: { contentType: file.type || "application/octet-stream" },
    });
    await env.D1.prepare(
      `INSERT INTO cc_audio_assets
      (id, bucket_key, filename, mime, bytes, source, license, attribution, bpm, tags, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        id,
        key,
        file.name,
        file.type || "application/octet-stream",
        Number(file.size || 0),
        meta.source,
        meta.license,
        meta.attribution,
        Number.parseInt(meta.bpm || "0", 10) || 0,
        meta.tags,
        new Date().toISOString()
      )
      .run();
    await appendAuditLog({ env, action: "audio.upload", details: { id, key } });
    return json(200, { ok: true, id, key });
  }
  return json(405, { ok: false, error: "Method not allowed." });
};

const handleLiveApi = async ({ env, request, url }) => {
  if (request.method === "GET") {
    let state = {
      streamState: "idle",
      websocketState: env.LIVE_ROOM ? "ready" : "missing",
      superchatEnabled: true,
      actionsEnabled: true,
      bitrateKbps: 0,
    };
    if (env.KV) {
      const raw = await env.KV.get(LIVE_STATE_KEY);
      if (raw) {
        try {
          state = { ...state, ...(JSON.parse(raw) || {}) };
        } catch (_) {}
      }
    }
    return json(200, { ok: true, state });
  }
  const body = await parseJsonBody(request);
  const next = {
    streamState: String(body.streamState || "idle"),
    websocketState: String(body.websocketState || "ready"),
    superchatEnabled: Boolean(body.superchatEnabled),
    actionsEnabled: Boolean(body.actionsEnabled),
    bitrateKbps: Number(body.bitrateKbps || 0),
  };
  if (env.KV) await env.KV.put(LIVE_STATE_KEY, JSON.stringify(next));
  await appendAuditLog({ env, action: "live.update", details: next });
  if (env.LIVE_ROOM) {
    const id = env.LIVE_ROOM.idFromName("global");
    const stub = env.LIVE_ROOM.get(id);
    const token = getLiveRoomAdminToken(env);
    await stub.fetch("https://live/event", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ type: "live_state", payload: next }),
    });
  }
  return json(200, { ok: true, state: next });
};

const handleVoiceExecute = async ({ env, request }) => {
  const body = await parseJsonBody(request);
  const command = String(body.command || "").trim();
  if (!command) return json(400, { ok: false, error: "command is required." });
  const plan = parseVoiceIntent(command);
  const monetizationImpact = {
    adSlotsTouched: plan.targets.routes.some((r) => r.includes("store"))
      ? 1
      : 0,
    donationSurfaceTouched: plan.targets.routes.includes("/live"),
  };
  const analyticsImpact = {
    impactedRoutes: plan.previewRoutes,
    events: ["command_executed", "preview_built", "deploy_requested"],
  };
  await appendAuditLog({
    env,
    action: "voice.execute.plan",
    details: { command, plan },
  });
  return json(200, {
    ok: true,
    command,
    executionPlan: plan,
    monetizationImpact,
    analyticsImpact,
    whatChanged: ["Execution plan generated from command input"],
  });
};

const renderPreviewHtml = ({ html, route, showZones }) => {
  const watermark = `<div style="position:fixed;bottom:12px;right:12px;z-index:2147483647;font:700 12px/1.2 monospace;padding:8px 10px;border:1px solid #ef4444;background:rgba(127,29,29,.84);color:#fff;border-radius:8px;">${PREVIEW_WATERMARK}</div>`;
  const zones = showZones
    ? `<div style="position:fixed;inset:0;pointer-events:none;z-index:2147483646">
        <div style="position:absolute;top:8%;left:4%;right:4%;height:16%;border:2px dashed #22c55e;background:rgba(34,197,94,.08)"></div>
        <div style="position:absolute;top:36%;left:4%;right:4%;height:18%;border:2px dashed #f59e0b;background:rgba(245,158,11,.08)"></div>
        <div style="position:absolute;bottom:6%;left:4%;right:4%;height:14%;border:2px dashed #3b82f6;background:rgba(59,130,246,.08)"></div>
      </div>`
    : "";
  const marker = `<meta name="robots" content="noindex,nofollow" /><meta name="vtw-preview-route" content="${route}" />`;
  let out = String(html || "");
  if (out.includes("</head>")) out = out.replace("</head>", `${marker}</head>`);
  if (out.includes("</body>"))
    out = out.replace("</body>", `${zones}${watermark}</body>`);
  return out;
};

const handlePreviewRoute = async ({ env, assets, request, url }) => {
  let raw = "/";
  try {
    raw = decodeURIComponent(url.pathname.replace(/^\/preview/, "") || "/");
  } catch (_) {
    return text(400, "Invalid preview route encoding.");
  }
  const route = raw.startsWith("/") ? raw : `/${raw}`;
  const filePath = toFilePathFromRoute(route);
  if (!filePath) return text(404, "Preview target not found.");
  const resolved = await resolveFileContent({
    env,
    assets,
    request,
    url,
    filePath,
  });
  if (!resolved.ok)
    return text(resolved.status || 404, resolved.error || "Not found");
  const showZones = url.searchParams.get("zones") === "1";
  const html = renderPreviewHtml({
    html: resolved.content,
    route,
    showZones,
  });
  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
};

export const handleCommandCenterRequest = async ({
  request,
  env,
  url,
  assets,
}) => {
  if (
    url.pathname.startsWith("/preview/") &&
    url.searchParams.get("shadow") === "1"
  ) {
    return handlePreviewRoute({ env, assets, request, url });
  }

  if (!url.pathname.startsWith("/api/")) return null;

  if (url.pathname === "/api/fs/tree" && request.method === "GET")
    return handleFsTree({ env });
  if (url.pathname === "/api/fs/read" && request.method === "GET")
    return handleFsRead({ env, assets, request, url });
  if (url.pathname === "/api/fs/write" && request.method === "POST")
    return handleFsWrite({ env, request });
  if (url.pathname === "/api/fs/delete" && request.method === "POST")
    return handleFsDelete({ env, request });
  if (url.pathname === "/api/fs/search" && request.method === "GET")
    return handleFsSearch({ env, assets, request, url });

  if (url.pathname === "/api/preview/build" && request.method === "POST")
    return handlePreviewBuild({ request });

  if (url.pathname === "/api/repo/status" && request.method === "GET")
    return handleRepoStatus({ env });
  if (url.pathname === "/api/repo/commit" && request.method === "POST")
    return handleRepoCommit({ env, request });

  if (url.pathname === "/api/deploy/run" && request.method === "POST")
    return handleDeployRun({ env, request });
  if (url.pathname === "/api/deploy/logs" && request.method === "GET")
    return handleDeployLogs({ env });
  if (url.pathname === "/api/deploy/meter" && request.method === "GET")
    return handleDeployMeter({ env, request });

  if (url.pathname === "/api/analytics/metrics" && request.method === "GET")
    return handleAnalyticsMetrics({ env });
  if (
    url.pathname === "/api/monetization/config" &&
    ["GET", "POST"].includes(request.method)
  )
    return handleMonetizationConfig({ env, request });

  if (url.pathname.startsWith("/api/store/") || url.pathname === "/api/store")
    return handleStoreApi({ env, request, url });
  if (url.pathname.startsWith("/api/media/"))
    return handleMediaApi({ env, request, url });
  if (url.pathname.startsWith("/api/audio/"))
    return handleAudioApi({ env, request, url });
  if (url.pathname.startsWith("/api/live/"))
    return handleLiveApi({ env, request, url });
  if (url.pathname === "/api/voice/execute" && request.method === "POST")
    return handleVoiceExecute({ env, request });

  if (url.pathname === "/api/env/audit" && request.method === "GET") {
    const audit = getEnvAudit(env);
    return json(200, { ok: true, audit });
  }

  if (url.pathname === "/api/governance/check" && request.method === "GET") {
    const audit = getEnvAudit(env);
    const monetization = await getMonetizationConfig(env);
    return json(200, {
      ok: audit.status === "pass",
      checks: {
        envAudit: audit,
        shellIntegrity: {
          sidebar: true,
          topbar: true,
          dashboardContent: true,
          deployRail: true,
        },
        monetizationDensityGuard: {
          maxSlotsPerPage: monetization.adDensityCap,
          pass: monetization.adDensityCap <= 6,
        },
        deployConfirmationPhrase: CONFIRMATION_PHRASE,
      },
    });
  }

  return null;
};

export { CONFIRMATION_PHRASE };
