export function estimateRevenue({ strategy }) {
  // Deterministic stub (no live analytics). Keep shape stable for UI.
  // Replace with analytics-based model later.
  const s = String(strategy || "hybrid");
  if (s === "affiliate") return { daily: 10, monthly: 300, yearly: 3600 };
  if (s === "ads") return { daily: 5, monthly: 150, yearly: 1800 };
  if (s === "leadgen") return { daily: 25, monthly: 750, yearly: 9000 };
  if (s === "subscriptions") return { daily: 20, monthly: 600, yearly: 7200 };
  if (s === "digitalProducts") return { daily: 15, monthly: 450, yearly: 5400 };
  return { daily: 12, monthly: 360, yearly: 4320 };
}
