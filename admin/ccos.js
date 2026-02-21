const CONFIRMATION_PHRASE = "hell yeah ship it";
const DEFAULT_ROUTE = "/admin/mission";

const state = {
  route: DEFAULT_ROUTE,
  currentFilePath: "",
  lastRepoStatus: null,
  lastVoicePlan: null,
  lastPreviews: [],
  analytics: null,
  deployInProgress: false,
};

const byId = (id) => document.getElementById(id);

const escapeHtml = (value) =>
  String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const requestJson = async (url, init = {}) => {
  const isFormData =
    typeof FormData !== "undefined" && init.body instanceof FormData;
  const baseHeaders = isFormData ? {} : { "Content-Type": "application/json" };
  const res = await fetch(url, {
    cache: "no-store",
    ...init,
    headers: {
      ...baseHeaders,
      ...(init.headers || {}),
    },
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload?.error || `Request failed (${res.status})`);
  }
  return payload;
};

const refreshDeployLogs = async () => {
  const statusEl = byId("deploy-rail-status");
  const logsEl = byId("deploy-rail-logs");
  try {
    const payload = await requestJson("/api/deploy/logs", { method: "GET" });
    statusEl.textContent = payload.locked ? "Deploy in progress" : "Idle";
    logsEl.textContent = (payload.logs || [])
      .slice(-40)
      .map((entry) => `[${entry.ts}] [${entry.level}] ${entry.message}`)
      .join("\n");
    if (!logsEl.textContent) logsEl.textContent = "No deployment logs yet.";
  } catch (error) {
    statusEl.textContent = "Unavailable";
    logsEl.textContent = `Deploy logs unavailable: ${error.message}`;
  }
};

const deployFromTopbar = async () => {
  const phrase = String(byId("deploy-confirm")?.value || "");
  if (phrase !== CONFIRMATION_PHRASE) return;
  if (state.deployInProgress) return; // Prevent concurrent deploys

  const button = byId("deploy-button");
  const statusEl = byId("deploy-rail-status");
  state.deployInProgress = true;
  button.disabled = true;
  statusEl.textContent = "Running deploy pipeline...";
  try {
    await requestJson("/api/deploy/run", {
      method: "POST",
      body: JSON.stringify({
        confirmation: phrase,
        summary: { route: state.route },
      }),
    });
    await refreshDeployLogs();
  } catch (error) {
    statusEl.textContent = `Deploy failed: ${error.message}`;
  } finally {
    state.deployInProgress = false;
    syncDeployPhraseGate();
  }
};

const syncDeployPhraseGate = () => {
  const phrase = String(byId("deploy-confirm")?.value || "");
  const matches = phrase === CONFIRMATION_PHRASE;
  const button = byId("deploy-button");
  button.disabled = !matches || state.deployInProgress;
};

const normalizeRoute = (path) => {
  let next = String(path || "").trim();
  if (!next) return DEFAULT_ROUTE;
  if (next === "/admin" || next === "/admin/") return DEFAULT_ROUTE;
  if (!next.startsWith("/admin/")) return DEFAULT_ROUTE;
  return ROUTES[next] ? next : DEFAULT_ROUTE;
};

const navigate = (path, replace = false) => {
  const target = normalizeRoute(path);
  if (target !== new URL(document.URL).pathname) {
    if (replace) history.replaceState({}, "", target);
    else history.pushState({}, "", target);
  }
  loadRoute(target);
};

const renderContextPanels = (analytics, changedSummary = []) => {
  const metrics = analytics || state.analytics || {};
  const traffic = metrics?.traffic?.sessions24h ?? 0;
  const revenue = metrics?.conversions?.revenue ?? 0;
  const stageCount = metrics?.governance?.stagedChanges ?? 0;
  return `
    <div class="ccos-grid">
      <article class="ccos-card ccos-col-6">
        <h4>Contextual Analytics</h4>
        <table class="ccos-data">
          <tr><th>Traffic (24h)</th><td>${escapeHtml(traffic)}</td></tr>
          <tr><th>Revenue</th><td>$${escapeHtml(Number(revenue).toFixed(2))}</td></tr>
          <tr><th>Staged Changes</th><td>${escapeHtml(stageCount)}</td></tr>
        </table>
      </article>
      <article class="ccos-card ccos-col-6">
        <h4>What Changed</h4>
        <ul>
          ${changedSummary.length ? changedSummary.map((line) => `<li>${escapeHtml(line)}</li>`).join("") : "<li>No changes in this module yet.</li>"}
        </ul>
      </article>
    </div>
  `;
};

const refreshRepoStatus = async () => {
  const status = await requestJson("/api/repo/status", { method: "GET" });
  state.lastRepoStatus = status;
  return status;
};

const loadAnalytics = async () => {
  try {
    const analytics = await requestJson("/api/analytics/metrics", {
      method: "GET",
    });
    state.analytics = analytics;
    return analytics;
  } catch (_) {
    return state.analytics;
  }
};

const renderMission = async () => {
  const [governance, deployLogs, deployMeter, analytics] = await Promise.all([
    requestJson("/api/governance/check", { method: "GET" }).catch(() => null),
    requestJson("/api/deploy/logs", { method: "GET" }).catch(() => null),
    requestJson("/api/deploy/meter", { method: "GET" }).catch(() => null),
    loadAnalytics(),
  ]);
  const envStatus = governance?.checks?.envAudit?.status || "fail";
  const envMissing = governance?.checks?.envAudit?.missing || [];
  const lock = deployLogs?.locked ? "Deploy In Progress" : "Idle";
  const auditPass = governance?.ok ? "PASS" : "FAIL";
  const remaining = deployMeter?.metering?.remaining;
  return `
    <section class="ccos-kpi">
      <article class="ccos-card"><h4>Worker Health</h4><p><span class="ccos-pill ok">ONLINE</span></p></article>
      <article class="ccos-card"><h4>Governance</h4><p><span class="ccos-pill ${auditPass === "PASS" ? "ok" : "err"}">${auditPass}</span></p></article>
      <article class="ccos-card"><h4>Deploy State</h4><p>${escapeHtml(lock)}</p></article>
      <article class="ccos-card"><h4>Deploy Remaining</h4><p>${remaining == null ? "n/a" : escapeHtml(remaining)}</p></article>
      <article class="ccos-card"><h4>Env Audit</h4><p><span class="ccos-pill ${envStatus === "pass" ? "ok" : "err"}">${escapeHtml(envStatus.toUpperCase())}</span></p></article>
    </section>
    <section class="ccos-grid">
      <article class="ccos-card ccos-col-8">
        <h3>System Health</h3>
        <table class="ccos-data">
          <tr><th>Durable Objects</th><td>DeployControllerDO, LiveRoomDO, AuditLogDO</td></tr>
          <tr><th>Monetization Density Guard</th><td>${escapeHtml(governance?.checks?.monetizationDensityGuard?.maxSlotsPerPage ?? "n/a")}</td></tr>
          <tr><th>Missing Environment Vars</th><td>${envMissing.length ? escapeHtml(envMissing.join(", ")) : "None"}</td></tr>
          <tr><th>Confirmation Phrase</th><td>${escapeHtml(governance?.checks?.deployConfirmationPhrase || CONFIRMATION_PHRASE)}</td></tr>
        </table>
      </article>
      <article class="ccos-card ccos-col-4">
        <h3>Recent Deploy Log</h3>
        <pre>${escapeHtml(
          (deployLogs?.logs || [])
            .slice(-8)
            .map((l) => `${l.level}: ${l.message}`)
            .join("\n") || "No logs yet."
        )}</pre>
      </article>
    </section>
    ${renderContextPanels(analytics, ["Mission health data refreshed", `Governance status: ${auditPass}`])}
  `;
};

const renderCC = async () => {
  const [tree, repoStatus, analytics] = await Promise.all([
    requestJson("/api/fs/tree", { method: "GET" }).catch(() => ({ files: [] })),
    refreshRepoStatus().catch(() => ({ staged: { files: [] } })),
    loadAnalytics(),
  ]);
  const staged = repoStatus?.staged?.files || [];
  return `
    <section class="ccos-grid">
      <article class="ccos-card ccos-col-4">
        <h3>File Tree</h3>
        <div id="cc-file-list">${
          tree.files
            .slice(0, 400)
            .map(
              (path) =>
                `<button type="button" class="ccos-button cc-file-open" data-path="${escapeHtml(path)}">${escapeHtml(path)}</button>`
            )
            .join("<br/>") || "No files."
        }</div>
      </article>
      <article class="ccos-card ccos-col-8">
        <h3>Editor</h3>
        <div class="ccos-grid">
          <div class="ccos-col-12">
            <label>Path</label>
            <input id="cc-file-path" class="ccos-input" value="${escapeHtml(state.currentFilePath)}" />
          </div>
          <div class="ccos-col-12">
            <label>Content</label>
            <textarea id="cc-file-content" class="ccos-textarea" rows="16"></textarea>
          </div>
          <div class="ccos-col-12">
            <button type="button" class="ccos-button" id="cc-file-save">Save To Shadow</button>
            <button type="button" class="ccos-button" id="cc-file-delete">Stage Delete</button>
            <button type="button" class="ccos-button" id="cc-build-preview">Build Preview</button>
            <button type="button" class="ccos-button" id="cc-run-verify">Run Verify</button>
            <button type="button" class="ccos-button" id="cc-prepare-deploy">Prepare Deploy</button>
          </div>
        </div>
        <div id="cc-action-status"></div>
      </article>
      <article class="ccos-card ccos-col-12">
        <h3>Preview</h3>
        <iframe title="Command Center Preview" id="cc-preview-frame" class="ccos-preview-frame"></iframe>
      </article>
      <article class="ccos-card ccos-col-12">
        <h3>Staged Diff Summary</h3>
        <table class="ccos-data">
          <thead><tr><th>Path</th><th>State</th><th>Risk</th></tr></thead>
          <tbody>${staged.map((row) => `<tr><td>${escapeHtml(row.path)}</td><td>${row.deleted ? "delete" : "update"}</td><td>${escapeHtml(row.risk)}</td></tr>`).join("") || "<tr><td colspan='3'>No staged changes.</td></tr>"}</tbody>
        </table>
      </article>
    </section>
    ${renderContextPanels(
      analytics,
      staged.map((s) => `${s.deleted ? "Delete" : "Update"} ${s.path}`)
    )}
  `;
};

const renderVCC = async () => {
  const analytics = await loadAnalytics();
  const plan = state.lastVoicePlan;
  const routes = plan?.executionPlan?.previewRoutes || [];
  return `
    <section class="ccos-grid">
      <article class="ccos-card ccos-col-6">
        <h3>Voice Command Center</h3>
        <textarea id="vcc-command" class="ccos-textarea" rows="4" placeholder="Describe the change you want to execute..."></textarea>
        <div style="margin-top:.5rem">
          <button type="button" class="ccos-button" id="vcc-mic">Voice Input</button>
          <button type="button" class="ccos-button" id="vcc-run">Compile Plan</button>
        </div>
        <h4>Execution Plan JSON</h4>
        <pre id="vcc-plan-json">${escapeHtml(JSON.stringify(plan || {}, null, 2) || "{}")}</pre>
      </article>
      <article class="ccos-card ccos-col-6">
        <h3>Execution Impact</h3>
        <table class="ccos-data" id="vcc-impact-table">
          <tr><th>Targets (routes)</th><td>${escapeHtml((plan?.executionPlan?.targets?.routes || []).join(", ") || "n/a")}</td></tr>
          <tr><th>Targets (files)</th><td>${escapeHtml((plan?.executionPlan?.targets?.files || []).join(", ") || "n/a")}</td></tr>
          <tr><th>Monetization Impact</th><td>${escapeHtml(JSON.stringify(plan?.monetizationImpact || {}))}</td></tr>
          <tr><th>Analytics Impact</th><td>${escapeHtml(JSON.stringify(plan?.analyticsImpact || {}))}</td></tr>
          <tr><th>Validation Checklist</th><td>${escapeHtml((plan?.executionPlan?.validations || []).join(", ") || "n/a")}</td></tr>
        </table>
      </article>
      <article class="ccos-card ccos-col-12">
        <h3>Route Previews</h3>
        <div id="vcc-preview-tabs">${routes.map((route) => `<button type="button" class="ccos-button vcc-preview-open" data-route="${escapeHtml(route)}">${escapeHtml(route)}</button>`).join(" ") || "Compile a command to generate previews."}</div>
        <iframe title="Voice Preview" id="vcc-preview-frame" class="ccos-preview-frame"></iframe>
      </article>
    </section>
    ${renderContextPanels(analytics, plan?.whatChanged || [])}
  `;
};

const renderMonetization = async () => {
  const [configPayload, analytics] = await Promise.all([
    requestJson("/api/monetization/config", { method: "GET" }).catch(() => ({
      config: {},
    })),
    loadAnalytics(),
  ]);
  const config = configPayload.config || {};
  return `
    <section class="ccos-grid">
      <article class="ccos-card ccos-col-6">
        <h3>Monetization Config</h3>
        <label>Ad Density Cap</label>
        <input id="monetization-density" class="ccos-input" type="number" min="0" max="6" value="${escapeHtml(config.adDensityCap ?? 3)}" />
        <label>Revenue Layout Variant</label>
        <select id="monetization-variant" class="ccos-select">
          <option value="cta-dominant"${config.ctaVariant === "cta-dominant" ? " selected" : ""}>CTA Dominant</option>
          <option value="donation-heavy"${config.ctaVariant === "donation-heavy" ? " selected" : ""}>Donation Heavy</option>
          <option value="sponsor-focus"${config.ctaVariant === "sponsor-focus" ? " selected" : ""}>Sponsor Focus</option>
        </select>
        <div style="margin-top:.5rem">
          <label><input type="checkbox" id="monetization-donation"${config.donationEnabled ? " checked" : ""}/> Donation Enabled</label>
          <label><input type="checkbox" id="monetization-superchat"${config.superchatEnabled ? " checked" : ""}/> Superchat Enabled</label>
          <label><input type="checkbox" id="monetization-affiliate"${config.affiliateEnabled ? " checked" : ""}/> Affiliate Enabled</label>
        </div>
        <div style="margin-top:.75rem">
          <button type="button" class="ccos-button" id="monetization-save">Save Monetization Config</button>
        </div>
        <div id="monetization-status"></div>
      </article>
      <article class="ccos-card ccos-col-6">
        <h3>Monetization Zones Preview</h3>
        <iframe id="monetization-preview" title="Monetization preview" class="ccos-preview-frame" src="/preview/?shadow=1&zones=1&ts=${Date.now()}"></iframe>
      </article>
    </section>
    ${renderContextPanels(analytics, ["Monetization controls loaded"])}
  `;
};

const renderAnalytics = async () => {
  const metrics = await loadAnalytics();
  return `
    <section class="ccos-grid">
      <article class="ccos-card ccos-col-12">
        <h3>Analytics Overview</h3>
        <table class="ccos-data">
          <tr><th>Traffic Sessions (24h)</th><td>${escapeHtml(metrics?.traffic?.sessions24h ?? 0)}</td></tr>
          <tr><th>Unique Users (24h)</th><td>${escapeHtml(metrics?.traffic?.uniqueUsers24h ?? 0)}</td></tr>
          <tr><th>Conversions</th><td>${escapeHtml(metrics?.conversions?.orders ?? 0)}</td></tr>
          <tr><th>Revenue</th><td>$${escapeHtml(Number(metrics?.conversions?.revenue || 0).toFixed(2))}</td></tr>
          <tr><th>Store Product Count</th><td>${escapeHtml(metrics?.store?.productCount ?? 0)}</td></tr>
          <tr><th>Livestream Viewer Count</th><td>${escapeHtml(metrics?.livestream?.viewerCount ?? 0)}</td></tr>
        </table>
      </article>
    </section>
    ${renderContextPanels(metrics, ["Analytics refreshed"])}
  `;
};

const renderLive = async () => {
  const [live, analytics] = await Promise.all([
    requestJson("/api/live/state", { method: "GET" }).catch(() => ({
      state: {},
    })),
    loadAnalytics(),
  ]);
  const s = live.state || {};
  return `
    <section class="ccos-grid">
      <article class="ccos-card ccos-col-6">
        <h3>Admin Live Stream Manager</h3>
        <label>Stream State</label>
        <select id="live-stream-state" class="ccos-select">
          <option value="idle"${s.streamState === "idle" ? " selected" : ""}>Idle</option>
          <option value="live"${s.streamState === "live" ? " selected" : ""}>Live</option>
          <option value="paused"${s.streamState === "paused" ? " selected" : ""}>Paused</option>
        </select>
        <label>Bitrate (kbps)</label>
        <input id="live-bitrate" class="ccos-input" type="number" value="${escapeHtml(s.bitrateKbps ?? 0)}" />
        <div style="margin-top:.5rem">
          <label><input type="checkbox" id="live-superchat"${s.superchatEnabled ? " checked" : ""}/> Superchat Enabled</label>
          <label><input type="checkbox" id="live-actions"${s.actionsEnabled ? " checked" : ""}/> Viewer Actions Enabled</label>
        </div>
        <button type="button" class="ccos-button" id="live-save" style="margin-top:.75rem">Save Live State</button>
        <div id="live-status"></div>
      </article>
      <article class="ccos-card ccos-col-6">
        <h3>Live Metrics</h3>
        <table class="ccos-data">
          <tr><th>WebSocket State</th><td>${escapeHtml(s.websocketState || "unknown")}</td></tr>
          <tr><th>Viewer Count</th><td>${escapeHtml(analytics?.livestream?.viewerCount ?? 0)}</td></tr>
          <tr><th>Chat Rate</th><td>${escapeHtml(analytics?.livestream?.chatRatePerMinute ?? 0)}</td></tr>
          <tr><th>Revenue / Stream</th><td>${escapeHtml(analytics?.livestream?.revenuePerStream ?? 0)}</td></tr>
        </table>
      </article>
    </section>
    ${renderContextPanels(analytics, ["Live control state loaded"])}
  `;
};

const renderStore = async () => {
  const [productsPayload, analytics] = await Promise.all([
    requestJson("/api/store/products", { method: "GET" }).catch(() => ({
      products: [],
    })),
    loadAnalytics(),
  ]);
  const products = productsPayload.products || [];
  return `
    <section class="ccos-grid">
      <article class="ccos-card ccos-col-8">
        <h3>Store Products</h3>
        <table class="ccos-data">
          <thead><tr><th>ID</th><th>Title</th><th>Price</th><th>Featured Live</th></tr></thead>
          <tbody>${products.map((p) => `<tr><td>${escapeHtml(p.id)}</td><td>${escapeHtml(p.title)}</td><td>$${escapeHtml(Number(p.price || 0).toFixed(2))}</td><td>${p.featured_in_live ? "Yes" : "No"}</td></tr>`).join("") || "<tr><td colspan='4'>No products yet.</td></tr>"}</tbody>
        </table>
      </article>
      <article class="ccos-card ccos-col-4">
        <h3>Create Product</h3>
        <input id="store-id" class="ccos-input" placeholder="product-id" />
        <input id="store-title" class="ccos-input" placeholder="Title" />
        <input id="store-price" class="ccos-input" type="number" step="0.01" placeholder="Price" />
        <textarea id="store-description" class="ccos-textarea" rows="4" placeholder="Description"></textarea>
        <label><input type="checkbox" id="store-featured" /> Featured In Live</label>
        <button type="button" class="ccos-button" id="store-save">Save Product</button>
        <div id="store-status"></div>
      </article>
      <article class="ccos-card ccos-col-12">
        <h3>Product Preview</h3>
        <div class="ccos-grid">${products.map((p) => `<article class="ccos-card ccos-col-4"><strong>${escapeHtml(p.title)}</strong><p>${escapeHtml(p.description || "")}</p><p>$${escapeHtml(Number(p.price || 0).toFixed(2))}</p></article>`).join("") || "No products to preview."}</div>
      </article>
    </section>
    ${renderContextPanels(
      analytics,
      products.map((p) => `Loaded product ${p.id}`)
    )}
  `;
};

const renderMedia = async () => {
  const [media, analytics] = await Promise.all([
    requestJson("/api/media/list", { method: "GET" }).catch(() => ({
      assets: [],
    })),
    loadAnalytics(),
  ]);
  const assets = media.assets || [];
  return `
    <section class="ccos-grid">
      <article class="ccos-card ccos-col-6">
        <h3>Upload Licensed Media</h3>
        <form id="media-upload-form">
          <input type="file" id="media-file" class="ccos-input" required />
          <input id="media-source" class="ccos-input" placeholder="Source URL or owner" required />
          <input id="media-license" class="ccos-input" placeholder="License type" required />
          <input id="media-attribution" class="ccos-input" placeholder="Attribution" required />
          <input id="media-usage" class="ccos-input" placeholder="Usage restrictions" />
          <input id="media-tags" class="ccos-input" placeholder="Tags (comma separated)" />
          <button type="submit" class="ccos-button">Upload Media</button>
        </form>
        <div id="media-status"></div>
      </article>
      <article class="ccos-card ccos-col-6">
        <h3>Media Vault</h3>
        <table class="ccos-data">
          <thead><tr><th>File</th><th>License</th><th>Attribution</th></tr></thead>
          <tbody>${assets.map((a) => `<tr><td>${escapeHtml(a.filename)}</td><td>${escapeHtml(a.license)}</td><td>${escapeHtml(a.attribution)}</td></tr>`).join("") || "<tr><td colspan='3'>No assets.</td></tr>"}</tbody>
        </table>
      </article>
    </section>
    ${renderContextPanels(
      analytics,
      assets.map((a) => `Loaded asset ${a.filename}`)
    )}
  `;
};

const renderAudio = async () => {
  const [audio, analytics] = await Promise.all([
    requestJson("/api/audio/list", { method: "GET" }).catch(() => ({
      assets: [],
    })),
    loadAnalytics(),
  ]);
  const assets = audio.assets || [];
  return `
    <section class="ccos-grid">
      <article class="ccos-card ccos-col-6">
        <h3>Upload Licensed Audio</h3>
        <form id="audio-upload-form">
          <input type="file" id="audio-file" class="ccos-input" required />
          <input id="audio-source" class="ccos-input" placeholder="Source URL or owner" required />
          <input id="audio-license" class="ccos-input" placeholder="License type" required />
          <input id="audio-attribution" class="ccos-input" placeholder="Attribution" required />
          <input id="audio-bpm" class="ccos-input" placeholder="BPM" type="number" />
          <input id="audio-tags" class="ccos-input" placeholder="Tags (comma separated)" />
          <button type="submit" class="ccos-button">Upload Audio</button>
        </form>
        <div id="audio-status"></div>
      </article>
      <article class="ccos-card ccos-col-6">
        <h3>Audio Vault + Soundboard Mapping</h3>
        <table class="ccos-data">
          <thead><tr><th>File</th><th>BPM</th><th>License</th></tr></thead>
          <tbody>${assets.map((a) => `<tr><td>${escapeHtml(a.filename)}</td><td>${escapeHtml(a.bpm || 0)}</td><td>${escapeHtml(a.license)}</td></tr>`).join("") || "<tr><td colspan='3'>No audio assets.</td></tr>"}</tbody>
        </table>
      </article>
    </section>
    ${renderContextPanels(
      analytics,
      assets.map((a) => `Loaded audio ${a.filename}`)
    )}
  `;
};

const renderSettings = async () => {
  const [envAudit, governance, analytics] = await Promise.all([
    requestJson("/api/env/audit", { method: "GET" }).catch(() => ({
      audit: { status: "fail", missing: [] },
    })),
    requestJson("/api/governance/check", { method: "GET" }).catch(() => ({
      checks: {},
    })),
    loadAnalytics(),
  ]);
  return `
    <section class="ccos-grid">
      <article class="ccos-card ccos-col-6">
        <h3>Environment Audit</h3>
        <p>Status: <span class="ccos-pill ${envAudit.audit.status === "pass" ? "ok" : "err"}">${escapeHtml(String(envAudit.audit.status || "fail").toUpperCase())}</span></p>
        <p>Missing: ${escapeHtml((envAudit.audit.missing || []).join(", ") || "None")}</p>
      </article>
      <article class="ccos-card ccos-col-6">
        <h3>Deploy Policy</h3>
        <table class="ccos-data">
          <tr><th>Confirmation Phrase</th><td>${escapeHtml(governance?.checks?.deployConfirmationPhrase || CONFIRMATION_PHRASE)}</td></tr>
          <tr><th>Queueing</th><td>Disabled (single lock only)</td></tr>
          <tr><th>Rollback Ref</th><td>Available in Deploy Rail logs</td></tr>
        </table>
      </article>
    </section>
    ${renderContextPanels(analytics, ["Settings and policy loaded"])}
  `;
};

const ROUTES = {
  "/admin/mission": {
    title: "Mission Control",
    render: renderMission,
    navRoute: "/admin/mission",
    moduleKey: "mission",
  },
  "/admin/dashboard": {
    title: "Mission Control",
    render: renderMission,
    navRoute: "/admin/mission",
    moduleKey: "mission",
  },
  "/admin/cc": {
    title: "Command Center",
    render: renderCC,
    navRoute: "/admin/cc",
    moduleKey: "cc",
  },
  "/admin/deploy": {
    title: "Command Center",
    render: renderCC,
    navRoute: "/admin/cc",
    moduleKey: "cc",
  },
  "/admin/vcc": {
    title: "Voice Command Center",
    render: renderVCC,
    navRoute: "/admin/vcc",
    moduleKey: "vcc",
  },
  "/admin/preview": {
    title: "Voice Command Center",
    render: renderVCC,
    navRoute: "/admin/vcc",
    moduleKey: "vcc",
  },
  "/admin/monetization": {
    title: "Monetization Control",
    render: renderMonetization,
    navRoute: "/admin/monetization",
    moduleKey: "monetization",
  },
  "/admin/analytics": {
    title: "Analytics",
    render: renderAnalytics,
    navRoute: "/admin/analytics",
    moduleKey: "analytics",
  },
  "/admin/live": {
    title: "Live Stream Manager",
    render: renderLive,
    navRoute: "/admin/live",
    moduleKey: "live",
  },
  "/admin/store": {
    title: "Store Manager",
    render: renderStore,
    navRoute: "/admin/store",
    moduleKey: "store",
  },
  "/admin/media": {
    title: "Media Library",
    render: renderMedia,
    navRoute: "/admin/media",
    moduleKey: "media",
  },
  "/admin/audio": {
    title: "Audio Library",
    render: renderAudio,
    navRoute: "/admin/audio",
    moduleKey: "audio",
  },
  "/admin/settings": {
    title: "Settings",
    render: renderSettings,
    navRoute: "/admin/settings",
    moduleKey: "settings",
  },
  "/admin/governance": {
    title: "Settings",
    render: renderSettings,
    navRoute: "/admin/settings",
    moduleKey: "settings",
  },
};

const wireCommonNav = () => {
  // Remove existing event listeners to prevent memory leaks
  document.querySelectorAll("[data-route]").forEach((el) => {
    const newEl = el.cloneNode(true);
    el.parentNode.replaceChild(newEl, el);
  });

  // Add new event listeners
  document.querySelectorAll("[data-route]").forEach((el) => {
    el.addEventListener("click", () => navigate(el.getAttribute("data-route")));
  });
};

const wireCCEvents = () => {
  const statusEl = byId("cc-action-status");

  document.querySelectorAll(".cc-file-open").forEach((button) => {
    button.addEventListener("click", async () => {
      const path = String(button.getAttribute("data-path") || "");
      if (!path) return;
      const payload = await requestJson(
        `/api/fs/read?path=${encodeURIComponent(path)}`,
        {
          method: "GET",
        }
      );
      state.currentFilePath = payload.path;
      byId("cc-file-path").value = payload.path;
      byId("cc-file-content").value = payload.content || "";
      statusEl.textContent = `Loaded ${payload.path} from ${payload.source}.`;
    });
  });

  byId("cc-file-save")?.addEventListener("click", async () => {
    const path = String(byId("cc-file-path")?.value || "").trim();
    const content = String(byId("cc-file-content")?.value || "");
    const payload = await requestJson("/api/fs/write", {
      method: "POST",
      body: JSON.stringify({ path, content }),
    });
    statusEl.textContent =
      payload.whatChanged?.join(" | ") || "Saved to shadow.";
  });

  byId("cc-file-delete")?.addEventListener("click", async () => {
    const path = String(byId("cc-file-path")?.value || "").trim();
    const payload = await requestJson("/api/fs/delete", {
      method: "POST",
      body: JSON.stringify({ path }),
    });
    statusEl.textContent = payload.whatChanged?.join(" | ") || "Delete staged.";
  });

  byId("cc-build-preview")?.addEventListener("click", async () => {
    const path = String(byId("cc-file-path")?.value || "").trim();
    const payload = await requestJson("/api/preview/build", {
      method: "POST",
      body: JSON.stringify({ files: [path], showMonetizationZones: true }),
    });
    const first = payload.previews?.[0];
    if (first) {
      byId("cc-preview-frame").src = `${first.url}&ts=${Date.now()}`;
      statusEl.textContent = `Previewing ${first.route}`;
    }
  });

  byId("cc-run-verify")?.addEventListener("click", async () => {
    const governance = await requestJson("/api/governance/check", {
      method: "GET",
    });
    statusEl.textContent = governance.ok
      ? "Governance and env checks passed."
      : "Governance failed, deploy blocked.";
  });

  byId("cc-prepare-deploy")?.addEventListener("click", async () => {
    const repo = await refreshRepoStatus();
    statusEl.textContent = `Prepared deploy summary: ${repo.staged?.total || 0} staged files.`;
  });
};

const wireVCCEvents = () => {
  const micButton = byId("vcc-mic");
  const commandInput = byId("vcc-command");
  const runButton = byId("vcc-run");
  const previewFrame = byId("vcc-preview-frame");
  const planPre = byId("vcc-plan-json");

  runButton?.addEventListener("click", async () => {
    const command = String(commandInput?.value || "").trim();
    if (!command) return;
    const payload = await requestJson("/api/voice/execute", {
      method: "POST",
      body: JSON.stringify({ command }),
    });
    state.lastVoicePlan = payload;
    planPre.textContent = JSON.stringify(payload, null, 2);
    const previews = await requestJson("/api/preview/build", {
      method: "POST",
      body: JSON.stringify({
        routes: payload.executionPlan?.previewRoutes || [],
      }),
    });
    state.lastPreviews = previews.previews || [];
    if (state.lastPreviews[0]) {
      previewFrame.src = `${state.lastPreviews[0].url}&ts=${Date.now()}`;
    }
  });

  micButton?.addEventListener("click", () => {
    const Recognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      micButton.textContent = "Voice Unavailable";
      return;
    }
    const recognition = new Recognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const text = event.results?.[0]?.[0]?.transcript || "";
      commandInput.value = text;
    };
    recognition.start();
  });

  document.querySelectorAll(".vcc-preview-open").forEach((button) => {
    button.addEventListener("click", async () => {
      const route = String(button.getAttribute("data-route") || "");
      if (!route) return;
      const previews = await requestJson("/api/preview/build", {
        method: "POST",
        body: JSON.stringify({ routes: [route], showMonetizationZones: true }),
      });
      const first = previews.previews?.[0];
      if (first) previewFrame.src = `${first.url}&ts=${Date.now()}`;
    });
  });
};

const wireMonetizationEvents = () => {
  const status = byId("monetization-status");
  byId("monetization-save")?.addEventListener("click", async () => {
    const payload = await requestJson("/api/monetization/config", {
      method: "POST",
      body: JSON.stringify({
        adDensityCap: Number(byId("monetization-density").value || 0),
        ctaVariant: String(
          byId("monetization-variant").value || "cta-dominant"
        ),
        donationEnabled: byId("monetization-donation").checked,
        superchatEnabled: byId("monetization-superchat").checked,
        affiliateEnabled: byId("monetization-affiliate").checked,
      }),
    });
    status.textContent = `Saved. Density cap: ${payload.config.adDensityCap}`;
    byId("monetization-preview").src =
      `/preview/?shadow=1&zones=1&ts=${Date.now()}`;
  });
};

const wireLiveEvents = () => {
  byId("live-save")?.addEventListener("click", async () => {
    const payload = await requestJson("/api/live/state", {
      method: "POST",
      body: JSON.stringify({
        streamState: byId("live-stream-state").value,
        bitrateKbps: Number(byId("live-bitrate").value || 0),
        superchatEnabled: byId("live-superchat").checked,
        actionsEnabled: byId("live-actions").checked,
        websocketState: "ready",
      }),
    });
    byId("live-status").textContent =
      `Saved live state: ${payload.state.streamState}`;
  });
};

const wireStoreEvents = () => {
  byId("store-save")?.addEventListener("click", async () => {
    const payload = await requestJson("/api/store/products", {
      method: "POST",
      body: JSON.stringify({
        id: byId("store-id").value,
        title: byId("store-title").value,
        price: Number(byId("store-price").value || 0),
        description: byId("store-description").value,
        featuredInLive: byId("store-featured").checked,
      }),
    });
    byId("store-status").textContent =
      `Saved product ${payload.id}. Reloading...`;
    await loadRoute(state.route);
  });
};

const wireUploadForm = (kind) => {
  const form = byId(`${kind}-upload-form`);
  const status = byId(`${kind}-status`);
  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const fd = new FormData();
    fd.set("file", byId(`${kind}-file`).files?.[0] || "");
    fd.set("source", byId(`${kind}-source`).value || "");
    fd.set("license", byId(`${kind}-license`).value || "");
    fd.set("attribution", byId(`${kind}-attribution`).value || "");
    fd.set("tags", byId(`${kind}-tags`).value || "");
    if (kind === "media") {
      fd.set("usageRestrictions", byId("media-usage").value || "");
    } else {
      fd.set("bpm", byId("audio-bpm").value || "0");
    }
    try {
      await requestJson(`/api/${kind}/upload`, {
        method: "POST",
        headers: {},
        body: fd,
      });
      status.textContent = `${kind} upload successful. Reloading...`;
      await loadRoute(state.route);
    } catch (error) {
      status.textContent = `${kind} upload failed: ${error.message}`;
    }
  });
};

const wireRouteHandlers = () => {
  const moduleKey = ROUTES[state.route]?.moduleKey || "";
  if (moduleKey === "cc") wireCCEvents();
  if (moduleKey === "vcc") wireVCCEvents();
  if (moduleKey === "monetization") wireMonetizationEvents();
  if (moduleKey === "live") wireLiveEvents();
  if (moduleKey === "store") wireStoreEvents();
  if (moduleKey === "media") wireUploadForm("media");
  if (moduleKey === "audio") wireUploadForm("audio");
};

const loadRoute = async (routePath) => {
  const route = normalizeRoute(routePath);
  state.route = route;
  const module = ROUTES[route];
  byId("ccos-title").textContent = module.title;
  const activeRoute = module.navRoute || route;
  document.querySelectorAll(".ccos-nav-item").forEach((button) => {
    button.classList.toggle(
      "is-active",
      button.getAttribute("data-route") === activeRoute
    );
  });
  const container = byId("dashboard-content");
  container.innerHTML = `<article class="ccos-card"><p>Loading ${escapeHtml(module.title)}...</p></article>`;
  try {
    container.innerHTML = await module.render();
    wireRouteHandlers();
  } catch (error) {
    container.innerHTML = `<article class="ccos-card"><h3>Module Error</h3><pre>${escapeHtml(error.message || String(error))}</pre></article>`;
  }
};

const init = async () => {
  wireCommonNav();
  byId("deploy-confirm")?.addEventListener("input", syncDeployPhraseGate);
  byId("deploy-button")?.addEventListener("click", deployFromTopbar);
  byId("refresh-deploy-logs")?.addEventListener("click", refreshDeployLogs);
  window.addEventListener("popstate", () =>
    loadRoute(new URL(document.URL).pathname)
  );
  navigate(new URL(document.URL).pathname, true);
  await refreshDeployLogs();
  setInterval(refreshDeployLogs, 10_000);
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
