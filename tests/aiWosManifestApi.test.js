import { describe, expect, it } from "vitest";
import worker from "../worker.js";

class MemoryKv {
  constructor() {
    this.store = new Map();
  }

  async get(key) {
    return this.store.get(key) || null;
  }

  async put(key, value) {
    this.store.set(key, value);
  }
}

const env = {
  CONTROL_PASSWORD: "pw",
  ADMIN_ACCESS_CODE: "code",
  ADMIN_COOKIE_SECRET: "test-admin-cookie-secret",
  ORCH_TOKEN: "orch-secret",
  KV: new MemoryKv(),
  NODE_ENV: "test",
};

const extractCookie = (setCookieHeader) =>
  String(setCookieHeader || "").split(";")[0];

describe("ai-wos manifest api", () => {
  it("rejects unauthenticated manifest requests", async () => {
    const response = await worker.fetch(
      new Request("https://example.com/api/admin/ai-wos/manifest"),
      env,
      {}
    );
    expect(response.status).toBe(401);
  });

  it("returns manifest data for authenticated admin sessions", async () => {
    const loginRes = await worker.fetch(
      new Request("https://example.com/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: "pw" }),
      }),
      env,
      {}
    );
    const cookie = extractCookie(loginRes.headers.get("Set-Cookie"));

    const response = await worker.fetch(
      new Request("https://example.com/api/admin/ai-wos/manifest", {
        headers: { Cookie: cookie },
      }),
      env,
      {}
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.product.shortName).toBe("AI-WOS");
    expect(Array.isArray(body.sections)).toBe(true);
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.summary.totalItems).toBeGreaterThan(10);
    expect(
      body.items.some(
        (item) => item.id === "module-command-router" && item.status === "live"
      )
    ).toBe(true);
    expect(
      body.items.some(
        (item) => item.id === "theme-neon" && item.status === "planned"
      )
    ).toBe(true);
  });

  it("allows orchestrator-token callers to inspect the manifest", async () => {
    const response = await worker.fetch(
      new Request("https://example.com/api/ai-wos/manifest", {
        headers: { "x-orch-token": "orch-secret" },
      }),
      env,
      {}
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.product.commandEndpoint).toBe("/api/execute");
    expect(
      body.items.some(
        (item) =>
          item.id === "security-orchestrator-token" && item.status === "live"
      )
    ).toBe(true);
  });
});
