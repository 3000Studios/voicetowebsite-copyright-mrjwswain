import { onRequestPost as handleOrchestrator } from "./functions/orchestrator.js";

const jsonResponse = (status, payload) =>
  addSecurityHeaders(
    new Response(JSON.stringify(payload), {
      status,
      headers: { "Content-Type": "application/json" },
    })
  );

const addSecurityHeaders = (response) => {
  const headers = new Headers(response.headers);
  headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "SAMEORIGIN");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "geolocation=(), microphone=(self), camera=(self)");

  // Preserve status + statusText; clone body to avoid locking the original response stream.
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const cleanPath = url.pathname.replace(/\/$/, "");

    if (!env.ASSETS) {
      return jsonResponse(500, { error: "ASSETS binding is missing on this Worker route." });
    }

    // Orchestrator API (primary: /api/orchestrator; legacy: /.netlify/functions/orchestrator)
    if (url.pathname === "/api/orchestrator" || url.pathname === "/.netlify/functions/orchestrator") {
      if (request.method !== "POST") {
        return jsonResponse(405, { error: "Method not allowed." });
      }
      // Delegate to the Cloudflare function implementation for orchestration.
      const res = await handleOrchestrator({ request, env, ctx });
      return addSecurityHeaders(res);
    }

    // Admin activity logs (read-only)
    if (url.pathname === "/admin/logs" && request.method === "GET") {
      if (!env.D1) {
        return jsonResponse(503, { error: "D1 database not available." });
      }
      try {
        await env.D1.prepare(
          `CREATE TABLE IF NOT EXISTS commands (
             id INTEGER PRIMARY KEY AUTOINCREMENT,
             ts DATETIME DEFAULT CURRENT_TIMESTAMP,
             command TEXT,
             actions TEXT,
             files TEXT,
             commit_sha TEXT
           );`
        ).run();

        const data = await env.D1.prepare(
          "SELECT id, ts, command, actions, files, commit_sha FROM commands ORDER BY ts DESC LIMIT 20"
        ).all();

        return jsonResponse(200, { logs: data.results || [] });
      } catch (err) {
        return jsonResponse(500, { error: err.message });
      }
    }

    // Cloudflare zone analytics proxy (real data only)
    if (url.pathname === "/api/analytics/overview" && request.method === "GET") {
      const zoneId = request.cf?.zoneId || env.CF_ZONE_ID;
      if (!env.CF_API_TOKEN || !zoneId) {
        return jsonResponse(501, { error: "Cloudflare API token or zone ID missing. Set CF_API_TOKEN (and optionally CF_ZONE_ID)." });
      }
      try {
        const since = "-43200"; // last 12 hours; supports relative values
        const apiUrl = `https://api.cloudflare.com/client/v4/zones/${zoneId}/analytics/dashboard?since=${since}&continuous=true`;
        const cfRes = await fetch(apiUrl, {
          headers: {
            Authorization: `Bearer ${env.CF_API_TOKEN}`,
            "Content-Type": "application/json",
          },
        });
        const data = await cfRes.json();
        if (!cfRes.ok || !data?.success) {
          return jsonResponse(cfRes.status || 500, { error: data?.errors || data?.messages || "Analytics fetch failed." });
        }
        return jsonResponse(200, { result: data.result });
      } catch (err) {
        return jsonResponse(500, { error: err.message });
      }
    }

    if (url.pathname === "/admin") {
      const adminUrl = new URL("/admin/index.html", url.origin);
      const res = await env.ASSETS.fetch(new Request(adminUrl, request));
      return addSecurityHeaders(res);
    }

    if (url.pathname.startsWith("/admin/")) {
      const adminRes = await env.ASSETS.fetch(request);
      if (adminRes.status !== 404) {
        return addSecurityHeaders(adminRes);
      }
      const adminUrl = new URL("/admin/index.html", url.origin);
      const res = await env.ASSETS.fetch(new Request(adminUrl, request));
      return addSecurityHeaders(res);
    }

    if (cleanPath && !cleanPath.includes(".") && cleanPath !== "/") {
      const htmlUrl = new URL(`${cleanPath}.html`, url.origin);
      const htmlRes = await env.ASSETS.fetch(new Request(htmlUrl, request));
      if (htmlRes.status !== 404) {
        return addSecurityHeaders(htmlRes);
      }
    }

    // Default: serve the built static assets from ./dist with optional placeholder injection.
    const assetRes = await env.ASSETS.fetch(request);
    const contentType = assetRes.headers.get("Content-Type") || "";
    if (contentType.includes("text/html")) {
      const text = await assetRes.text();
      const injected = text
        .replace(/__PAYPAL_CLIENT_ID__/g, env.PAYPAL_CLIENT_ID_PROD || "")
        .replace(/__ADSENSE_PUBLISHER__/g, env.ADSENSE_PUBLISHER || env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID || "")
        .replace(/__ADSENSE_SLOT__/g, env.ADSENSE_SLOT || "");
      const headers = new Headers(assetRes.headers);
      headers.set("Content-Type", "text/html; charset=utf-8");
      headers.set("Cache-Control", "no-store");
      return addSecurityHeaders(
        new Response(injected, {
          status: assetRes.status,
          headers,
        })
      );
    }
    return addSecurityHeaders(assetRes);
  },
};
