import { describe, expect, it } from "vitest";
import worker from "../worker.js";

const createMockD1 = () => {
  const statements = [];
  return {
    statements,
    prepare(sql) {
      const entry = { sql, bindings: [] };
      statements.push(entry);
      return {
        bind(...args) {
          entry.bindings = args;
          return this;
        },
        async run() {
          return { success: true };
        },
        async all() {
          return { results: [] };
        },
        async first() {
          return null;
        },
      };
    },
  };
};

describe("Revenue analytics event ingestion", () => {
  it("accepts public analytics events and records them when D1 exists", async () => {
    const d1 = createMockD1();
    const env = { D1: d1, NODE_ENV: "test" };
    const res = await worker.fetch(
      new Request("https://example.com/api/analytics/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventName: "store_cta_clicked",
          page: "/",
          value: 249,
          properties: { source: "home_pricing_tier", plan: "growth" },
        }),
      }),
      env,
      {}
    );

    expect(res.status).toBe(200);
    const payload = await res.json();
    expect(payload.ok).toBe(true);
    expect(payload.event).toBe("store_cta_clicked");
    const inserted = d1.statements.find((s) =>
      s.sql.includes("INSERT INTO analytics_events")
    );
    expect(Boolean(inserted)).toBe(true);
  });

  it("rejects analytics event requests missing eventName", async () => {
    const env = { NODE_ENV: "test" };
    const res = await worker.fetch(
      new Request("https://example.com/api/analytics/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ properties: { source: "test" } }),
      }),
      env,
      {}
    );

    expect(res.status).toBe(400);
    const payload = await res.json();
    expect(String(payload.error || "").toLowerCase()).toContain(
      "eventname is required"
    );
  });
});
