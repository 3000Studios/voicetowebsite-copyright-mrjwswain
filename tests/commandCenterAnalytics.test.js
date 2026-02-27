import { describe, expect, it } from "vitest";
import { handleCommandCenterRequest } from "../functions/commandCenterApi.js";

const makeMockD1 = () => ({
  prepare(sql) {
    const q = String(sql || "");
    return {
      async run() {
        return { success: true };
      },
      async first() {
        if (q.includes("FROM cc_store_products")) return { count: 3 };
        if (q.includes("FROM orders") && q.includes("datetime('now','-24 hours')"))
          return { count: 4, total: 280 };
        if (q.includes("FROM orders") && q.includes("datetime('now','-7 days')"))
          return { count: 15, total: 910 };
        if (
          q.includes("FROM orders") &&
          q.includes("COUNT(*) AS count") &&
          !q.includes("datetime('now'")
        )
          return { count: 20, total: 1260 };
        if (q.includes("FROM sessions")) return { sessions: 1000, uniques: 730 };
        if (q.includes("FROM execute_events") && q.includes("COUNT(*) AS count"))
          return { count: 36 };
        if (q.includes("FROM cc_media_assets")) return { count: 12 };
        if (q.includes("FROM cc_audio_assets")) return { count: 7 };
        if (q.includes("FROM audit_events")) return { count: 41 };
        return {};
      },
      async all() {
        if (q.includes("GROUP BY substr(ts, 1, 10)")) {
          return {
            results: [
              { day: "2026-02-21", revenue: 120 },
              { day: "2026-02-22", revenue: 160 },
              { day: "2026-02-23", revenue: 110 },
              { day: "2026-02-24", revenue: 140 },
              { day: "2026-02-25", revenue: 130 },
              { day: "2026-02-26", revenue: 125 },
              { day: "2026-02-27", revenue: 125 },
            ],
          };
        }
        if (
          q.includes("FROM execute_events") &&
          q.includes("SELECT status, response_json")
        ) {
          return {
            results: [
              {
                status: 200,
                response_json: JSON.stringify({
                  action: { command: "run split test for pricing", page: "/pricing" },
                  result: { previewRoutes: ["/pricing", "/"] },
                }),
              },
              {
                status: 200,
                response_json: JSON.stringify({
                  action: { command: "optimize home hero", path: "/" },
                  result: { impactedRoutes: ["/"] },
                }),
              },
            ],
          };
        }
        return { results: [] };
      },
    };
  },
});

describe("command center analytics metrics", () => {
  it("returns computed metrics and scientific metadata", async () => {
    const request = new Request("https://example.com/api/analytics/metrics", {
      method: "GET",
    });
    const response = await handleCommandCenterRequest({
      request,
      env: { D1: makeMockD1() },
      url: new URL(request.url),
      assets: { fetch: async () => new Response("ok") },
    });

    expect(response).toBeTruthy();
    const body = await response.json();

    expect(body.ok).toBe(true);
    expect(body.traffic.sessions24h).toBe(1000);
    expect(body.store.productCount).toBe(3);
    expect(body.store.aov).toBe(63);
    expect(body.store.conversionRate).toBe(0.4);
    expect(body.store.rpm).toBe(280);
    expect(body.conversions.runRateMonthly).toBeGreaterThan(0);
    expect(body.scientific.confidenceScore).toBeGreaterThan(0);
    expect(body.scientific.formulas.conversionRate).toContain("orders_24h");
    expect(Array.isArray(body.perRoute)).toBe(true);
    expect(body.perRoute[0].route).toBe("/");
  });
});
