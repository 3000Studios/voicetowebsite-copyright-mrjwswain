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

const redirectingHtmlAssets = {
  async fetch(request) {
    const url = new URL(request.url);
    const headers = new Headers();

    if (url.pathname.endsWith(".js")) {
      headers.set("Content-Type", "application/javascript; charset=utf-8");
      return new Response("console.log('ok');", { status: 200, headers });
    }

    if (url.pathname.endsWith(".css")) {
      headers.set("Content-Type", "text/css; charset=utf-8");
      return new Response("body{}", { status: 200, headers });
    }

    headers.set("Content-Type", "text/html; charset=utf-8");

    if (url.pathname === "/index.html") {
      return new Response("<html><body>asset:/index.html</body></html>", {
        status: 200,
        headers,
      });
    }

    if (url.pathname.endsWith(".html")) {
      const cleanPath = url.pathname.replace(/\.html$/i, "");
      return new Response(null, {
        status: 307,
        headers: { Location: cleanPath || "/" },
      });
    }

    return new Response("not found", { status: 404, headers });
  },
};

const extractFirstCookie = (setCookieHeader) => {
  const raw = String(setCookieHeader || "");
  if (!raw) return "";
  // "name=value; Path=/; ..." -> "name=value"
  return raw.split(";")[0].trim();
};

describe("Admin UI route guarding + critical admin endpoints", () => {
  it("serves the Custom GPT compatibility status alias without auth", async () => {
    const env = {
      ASSETS: mockAssets,
      NODE_ENV: "test",
    };

    const res = await worker.fetch(
      new Request("https://example.com/status"),
      env,
      {}
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.endpoint).toBe("status-alias");
  });

  it("redirects /admin/* to /admin/access when unauthenticated", async () => {
    const env = {
      ASSETS: mockAssets,
      CONTROL_PASSWORD: "pw",
      ADMIN_COOKIE_SECRET: "test-admin-cookie-secret",
      ADMIN_ACCESS_CODE: "code",
      NODE_ENV: "test",
    };

    const res = await worker.fetch(
      new Request("https://example.com/admin/customer-chat.html"),
      env,
      {}
    );
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toContain("/admin/access");
  });

  it("serves /admin/access.html without admin cookie", async () => {
    const env = {
      ASSETS: mockAssets,
      CONTROL_PASSWORD: "pw",
      ADMIN_COOKIE_SECRET: "test-admin-cookie-secret",
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

  it("serves admin access inline even when the asset layer redirects html paths", async () => {
    const env = {
      ASSETS: redirectingHtmlAssets,
      CONTROL_PASSWORD: "5555",
      ADMIN_COOKIE_SECRET: "5555",
      ADMIN_ACCESS_CODE: "5555",
      NODE_ENV: "test",
    };

    const res = await worker.fetch(
      new Request("https://example.com/admin/access.html"),
      env,
      {}
    );
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain("Open admin dashboard");
    expect(body).toContain('src="/admin/access.js"');
    expect(body).not.toContain("form.addEventListener");
  });

  it("normalizes clean public admin auth routes", async () => {
    const env = {
      ASSETS: mockAssets,
      CONTROL_PASSWORD: "pw",
      ADMIN_COOKIE_SECRET: "test-admin-cookie-secret",
      ADMIN_ACCESS_CODE: "code",
      NODE_ENV: "test",
    };

    // /admin/login: worker serves login page in place (200) to avoid redirect loop, or redirects if asset returns redirect
    const loginRes = await worker.fetch(
      new Request("https://example.com/admin/login"),
      env,
      {}
    );
    expect([200, 302]).toContain(loginRes.status);
    if (loginRes.status === 302)
      expect(loginRes.headers.get("Location")).toContain("/admin/login.html");
    else
      expect(loginRes.headers.get("Content-Type") || "").toContain("text/html");

    // /admin/access: same—serve in place or redirect
    const accessRes = await worker.fetch(
      new Request("https://example.com/admin/access"),
      env,
      {}
    );
    expect([200, 302]).toContain(accessRes.status);
    if (accessRes.status === 302)
      expect(accessRes.headers.get("Location")).toContain("/admin/access.html");
    else
      expect(accessRes.headers.get("Content-Type") || "").toContain(
        "text/html"
      );
  });

  it("can login and then access guarded /admin/* routes with the signed admin cookie", async () => {
    const env = {
      ASSETS: mockAssets,
      CONTROL_PASSWORD: "pw",
      ADMIN_COOKIE_SECRET: "test-admin-cookie-secret",
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

  it("can login with ADMIN_ACCESS_CODE when CONTROL_PASSWORD is not set", async () => {
    const env = {
      ASSETS: mockAssets,
      ADMIN_COOKIE_SECRET: "test-admin-cookie-secret",
      ADMIN_ACCESS_CODE: "5555",
      NODE_ENV: "test",
    };

    const loginRes = await worker.fetch(
      new Request("https://example.com/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: "5555" }),
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
  });

  it("falls back to the SPA shell for clean public routes when html assets redirect to clean urls", async () => {
    const env = {
      ASSETS: redirectingHtmlAssets,
      NODE_ENV: "test",
    };

    const res = await worker.fetch(
      new Request("https://example.com/store", {
        headers: { Accept: "text/html" },
      }),
      env,
      {}
    );
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain("asset:/index.html");
  });

  it("blocks critical admin APIs without an admin cookie (support admin sessions)", async () => {
    const env = {
      ASSETS: mockAssets,
      CONTROL_PASSWORD: "pw",
      ADMIN_COOKIE_SECRET: "test-admin-cookie-secret",
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
      ADMIN_COOKIE_SECRET: "test-admin-cookie-secret",
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
