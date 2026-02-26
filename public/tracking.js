(function initRevenueTracking() {
  const ENDPOINT = "/api/analytics/event";
  const SESSION_KEY = "vtw-revenue-session";

  const getSessionId = () => {
    try {
      const existing = sessionStorage.getItem(SESSION_KEY);
      if (existing) return existing;
      const next = crypto?.randomUUID?.() || `vtw-${Date.now()}`;
      sessionStorage.setItem(SESSION_KEY, next);
      return next;
    } catch (_) {
      return `vtw-${Date.now()}`;
    }
  };

  const normalizeEventName = (value) =>
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_:-]/g, "_")
      .slice(0, 64);

  const sendPayload = (payload) => {
    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      try {
        const blob = new Blob([body], { type: "application/json" });
        if (navigator.sendBeacon(ENDPOINT, blob)) return;
      } catch (_) {
        // Fall back to fetch.
      }
    }
    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      credentials: "same-origin",
      keepalive: true,
    }).catch(() => {});
  };

  window.vtwTrackEvent = (eventName, properties = {}, value) => {
    const normalized = normalizeEventName(eventName);
    if (!normalized) return;
    const payload = {
      eventName: normalized,
      page: window.location.pathname,
      properties: {
        sessionId: getSessionId(),
        ...properties,
      },
      ts: new Date().toISOString(),
    };
    if (typeof value === "number" && Number.isFinite(value)) {
      payload.value = value;
    }
    sendPayload(payload);
  };

  window.vtwTrackEvent("page_view", {
    title: document.title,
    referrer: document.referrer || "direct",
  });
})();
