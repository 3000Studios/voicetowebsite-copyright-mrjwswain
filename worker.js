import {
  clearAdminCookieHeaders,
  hasValidAdminCookie,
  isAdminEnabled,
  mintAdminCookieValue,
  setAdminCookieHeaders,
} from "./functions/adminAuth.js";
import { handleBotHubRequest } from "./functions/botHub.js";
import { onRequestPost as handleOrchestrator } from "./functions/orchestrator.js";
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
    }),
  );

const addSecurityHeaders = (response) => {
  const headers = new Headers(response.headers);
  headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload",
  );
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "SAMEORIGIN");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set(
    "Permissions-Policy",
    "geolocation=(), microphone=(self), camera=(self)",
  );
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
      return jsonResponse(500, {
        error: "ASSETS binding is missing on this Worker route.",
      });
    }

    // Admin auth (server-issued, signed cookie)
    if (url.pathname === "/api/admin/login" && request.method === "POST") {
      if (!isAdminEnabled(env)) {
        return jsonResponse(501, {
          error: "Admin is not enabled. Set CONTROL_PASSWORD in Cloudflare.",
        });
      }
      try {
        const contentType = request.headers.get("content-type") || "";
        let password = "";
        if (contentType.includes("application/json")) {
          const body = await request.json();
          password = String(body?.password || "");
        } else if (
          contentType.includes("application/x-www-form-urlencoded") ||
          contentType.includes("multipart/form-data")
        ) {
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
        setAdminCookieHeaders(headers, cookieValue, {
          secure: url.protocol === "https:",
        });
        return addSecurityHeaders(
          new Response(JSON.stringify({ ok: true }), { status: 200, headers }),
        );
      } catch (err) {
        return jsonResponse(500, { error: err.message });
      }
    }

    if (url.pathname === "/api/admin/logout" && request.method === "POST") {
      const headers = new Headers({ "Content-Type": "application/json" });
      clearAdminCookieHeaders(headers, { secure: url.protocol === "https:" });
      return addSecurityHeaders(
        new Response(JSON.stringify({ ok: true }), { status: 200, headers }),
      );
    }

    // Voice-to-layout routes (edge / Workers AI + D1 + R2)
    if (url.pathname === "/api/generate" && request.method === "POST") {
      return addSecurityHeaders(
        await handleGenerateRequest({ request, env, ctx }),
      );
    }
    if (url.pathname === "/api/preview" && request.method === "GET") {
      return addSecurityHeaders(
        await handlePreviewApiRequest({ request, env, ctx }),
      );
    }
    if (url.pathname.startsWith("/preview/") && request.method === "GET") {
      return addSecurityHeaders(
        await handlePreviewPageRequest({ request, env, ctx }),
      );
    }
    if (url.pathname === "/api/publish" && request.method === "POST") {
      return addSecurityHeaders(
        await handlePublishRequest({ request, env, ctx }),
      );
    }

    // Bot hub (coordination + shared brief for multiple AI bots)
    if (url.pathname.startsWith("/api/bot-hub")) {
      return addSecurityHeaders(
        await handleBotHubRequest({ request, env, ctx }),
      );
    }

    // Orchestrator API (primary: /api/orchestrator; legacy: /.netlify/functions/orchestrator)
    if (
      url.pathname === "/api/orchestrator" ||
      url.pathname === "/.netlify/functions/orchestrator"
    ) {
      const hasAdmin = await hasValidAdminCookie(request, env);
      if (!hasAdmin) {
        return jsonResponse(401, { error: "Unauthorized" });
      }
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
        const data = await env.D1.prepare(
          "SELECT id, ts, command, actions, files, commit_sha, intent_json, deployment_id, deployment_status, deployment_message FROM commands ORDER BY ts DESC LIMIT 20",
        ).all();
        return jsonResponse(200, { logs: data.results || [] });
      } catch (err) {
        return jsonResponse(500, { error: err.message });
      }
    }

    // Cloudflare zone analytics proxy (real data only)
    if (
      url.pathname === "/api/analytics/overview" &&
      request.method === "GET"
    ) {
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
          return jsonResponse(cfRes.status || 500, {
            error: data?.errors || data?.messages || "Analytics fetch failed.",
          });
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
          `SELECT COUNT(*) AS count FROM commands WHERE ts > ${since}`,
        ).first(),
        env.D1.prepare(
          `SELECT COUNT(*) AS count FROM errors WHERE ts > ${since}`,
        )
          .first()
          .catch(() => ({ count: 0 })),
      ]);
      return jsonResponse(200, {
        window: "24h",
        commands: commands?.count || 0,
        errors: errors?.count || 0,
        deployments: {
          success: 0,
          failed: 0,
        },
        revenue: {
          usd: 0,
        },
        ts: new Date().toISOString(),
      });
    }

    if (url.pathname === "/api/session" && request.method === "POST") {
      if (!env.D1) return jsonResponse(200, { ok: true });
      const id = crypto.randomUUID();
      const ua = request.headers.get("user-agent") || "unknown";
      await env.D1.prepare(
        "INSERT OR IGNORE INTO sessions (id, user_agent) VALUES (?,?)",
      )
        .bind(id, ua)
        .run();
      return jsonResponse(200, { ok: true });
    }

    // Products API (D1 backed)
    if (url.pathname === "/api/products") {
      if (!env.D1) return jsonResponse(503, { error: "D1 unavailable." });

      // Auto-init logs table (already handled above) + products table
      try {
        await env.D1.prepare(
          `CREATE TABLE IF NOT EXISTS products (
             id TEXT PRIMARY KEY,
             label TEXT,
             title TEXT,
             desc TEXT,
             price REAL,
             link TEXT,  -- Optional fulfillment URL (avoid public downloads)
             stripe_buy_button_id TEXT,
             stripe_payment_link TEXT,
             tag TEXT,
             active INTEGER DEFAULT 1,
             ts DATETIME DEFAULT CURRENT_TIMESTAMP
           );`,
        ).run();

        // Best-effort migrations for older tables.
        await env.D1.prepare("ALTER TABLE products ADD COLUMN stripe_buy_button_id TEXT;")
          .run()
          .catch(() => {});
        await env.D1.prepare("ALTER TABLE products ADD COLUMN stripe_payment_link TEXT;")
          .run()
          .catch(() => {});
      } catch (err) {
        console.error("Product table init failed:", err);
      }

      const normalizeProduct = (row) => {
        const r = row || {};
        return {
          id: r.id,
          label: r.label || "",
          title: r.title || "",
          desc: r.desc || "",
          price: Number(r.price || 0),
          tag: r.tag || "",
          link: r.link || "",
          stripeBuyButtonId: r.stripe_buy_button_id || r.stripeBuyButtonId || "",
          stripePaymentLink: r.stripe_payment_link || r.stripePaymentLink || "",
          active: Number(r.active || 1),
          ts: r.ts || "",
        };
      };

      // GET: Public list of active products
      if (request.method === "GET") {
        try {
          const { results } = await env.D1.prepare(
            "SELECT * FROM products WHERE active = 1 ORDER BY ts DESC",
          ).all();

          // Seed if empty (just once)
          if (!results || results.length === 0) {
            const seed = [
              {
                id: "voice-to-saas-template",
                label: "Template / 01",
                title: "Voice-to-SaaS Template",
                desc: "Full SaaS starter: landing, pricing, onboarding, docs, and conversion blocks tuned for speed.",
                price: 149,
                tag: "Template",
                link: "",
                stripeBuyButtonId: "",
                stripePaymentLink: "",
              },
              {
                id: "ai-audio-enhancer-presets",
                label: "Audio / 02",
                title: "AI Audio Enhancer Presets",
                desc: "A curated preset pack for quick, clean voice and podcast enhancement.",
                price: 49,
                tag: "Presets",
                link: "",
                stripeBuyButtonId: "",
                stripePaymentLink: "",
              },
              {
                id: "premium-metallic-ui-kit",
                label: "UI / 03",
                title: "Premium Metallic UI Kit",
                desc: "Metallic gradients, shine animations, glass panels, and high-converting layout primitives.",
                price: 89,
                tag: "UI Kit",
                link: "",
                stripeBuyButtonId: "",
                stripePaymentLink: "",
              },
              {
                id: "jules-ai-integration-module",
                label: "Integration / 04",
                title: "\"Jules\" AI Integration Module",
                desc: "Drop-in AI integration module (API wiring, safety gates, prompt surfaces, and logging hooks).",
                price: 199,
                tag: "Module",
                link: "",
                stripeBuyButtonId: "",
                stripePaymentLink: "",
              },
              {
                id: "voice-seo-automation-script",
                label: "SEO / 05",
                title: "Voice-SEO Automation Script",
                desc: "Programmatic SEO helpers: sitemaps, canonical fixes, metadata injection, and long-tail page generation.",
                price: 99,
                tag: "Script",
                link: "",
                stripeBuyButtonId: "",
                stripePaymentLink: "",
              },
            ];
            for (const p of seed) {
              await env.D1.prepare(
                "INSERT INTO products (id, label, title, desc, price, tag, link, stripe_buy_button_id, stripe_payment_link) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
              )
                .bind(
                  p.id,
                  p.label,
                  p.title,
                  p.desc,
                  p.price,
                  p.tag,
                  p.link,
                  p.stripeBuyButtonId,
                  p.stripePaymentLink,
                )
                .run();
            }
            return jsonResponse(200, seed.map(normalizeProduct));
          }

          return jsonResponse(200, (results || []).map(normalizeProduct));
        } catch (err) {
          return jsonResponse(500, { error: err.message });
        }
      }

      // POST: Admin add/update product
      if (request.method === "POST") {
        const hasAdmin = await hasValidAdminCookie(request, env);
        if (!hasAdmin) return jsonResponse(401, { error: "Unauthorized" });

        try {
          const body = await request.json();
          const {
            id,
            label,
            title,
            desc,
            price,
            tag,
            link,
            stripeBuyButtonId,
            stripePaymentLink,
            stripe_buy_button_id,
            stripe_payment_link,
          } = body || {};
          if (!id || !title)
            return jsonResponse(400, {
              error: "Missing required fields (id, title).",
            });

          await env.D1.prepare(
            `INSERT INTO products (id, label, title, desc, price, tag, link, stripe_buy_button_id, stripe_payment_link, active, ts)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
             ON CONFLICT(id) DO UPDATE SET
               label=excluded.label,
               title=excluded.title,
               desc=excluded.desc,
               price=excluded.price,
               tag=excluded.tag,
               link=excluded.link,
               stripe_buy_button_id=excluded.stripe_buy_button_id,
               stripe_payment_link=excluded.stripe_payment_link,
               ts=CURRENT_TIMESTAMP`,
          )
            .bind(
              id,
              label || "",
              title,
              desc || "",
              Number(price || 0),
              tag || "",
              link || "",
              String(stripeBuyButtonId || stripe_buy_button_id || ""),
              String(stripePaymentLink || stripe_payment_link || ""),
            )
            .run();

          return jsonResponse(200, { ok: true, id });
        } catch (err) {
          return jsonResponse(500, { error: err.message });
        }
      }

      // DELETE: Admin remove (soft delete or hard delete)
      if (request.method === "DELETE") {
        const hasAdmin = await hasValidAdminCookie(request, env);
        if (!hasAdmin) return jsonResponse(401, { error: "Unauthorized" });

        const urlObj = new URL(request.url);
        const id = urlObj.searchParams.get("id");
        if (!id) return jsonResponse(400, { error: "Missing id parameter." });

        try {
          await env.D1.prepare("DELETE FROM products WHERE id = ?")
            .bind(id)
            .run();
          return jsonResponse(200, { ok: true });
        } catch (err) {
          return jsonResponse(500, { error: err.message });
        }
      }
    }

    // Orders API (D1 backed)
    if (url.pathname === "/api/orders") {
      if (!env.D1) return jsonResponse(503, { error: "D1 unavailable." });

      // Auto-init orders table
      try {
        await env.D1.prepare(
          `CREATE TABLE IF NOT EXISTS orders (
             id TEXT PRIMARY KEY,
             product_id TEXT,
             amount REAL,
             currency TEXT DEFAULT 'USD',
             status TEXT DEFAULT 'completed',
             customer_email TEXT,
             ts DATETIME DEFAULT CURRENT_TIMESTAMP
           );`,
        ).run();
      } catch (err) {
        console.error("Order table init failed:", err);
      }

      // POST: Record Order
      if (request.method === "POST") {
        try {
          const body = await request.json();
          // generate random ID if not provided
          const genId =
            "order-" +
            Date.now().toString(36) +
            Math.random().toString(36).slice(2);
          const { id, product_id, amount, customer_email } = body;
          const finalId = id || genId;

          await env.D1.prepare(
            `INSERT INTO orders (id, product_id, amount, customer_email) VALUES (?, ?, ?, ?)`,
          )
            .bind(
              finalId,
              product_id || "unknown",
              Number(amount || 0),
              customer_email || "",
            )
            .run();

          return jsonResponse(200, { ok: true, id: finalId });
        } catch (err) {
          return jsonResponse(500, { error: err.message });
        }
      }

      // GET: Admin list
      if (request.method === "GET") {
        const hasAdmin = await hasValidAdminCookie(request, env);
        if (!hasAdmin) return jsonResponse(401, { error: "Unauthorized" });

        const { results } = await env.D1.prepare(
          "SELECT * FROM orders ORDER BY ts DESC LIMIT 50",
        ).all();
        return jsonResponse(200, { results: results || [] });
      }
    }

    // Sales Stats API (for analytics)
    if (url.pathname === "/api/sales/stats") {
      if (!env.D1)
        return jsonResponse(200, {
          total_orders: 0,
          total_revenue: 0,
          recent_orders: [],
        });

      try {
        // Ensure table exists (idempotent)
        await env.D1.prepare(
          `CREATE TABLE IF NOT EXISTS orders (
             id TEXT PRIMARY KEY,
             product_id TEXT,
             amount REAL,
             currency TEXT DEFAULT 'USD',
             status TEXT DEFAULT 'completed',
             customer_email TEXT,
             ts DATETIME DEFAULT CURRENT_TIMESTAMP
           );`,
        ).run();

        const stats = await env.D1.prepare(
          `SELECT COUNT(*) as count, SUM(amount) as revenue FROM orders`,
        ).first();

        const recent = await env.D1.prepare(
          `SELECT * FROM orders ORDER BY ts DESC LIMIT 5`,
        ).all();

        return jsonResponse(200, {
          total_orders: stats.count || 0,
          total_revenue: stats.revenue || 0,
          recent_orders: recent.results || [],
        });
      } catch (err) {
        return jsonResponse(500, { error: err.message });
      }
    }

    if (url.pathname === "/api/stripe/checkout" && request.method === "POST") {
      const stripeSecret = env.STRIPE_SECRET_KEY;
      if (!stripeSecret) {
        return jsonResponse(501, {
          error: "Stripe secret key missing. Set STRIPE_SECRET_KEY.",
        });
      }
      try {
        const stripeProductCatalog = {
          starter: {
            amount: 3900,
            label: "Starter Site",
            priceId: env.STRIPE_PRICE_STARTER,
          },
          growth: {
            amount: 9900,
            label: "Growth Voice",
            priceId: env.STRIPE_PRICE_GROWTH,
          },
          enterprise: {
            amount: 24900,
            label: "Enterprise Edge",
            priceId: env.STRIPE_PRICE_ENTERPRISE,
          },
          lifetime: {
            amount: 49900,
            label: "Lifetime App",
            priceId: env.STRIPE_PRICE_LIFETIME,
          },
        };

        const payload = await request.json();
        const product =
          String(payload?.product || "")
            .trim()
            .toLowerCase() || "product";

        const allowCustomAmount =
          String(env.STRIPE_ALLOW_CUSTOM_AMOUNT || "") === "1";
        const catalogEntry = stripeProductCatalog[product];

        const label =
          catalogEntry?.label || String(payload?.label || "VoiceToWebsite");
        const amount = catalogEntry?.amount ?? Number(payload?.amount || 0);
        const priceId = (
          catalogEntry?.priceId ? String(catalogEntry.priceId) : ""
        ).trim();

        if (!catalogEntry && !allowCustomAmount) {
          return jsonResponse(400, {
            error:
              "Unknown product. Use a supported product id or enable STRIPE_ALLOW_CUSTOM_AMOUNT=1.",
            supported: Object.keys(stripeProductCatalog),
          });
        }

        // Prefer Price IDs (prevents client-side price tampering). Fallback to amount only when explicitly allowed.
        const usePriceId = Boolean(priceId);
        if (!usePriceId) {
          if (!allowCustomAmount) {
            return jsonResponse(400, {
              error:
                "Stripe price ID not configured for this product. Set STRIPE_PRICE_* vars or enable STRIPE_ALLOW_CUSTOM_AMOUNT=1.",
              supported: Object.keys(stripeProductCatalog),
            });
          }
          if (!Number.isFinite(amount) || amount <= 0)
            return jsonResponse(400, { error: "Invalid amount." });
        }

        const paymentMethodTypes = String(
          env.STRIPE_PAYMENT_METHOD_TYPES || "card",
        )
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
        paymentMethodTypes.forEach((t, idx) =>
          form.set(`payment_method_types[${idx}]`, t),
        );

        form.set("line_items[0][quantity]", "1");
        if (usePriceId) {
          form.set("line_items[0][price]", priceId);
        } else {
          form.set("line_items[0][price_data][currency]", "USD");
          form.set("line_items[0][price_data][product_data][name]", label);
          form.set(
            "line_items[0][price_data][unit_amount]",
            String(Math.round(amount)),
          );
        }
        const stripeRes = await fetch(
          "https://api.stripe.com/v1/checkout/sessions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${stripeSecret}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: form.toString(),
          },
        );
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

    const isAdminRoot =
      url.pathname === "/admin" ||
      url.pathname === "/admin/" ||
      url.pathname === "/admin/index.html";
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
            PAYPAL_CLIENT_ID: "${env.PAYPAL_CLIENT_ID_PROD || env.PAYPAL_CLIENT_ID || ""}",
            STRIPE_PUBLISHABLE_KEY: "${env.STRIPE_PUBLISHABLE_KEY || env.STRIPE_PUBLIC || ""}",
            STRIPE_PAYMENT_LINK_STARTER: "${env.STRIPE_PAYMENT_LINK_STARTER || ""}",
            STRIPE_PAYMENT_LINK_GROWTH: "${env.STRIPE_PAYMENT_LINK_GROWTH || ""}",
            STRIPE_PAYMENT_LINK_ENTERPRISE: "${env.STRIPE_PAYMENT_LINK_ENTERPRISE || ""}",
            STRIPE_PAYMENT_LINK_LIFETIME: "${env.STRIPE_PAYMENT_LINK_LIFETIME || ""}",
            STRIPE_BUY_BUTTON_ID_STARTER: "${env.STRIPE_BUY_BUTTON_ID_STARTER || ""}",
            STRIPE_BUY_BUTTON_ID_GROWTH: "${env.STRIPE_BUY_BUTTON_ID_GROWTH || ""}",
            STRIPE_BUY_BUTTON_ID_ENTERPRISE: "${env.STRIPE_BUY_BUTTON_ID_ENTERPRISE || ""}",
            STRIPE_BUY_BUTTON_ID_LIFETIME: "${env.STRIPE_BUY_BUTTON_ID_LIFETIME || ""}",
            ADSENSE_PUBLISHER: "${env.ADSENSE_PUBLISHER || env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID || ADSENSE_CLIENT_ID}",
            ADSENSE_SLOT: "${env.ADSENSE_SLOT || ""}",
            ADSENSE_MODE: "${env.ADSENSE_MODE || "auto"}",
            ADSENSE_SLOT_TOP: "${env.ADSENSE_SLOT_TOP || ""}",
            ADSENSE_SLOT_MID: "${env.ADSENSE_SLOT_MID || ""}",
            ADSENSE_SLOT_BOTTOM: "${env.ADSENSE_SLOT_BOTTOM || ""}",
            ADSENSE_MAX_SLOTS: "${env.ADSENSE_MAX_SLOTS || "3"}"
          };
        </script>
      `;

      const normalizedPath = cleanPath || "/";
      const seoPath = (() => {
        try {
          let p = String(url.pathname || "/");
          if (p.length > 1) p = p.replace(/\/$/, "");
          if (p.endsWith(".html")) p = p.slice(0, -5);
          if (!p) p = "/";
          return p;
        } catch (_) {
          return "/";
        }
      })();
      const canonicalUrl = `${url.origin}${seoPath === "/" ? "/" : seoPath}`;
      const isAdminPage =
        url.pathname === "/admin" || url.pathname.startsWith("/admin/");
      const isSecretPage = url.pathname.startsWith("/the3000");
      const robotsTag =
        isAdminPage || isSecretPage
          ? "noindex, nofollow"
          : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

      const defaultOgImage = `${url.origin}/vtw-wallpaper.png`;
      const defaultDescription =
        "VoiceToWebsite — autonomous web engineering, deployment, and monetization.";
      const descriptionByPath = {
        "/rush-percussion":
          "RUSH PERCUSSION: an interactive microgame demo from the VoiceToWebsite App Store.",
      };
      const seoJsonLd = JSON.stringify(
        {
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "@id": `${url.origin}/#organization`,
              name: "VoiceToWebsite",
              url: url.origin,
            },
            {
              "@type": "WebSite",
              "@id": `${url.origin}/#website`,
              url: url.origin,
              name: "VoiceToWebsite",
              publisher: { "@id": `${url.origin}/#organization` },
            },
          ],
        },
        null,
        0,
      );

      // Inject strict replacements for legacy placeholders + new __ENV
      /*
       * Note: We inject __ENV before the closing </head> or <body> for availability.
       * We also continue to support direct text replacement for HTML-embedded tokens.
       */
      const injected = text
        .replace(
          /__PAYPAL_CLIENT_ID__/g,
          env.PAYPAL_CLIENT_ID_PROD || env.PAYPAL_CLIENT_ID || "",
        )
        .replace(
          /__STRIPE_PUBLISHABLE_KEY__/g,
          env.STRIPE_PUBLISHABLE_KEY || env.STRIPE_PUBLIC || "",
        )
        .replace(
          /__ADSENSE_PUBLISHER__/g,
          env.ADSENSE_PUBLISHER ||
            env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID ||
            ADSENSE_CLIENT_ID,
        )
        .replace(/__ADSENSE_SLOT__/g, env.ADSENSE_SLOT || "")
        .replace("</head>", `${envInjection}</head>`); // Inject variables early

      // Strip any hard-coded AdSense loader scripts from HTML. Policy-based injection below.
      const strippedAdsense = injected.replace(
        /<script\b[^>]*\bsrc=["']https?:\/\/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=[^"']+["'][^>]*>\s*<\/script>\s*/gi,
        "",
      );

      // SEO: canonical + robots + stable OG/Twitter URLs + JSON-LD (server-side so crawlers see it).
      let seoInjected = strippedAdsense
        .replace(/<link\b[^>]*rel=["']canonical["'][^>]*>\s*/gi, "")
        .replace(/<meta\b[^>]*name=["']robots["'][^>]*>\s*/gi, "")
        .replace(/<meta\b[^>]*property=["']og:url["'][^>]*>\s*/gi, "")
        .replace(
          /<meta\b[^>]*(?:name|property)=["']twitter:url["'][^>]*>\s*/gi,
          "",
        )
        .replace(
          /<script\b[^>]*type=["']application\/ld\+json["'][^>]*id=["']vtw-jsonld["'][\s\S]*?<\/script>\s*/gi,
          "",
        );

      const hasOgImage = /<meta\b[^>]*property=["']og:image["']/i.test(
        seoInjected,
      );
      const hasTwitterImage =
        /<meta\b[^>]*(?:name|property)=["']twitter:image["']/i.test(
          seoInjected,
        );
      const hasTwitterCard =
        /<meta\b[^>]*(?:name|property)=["']twitter:card["']/i.test(seoInjected);
      const hasOgType = /<meta\b[^>]*property=["']og:type["']/i.test(
        seoInjected,
      );
      const hasOgSiteName = /<meta\b[^>]*property=["']og:site_name["']/i.test(
        seoInjected,
      );
      const hasDescription = /<meta\b[^>]*name=["']description["']/i.test(
        seoInjected,
      );
      const fallbackDescription =
        descriptionByPath[seoPath] || defaultDescription;

      const seoBlock = `
        <link rel="canonical" href="${canonicalUrl}" />
        <meta name="robots" content="${robotsTag}" />
        ${hasDescription ? "" : `<meta name="description" content="${fallbackDescription}" />`}
        <meta property="og:url" content="${canonicalUrl}" />
        <meta property="og:type" content="${hasOgType ? "" : "website"}" />
        <meta property="og:site_name" content="${hasOgSiteName ? "" : "VoiceToWebsite"}" />
        <meta name="twitter:url" content="${canonicalUrl}" />
        ${hasTwitterCard ? "" : `<meta name="twitter:card" content="summary_large_image" />`}
        ${hasOgImage ? "" : `<meta property="og:image" content="${defaultOgImage}" />`}
        ${hasTwitterImage ? "" : `<meta name="twitter:image" content="${defaultOgImage}" />`}
        <script type="application/ld+json" id="vtw-jsonld">${seoJsonLd}</script>
      `;

      // Clean up conditional OG/Twitter placeholders to avoid invalid empty metas.
      const sanitizedSeoBlock = seoBlock
        .replace(/<meta property="og:type" content=""\s*\/>\s*/g, "")
        .replace(/<meta property="og:site_name" content=""\s*\/>\s*/g, "");

      seoInjected = seoInjected.replace(
        "</head>",
        `${sanitizedSeoBlock}\n</head>`,
      );

      // Ads policy: only load AdSense on pages that explicitly render ad slots and are allowed.
      const wantsAds =
        /\badsbygoogle\b/.test(seoInjected) ||
        seoInjected.includes("__ADSENSE_SLOT__");
      const isAdsAllowed =
        normalizedPath === "/blog" ||
        normalizedPath === "/projects" ||
        normalizedPath === "/studio3000" ||
        url.pathname === "/blog.html" ||
        url.pathname === "/projects.html" ||
        url.pathname === "/studio3000.html";

      const shouldInjectAdsense =
        wantsAds && isAdsAllowed && !isAdminPage && !isSecretPage;

      const adsensePublisher =
        env.ADSENSE_PUBLISHER ||
        env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID ||
        ADSENSE_CLIENT_ID;

      const adsenseScriptTag = `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsensePublisher}" crossorigin="anonymous"></script>`;

      const withAdsense = shouldInjectAdsense
        ? seoInjected.includes(
            "pagead2.googlesyndication.com/pagead/js/adsbygoogle.js",
          )
          ? seoInjected.replace(
              /pagead\/js\/adsbygoogle\.js\?client=[^"'\s>]+/g,
              `pagead/js/adsbygoogle.js?client=${adsensePublisher}`,
            )
          : seoInjected.replace("</head>", `${adsenseScriptTag}\n</head>`)
        : seoInjected;

      const headers = new Headers(assetRes.headers);
      headers.set("Content-Type", "text/html; charset=utf-8");

      // Cache policy:
      // - Admin/secret pages: never cache (avoid leaking sensitive state + ensure instant updates).
      // - Public pages: allow edge caching with revalidation for faster repeat visits.
      headers.set(
        "Cache-Control",
        isAdminPage || isSecretPage
          ? "no-store"
          : "public, max-age=0, s-maxage=600, stale-while-revalidate=86400",
      );
      headers.set("X-Robots-Tag", robotsTag);

      return addSecurityHeaders(
        new Response(withAdsense, {
          status: assetRes.status,
          headers,
        }),
      );
    }
    return addSecurityHeaders(assetRes);
  },
};
