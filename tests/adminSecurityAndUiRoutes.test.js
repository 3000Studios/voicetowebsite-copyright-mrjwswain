import { describe, it, expect } from "vitest";
import worker from "../worker.js";

const mockAssets = {
  async fetch(request) {
    const url = new URL(request.url);
    const headers = new Headers();

    if (url.pathname.endsWith(".js"))
      headers.set("Content-Type", "application/javascript; charset=utf-8");
    else if (url.pathname.endsWith(".css"))
      headers.set("Content-Type", "text/css; charset=utf-8");
    else headers.set("Content-Type", "text/html; charset=utf-8");

    // Return 404 only for a clearly missing path so we can still cover the admin fallback logic if needed.
    if (url.pathname.includes("definitely-missing"))
      return new Response("not found", { status: 404, headers });

    return new Response(`<html><body>asset:${url.pathname}</body></html>`, {
      status: 200,
      headers,
    });
  },
};

const extractFirstCookie = (setCookieHeader) => {
  const raw = String(setCookieHeader || "");
  if (!raw) return "";
  // "name=value; Path=/; ..." -> "name=value"
  return raw.split(";")[0].trim();
};

describe("Admin UI route guarding + critical admin endpoints", () => {
  it("redirects /admin/* to /admin/access.html when unauthenticated", async () => {
    const env = {
      ASSETS: mockAssets,
      CONTROL_PASSWORD: "pw",
      ADMIN_ACCESS_CODE: "code",
      NODE_ENV: "test",
    };

    const res = await worker.fetch(
      new Request("https://example.com/admin/customer-chat.html"),
      env,
      {}
    );
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toContain("/admin/access.html");
  });

  it("serves /admin/access.html without admin cookie", async () => {
    const env = {
      ASSETS: mockAssets,
      CONTROL_PASSWORD: "pw",
      ADMIN_ACCESS_CODE: "code",
      NODE_ENV: "test",
    };

    const res = await worker.fetch(
      new Request("https://example.com/admin/access.html"),
      env,
      {}
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type") || "").toContain("text/html");
  });

  it("can login and then access guarded /admin/* routes with the signed admin cookie", async () => {
    const env = {
      ASSETS: mockAssets,
      CONTROL_PASSWORD: "pw",
      ADMIN_ACCESS_CODE: "code",
      NODE_ENV: "test",
    };

    const loginRes = await worker.fetch(
      new Request("https://example.com/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: "pw", email: "admin@example.com" }),
      }),
      env,
      {}
    );
    expect(loginRes.status).toBe(200);
    const cookie = extractFirstCookie(loginRes.headers.get("Set-Cookie"));
    expect(cookie.startsWith("vtw_admin=")).toBe(true);

    const statusRes = await worker.fetch(
      new Request("https://example.com/api/config/status", {
        headers: { Cookie: cookie },
      }),
      env,
      {}
    );
    expect(statusRes.status).toBe(200);

    const res = await worker.fetch(
      new Request("https://example.com/admin/customer-chat.html", {
        headers: { Cookie: cookie },
      }),
      env,
      {}
    );
    expect(res.status).toBe(200);
  });

  it("blocks critical admin APIs without an admin cookie (support admin sessions)", async () => {
    const env = {
      ASSETS: mockAssets,
      CONTROL_PASSWORD: "pw",
      ADMIN_ACCESS_CODE: "code",
      NODE_ENV: "test",
    };

    const res = await worker.fetch(
      new Request("https://example.com/api/support/admin/sessions"),
      env,
      {}
    );
    expect(res.status).toBe(401);
  });

  it("blocks godmode inference without an admin cookie", async () => {
    const env = {
      ASSETS: mockAssets,
      CONTROL_PASSWORD: "pw",
      ADMIN_ACCESS_CODE: "code",
      NODE_ENV: "test",
    };

    const res = await worker.fetch(
      new Request("https://example.com/api/godmode/infer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawInput: "test" }),
      }),
      env,
      {}
    );
    expect(res.status).toBe(401);
  });
});

describe("CSRF origin checks (defense-in-depth)", () => {
  it("rejects cross-origin POST to /api/support/start when Origin is present and mismatched", async () => {
    const env = {
      ASSETS: mockAssets,
      NODE_ENV: "test",
    };

    const res = await worker.fetch(
      new Request("https://example.com/api/support/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "https://evil.example",
        },
        body: JSON.stringify({ email: "a@b.com", name: "A" }),
      }),
      env,
      {}
    );
    expect(res.status).toBe(403);
  });
});
