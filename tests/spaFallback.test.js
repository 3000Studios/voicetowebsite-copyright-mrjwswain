import { describe, expect, it } from "vitest";
import worker from "../worker.js";

const mockAssets = {
  async fetch(request) {
    const url = new URL(request.url);
    const headers = new Headers();

    if (url.pathname.endsWith(".js"))
      headers.set("Content-Type", "application/javascript; charset=utf-8");
    else if (url.pathname.endsWith(".css"))
      headers.set("Content-Type", "text/css; charset=utf-8");
    else if (url.pathname === "/index.html")
      headers.set("Content-Type", "text/html; charset=utf-8");
    else headers.set("Content-Type", "text/html; charset=utf-8");

    // Return 404 for missing assets
    if (
      url.pathname.includes("missing-file") ||
      url.pathname === "/nonexistent"
    ) {
      return new Response("not found", { status: 404, headers });
    }

    // Return index.html for root
    if (url.pathname === "/index.html") {
      return new Response("<html><body>index page</body></html>", {
        status: 200,
        headers,
      });
    }

    // Return 404 for other non-existent paths
    return new Response("not found", { status: 404, headers });
  },
};

describe("SPA Fallback Behavior", () => {
  const env = {
    ASSETS: mockAssets,
    NODE_ENV: "test",
  };

  it("should fallback to index.html for document navigation to non-existent paths without extensions", async () => {
    const request = new Request("https://example.com/nonexistent", {
      method: "GET",
      headers: {
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Sec-Fetch-Dest": "document",
      },
    });

    const response = await worker.fetch(request, env, {});
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toContain("index page");
  });

  it("should fallback to index.html for SPA routes with query parameters", async () => {
    const request = new Request("https://example.com/search?q=test.js", {
      method: "GET",
      headers: {
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    const response = await worker.fetch(request, env, {});
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toContain("index page");
  });

  it("should NOT fallback to index.html for paths with file extensions", async () => {
    const request = new Request("https://example.com/missing-file.js", {
      method: "GET",
      headers: {
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    const response = await worker.fetch(request, env, {});
    expect(response.status).toBe(404);
  });

  it("should NOT fallback to index.html for non-GET requests", async () => {
    const request = new Request("https://example.com/nonexistent", {
      method: "POST",
      headers: {
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    const response = await worker.fetch(request, env, {});
    expect(response.status).toBe(404);
  });

  it("should NOT fallback to index.html for non-document navigation requests", async () => {
    const request = new Request("https://example.com/nonexistent", {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    const response = await worker.fetch(request, env, {});
    expect(response.status).toBe(404);
  });

  it("should NOT fallback to index.html when index.html itself is missing", async () => {
    const failingAssets = {
      async fetch(_request) {
        const _url = new URL(_request.url);
        const headers = new Headers();
        headers.set("Content-Type", "text/html; charset=utf-8");

        // Always return 404, including for index.html
        return new Response("not found", { status: 404, headers });
      },
    };

    const envWithFailingAssets = {
      ...env,
      ASSETS: failingAssets,
    };

    const request = new Request("https://example.com/nonexistent", {
      method: "GET",
      headers: {
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    const response = await worker.fetch(request, envWithFailingAssets, {});
    expect(response.status).toBe(404);
  });

  it("should handle edge case paths with dots in directories correctly", async () => {
    const request = new Request("https://example.com/v1.2/api/users", {
      method: "GET",
      headers: {
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    const response = await worker.fetch(request, env, {});
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toContain("index page");
  });
});
