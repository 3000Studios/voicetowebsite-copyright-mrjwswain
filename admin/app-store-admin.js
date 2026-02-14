const appsTableBody = document.getElementById("app-table-body");
const appsCount = document.getElementById("apps-count");
const appsSales = document.getElementById("apps-sales");
const appsReset = document.getElementById("apps-reset");
const kpiApps = document.getElementById("kpi-apps");

const readonly = Boolean(document.getElementById("app-form")?.dataset?.mode === "readonly");

const loadCatalog = async () => {
  try {
    const res = await fetch("/api/catalog", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load catalog");
    return await res.json();
  } catch (err) {
    console.warn("Catalog loader:", err);
    return { products: [], apps: [] };
  }
};

const fmtMoney = (n) => {
  const v = Number(n);
  if (!Number.isFinite(v)) return "—";
  return `$${v.toFixed(2)}`;
};

const updateKpis = (apps = []) => {
  if (appsCount) appsCount.textContent = `${apps.length} apps`;
  if (kpiApps) kpiApps.textContent = String(apps.length);
  // Real sales are surfaced on /admin/analytics.html via /api/sales/stats. Do not invent numbers here.
  if (appsSales) appsSales.textContent = "Sales: —";
};

const esc = (s) => String(s || "").replace(/</g, "&lt;");

const renderApps = async () => {
  if (!appsTableBody) return;

  const catalog = await loadCatalog();
  const apps = Array.isArray(catalog?.apps) ? catalog.apps : [];
  appsTableBody.innerHTML = "";

  if (!apps.length) {
    appsTableBody.innerHTML = `<tr><td colspan="5" class="muted">No apps in catalog.</td></tr>`;
    updateKpis([]);
    return;
  }

  apps.forEach((app) => {
    const tr = document.createElement("tr");
    const previewUrl = String(app.previewUrl || "").trim();
    const downloadUrl = String(app.downloadUrl || "").trim();

    tr.innerHTML = `
      <td>
        <div class="app-title">${esc(app.title)}</div>
        <div class="muted small">${esc(app.desc || "")}</div>
      </td>
      <td>${esc(app.label || "--")}</td>
      <td>${fmtMoney(app.price)} USD</td>
      <td class="small muted">${esc(app.id)}</td>
      <td>
        ${previewUrl ? `<a class="ghost small" href="${esc(previewUrl)}" target="_blank" rel="noopener">Preview</a>` : ""}
        ${downloadUrl ? `<a class="ghost small" href="${esc(downloadUrl)}" download>Download</a>` : ""}
      </td>
    `;
    appsTableBody.appendChild(tr);
  });

  updateKpis(apps);
};

const disableForm = () => {
  const form = document.getElementById("app-form");
  if (!form) return;
  const submit = form.querySelector('button[type="submit"]');
  if (submit) submit.setAttribute("disabled", "true");
};

appsReset?.addEventListener("click", async () => {
  await renderApps();
});

if (readonly) disableForm();
renderApps();
