import { onRequestPost as handleOrchestrator } from "./functions/orchestrator.js";
import {
  clearAdminCookieHeaders,
  hasValidAdminCookie,
  isAdminEnabled,
  isAdminRequest,
  mintAdminCookieValue,
  setAdminCookieHeaders,
} from "./functions/adminAuth.js";
import { handleBotHubRequest } from "./functions/botHub.js";
import {
  handleGenerateRequest,
  handlePreviewApiRequest,
  handlePreviewPageRequest,
  handlePublishRequest,
} from "./functions/siteGenerator.js";

const ADSENSE_CLIENT_ID = "ca-pub-5800977493749262";

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

    // Admin auth (server-issued, signed cookie)
    if (url.pathname === "/api/admin/login" && request.method === "POST") {
      if (!isAdminEnabled(env)) {
        return jsonResponse(501, { error: "Admin is not enabled. Set CONTROL_PASSWORD in Cloudflare." });
      }
      try {
        const contentType = request.headers.get("content-type") || "";
        let password = "";
        if (contentType.includes("application/json")) {
          const body = await request.json();
          password = String(body?.password || "");
        } else if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
          const form = await request.formData();
          password = String(form.get("password") || "");
        } else {
          password = String(await request.text());
        }
        if (!password || password !== String(env.CONTROL_PASSWORD)) {
          return jsonResponse(401, { error: "Invalid password." });
        }
        const cookieValue = await mintAdminCookieValue(env);
        const headers = new Headers({ "Content-Type": "application/json" });
        setAdminCookieHeaders(headers, cookieValue, { secure: url.protocol === "https:" });
        return addSecurityHeaders(new Response(JSON.stringify({ ok: true }), { status: 200, headers }));
      } catch (err) {
        return jsonResponse(500, { error: err.message });
      }
    }

    if (url.pathname === "/api/admin/logout" && request.method === "POST") {
      const headers = new Headers({ "Content-Type": "application/json" });
      clearAdminCookieHeaders(headers, { secure: url.protocol === "https:" });
      return addSecurityHeaders(new Response(JSON.stringify({ ok: true }), { status: 200, headers }));
    }

    // Voice-to-layout routes (edge / Workers AI + D1 + R2)
    if (url.pathname === "/api/generate" && request.method === "POST") {
      return addSecurityHeaders(await handleGenerateRequest({ request, env, ctx }));
    }
    if (url.pathname === "/api/preview" && request.method === "GET") {
      return addSecurityHeaders(await handlePreviewApiRequest({ request, env, ctx }));
    }
    if (url.pathname.startsWith("/preview/") && request.method === "GET") {
      return addSecurityHeaders(await handlePreviewPageRequest({ request, env, ctx }));
    }
    if (url.pathname === "/api/publish" && request.method === "POST") {
      return addSecurityHeaders(await handlePublishRequest({ request, env, ctx }));
    }

    // Bot hub (coordination + shared brief for multiple AI bots)
    if (url.pathname.startsWith("/api/bot-hub")) {
      return addSecurityHeaders(await handleBotHubRequest({ request, env, ctx }));
    }

    // Orchestrator API (primary: /api/orchestrator; legacy: /.netlify/functions/orchestrator)
    if (url.pathname === "/api/orchestrator" || url.pathname === "/.netlify/functions/orchestrator") {
      if (request.method !== "POST") {
        return jsonResponse(405, { error: "Method not allowed." });
      }

      const isAdmin = await isAdminRequest(request, env);
      if (!isAdmin) {
        return jsonResponse(401, { error: "Unauthorized. Admin access required." });
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
             commit_sha TEXT,
             intent_json TEXT,
             deployment_id TEXT,
             deployment_status TEXT,
             deployment_message TEXT
           );`
        ).run();
        const columns = await env.D1.prepare("PRAGMA table_info(commands);").all();
        const columnNames = new Set((columns.results || []).map((col) => col.name));
        if (!columnNames.has("intent_json")) {
          await env.D1.prepare("ALTER TABLE commands ADD COLUMN intent_json TEXT;").run();
        }
        if (!columnNames.has("deployment_id")) {
          await env.D1.prepare("ALTER TABLE commands ADD COLUMN deployment_id TEXT;").run();
        }
        if (!columnNames.has("deployment_status")) {
          await env.D1.prepare("ALTER TABLE commands ADD COLUMN deployment_status TEXT;").run();
        }
        if (!columnNames.has("deployment_message")) {
          await env.D1.prepare("ALTER TABLE commands ADD COLUMN deployment_message TEXT;").run();
        }
        const data = await env.D1.prepare(
          "SELECT id, ts, command, actions, files, commit_sha, intent_json, deployment_id, deployment_status, deployment_message FROM commands ORDER BY ts DESC LIMIT 20"
        ).all();
        return jsonResponse(200, { logs: data.results || [] });
      } catch (err) {
        return jsonResponse(500, { error: err.message });
      }
    }

    // Cloudflare zone analytics proxy (real data only)
    if (url.pathname === "/api/analytics/overview" && request.method === "GET") {
      const zoneId = request.cf?.zoneId || env.CF_ZONE_ID;
      const apiToken =
        env.CF_API_TOKEN ||
        env.CF_API_TOKEN2 ||
        env.CF_USER_TOKEN ||
        env.CLOUDFLARE_API_TOKEN ||
        env.CF_ACCOUNT_API_VOICETOWEBSITE ||
        env.CF_Account_API_VoicetoWebsite;
      if (!apiToken || !zoneId) {
        return jsonResponse(501, {
          error:
            "Cloudflare API token or zone ID missing. Set CF_API_TOKEN (preferred) or CF_USER_TOKEN, and optionally CF_ZONE_ID.",
        });
      }
      try {
        const since = "-43200"; // last 12 hours; supports relative values
        const apiUrl = `https://api.cloudflare.com/client/v4/zones/${zoneId}/analytics/dashboard?since=${since}&continuous=true`;
        const cfRes = await fetch(apiUrl, {
          headers: {
            Authorization: `Bearer ${apiToken}`,
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

    if (url.pathname === "/api/health" && request.method === "GET") {
      return jsonResponse(200, {
        status: "ok",
        orchestrator: "online",
        d1: !!env.D1,
        assets: !!env.ASSETS,
        ts: new Date().toISOString(),
      });
    }

    if (url.pathname === "/api/metrics" && request.method === "GET") {
      if (!env.D1) {
        return jsonResponse(503, { error: "D1 database not available." });
      }
      const since = "datetime('now','-24 hours')";
      const [commands, errors] = await Promise.all([
        env.D1.prepare(
          `SELECT COUNT(*) AS count FROM commands WHERE ts > ${since}`
        ).first(),
        env.D1.prepare(
          `SELECT COUNT(*) AS count FROM errors WHERE ts > ${since}`
        ).first().catch(() => ({ count: 0 })),
      ]);
      return jsonResponse(200, {
        window: "24h",
        commands: commands?.count || 0,
        errors: errors?.count || 0,
        deployments: {
          success: 0,
          failed: 0
        },
        revenue: {
          usd: 0
        },
        ts: new Date().toISOString()
      });
    }

    if (url.pathname === "/api/session" && request.method === "POST") {
      if (!env.D1) return jsonResponse(200, { ok: true });
      const id = crypto.randomUUID();
      const ua = request.headers.get("user-agent") || "unknown";
      await env.D1.prepare(
        `CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY,
          ts DATETIME DEFAULT CURRENT_TIMESTAMP,
          user_agent TEXT
        )`
      ).run();
      await env.D1.prepare(
        "INSERT OR IGNORE INTO sessions (id, user_agent) VALUES (?,?)"
      ).bind(id, ua).run();
      return jsonResponse(200, { ok: true });
    }

    if (url.pathname === "/api/stripe/checkout" && request.method === "POST") {
      const stripeSecret = env.STRIPE_SECRET_KEY;
      if (!stripeSecret) {
        return jsonResponse(501, { error: "Stripe secret key missing. Set STRIPE_SECRET_KEY." });
      }
      try {
        const stripeProductCatalog = {
          starter: { amount: 3900, label: "Starter Site", priceId: env.STRIPE_PRICE_STARTER },
          growth: { amount: 9900, label: "Growth Voice", priceId: env.STRIPE_PRICE_GROWTH },
          enterprise: { amount: 24900, label: "Enterprise Edge", priceId: env.STRIPE_PRICE_ENTERPRISE },
          lifetime: { amount: 49900, label: "Lifetime App", priceId: env.STRIPE_PRICE_LIFETIME },
        };

        const payload = await request.json();
        const product = String(payload?.product || "").trim().toLowerCase() || "product";

        const allowCustomAmount = String(env.STRIPE_ALLOW_CUSTOM_AMOUNT || "") === "1";
        const catalogEntry = stripeProductCatalog[product];

        const label = catalogEntry?.label || String(payload?.label || "VoiceToWebsite");
        const amount = catalogEntry?.amount ?? Number(payload?.amount || 0);
        const priceId = (catalogEntry?.priceId ? String(catalogEntry.priceId) : "").trim();

        if (!catalogEntry && !allowCustomAmount) {
          return jsonResponse(400, {
            error: "Unknown product. Use a supported product id or enable STRIPE_ALLOW_CUSTOM_AMOUNT=1.",
            supported: Object.keys(stripeProductCatalog),
          });
        }

        // Prefer Price IDs (prevents client-side price tampering). Fallback to amount only when explicitly allowed.
        const usePriceId = Boolean(priceId);
        if (!usePriceId) {
          if (!allowCustomAmount) {
            return jsonResponse(400, {
              error: "Stripe price ID not configured for this product. Set STRIPE_PRICE_* vars or enable STRIPE_ALLOW_CUSTOM_AMOUNT=1.",
              supported: Object.keys(stripeProductCatalog),
            });
          }
          if (!Number.isFinite(amount) || amount <= 0) return jsonResponse(400, { error: "Invalid amount." });
        }

        const paymentMethodTypes = String(env.STRIPE_PAYMENT_METHOD_TYPES || "card")
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean)
          .slice(0, 6);

        const origin = `${url.protocol}//${url.host}`;
        const safeUrl = (maybeUrl, fallback) => {
          if (!maybeUrl) return fallback;
          try {
            const candidate = new URL(String(maybeUrl), origin);
            if (candidate.origin !== origin) return fallback;
            return candidate.toString();
          } catch (_) {
            return fallback;
          }
        };
        const defaultSuccess = `${origin}/store.html?checkout=success&product=${encodeURIComponent(product)}`;
        const defaultCancel = `${origin}/store.html?checkout=cancel`;
        const successUrl = safeUrl(payload?.successUrl, defaultSuccess);
        const cancelUrl = safeUrl(payload?.cancelUrl, defaultCancel);
        const form = new URLSearchParams();
        form.set("mode", "payment");
        form.set("success_url", successUrl);
        form.set("cancel_url", cancelUrl);
        paymentMethodTypes.forEach((t, idx) => form.set(`payment_method_types[${idx}]`, t));

        form.set("line_items[0][quantity]", "1");
        if (usePriceId) {
          form.set("line_items[0][price]", priceId);
        } else {
          form.set("line_items[0][price_data][currency]", "USD");
          form.set("line_items[0][price_data][product_data][name]", label);
          form.set("line_items[0][price_data][unit_amount]", String(Math.round(amount)));
        }
        const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${stripeSecret}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: form.toString(),
        });
        const stripeData = await stripeRes.json();
        if (!stripeRes.ok || !stripeData?.id) {
          return jsonResponse(stripeRes.status || 500, {
            error: stripeData?.error?.message || "Stripe checkout failed.",
          });
        }
        return jsonResponse(200, { sessionId: stripeData.id });
      } catch (err) {
        return jsonResponse(500, { error: err.message });
      }
    }

    const isAdminRoot = url.pathname === "/admin" || url.pathname === "/admin/" || url.pathname === "/admin/index.html";
    if (url.pathname.startsWith("/admin/") && !isAdminRoot) {
      const hasAdmin = await hasValidAdminCookie(request, env);
      if (!hasAdmin) {
        return Response.redirect(new URL("/admin/", url.origin), 302);
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

      // Prepare environment variables for client-side injection via window.__ENV
      const envInjection = `
        <script>
          window.__ENV = {
            PAYPAL_CLIENT_ID: "${env.PAYPAL_CLIENT_ID_PROD || ''}",
            STRIPE_PUBLISHABLE_KEY: "${env.STRIPE_PUBLISHABLE_KEY || ''}",
            STRIPE_PAYMENT_LINK_STARTER: "${env.STRIPE_PAYMENT_LINK_STARTER || ''}",
            STRIPE_PAYMENT_LINK_GROWTH: "${env.STRIPE_PAYMENT_LINK_GROWTH || ''}",
            STRIPE_PAYMENT_LINK_ENTERPRISE: "${env.STRIPE_PAYMENT_LINK_ENTERPRISE || ''}",
            STRIPE_PAYMENT_LINK_LIFETIME: "${env.STRIPE_PAYMENT_LINK_LIFETIME || ''}",
            STRIPE_BUY_BUTTON_ID_STARTER: "${env.STRIPE_BUY_BUTTON_ID_STARTER || ''}",
            STRIPE_BUY_BUTTON_ID_GROWTH: "${env.STRIPE_BUY_BUTTON_ID_GROWTH || ''}",
            STRIPE_BUY_BUTTON_ID_ENTERPRISE: "${env.STRIPE_BUY_BUTTON_ID_ENTERPRISE || ''}",
            STRIPE_BUY_BUTTON_ID_LIFETIME: "${env.STRIPE_BUY_BUTTON_ID_LIFETIME || ''}",
            ADSENSE_PUBLISHER: "${env.ADSENSE_PUBLISHER || env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID || ADSENSE_CLIENT_ID}",
            ADSENSE_SLOT: "${env.ADSENSE_SLOT || ''}"
          };
        </script>
      `;

      // Inject strict replacements for legacy placeholders + new __ENV
      /*
       * Note: We inject __ENV before the closing </head> or <body> for availability.
       * We also continue to support direct text replacement for HTML-embedded tokens.
       */
      const injected = text
        .replace(/__PAYPAL_CLIENT_ID__/g, env.PAYPAL_CLIENT_ID_PROD || "")
        .replace(/__STRIPE_PUBLISHABLE_KEY__/g, env.STRIPE_PUBLISHABLE_KEY || "")
        .replace(/__ADSENSE_PUBLISHER__/g, env.ADSENSE_PUBLISHER || env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID || ADSENSE_CLIENT_ID)
        .replace(/__ADSENSE_SLOT__/g, env.ADSENSE_SLOT || "")
        .replace('</head>', `${envInjection}</head>`); // Inject variables early

      // Strip any hard-coded AdSense loader scripts from HTML. Policy-based injection below.
      const strippedAdsense = injected.replace(
        /<script\b[^>]*\bsrc=["']https?:\/\/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=[^"']+["'][^>]*>\s*<\/script>\s*/gi,
        ""
      );

      // Ads policy: only load AdSense on pages that explicitly render ad slots and are allowed.
      const wantsAds = /\badsbygoogle\b/.test(strippedAdsense) || strippedAdsense.includes("__ADSENSE_SLOT__");
      const isAdminPage = url.pathname === "/admin" || url.pathname.startsWith("/admin/");
      const isSecretPage = url.pathname.startsWith("/the3000");
      const normalizedPath = cleanPath || "/";
      const isAdsAllowed =
        normalizedPath === "/blog" ||
        normalizedPath === "/projects" ||
        normalizedPath === "/studio3000" ||
        url.pathname === "/blog.html" ||
        url.pathname === "/projects.html" ||
        url.pathname === "/studio3000.html";

      const shouldInjectAdsense = wantsAds && isAdsAllowed && !isAdminPage && !isSecretPage;

      const adsensePublisher =
        env.ADSENSE_PUBLISHER || env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID || ADSENSE_CLIENT_ID;

      const adsenseScriptTag = `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsensePublisher}" crossorigin="anonymous"></script>`;

      const withAdsense = shouldInjectAdsense
        ? strippedAdsense.includes("pagead2.googlesyndication.com/pagead/js/adsbygoogle.js")
          ? strippedAdsense.replace(
              /pagead\/js\/adsbygoogle\.js\?client=[^"'\s>]+/g,
              `pagead/js/adsbygoogle.js?client=${adsensePublisher}`
            )
          : strippedAdsense.replace("</head>", `${adsenseScriptTag}\n</head>`)
        : strippedAdsense;

      const headers = new Headers(assetRes.headers);
      headers.set("Content-Type", "text/html; charset=utf-8");
      headers.set("Cache-Control", "no-store"); // Dynamic injection requires no-store or private cache

      return addSecurityHeaders(
        new Response(withAdsense, {
          status: assetRes.status,
          headers,
        })
      );
    }
    return addSecurityHeaders(assetRes);
  },
};
