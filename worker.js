import {
  clearAdminCookieHeaders,
  hasValidAdminCookie,
  isAdminEnabled,
  isAdminRequest,
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
import catalog from "./products.json";

const ADSENSE_CLIENT_ID = "ca-pub-5800977493749262";

const jsonResponse = (status, payload) =>
  addSecurityHeaders(
    new Response(JSON.stringify(payload), {
      status,
      headers: { "Content-Type": "application/json" },
    })
  );

const addSecurityHeaders = (response, options = {}) => {
  const headers = new Headers(response.headers);
  if (options.cacheControl) headers.set("Cache-Control", options.cacheControl);
  if (options.pragmaNoCache) headers.set("Pragma", "no-cache");
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

let paypalTokenCache = {
  mode: "",
  clientId: "",
  accessToken: "",
  expiresAtMs: 0,
};

const getPayPalMode = (env) => {
  const explicit = String(env.PAYPAL_ENV || env.PAYPAL_MODE || "")
    .trim()
    .toLowerCase();
  if (explicit === "live" || explicit === "sandbox") return explicit;
  if (env.PAYPAL_CLIENT_ID_PROD || env.PAYPAL_CLIENT_SECRET_PROD) return "live";
  return "sandbox";
};

const getPayPalCredentials = (env) => {
  const mode = getPayPalMode(env);
  const liveClientId = String(env.PAYPAL_CLIENT_ID_PROD || "").trim();
  const liveSecret = String(env.PAYPAL_CLIENT_SECRET_PROD || "").trim();
  const sandboxClientId = String(env.PAYPAL_CLIENT_ID || "").trim();
  const sandboxSecret = String(env.PAYPAL_CLIENT_SECRET || "").trim();

  if (mode === "live") {
    return {
      mode,
      clientId: liveClientId || sandboxClientId,
      clientSecret: liveSecret || sandboxSecret,
      apiBase: "https://api-m.paypal.com",
    };
  }
  return {
    mode,
    clientId: sandboxClientId || liveClientId,
    clientSecret: sandboxSecret || liveSecret,
    apiBase: "https://api-m.sandbox.paypal.com",
  };
};

const getPayPalAccessToken = async (env) => {
  const { mode, clientId, clientSecret, apiBase } = getPayPalCredentials(env);
  if (!clientId) {
    throw new Error("PayPal client id missing. Set PAYPAL_CLIENT_ID (sandbox) or PAYPAL_CLIENT_ID_PROD (live).");
  }
  if (!clientSecret) {
    throw new Error(
      "PayPal client secret missing. Set PAYPAL_CLIENT_SECRET (sandbox) or PAYPAL_CLIENT_SECRET_PROD (live)."
    );
  }

  const now = Date.now();
  const validCache =
    paypalTokenCache?.accessToken &&
    paypalTokenCache.mode === mode &&
    paypalTokenCache.clientId === clientId &&
    paypalTokenCache.expiresAtMs - 60_000 > now;
  if (validCache) return { accessToken: paypalTokenCache.accessToken, apiBase };

  const basic = btoa(`${clientId}:${clientSecret}`);
  const form = new URLSearchParams();
  form.set("grant_type", "client_credentials");
  const res = await fetch(`${apiBase}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = data?.error_description || data?.error || "PayPal token request failed.";
    throw new Error(detail);
  }

  const accessToken = String(data?.access_token || "");
  const expiresInSec = Number(data?.expires_in || 0);
  paypalTokenCache = {
    mode,
    clientId,
    accessToken,
    expiresAtMs: now + Math.max(0, expiresInSec) * 1000,
  };
  return { accessToken, apiBase };
};

const paypalApiFetch = async (env, path, init = {}) => {
  const { accessToken, apiBase } = await getPayPalAccessToken(env);
  const url = `${apiBase}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = new Headers(init.headers || {});
  headers.set("Authorization", `Bearer ${accessToken}`);
  headers.set("Content-Type", headers.get("Content-Type") || "application/json");
  headers.set("Accept", headers.get("Accept") || "application/json");
  return fetch(url, { ...init, headers });
};

// Simple dynamic-price PayPal helpers (mirrors existing catalog flow)
export const createPayPalOrder = async (env, product = {}) => {
  const amount = toUsdString(product.price);
  if (!amount) throw new Error("Invalid price.");
  const currency = (product.currency || "USD").toUpperCase();
  const body = {
    intent: "CAPTURE",
    purchase_units: [
      {
        reference_id: product.sku || "custom",
        description: product.name || "Custom Product",
        amount: { currency_code: currency, value: amount },
      },
    ],
  };
  const res = await paypalApiFetch(env, "/v2/checkout/orders", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || data?.details?.[0]?.description || "PayPal order create failed");
  return data;
};

export const capturePayPalOrder = async (env, orderID) => {
  const id = String(orderID || "").trim();
  if (!id) throw new Error("orderID required.");
  const res = await paypalApiFetch(env, `/v2/checkout/orders/${encodeURIComponent(id)}/capture`, {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || data?.details?.[0]?.description || "PayPal capture failed");
  return data;
};

const toUsdString = (amount) => {
  const n = Number(amount || 0);
  if (!Number.isFinite(n) || n <= 0) return "";
  return n.toFixed(2);
};

const ensureOrdersTable = async (env) => {
  if (!env.D1) return;
  await env.D1.prepare(
    `CREATE TABLE IF NOT EXISTS orders (
       id TEXT PRIMARY KEY,
       product_id TEXT,
       amount REAL,
       currency TEXT DEFAULT 'USD',
       status TEXT DEFAULT 'completed',
       customer_email TEXT,
       ts DATETIME DEFAULT CURRENT_TIMESTAMP
     );`
  ).run();
};

const base64UrlEncode = (input) => {
  const bytes = input instanceof Uint8Array ? input : new TextEncoder().encode(String(input));
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

const base64UrlDecode = (input) => {
  const padded = String(input)
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(input.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
};

const signLicensePayload = async (secret, payloadB64) => {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadB64));
  return base64UrlEncode(new Uint8Array(sig));
};

const issueLicenseToken = async (env, { email, term, plan, orderId }) => {
  const secret = String(env.LICENSE_SECRET || "").trim();
  if (!secret) throw new Error("License secret missing. Set LICENSE_SECRET.");

  const now = Math.floor(Date.now() / 1000);
  const termKey = String(term || "week").toLowerCase();
  const days = termKey === "month" ? 30 : termKey === "year" ? 365 : termKey === "perpetual" ? 3650 : 7;
  const exp = termKey === "perpetual" ? now + days * 86400 : now + days * 86400;

  const payload = {
    v: 1,
    iat: now,
    exp,
    email: String(email || "").trim(),
    term: termKey,
    plan: String(plan || "").trim(),
    orderId: String(orderId || "").trim(),
  };
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const sig = await signLicensePayload(secret, payloadB64);
  return `vtw1.${payloadB64}.${sig}`;
};

const verifyLicenseToken = async (env, token) => {
  const secret = String(env.LICENSE_SECRET || "").trim();
  if (!secret) throw new Error("License secret missing. Set LICENSE_SECRET.");
  const parts = String(token || "").split(".");
  if (parts.length !== 3 || parts[0] !== "vtw1") throw new Error("Invalid license format.");
  const payloadB64 = parts[1];
  const sig = parts[2];
  const expected = await signLicensePayload(secret, payloadB64);
  if (sig !== expected) throw new Error("Invalid license signature.");
  const payload = JSON.parse(base64UrlDecode(payloadB64));
  const now = Math.floor(Date.now() / 1000);
  if (payload?.exp && now > payload.exp) throw new Error("License expired.");
  return payload;
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const cleanPath = url.pathname.replace(/\/$/, "");
    const assets = env.ASSETS || env.SITE_ASSETS;

    if (!assets) {
      return jsonResponse(500, {
        error: "Static assets binding is missing on this Worker route.",
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
        let email = "";
        if (contentType.includes("application/json")) {
          const body = await request.json();
          password = String(body?.password || "");
          email = String(body?.email || "");
        } else if (
          contentType.includes("application/x-www-form-urlencoded") ||
          contentType.includes("multipart/form-data")
        ) {
          const form = await request.formData();
          password = String(form.get("password") || "");
          email = String(form.get("email") || "");
        } else {
          password = String(await request.text());
        }

        const validPassword = String(env.CONTROL_PASSWORD);
        const validEmail = String(env.ADMIN_EMAIL);

        if (!password || password !== validPassword || (validEmail && email !== validEmail)) {
          return jsonResponse(401, { error: "Invalid credentials." });
        }
        const cookieValue = await mintAdminCookieValue(env);
        const headers = new Headers({ "Content-Type": "application/json" });
        setAdminCookieHeaders(headers, cookieValue, {
          secure: url.protocol === "https:",
        });
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
      const hasAdmin = await hasValidAdminCookie(request, env);
      if (!hasAdmin) {
        return jsonResponse(401, { error: "Unauthorized" });
      }
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
        assets: !!(env.ASSETS || env.SITE_ASSETS),
        ts: new Date().toISOString(),
      });
    }

    if (url.pathname === "/api/config/status" && request.method === "GET") {
      const hasAdmin = await hasValidAdminCookie(request, env);
      if (!hasAdmin) {
        return jsonResponse(401, { error: "Unauthorized" });
      }
      return jsonResponse(200, {
        stripe_publishable: !!(env.STRIPE_PUBLISHABLE_KEY || env.STRIPE_PUBLIC),
        stripe_secret: !!env.STRIPE_SECRET_KEY,
        paypal_client_id: !!(env.PAYPAL_CLIENT_ID_PROD || env.PAYPAL_CLIENT_ID),
        paypal_secret: !!(env.PAYPAL_CLIENT_SECRET_PROD || env.PAYPAL_CLIENT_SECRET),
        paypal_mode: getPayPalMode(env),
        adsense_publisher: !!(env.ADSENSE_PUBLISHER || env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID),
        adsense_slots: {
          slot: !!env.ADSENSE_SLOT,
          top: !!env.ADSENSE_SLOT_TOP,
          mid: !!env.ADSENSE_SLOT_MID,
          bottom: !!env.ADSENSE_SLOT_BOTTOM,
        },
        ts: new Date().toISOString(),
      });
    }

    if (url.pathname === "/api/metrics" && request.method === "GET") {
      if (!env.D1) {
        return jsonResponse(503, { error: "D1 database not available." });
      }
      const since = "datetime('now','-24 hours')";
      const [commands, errors] = await Promise.all([
        env.D1.prepare(`SELECT COUNT(*) AS count FROM commands WHERE ts > ${since}`).first(),
        env.D1.prepare(`SELECT COUNT(*) AS count FROM errors WHERE ts > ${since}`)
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
      await env.D1.prepare("INSERT OR IGNORE INTO sessions (id, user_agent) VALUES (?,?)").bind(id, ua).run();
      return jsonResponse(200, { ok: true });
    }

    // Catalog API (single source of truth JSON)
    if (url.pathname === "/api/products" || url.pathname === "/api/catalog") {
      return jsonResponse(200, catalog);
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
           );`
        ).run();
      } catch (err) {
        console.error("Order table init failed:", err);
      }

      // POST: Record Order
      if (request.method === "POST") {
        try {
          const body = await request.json();
          // generate random ID if not provided
          const genId = "order-" + Date.now().toString(36) + Math.random().toString(36).slice(2);
          const { id, product_id, amount, customer_email } = body;
          const finalId = id || genId;

          await env.D1.prepare(`INSERT INTO orders (id, product_id, amount, customer_email) VALUES (?, ?, ?, ?)`)
            .bind(finalId, product_id || "unknown", Number(amount || 0), customer_email || "")
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

        const { results } = await env.D1.prepare("SELECT * FROM orders ORDER BY ts DESC LIMIT 50").all();
        return jsonResponse(200, { results: results || [] });
      }
    }

    if (url.pathname === "/api/checkout" && request.method === "POST") {
      try {
        const { provider, itemId, id } = await request.json(); // Support both 'id' (prompt) and 'itemId' (legacy)
        const targetId = id || itemId;

        // 1. Fetch Item from SOT (products.json)
        const allItems = [...(catalog.products || []), ...(catalog.apps || []), ...(catalog.subscriptions || [])];
        const item = allItems.find((p) => p.id === targetId);

        if (!item) return jsonResponse(404, { error: `Item not found: ${targetId}` });

        // 2. PayPal Flow
        if (provider === "paypal") {
          const order = await createPayPalOrder(env, {
            sku: item.id,
            name: item.name,
            price: item.price,
            currency: item.currency || "USD",
          });
          return jsonResponse(200, { id: order.id, status: order.status || "CREATED" });
        }

        // 3. Stripe Flow
        if (provider === "stripe") {
          const stripeKey = env.STRIPE_SECRET_KEY || env.STRIPE_SECRET;
          if (!stripeKey) throw new Error("Stripe not configured");

          const isSub = item.type === "subscription";
          const mode = isSub ? "subscription" : "payment";

          const params = new URLSearchParams();
          params.append("mode", mode);
          params.append("success_url", `${url.origin}/success.html`);
          params.append("cancel_url", `${url.origin}/cancel.html`);
          params.append("line_items[0][quantity]", "1");
          params.append("line_items[0][price_data][currency]", (item.currency || "usd").toLowerCase());
          params.append("line_items[0][price_data][product_data][name]", item.name);
          params.append("line_items[0][price_data][unit_amount]", Math.round(item.price * 100));

          if (isSub) {
            params.append("line_items[0][price_data][recurring][interval]", (item.interval || "month").toLowerCase());
          }

          const stRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${stripeKey}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: params,
          });
          const data = await stRes.json();
          if (!stRes.ok) throw new Error(data.error?.message || "Stripe session failed");
          return jsonResponse(200, { url: data.url, id: data.id });
        }

        return jsonResponse(400, { error: "Invalid provider" });
      } catch (err) {
        return jsonResponse(500, { error: err.message });
      }
    }

    // License issuance + verification
    if (url.pathname === "/api/license/issue" && request.method === "POST") {
      const hasAdmin = await hasValidAdminCookie(request, env);
      if (!hasAdmin) return jsonResponse(401, { error: "Unauthorized" });
      try {
        const payload = await request.json().catch(() => ({}));
        const email = String(payload?.email || "").trim();
        const term = String(payload?.term || "week").trim();
        const plan = String(payload?.plan || "starter").trim();
        const orderId = String(payload?.orderId || "").trim();
        if (!email) return jsonResponse(400, { error: "Email required." });

        const license = await issueLicenseToken(env, { email, term, plan, orderId });

        if (env.D1) {
          await env.D1.prepare(
            `CREATE TABLE IF NOT EXISTS licenses (
               id TEXT PRIMARY KEY,
               email TEXT,
               plan TEXT,
               term TEXT,
               order_id TEXT,
               status TEXT DEFAULT 'active',
               issued_at DATETIME DEFAULT CURRENT_TIMESTAMP
             );`
          ).run();
          await env.D1.prepare(
            "INSERT OR REPLACE INTO licenses (id, email, plan, term, order_id, status) VALUES (?, ?, ?, ?, ?, ?)"
          )
            .bind(license, email, plan, term, orderId, "active")
            .run();
        }

        return jsonResponse(200, { ok: true, license });
      } catch (err) {
        return jsonResponse(500, { error: err.message });
      }
    }

    if (url.pathname === "/api/license/verify" && request.method === "POST") {
      try {
        const payload = await request.json().catch(() => ({}));
        const license = String(payload?.license || "").trim();
        if (!license) return jsonResponse(400, { error: "License required." });

        const data = await verifyLicenseToken(env, license);
        if (env.D1) {
          try {
            await env.D1.prepare(
              `CREATE TABLE IF NOT EXISTS licenses (
                 id TEXT PRIMARY KEY,
                 email TEXT,
                 plan TEXT,
                 term TEXT,
                 order_id TEXT,
                 status TEXT DEFAULT 'active',
                 issued_at DATETIME DEFAULT CURRENT_TIMESTAMP
               );`
            ).run();
            const row = await env.D1.prepare("SELECT status FROM licenses WHERE id = ? LIMIT 1").bind(license).first();
            if (row && String(row.status || "").toLowerCase() !== "active") {
              return jsonResponse(403, { error: "License revoked." });
            }
          } catch (_) {}
        }
        return jsonResponse(200, { ok: true, data });
      } catch (err) {
        return jsonResponse(400, { error: err.message });
      }
    }

    // PayPal Orders API (dynamic price shortcut)
    if (url.pathname === "/api/paypal/create-order" && request.method === "POST") {
      try {
        const product = await request.json().catch(() => ({}));
        const order = await createPayPalOrder(env, product);
        return jsonResponse(200, { id: order.id, status: order.status || "CREATED" });
      } catch (err) {
        return jsonResponse(500, { error: err.message || "PayPal order create failed." });
      }
    }

    if (url.pathname === "/api/paypal/capture-order" && request.method === "POST") {
      try {
        const payload = await request.json().catch(() => ({}));
        const capture = await capturePayPalOrder(env, payload?.orderID || payload?.orderId || payload?.id);
        const cap = capture?.purchase_units?.[0]?.payments?.captures?.[0] || {};
        return jsonResponse(200, {
          id: capture?.id,
          status: capture?.status,
          captureId: cap.id,
          amount: cap?.amount?.value,
          currency: cap?.amount?.currency_code,
        });
      } catch (err) {
        return jsonResponse(500, { error: err.message || "PayPal capture failed." });
      }
    }

    // PayPal Orders API (server-side create + capture)
    if (url.pathname === "/api/paypal/order/create" && request.method === "POST") {
      try {
        const payload = await request.json().catch(() => ({}));

        const planCatalog = {
          starter: { amountUsd: 79.0, label: "Starter Site" },
          growth: { amountUsd: 249.0, label: "Growth Voice" },
          enterprise: { amountUsd: 699.0, label: "Enterprise Edge" },
          lifetime: { amountUsd: 4999.0, label: "Lifetime App" },
        };

        const skuCatalog = {
          "project-planning-hub": { amountUsd: 49.0, label: "Project Planning Hub" },
          "ai-web-forge-pro": { amountUsd: 49.99, label: "AI Web Forge Pro" },
          "ai-drive": { amountUsd: 4.99, label: "AI Drive" },
          "google-ai-prompts": { amountUsd: 2.99, label: "Google AI Prompts" },
        };

        const plan = String(payload?.product || payload?.plan || "")
          .trim()
          .toLowerCase();
        const sku = String(payload?.sku || "")
          .trim()
          .toLowerCase();
        const productId = String(payload?.productId || payload?.product_id || "").trim();

        let description = "";
        let amountUsd = 0;
        let productRef = "";

        if (sku && skuCatalog[sku]) {
          description = skuCatalog[sku].label;
          amountUsd = skuCatalog[sku].amountUsd;
          productRef = `sku:${sku}`;
        } else if (plan && planCatalog[plan]) {
          description = planCatalog[plan].label;
          amountUsd = planCatalog[plan].amountUsd;
          productRef = `plan:${plan}`;
        } else if (productId) {
          if (!env.D1) return jsonResponse(503, { error: "D1 database not available for product checkout." });
          const row = await env.D1.prepare("SELECT id, title, price FROM products WHERE id = ? AND active = 1 LIMIT 1")
            .bind(productId)
            .first();
          if (!row) return jsonResponse(404, { error: "Product not found." });

          description = String(row.title || row.id || "Product");
          amountUsd = Number(row.price || 0);
          productRef = `product:${String(row.id || productId)}`;
        } else {
          return jsonResponse(400, { error: "Missing product. Provide { product: 'starter' } or { productId }." });
        }

        const amount = toUsdString(amountUsd);
        if (!amount) return jsonResponse(400, { error: "Invalid product amount." });

        const reqId = crypto?.randomUUID
          ? crypto.randomUUID()
          : `vtw-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

        const body = {
          intent: "CAPTURE",
          purchase_units: [
            {
              description: description.slice(0, 127),
              custom_id: productRef.slice(0, 127),
              amount: { currency_code: "USD", value: amount },
            },
          ],
        };

        const ppRes = await paypalApiFetch(env, "/v2/checkout/orders", {
          method: "POST",
          headers: { "PayPal-Request-Id": reqId, Prefer: "return=representation" },
          body: JSON.stringify(body),
        });

        const data = await ppRes.json().catch(() => ({}));
        if (!ppRes.ok) {
          const detail =
            data?.message ||
            data?.error_description ||
            data?.error ||
            data?.details?.[0]?.description ||
            "PayPal order create failed.";
          return jsonResponse(ppRes.status || 500, { error: detail });
        }

        return jsonResponse(200, { id: data.id, status: data.status });
      } catch (err) {
        return jsonResponse(500, { error: err.message });
      }
    }

    if (
      (url.pathname === "/api/paypal/order/capture" || url.pathname === "/api/paypal/capture") &&
      request.method === "POST"
    ) {
      try {
        const payload = await request.json().catch(() => ({}));
        const orderId = String(payload?.orderId || payload?.orderID || payload?.id || "").trim();
        if (!orderId) return jsonResponse(400, { error: "Missing orderId." });

        const plan = String(payload?.product || payload?.plan || "")
          .trim()
          .toLowerCase();
        const sku = String(payload?.sku || "")
          .trim()
          .toLowerCase();
        const productId = String(payload?.productId || payload?.product_id || "").trim();
        const expectedRef = sku ? `sku:${sku}` : plan ? `plan:${plan}` : productId ? `product:${productId}` : "";

        if (expectedRef) {
          const getRes = await paypalApiFetch(env, `/v2/checkout/orders/${encodeURIComponent(orderId)}`, {
            method: "GET",
          });
          const getData = await getRes.json().catch(() => ({}));
          if (!getRes.ok) {
            const detail = getData?.message || getData?.details?.[0]?.description || "PayPal order lookup failed.";
            return jsonResponse(getRes.status || 500, { error: detail });
          }
          const actualRef = String(getData?.purchase_units?.[0]?.custom_id || "").trim();
          if (actualRef && actualRef !== expectedRef) {
            return jsonResponse(400, { error: "Order does not match requested product." });
          }
        }

        const capRes = await paypalApiFetch(env, `/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
          method: "POST",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify({}),
        });
        const capData = await capRes.json().catch(() => ({}));
        if (!capRes.ok) {
          const detail =
            capData?.message ||
            capData?.details?.[0]?.description ||
            capData?.error_description ||
            capData?.error ||
            "PayPal capture failed.";
          return jsonResponse(capRes.status || 500, { error: detail });
        }

        const payerEmail = String(capData?.payer?.email_address || "");
        const status = String(capData?.status || "").toLowerCase();
        const captureAmount = Number(
          capData?.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value ||
            capData?.purchase_units?.[0]?.amount?.value ||
            0
        );
        const currency = String(
          capData?.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.currency_code ||
            capData?.purchase_units?.[0]?.amount?.currency_code ||
            "USD"
        );
        const productRef =
          expectedRef || String(capData?.purchase_units?.[0]?.custom_id || "").trim() || "paypal:unknown";

        if (env.D1) {
          try {
            await ensureOrdersTable(env);
            const rowId = `paypal:${orderId}`;
            await env.D1.prepare(
              "INSERT OR IGNORE INTO orders (id, product_id, amount, currency, status, customer_email) VALUES (?, ?, ?, ?, ?, ?)"
            )
              .bind(rowId, productRef, Number.isFinite(captureAmount) ? captureAmount : 0, currency, status, payerEmail)
              .run();
          } catch (err) {
            console.warn("PayPal order log failed:", err);
          }
        }

        return jsonResponse(200, {
          ok: true,
          orderId,
          status,
          amount: Number.isFinite(captureAmount) ? captureAmount : 0,
          currency,
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
              error:
                "Stripe price ID not configured for this product. Set STRIPE_PRICE_* vars or enable STRIPE_ALLOW_CUSTOM_AMOUNT=1.",
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
      const res = await assets.fetch(new Request(adminUrl, request));
      return addSecurityHeaders(res, { cacheControl: "no-store", pragmaNoCache: true });
    }

    if (url.pathname.startsWith("/admin/")) {
      const adminRes = await assets.fetch(request);
      if (adminRes.status !== 404) {
        return addSecurityHeaders(adminRes, { cacheControl: "no-store", pragmaNoCache: true });
      }
      const adminUrl = new URL("/admin/index.html", url.origin);
      const res = await assets.fetch(new Request(adminUrl, request));
      return addSecurityHeaders(res, { cacheControl: "no-store", pragmaNoCache: true });
    }

    if (cleanPath && !cleanPath.includes(".") && cleanPath !== "/") {
      const htmlUrl = new URL(`${cleanPath}.html`, url.origin);
      const htmlRes = await assets.fetch(new Request(htmlUrl, request));
      if (htmlRes.status !== 404) {
        return addSecurityHeaders(htmlRes);
      }
    }

    // Default: serve the built static assets from ./dist with optional placeholder injection.
    const assetRes = await assets.fetch(request);
    // Never cache global "shell" assets (nav/wave/theme). This avoids getting stuck on an older navbar
    // when Cloudflare serves a stale response during revalidation.
    if (pathname === "/nav.js" || pathname === "/styles.css") {
      return addSecurityHeaders(assetRes, { cacheControl: "no-store", pragmaNoCache: true });
    }
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
      const isAdminPage = url.pathname === "/admin" || url.pathname.startsWith("/admin/");
      const isSecretPage = url.pathname.startsWith("/the3000");
      const robotsTag =
        isAdminPage || isSecretPage
          ? "noindex, nofollow"
          : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

      const defaultOgImage = `${url.origin}/vtw-wallpaper.png`;
      const defaultDescription = "VoiceToWebsite — autonomous web engineering, deployment, and monetization.";
      const descriptionByPath = {
        "/rush-percussion": "RUSH PERCUSSION: an interactive microgame demo from the VoiceToWebsite App Store.",
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
        0
      );

      // Inject strict replacements for legacy placeholders + new __ENV
      /*
       * Note: We inject __ENV before the closing </head> or <body> for availability.
       * We also continue to support direct text replacement for HTML-embedded tokens.
       */
      const injected = text
        .replace(/__PAYPAL_CLIENT_ID__/g, env.PAYPAL_CLIENT_ID_PROD || env.PAYPAL_CLIENT_ID || "")
        .replace(/__STRIPE_PUBLISHABLE_KEY__/g, env.STRIPE_PUBLISHABLE_KEY || env.STRIPE_PUBLIC || "")
        .replace(
          /__ADSENSE_PUBLISHER__/g,
          env.ADSENSE_PUBLISHER || env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID || ADSENSE_CLIENT_ID
        )
        .replace(/__ADSENSE_SLOT__/g, env.ADSENSE_SLOT || "")
        .replace("</head>", `${envInjection}</head>`); // Inject variables early

      // Strip any hard-coded AdSense loader scripts from HTML. Policy-based injection below.
      const strippedAdsense = injected.replace(
        /<script\b[^>]*\bsrc=["']https?:\/\/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=[^"']+["'][^>]*>\s*<\/script>\s*/gi,
        ""
      );

      // SEO: canonical + robots + stable OG/Twitter URLs + JSON-LD (server-side so crawlers see it).
      let seoInjected = strippedAdsense
        .replace(/<link\b[^>]*rel=["']canonical["'][^>]*>\s*/gi, "")
        .replace(/<meta\b[^>]*name=["']robots["'][^>]*>\s*/gi, "")
        .replace(/<meta\b[^>]*property=["']og:url["'][^>]*>\s*/gi, "")
        .replace(/<meta\b[^>]*(?:name|property)=["']twitter:url["'][^>]*>\s*/gi, "")
        .replace(
          /<script\b[^>]*type=["']application\/ld\+json["'][^>]*id=["']vtw-jsonld["'][\s\S]*?<\/script>\s*/gi,
          ""
        );

      const hasOgImage = /<meta\b[^>]*property=["']og:image["']/i.test(seoInjected);
      const hasTwitterImage = /<meta\b[^>]*(?:name|property)=["']twitter:image["']/i.test(seoInjected);
      const hasTwitterCard = /<meta\b[^>]*(?:name|property)=["']twitter:card["']/i.test(seoInjected);
      const hasOgType = /<meta\b[^>]*property=["']og:type["']/i.test(seoInjected);
      const hasOgSiteName = /<meta\b[^>]*property=["']og:site_name["']/i.test(seoInjected);
      const hasDescription = /<meta\b[^>]*name=["']description["']/i.test(seoInjected);
      const fallbackDescription = descriptionByPath[seoPath] || defaultDescription;

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

      seoInjected = seoInjected.replace("</head>", `${sanitizedSeoBlock}\n</head>`);

      // Ads policy: only load AdSense on pages that explicitly render ad slots and are allowed.
      const wantsAds = /\badsbygoogle\b/.test(seoInjected) || seoInjected.includes("__ADSENSE_SLOT__");
      const isAdsAllowed =
        normalizedPath === "/blog" ||
        normalizedPath === "/projects" ||
        normalizedPath === "/studio3000" ||
        url.pathname === "/blog.html" ||
        url.pathname === "/projects.html" ||
        url.pathname === "/studio3000.html";

      const shouldInjectAdsense = wantsAds && isAdsAllowed && !isAdminPage && !isSecretPage;

      const adsensePublisher = env.ADSENSE_PUBLISHER || env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID || ADSENSE_CLIENT_ID;

      const adsenseScriptTag = `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsensePublisher}" crossorigin="anonymous"></script>`;

      const withAdsense = shouldInjectAdsense
        ? seoInjected.includes("pagead2.googlesyndication.com/pagead/js/adsbygoogle.js")
          ? seoInjected.replace(
              /pagead\/js\/adsbygoogle\.js\?client=[^"'\s>]+/g,
              `pagead/js/adsbygoogle.js?client=${adsensePublisher}`
            )
          : seoInjected.replace("</head>", `${adsenseScriptTag}\n</head>`)
        : seoInjected;

      const headers = new Headers(assetRes.headers);
      headers.set("Content-Type", "text/html; charset=utf-8");

      // Cache policy:
      // HTML is always "no-store" so new deploys show up immediately and we never get stuck on a stale
      // navbar / old asset hashes due to edge stale-while-revalidate behavior.
      headers.set("Cache-Control", "no-store");
      headers.set("Pragma", "no-cache");
      headers.set("X-Robots-Tag", robotsTag);

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
