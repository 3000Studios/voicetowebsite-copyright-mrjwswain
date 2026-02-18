import { describe, it, expect } from "vitest";
import { BotHubDO } from "../src/durable_objects/BotHubDO.js";

const makeState = () => {
  const map = new Map();
  return {
    storage: {
      get: async (k) => map.get(k),
      put: async (k, v) => map.set(k, v),
      delete: async (k) => map.delete(k),
    },
    blockConcurrencyWhile: async (fn) => fn(),
  };
};

const jsonReq = (url, body) =>
  new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

describe("BotHubDO patch_apply", () => {
  it("enforces actor + idempotencyKey and returns cached result", async () => {
    const state = makeState();
    const env = {};
    const hub = new BotHubDO(state, env);

    const res400 = await hub.fetch(
      jsonReq("https://example.com/?action=patch_apply", {
        route: "/",
        ops: [{ op: "set", path: "theme/color", value: "red" }],
      })
    );
    expect(res400.status).toBe(400);

    const res1 = await hub.fetch(
      jsonReq("https://example.com/?action=patch_apply", {
        actor: "tester",
        idempotencyKey: "k1",
        route: "/",
        ops: [{ op: "set", path: "theme/color", value: "red" }],
      })
    );
    expect(res1.status).toBe(200);
    const body1 = await res1.json();
    expect(body1.success).toBe(true);
    expect(body1.overrides.theme.color).toBe("red");

    const res2 = await hub.fetch(
      jsonReq("https://example.com/?action=patch_apply", {
        actor: "tester",
        idempotencyKey: "k1",
        route: "/",
        ops: [{ op: "set", path: "theme/color", value: "blue" }],
      })
    );
    expect(res2.status).toBe(200);
    const body2 = await res2.json();
    // Cached response should match first application.
    expect(body2.overrides.theme.color).toBe("red");
  });

  it("rejects unsafe op paths", async () => {
    const state = makeState();
    const env = {};
    const hub = new BotHubDO(state, env);

    const res = await hub.fetch(
      jsonReq("https://example.com/?action=patch_apply", {
        actor: "tester",
        idempotencyKey: "k2",
        route: "/",
        ops: [{ op: "set", path: "../secrets", value: "x" }],
      })
    );
    expect(res.status).toBe(400);
  });

  it("rate limits per actor", async () => {
    const state = makeState();
    const env = { PATCH_APPLY_RATE_LIMIT: "2" };
    const hub = new BotHubDO(state, env);

    const mk = (key) =>
      hub.fetch(
        jsonReq("https://example.com/?action=patch_apply", {
          actor: "tester",
          idempotencyKey: key,
          route: "/",
          ops: [{ op: "set", path: "a/b", value: key }],
        })
      );

    expect((await mk("k3")).status).toBe(200);
    expect((await mk("k4")).status).toBe(200);
    expect((await mk("k5")).status).toBe(429);
  });
});
