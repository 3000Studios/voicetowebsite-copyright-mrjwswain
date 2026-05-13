import { describe, it, expect, vi } from "vitest";
import { handlePublishRequest } from "../functions/siteGenerator.js";

vi.mock("../functions/adminAuth.js", () => ({
  isAdminRequest: async () => true,
}));

describe("Publish Performance Benchmark", () => {
  it("measures execution time of handlePublishRequest", async () => {
    const r2Latency = 100;
    const d1Latency = 50;
    const d1BatchLatency = 60;

    const mockEnv = {
      D1: {
        prepare: vi.fn().mockImplementation(() => {
          const stmt = {
            bind: vi.fn().mockImplementation(() => stmt),
            run: vi.fn().mockImplementation(async () => {
              await new Promise((r) => setTimeout(r, d1Latency));
              return { success: true };
            }),
            first: vi.fn().mockImplementation(async () => {
              await new Promise((r) => setTimeout(r, d1Latency));
              return {
                id: "test-site",
                html: "<html></html>",
                css: "body{}",
                layout_json: "{}",
              };
            }),
          };
          return stmt;
        }),
        batch: vi.fn().mockImplementation(async (stmts) => {
          await new Promise((r) => setTimeout(r, d1BatchLatency));
          return stmts.map(() => ({ success: true }));
        }),
      },
      R2: {
        put: vi.fn().mockImplementation(async () => {
          await new Promise((r) => setTimeout(r, r2Latency));
          return {};
        }),
      },
    };

    const mockRequest = {
      clone: () => ({
        json: async () => ({ siteId: "test-site" }),
      }),
      headers: {
        get: (name) => (name === "content-type" ? "application/json" : null),
      },
    };

    const start = Date.now();
    await handlePublishRequest({ request: mockRequest, env: mockEnv });
    const duration = Date.now() - start;

    console.log(`Publish duration: ${duration}ms`);

    expect(duration).toBeGreaterThan(0);
  });
});
