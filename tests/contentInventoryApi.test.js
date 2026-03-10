import { describe, expect, it } from "vitest";
import worker from "../worker.js";

const assetMap = new Map([
  ["/config/home.json", { hero: { headline: "Hello" } }],
  ["/config/nav.json", { main: [] }],
  ["/config/blog.json", { posts: [] }],
  ["/config/products.json", { products: [] }],
  ["/config/redirects.json", { redirects: [] }],
  ["/config/registry.json", { pages: [] }],
  ["/config/progress.json", { steps: [] }],
  ["/config/materials.json", { items: [] }],
  ["/config/monetization-roadmap.json", { phases: [] }],
  ["/config/affiliates.json", { items: [] }],
  ["/config/adsense.json", { mode: "auto" }],
  ["/data/storefront-apps.json", { apps: [] }],
  ["/about.html", "<html>about</html>"],
  ["/pricing.html", "<html>pricing</html>"],
  ["/index.html", "<html>home</html>"],
  ["/blog.html", "<html>blog</html>"],
  ["/admin/access.html", "<html>admin access</html>"],
  ["/admin/login.html", "<html>admin login</html>"],
  ["/admin/index.html", "<html>admin index</html>"],
  ["/admin/integrated-dashboard.html", "<html>dashboard</html>"],
  ["/admin/analytics.html", "<html>analytics</html>"],
  ["/admin/analytics-enhanced.html", "<html>analytics enhanced</html>"],
  ["/admin/bot-command-center.html", "<html>bot</html>"],
  ["/admin/customer-chat.html", "<html>chat</html>"],
  ["/admin/live-stream.html", "<html>live</html>"],
  ["/admin/live-stream-enhanced.html", "<html>live2</html>"],
  ["/admin/store-manager.html", "<html>store manager</html>"],
  ["/admin/app-store-manager.html", "<html>app store manager</html>"],
  ["/admin/voice-commands.html", "<html>voice commands</html>"],
  ["/admin/progress.html", "<html>progress</html>"],
  ["/admin/nexus.html", "<html>nexus</html>"],
  ["/footer.html", "<html>footer</html>"],
  ["/nav.js", "console.log('nav')"],
  ["/footer.js", "console.log('footer')"],
  ["/blog.js", "console.log('blog')"],
  ["/search.js", "console.log('search')"],
  ["/vtw-wallpaper.png", "png"],
  ["/media/vtw-opener.mp4", "video"],
  ["/media/vtw-admin-dashboard.mp4", "video"],
  ["/media/vtw-home-wallpaper.mp4", "video"],
  ["/downloads/vtw-demo-kit.html", "<html>demo kit</html>"],
  ["/downloads/ui-generator.html", "<html>ui gen</html>"],
  ["/downloads/project-planning-hub.zip", "zip"],
  ["/downloads/audioboost-pro-ai.zip", "zip"],
]);

const mockAssets = {
  async fetch(request) {
    const url = new URL(typeof request === "string" ? request : request.url);
    const asset = assetMap.get(url.pathname);
    if (!asset) {
      return new Response("not found", { status: 404 });
    }
    const isJson = url.pathname.endsWith(".json");
    return new Response(isJson ? JSON.stringify(asset) : asset, {
      status: 200,
      headers: {
        "Content-Type": isJson
          ? "application/json; charset=utf-8"
          : "text/html; charset=utf-8",
      },
    });
  },
};

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

const extractCookie = (setCookieHeader) =>
  String(setCookieHeader || "").split(";")[0];

describe("content inventory api", () => {
  const baseEnv = {
    ASSETS: mockAssets,
    CONTROL_PASSWORD: "pw",
    ADMIN_ACCESS_CODE: "code",
    ADMIN_COOKIE_SECRET: "test-admin-cookie-secret",
    KV: new MemoryKv(),
    NODE_ENV: "test",
  };

  it("rejects unauthenticated inventory requests", async () => {
    const response = await worker.fetch(
      new Request("https://example.com/api/admin/content-inventory"),
      baseEnv,
      {}
    );
    expect(response.status).toBe(401);
  });

  it("returns structured inventory data for authenticated admins", async () => {
    const loginRes = await worker.fetch(
      new Request("https://example.com/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: "pw" }),
      }),
      baseEnv,
      {}
    );
    const cookie = extractCookie(loginRes.headers.get("Set-Cookie"));

    const response = await worker.fetch(
      new Request("https://example.com/api/admin/content-inventory", {
        headers: { Cookie: cookie },
      }),
      baseEnv,
      {}
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(Array.isArray(body.sections)).toBe(true);
    expect(Array.isArray(body.items)).toBe(true);
    expect(Array.isArray(body.warnings)).toBe(true);
    expect(Array.isArray(body.editableSources)).toBe(true);
    expect(body.summary.totalLivePages).toBeGreaterThan(0);
    expect(
      body.items.some(
        (item) =>
          item.route === "/config/assets.json" && item.status === "missing"
      )
    ).toBe(true);
    expect(
      body.items.some(
        (item) => item.route === "/about" && item.status === "secondary"
      )
    ).toBe(true);
    expect(
      body.items.some(
        (item) => item.route === "/admin/mission" && item.status === "protected"
      )
    ).toBe(true);
  });

  it("saves and serves runtime config overrides for editable sources", async () => {
    const env = { ...baseEnv, KV: new MemoryKv() };
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

    const saveRes = await worker.fetch(
      new Request("https://example.com/api/admin/content-inventory/source", {
        method: "POST",
        headers: {
          Cookie: cookie,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          path: "/config/home.json",
          content: { hero: { headline: "Changed from inventory" } },
        }),
      }),
      env,
      {}
    );
    expect(saveRes.status).toBe(200);

    const fetchSourceRes = await worker.fetch(
      new Request(
        "https://example.com/api/admin/content-inventory/source?path=%2Fconfig%2Fhome.json",
        { headers: { Cookie: cookie } }
      ),
      env,
      {}
    );
    const sourceBody = await fetchSourceRes.json();
    expect(fetchSourceRes.status).toBe(200);
    expect(sourceBody.overridden).toBe(true);
    expect(sourceBody.content.hero.headline).toBe("Changed from inventory");

    const publicConfigRes = await worker.fetch(
      new Request("https://example.com/config/home.json"),
      env,
      {}
    );
    const publicBody = await publicConfigRes.json();
    expect(publicConfigRes.status).toBe(200);
    expect(publicBody.hero.headline).toBe("Changed from inventory");
  });
});
