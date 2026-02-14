const UNLOCK_KEY = "yt-admin-unlocked";
const UNLOCK_TS_KEY = "yt-admin-unlocked-ts";
const SESSION_TTL_MS = 1000 * 60 * 60 * 2;

const byId = (id) => document.getElementById(id);

const hasAdminCookie = () => {
  try {
    return document.cookie.split(";").some((part) => part.trim().startsWith("vtw_admin=1"));
  } catch (_) {
    return false;
  }
};

const isSessionFresh = () => {
  try {
    const ts = Number(sessionStorage.getItem(UNLOCK_TS_KEY) || 0);
    if (!ts) return false;
    return Date.now() - ts < SESSION_TTL_MS;
  } catch (_) {
    return false;
  }
};

const isUnlocked = () => {
  try {
    return sessionStorage.getItem("adminAccessValidated") === "true";
  } catch (_) {
    return false;
  }
};

const setChip = (el, text, tone) => {
  if (!el) return;
  el.textContent = text;
  el.classList.remove("ok", "warn", "alert");
  if (tone) el.classList.add(tone);
};

const fmtNumber = (n) => (typeof n === "number" ? n.toLocaleString() : "—");

const loadSnapshot = async () => {
  const authChip = byId("hub-auth");
  const configChip = byId("hub-config");
  const statusChip = byId("hub-snapshot-status");

  if (!isUnlocked()) {
    setChip(authChip, "Locked", "warn");
    setChip(configChip, "Config: —", null);
    setChip(statusChip, "Unlock required", "warn");
    return;
  }

  setChip(authChip, "Unlocked", "ok");
  setChip(statusChip, "Loading...", null);

  const productsEl = byId("hub-products");
  const missingEl = byId("hub-missing-buttons");
  const requestsEl = byId("hub-requests");
  const uniquesEl = byId("hub-uniques");
  const stripePubEl = byId("hub-stripe-pub");
  const stripeSecretEl = byId("hub-stripe-secret");
  const paypalEl = byId("hub-paypal");

  try {
    const [configRes, analyticsRes, productsRes] = await Promise.all([
      fetch("/api/config/status", { cache: "no-store" }),
      fetch("/api/analytics/overview", { cache: "no-store" }),
      fetch("/api/products", { cache: "no-store" }),
    ]);

    const [config, analytics, productsPayload] = await Promise.all([
      configRes.json().catch(() => ({})),
      analyticsRes.json().catch(() => ({})),
      productsRes.json().catch(() => ({})),
    ]);

    if (!configRes.ok || config?.error) throw new Error(config?.error || "Config unavailable");
    if (!analyticsRes.ok || analytics?.error) throw new Error(analytics?.error || "Analytics unavailable");
    if (!productsRes.ok || productsPayload?.error) throw new Error(productsPayload?.error || "Products unavailable");

    const totals = analytics?.result?.totals || {};
    requestsEl.textContent = fmtNumber(totals?.requests?.all);
    uniquesEl.textContent = fmtNumber(totals?.uniques?.all);

    const products = Array.isArray(productsPayload?.products) ? productsPayload.products : [];
    productsEl.textContent = fmtNumber(products.length);

    // Catalog does not guarantee checkout metadata; do not invent "missing" counts.
    // If a product explicitly declares any checkout field, we can validate; otherwise show "—".
    const hasAnyCheckoutMeta = products.some(
      (p) =>
        String(p?.stripeBuyButtonId || "").trim() ||
        String(p?.stripePriceId || "").trim() ||
        String(p?.stripePaymentLink || "").trim() ||
        String(p?.paypalPaymentLink || "").trim()
    );
    if (!hasAnyCheckoutMeta) {
      missingEl.textContent = "—";
    } else {
      const missingButtons = products.filter((p) => {
        if (!p) return false;
        const any =
          String(p?.stripeBuyButtonId || "").trim() ||
          String(p?.stripePriceId || "").trim() ||
          String(p?.stripePaymentLink || "").trim() ||
          String(p?.paypalPaymentLink || "").trim();
        return !any;
      });
      missingEl.textContent = fmtNumber(missingButtons.length);
    }

    stripePubEl.textContent = config.stripe_publishable ? "Connected" : "Missing";
    stripeSecretEl.textContent = config.stripe_secret ? "Connected" : "Missing";
    paypalEl.textContent = config.paypal_client_id ? "Connected" : "Missing";

    const paymentsReady = !!(config.stripe_publishable && config.stripe_secret) || !!config.paypal_client_id;
    setChip(
      configChip,
      paymentsReady ? "Config: payments ready" : "Config: missing payments",
      paymentsReady ? "ok" : "warn"
    );
    setChip(statusChip, "Live", "ok");
  } catch (err) {
    setChip(statusChip, err?.message || "Snapshot failed", "alert");
  }
};

const init = () => {
  const refreshBtn = byId("hub-refresh");
  refreshBtn?.addEventListener("click", () => loadSnapshot());

  // Load once, then keep updating while unlocked.
  loadSnapshot();
  window.setInterval(loadSnapshot, 60000);
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
