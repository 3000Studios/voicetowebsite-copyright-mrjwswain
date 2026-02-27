const CONFIRMATION_PHRASE = "hell yeah ship it";
const DEFAULT_ROUTE = "/admin/mission";

const state = {
  route: DEFAULT_ROUTE,
  currentFilePath: "",
  lastRepoStatus: null,
  lastVoicePlan: null,
  lastPreviews: [],
  lastVoiceExecution: null,
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

const formatNumber = (value) => {
  const num = Number(value || 0);
  if (!Number.isFinite(num)) return "0";
  return num.toLocaleString();
};

const formatBytes = (value) => {
  const num = Number(value || 0);
  if (!Number.isFinite(num) || num <= 0) return "0 B";
  if (num < 1024) return `${num} B`;
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
  if (num < 1024 * 1024 * 1024) return `${(num / (1024 * 1024)).toFixed(1)} MB`;
  return `${(num / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

const makeIdempotencyKey = (prefix = "op") => {
  const stamp = new Date()
    .toISOString()
    .replace(/[-:.TZ]/g, "")
    .slice(0, 14);
  return `${prefix}-${stamp}-${crypto.randomUUID().slice(0, 8)}`;
};

const withCacheBust = (url) => {
  const value = String(url || "").trim();
  if (!value) return "";
  return value.includes("?")
    ? `${value}&ts=${Date.now()}`
    : `${value}?ts=${Date.now()}`;
};

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

const uniqueStrings = (values = []) => {
  const out = [];
  const seen = new Set();
  for (const value of values) {
    const text = String(value || "").trim();
    if (!text || seen.has(text)) continue;
    seen.add(text);
    out.push(text);
  }
  return out;
};

const buildPreviewBundle = async ({
  routes = [],
  files = [],
  showMonetizationZones = true,
} = {}) => {
  const normalizedRoutes = uniqueStrings(
    routes.map((route) => normalizePreviewRoute(route)).filter(Boolean)
  );
  const normalizedFiles = uniqueStrings(files);
  const payload = await requestJson("/api/preview/build", {
    method: "POST",
    body: JSON.stringify({
      routes: normalizedRoutes,
      files: normalizedFiles,
      showMonetizationZones,
    }),
  });
  return payload;
};

const populatePreviewFrame = (frame, bundle) => {
  state.lastPreviews = bundle?.previews || [];
  const first = state.lastPreviews[0];
  if (first && frame) {
    frame.src = withCacheBust(first.url);
  }
  return first || null;
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

const loadCloudflareAnalytics = async () => {
  const [overview, detailed, realtime] = await Promise.all([
    requestJson("/api/analytics/overview", { method: "GET" }).catch(
      (error) => ({ error: error.message })
    ),
    requestJson("/api/analytics/detailed?since=-86400", {
      method: "GET",
    }).catch((error) => ({ error: error.message })),
    requestJson("/api/analytics/realtime", { method: "GET" }).catch(
      (error) => ({
        error: error.message,
      })
    ),
  ]);
  return { overview, detailed, realtime };
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
  const execution = state.lastVoiceExecution;
  const conversions = analytics?.conversions || {};
  const store = analytics?.store || {};
  const scientific = analytics?.scientific || {};
  const runRateDaily = Number(conversions?.runRateDaily || 0);
  const runRateMonthly = Number(conversions?.runRateMonthly || 0);
  const runRateYearly = Number(conversions?.runRateYearly || 0);
  return `
    <section class="ccos-grid">
      <article class="ccos-card ccos-col-6">
        <h3>Voice Command Center</h3>
        <textarea id="vcc-command" class="ccos-textarea" rows="4" placeholder="Describe the change you want to execute... (Use 'ops:' prefix for backend operations)"></textarea>
        <div style="margin-top:.5rem">
          <button type="button" class="ccos-button" id="vcc-mic">Voice Input</button>
          <button type="button" class="ccos-button" id="vcc-run">Compile Plan</button>
          <button type="button" class="ccos-button" id="vcc-build-preview">Build Preview</button>
          <button type="button" class="ccos-button" id="vcc-auto">Execute Auto</button>
        </div>
        <div style="margin-top:.5rem;display:flex;gap:.5rem;align-items:center;flex-wrap:wrap">
          <input id="vcc-deploy-confirm" class="ccos-input" style="max-width:280px" placeholder="hell yeah ship it" />
          <button type="button" class="ccos-button" id="vcc-deploy">Deploy Live</button>
        </div>
        <div id="vcc-status" style="margin-top:.5rem"></div>
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
        <h3>Profit Center Metrics</h3>
        <table class="ccos-data">
          <tr><th>Daily Revenue Estimate</th><td>$${escapeHtml(runRateDaily.toFixed(2))}</td></tr>
          <tr><th>Monthly Revenue Estimate</th><td>$${escapeHtml(runRateMonthly.toFixed(2))}</td></tr>
          <tr><th>Yearly Revenue Estimate</th><td>$${escapeHtml(runRateYearly.toFixed(2))}</td></tr>
          <tr><th>Store Conversion Rate</th><td>${escapeHtml(Number(store?.conversionRate || 0).toFixed(2))}%</td></tr>
          <tr><th>Average Order Value</th><td>$${escapeHtml(Number(store?.aov || 0).toFixed(2))}</td></tr>
          <tr><th>Effective RPM</th><td>$${escapeHtml(Number(store?.rpm || 0).toFixed(2))}</td></tr>
          <tr><th>Confidence Score</th><td>${escapeHtml(Number(scientific?.confidenceScore || 0).toFixed(1))}/100</td></tr>
        </table>
      </article>
      <article class="ccos-card ccos-col-12">
        <h3>Scientific Method</h3>
        <pre>${escapeHtml(
          [
            scientific?.method || "Method unavailable.",
            "",
            `conversion: ${scientific?.formulas?.conversionRate || "orders_24h / sessions_24h * 100"}`,
            `AOV: ${scientific?.formulas?.averageOrderValue || "revenue / orders"}`,
            `RPM: ${scientific?.formulas?.effectiveRpm || "revenue_24h / (sessions_24h / 1000)"}`,
            `daily projection: ${scientific?.formulas?.projectedDailyRevenue || "0.55*revenue_24h + 0.45*(revenue_7d/7)"}`,
          ].join("\n")
        )}</pre>
      </article>
      <article class="ccos-card ccos-col-12">
        <h3>Route Previews</h3>
        <div id="vcc-preview-tabs">${routes.map((route) => `<button type="button" class="ccos-button vcc-preview-open" data-route="${escapeHtml(route)}">${escapeHtml(route)}</button>`).join(" ") || "Compile a command to generate previews."}</div>
        <iframe title="Voice Preview" id="vcc-preview-frame" class="ccos-preview-frame"></iframe>
      </article>
      <article class="ccos-card ccos-col-12">
        <h3>Execution Result</h3>
        <pre id="vcc-exec-json">${escapeHtml(
          JSON.stringify(execution || {}, null, 2) || "{}"
        )}</pre>
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
        <iframe id="monetization-preview" title="Monetization preview" class="ccos-preview-frame" src="/preview/index?shadow=1&zones=1&ts=${Date.now()}"></iframe>
      </article>
    </section>
    ${renderContextPanels(analytics, ["Monetization controls loaded"])}
  `;
};

const renderAnalytics = async () => {
  const [metrics, cf] = await Promise.all([
    loadAnalytics(),
    loadCloudflareAnalytics(),
  ]);
  const overview = cf?.overview?.result || {};
  const overviewTotals = overview?.totals || {};
  const detailed = cf?.detailed?.result || {};
  const detailedMeta = detailed?.metadata || {};
  const realtime = cf?.realtime?.result || {};
  const realtimeTotals = realtime?.dashboard?.totals || {};
  const colos = detailed?.colocation || [];
  const coloRows = Array.isArray(colos) ? colos.slice(0, 8) : [];
  const cfErrors = [
    cf?.overview?.error,
    cf?.detailed?.error,
    cf?.realtime?.error,
  ]
    .filter(Boolean)
    .join(" | ");
  return `
    <section class="ccos-grid">
      <article class="ccos-card ccos-col-12">
        <h3>Cloudflare Analytics Overview</h3>
        <table class="ccos-data">
          <tr><th>Requests</th><td>${escapeHtml(formatNumber(overviewTotals?.requests?.all))}</td></tr>
          <tr><th>Unique Visitors</th><td>${escapeHtml(formatNumber(overviewTotals?.uniques?.all))}</td></tr>
          <tr><th>Page Views</th><td>${escapeHtml(formatNumber(overviewTotals?.pageviews?.all))}</td></tr>
          <tr><th>Bandwidth</th><td>${escapeHtml(formatBytes(overviewTotals?.bandwidth?.all))}</td></tr>
          <tr><th>Threats</th><td>${escapeHtml(formatNumber(overviewTotals?.threats?.all))}</td></tr>
          <tr><th>Window</th><td>${escapeHtml(String(detailedMeta.since || "-86400"))} → ${escapeHtml(String(detailedMeta.until || "now"))}</td></tr>
        </table>
        <div style="margin-top:.75rem;display:flex;gap:.5rem;flex-wrap:wrap">
          <button type="button" class="ccos-button" id="analytics-refresh">Refresh Cloudflare Data</button>
          <button type="button" class="ccos-button" id="analytics-refresh-realtime">Refresh Realtime</button>
        </div>
        <div id="analytics-status" style="margin-top:.5rem">${
          cfErrors
            ? `<span class="ccos-pill err">${escapeHtml(cfErrors)}</span>`
            : '<span class="ccos-pill ok">Cloudflare analytics live</span>'
        }</div>
      </article>
      <article class="ccos-card ccos-col-6">
        <h3>Realtime (Last Hour)</h3>
        <table class="ccos-data">
          <tr><th>Requests</th><td>${escapeHtml(formatNumber(realtimeTotals?.requests?.all))}</td></tr>
          <tr><th>Unique Visitors</th><td>${escapeHtml(formatNumber(realtimeTotals?.uniques?.all))}</td></tr>
          <tr><th>Bandwidth</th><td>${escapeHtml(formatBytes(realtimeTotals?.bandwidth?.all))}</td></tr>
          <tr><th>Threats</th><td>${escapeHtml(formatNumber(realtimeTotals?.threats?.all))}</td></tr>
        </table>
      </article>
      <article class="ccos-card ccos-col-6">
        <h3>Top Colos (Detailed)</h3>
        <table class="ccos-data">
          <thead><tr><th>Colo</th><th>Requests</th><th>Bandwidth</th></tr></thead>
          <tbody>${
            coloRows.length
              ? coloRows
                  .map(
                    (row) =>
                      `<tr><td>${escapeHtml(row?.colo || row?.coloName || "n/a")}</td><td>${escapeHtml(formatNumber(row?.sum?.requests || row?.requests || 0))}</td><td>${escapeHtml(formatBytes(row?.sum?.bytes || row?.bandwidth || 0))}</td></tr>`
                  )
                  .join("")
              : "<tr><td colspan='3'>No colocation data available.</td></tr>"
          }</tbody>
        </table>
      </article>
      <article class="ccos-card ccos-col-12">
        <h3>Command Center Metrics</h3>
        <table class="ccos-data">
          <tr><th>Sessions (24h)</th><td>${escapeHtml(
            formatNumber(metrics?.traffic?.sessions24h ?? 0)
          )}</td></tr>
          <tr><th>Unique Users (24h)</th><td>${escapeHtml(
            formatNumber(metrics?.traffic?.uniqueUsers24h ?? 0)
          )}</td></tr>
          <tr><th>Orders (24h)</th><td>${escapeHtml(
            formatNumber(metrics?.conversions?.orders24h ?? 0)
          )}</td></tr>
          <tr><th>Revenue (24h)</th><td>$${escapeHtml(
            Number(metrics?.conversions?.revenue24h || 0).toFixed(2)
          )}</td></tr>
          <tr><th>Run Rate (Monthly)</th><td>$${escapeHtml(
            Number(metrics?.conversions?.runRateMonthly || 0).toFixed(2)
          )}</td></tr>
          <tr><th>Store Conversion Rate</th><td>${escapeHtml(
            Number(metrics?.store?.conversionRate || 0).toFixed(2)
          )}%</td></tr>
          <tr><th>Average Order Value</th><td>$${escapeHtml(
            Number(metrics?.store?.aov || 0).toFixed(2)
          )}</td></tr>
          <tr><th>Effective RPM</th><td>$${escapeHtml(
            Number(metrics?.store?.rpm || 0).toFixed(2)
          )}</td></tr>
          <tr><th>Confidence Score</th><td>${escapeHtml(
            Number(metrics?.scientific?.confidenceScore || 0).toFixed(1)
          )}/100</td></tr>
          <tr><th>Store Product Count</th><td>${escapeHtml(metrics?.store?.productCount ?? 0)}</td></tr>
          <tr><th>Conversions</th><td>${escapeHtml(metrics?.conversions?.orders ?? 0)}</td></tr>
          <tr><th>Revenue</th><td>$${escapeHtml(Number(metrics?.conversions?.revenue || 0).toFixed(2))}</td></tr>
          <tr><th>Audit Events</th><td>${escapeHtml(metrics?.governance?.auditEvents ?? 0)}</td></tr>
        </table>
        <p style="margin-top:.65rem;color:rgba(226,232,240,.78);font-size:.85rem;">
          Formula basis: conversion = orders_24h / sessions_24h, AOV =
          revenue/orders, RPM = revenue_24h / (sessions_24h / 1000), monthly
          run-rate = weighted daily projection × 30.4375.
        </p>
      </article>
    </section>
    ${renderContextPanels(metrics, [
      cfErrors
        ? "Cloudflare analytics returned errors"
        : "Cloudflare analytics refreshed",
      "Command Center metrics refreshed",
    ])}
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
  const previewFrame = byId("cc-preview-frame");

  const buildAndRenderPreview = async ({ routes = [], files = [] } = {}) => {
    const payload = await buildPreviewBundle({ routes, files });
    const first = populatePreviewFrame(previewFrame, payload);
    return { payload, first };
  };

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
    const preview = await buildAndRenderPreview({ files: [path] }).catch(
      () => null
    );
    const baseStatus = payload.whatChanged?.join(" | ") || "Saved to shadow.";
    statusEl.textContent = preview?.first
      ? `${baseStatus} Preview: ${preview.first.route}`
      : baseStatus;
  });

  byId("cc-file-delete")?.addEventListener("click", async () => {
    const path = String(byId("cc-file-path")?.value || "").trim();
    const payload = await requestJson("/api/fs/delete", {
      method: "POST",
      body: JSON.stringify({ path }),
    });
    const preview = await buildAndRenderPreview({ files: [path] }).catch(
      () => null
    );
    const baseStatus = payload.whatChanged?.join(" | ") || "Delete staged.";
    statusEl.textContent = preview?.first
      ? `${baseStatus} Preview: ${preview.first.route}`
      : baseStatus;
  });

  byId("cc-build-preview")?.addEventListener("click", async () => {
    const path = String(byId("cc-file-path")?.value || "").trim();
    const stagedPaths = (state.lastRepoStatus?.staged?.files || [])
      .map((entry) => entry?.path)
      .filter(Boolean);
    const { first } = await buildAndRenderPreview({
      files: path ? [path] : stagedPaths,
      routes: path ? [] : ["/"],
    });
    statusEl.textContent = first
      ? `Previewing ${first.route}`
      : "No preview route resolved.";
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
  const buildPreviewButton = byId("vcc-build-preview");
  const autoButton = byId("vcc-auto");
  const deployButton = byId("vcc-deploy");
  const deployPhraseInput = byId("vcc-deploy-confirm");
  const previewFrame = byId("vcc-preview-frame");
  const planPre = byId("vcc-plan-json");
  const execPre = byId("vcc-exec-json");
  const statusEl = byId("vcc-status");
  const impactTable = byId("vcc-impact-table");

  if (commandInput && state.lastVoicePlan?.command) {
    commandInput.value = state.lastVoicePlan.command;
  }

  const setStatus = (message, isError = false) => {
    if (!statusEl) return;
    statusEl.textContent = String(message || "");
    statusEl.className = isError ? "ccos-pill err" : "ccos-pill ok";
  };

  const updatePlanJson = (payload) => {
    if (planPre) {
      planPre.textContent = JSON.stringify(payload || {}, null, 2);
    }
  };

  const updateExecJson = (payload) => {
    if (execPre) {
      execPre.textContent = JSON.stringify(payload || {}, null, 2);
    }
  };

  const updateImpactTable = (payload) => {
    if (!impactTable) return;
    const plan = payload?.executionPlan || {};
    impactTable.innerHTML = `
      <tr><th>Targets (routes)</th><td>${escapeHtml((plan?.targets?.routes || []).join(", ") || "n/a")}</td></tr>
      <tr><th>Targets (files)</th><td>${escapeHtml((plan?.targets?.files || []).join(", ") || "n/a")}</td></tr>
      <tr><th>Monetization Impact</th><td>${escapeHtml(JSON.stringify(payload?.monetizationImpact || {}))}</td></tr>
      <tr><th>Analytics Impact</th><td>${escapeHtml(JSON.stringify(payload?.analyticsImpact || {}))}</td></tr>
      <tr><th>Validation Checklist</th><td>${escapeHtml((plan?.validations || []).join(", ") || "n/a")}</td></tr>
    `;
  };

  const collectPreviewInputs = (payload) => {
    const executionPlan = payload?.executionPlan || {};
    const result = payload?.result || {};
    const routeCandidates = [
      ...(executionPlan.previewRoutes || []),
      ...(result.previewRoutes || []),
      ...(result.impactedRoutes || []),
      ...(result.preview?.previewRoutes || []),
      result.route,
    ];
    const fileCandidates = [
      ...(executionPlan?.targets?.files || []),
      ...(result?.targets?.files || []),
      ...(result?.changed || []).map((entry) => entry?.path),
    ];

    // Check if index.html was modified - if so, prioritize home page
    const hasIndexModification = fileCandidates.some((file) =>
      String(file).toLowerCase().includes("index.html")
    );

    const routes = uniqueStrings(
      routeCandidates
        .map((route) => normalizePreviewRoute(route))
        .filter(Boolean)
    );
    const files = uniqueStrings(fileCandidates);

    // If index.html was modified and home page isn't already prioritized, add it first
    if (hasIndexModification && routes.length > 0 && routes[0] !== "/") {
      routes.unshift("/");
    }

    return {
      routes: routes.length ? routes : ["/"],
      files,
    };
  };

  const buildAndRenderPreview = async (payload) => {
    const inputs = collectPreviewInputs(payload || {});
    const previews = await buildPreviewBundle({
      routes: inputs.routes,
      files: inputs.files,
      showMonetizationZones: true,
    });
    const first = populatePreviewFrame(previewFrame, previews);
    updatePreviewTabs(previews.previewRoutes || inputs.routes);
    return { previews, first };
  };

  const attachPreviewButtons = () => {
    document.querySelectorAll(".vcc-preview-open").forEach((button) => {
      button.addEventListener("click", async () => {
        const route = String(button.getAttribute("data-route") || "");
        if (!route) return;
        try {
          const previews = await buildPreviewBundle({
            routes: [route],
            showMonetizationZones: true,
          });
          const first = populatePreviewFrame(previewFrame, previews);
          if (first) setStatus(`Preview loaded for ${first.route}`);
        } catch (error) {
          setStatus(`Preview failed: ${error.message}`, true);
        }
      });
    });
  };

  const updatePreviewTabs = (routes = []) => {
    const tabs = byId("vcc-preview-tabs");
    if (!tabs) return;
    if (!routes.length) {
      tabs.textContent = "Compile a command to generate previews.";
      return;
    }
    tabs.innerHTML = routes
      .map(
        (route) =>
          `<button type="button" class="ccos-button vcc-preview-open" data-route="${escapeHtml(route)}">${escapeHtml(route)}</button>`
      )
      .join(" ");
    attachPreviewButtons();
  };

  runButton?.addEventListener("click", async () => {
    const command = String(commandInput?.value || "").trim();
    if (!command) {
      setStatus("Enter a voice command first.", true);
      return;
    }
    try {
      const payload = await requestJson("/api/voice/execute", {
        method: "POST",
        body: JSON.stringify({ command }),
      });
      state.lastVoicePlan = payload;
      updatePlanJson(payload);
      updateImpactTable(payload);
      const preview = await buildAndRenderPreview(payload).catch(() => null);
      setStatus(
        preview?.first
          ? `Execution plan compiled. Preview loaded for ${preview.first.route}.`
          : "Execution plan compiled."
      );
    } catch (error) {
      setStatus(`Compile failed: ${error.message}`, true);
    }
  });

  buildPreviewButton?.addEventListener("click", async () => {
    if (!state.lastVoicePlan && !state.lastVoiceExecution) {
      setStatus("Compile plan first to build previews.", true);
      return;
    }
    try {
      const preview = await buildAndRenderPreview(
        state.lastVoicePlan || state.lastVoiceExecution
      );
      setStatus(
        `Built ${(preview.previews?.previews || []).length} preview route(s).`
      );
    } catch (error) {
      setStatus(`Preview build failed: ${error.message}`, true);
    }
  });

  autoButton?.addEventListener("click", async () => {
    const command = String(commandInput?.value || "").trim();
    if (!command) {
      setStatus("Enter a command before Execute Auto.", true);
      return;
    }
    autoButton.disabled = true;
    try {
      const payload = await requestJson("/api/execute", {
        method: "POST",
        body: JSON.stringify({
          action: "auto",
          idempotencyKey: makeIdempotencyKey("vcc-auto"),
          command,
          target: "site",
          actor: "admin-vcc",
        }),
      });
      state.lastVoiceExecution = payload;
      updateExecJson(payload);
      const eventType = payload?.eventType || "applied";
      const preview = await buildAndRenderPreview(
        state.lastVoicePlan || payload
      ).catch(() => null);
      setStatus(
        preview?.first
          ? `Auto execution complete (${eventType}). Preview loaded for ${preview.first.route}.`
          : `Auto execution complete (${eventType}).`
      );
      await refreshDeployLogs();
    } catch (error) {
      setStatus(`Auto execution failed: ${error.message}`, true);
    } finally {
      autoButton.disabled = false;
    }
  });

  deployButton?.addEventListener("click", async () => {
    const phrase = String(deployPhraseInput?.value || "").trim();
    if (phrase !== CONFIRMATION_PHRASE) {
      setStatus(`Phrase must be exactly "${CONFIRMATION_PHRASE}".`, true);
      return;
    }
    deployButton.disabled = true;
    try {
      const payload = await requestJson("/api/deploy/run", {
        method: "POST",
        body: JSON.stringify({
          confirmation: phrase,
          summary: {
            route: state.route,
            source: "voice-command-center",
            plan:
              state.lastVoicePlan?.executionPlan ||
              state.lastVoiceExecution?.result ||
              {},
          },
        }),
      });
      state.lastVoiceExecution = payload;
      updateExecJson(payload);
      setStatus("Deployment triggered.");
      await refreshDeployLogs();
    } catch (error) {
      setStatus(`Deploy failed: ${error.message}`, true);
    } finally {
      deployButton.disabled = false;
    }
  });

  let recognition = null;
  let isListening = false;
  micButton?.addEventListener("click", () => {
    if (!recognition) {
      const Recognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!Recognition) {
        micButton.textContent = "Voice Unavailable";
        setStatus("Speech recognition is not supported in this browser.", true);
        return;
      }
      recognition = new Recognition();
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onresult = (event) => {
        const text = event.results?.[0]?.[0]?.transcript || "";
        if (commandInput) commandInput.value = text;
      };
      recognition.onend = () => {
        isListening = false;
        micButton.textContent = "Voice Input";
        setStatus("Voice capture stopped.");
      };
      recognition.onerror = (event) => {
        isListening = false;
        micButton.textContent = "Voice Input";
        const reason =
          event?.error === "not-allowed"
            ? "Microphone permission denied."
            : "Voice capture failed.";
        setStatus(reason, true);
      };
    }
    if (isListening) {
      recognition.stop();
      return;
    }
    try {
      recognition.start();
      isListening = true;
      micButton.textContent = "Stop Voice";
      setStatus("Listening...");
    } catch (error) {
      setStatus(`Mic start failed: ${error.message}`, true);
    }
  });

  attachPreviewButtons();
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
      `/preview/index?shadow=1&zones=1&ts=${Date.now()}`;
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

const wireAnalyticsEvents = () => {
  const statusEl = byId("analytics-status");
  byId("analytics-refresh")?.addEventListener("click", async () => {
    try {
      if (statusEl) {
        statusEl.innerHTML = '<span class="ccos-pill">Refreshing…</span>';
      }
      await loadRoute("/admin/analytics");
    } catch (error) {
      if (statusEl) {
        statusEl.innerHTML = `<span class="ccos-pill err">${escapeHtml(error.message)}</span>`;
      }
    }
  });
  byId("analytics-refresh-realtime")?.addEventListener("click", async () => {
    try {
      if (statusEl) {
        statusEl.innerHTML =
          '<span class="ccos-pill">Refreshing realtime…</span>';
      }
      await loadRoute("/admin/analytics");
    } catch (error) {
      if (statusEl) {
        statusEl.innerHTML = `<span class="ccos-pill err">${escapeHtml(error.message)}</span>`;
      }
    }
  });
};

const wireRouteHandlers = () => {
  const moduleKey = ROUTES[state.route]?.moduleKey || "";
  if (moduleKey === "cc") wireCCEvents();
  if (moduleKey === "vcc") wireVCCEvents();
  if (moduleKey === "monetization") wireMonetizationEvents();
  if (moduleKey === "analytics") wireAnalyticsEvents();
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
