type RevenueProperties = Record<string, unknown>;

const ENDPOINT = "/api/analytics/event";

const normalizeEventName = (value: string) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_:-]/g, "_")
    .slice(0, 64);

const postEvent = (payload: Record<string, unknown>) => {
  const body = JSON.stringify(payload);
  if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
    try {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon(ENDPOINT, blob)) return;
    } catch (_) {
      // Fall through to fetch-based transport.
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

export const trackRevenueEvent = (
  eventName: string,
  properties: RevenueProperties = {},
  value?: number
) => {
  const name = normalizeEventName(eventName);
  if (!name) return;

  const payload: Record<string, unknown> = {
    eventName: name,
    properties,
    page:
      typeof window !== "undefined" ? window.location.pathname : "/unknown-page",
    ts: new Date().toISOString(),
  };

  if (typeof value === "number" && Number.isFinite(value)) {
    payload.value = value;
  }

  postEvent(payload);
};

