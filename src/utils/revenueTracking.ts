type RevenueProperties = Record<string, unknown>;

const ENDPOINT = "/api/analytics/event";

const isTestEnvironment = () => import.meta.env.MODE === "test";

const resolveEndpoint = () => {
  if (isTestEnvironment()) return null;
  if (/^https?:\/\//i.test(ENDPOINT)) return ENDPOINT;
  if (typeof window === "undefined" || !window.location?.origin) return null;

  try {
    return new URL(ENDPOINT, window.location.origin).toString();
  } catch (_) {
    return null;
  }
};

const normalizeEventName = (value: string) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_:-]/g, "_")
    .slice(0, 64);

const postEvent = (payload: Record<string, unknown>) => {
  const endpoint = resolveEndpoint();
  if (!endpoint) return;
  const body = JSON.stringify(payload);
  if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
    try {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon(endpoint, blob)) return;
    } catch (_) {
      // Fall through to fetch-based transport.
    }
  }

  fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    credentials: "same-origin",
    keepalive: true,
  }).catch((error) => {
    // Log error for debugging but don't throw to avoid breaking app functionality
    console.warn("Failed to track revenue event:", error);
  });
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
      typeof window !== "undefined"
        ? window.location.pathname
        : "/unknown-page",
    ts: new Date().toISOString(),
  };

  if (typeof value === "number" && Number.isFinite(value)) {
    payload.value = value;
  }

  postEvent(payload);
};
