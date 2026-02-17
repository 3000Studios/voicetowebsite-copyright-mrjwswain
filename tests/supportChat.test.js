import { describe, expect, it } from "vitest";
import { handleSupportChatRequest } from "../functions/supportChat.js";

describe("support chat", () => {
  it("start creates a session without D1", async () => {
    const req = new Request("https://example.com/api/support/start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://example.com",
      },
      body: JSON.stringify({}),
    });
    const res = await handleSupportChatRequest({ request: req, env: {} });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(typeof json.sessionId).toBe("string");
    expect(json.sessionId.length).toBeGreaterThan(0);
  });

  it("message returns a static reply when PUBLIC_SUPPORT_AI is disabled", async () => {
    const req = new Request("https://example.com/api/support/message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://example.com",
      },
      body: JSON.stringify({
        sessionId: "sess1",
        message: "Where is pricing?",
      }),
    });
    const res = await handleSupportChatRequest({
      request: req,
      env: { PUBLIC_SUPPORT_AI: "0" },
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(typeof json.reply).toBe("string");
    expect(json.reply.length).toBeGreaterThan(0);
  });
});
