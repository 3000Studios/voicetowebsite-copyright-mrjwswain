import {
  clearAdminCookieHeaders,
  hasValidAdminCookie,
  isAdminEnabled,
  isAdminRequest,
  mintAdminCookieValue,
  setAdminCookieHeaders,
} from "./functions/adminAuth.js";
import { handleBotHubRequest } from "./functions/botHub.js";
import { onRequestPost as handleChatRequest } from "./functions/chat.js";
import { onRequestPost as handleExecuteRequest } from "./functions/execute.js";
import { getCapabilityManifest } from "./functions/capabilities.js";
import { onRequestPost as handleGodmodeInferRequest } from "./functions/godmode.js";
import { handleImageSearchRequest } from "./functions/imageSearch.js";
import { onRequestPost as handleOrchestrator } from "./functions/orchestrator.js";
import {
  handleGenerateRequest,
  handlePreviewApiRequest,
  handlePreviewPageRequest,
  handlePublishRequest,
  handleStylePacksRequest,
} from "./functions/siteGenerator.js";
import { handleSupportChatRequest } from "./functions/supportChat.js";
import catalog from "./products.json";
import { BotHubDO } from "./src/durable_objects/BotHubDO.js";
import { handleUICommand } from "./src/functions/uiCommand.js";

const ADSENSE_CLIENT_ID = "ca-pub-5800977493749262";
const CONTENT_SECURITY_POLICY = [
  "default-src 'self' https: data: blob:",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://www.googletagmanager.com https://www.google-analytics.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "media-src 'self' data: blob: https:",
  "connect-src 'self' https:",
  "frame-src 'self' https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://www.youtube.com",
  "worker-src 'self' blob:",
].join("; ");

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
  headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload"
  );
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "SAMEORIGIN");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set(
    "Permissions-Policy",
    "geolocation=(), microphone=(self), camera=(self)"
  );
  headers.set("Content-Security-Policy", CONTENT_SECURITY_POLICY);
  headers.set("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  headers.set("Cross-Origin-Resource-Policy", "cross-origin");
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

const getPayPalCredentialsForMode = (env, mode) => {
  const liveClientId = String(env.PAYPAL_CLIENT_ID_PROD || "").trim();
  const liveSecret = String(env.PAYPAL_CLIENT_SECRET_PROD || "").trim();
  const sandboxClientId = String(env.PAYPAL_CLIENT_ID || "").trim();
  const sandboxSecret = String(env.PAYPAL_CLIENT_SECRET || "").trim();
  if (mode === "live") {
    return {
      mode: "live",
      clientId: liveClientId || sandboxClientId,
      clientSecret: liveSecret || sandboxSecret,
      apiBase: "https://api-m.paypal.com",
    };
  }
  return {
    mode: "sandbox",
    clientId: sandboxClientId || liveClientId,
    clientSecret: sandboxSecret || liveSecret,
    apiBase: "https://api-m.sandbox.paypal.com",
  };
};

const isPayPalAuthError = (status, detail) => {
  const d = String(detail || "").toLowerCase();
  return (
    status === 401 ||
    d.includes("authentication") ||
    d.includes("invalid client")
  );
};

const requestPayPalAccessToken = async ({
  clientId,
  clientSecret,
  apiBase,
}) => {
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
  return { ok: res.ok, status: res.status, data };
};

const getPayPalAccessToken = async (env) => {
  const { mode, clientId, clientSecret, apiBase } = getPayPalCredentials(env);
  if (!clientId) {
    throw new Error(
      "PayPal client id missing. Set PAYPAL_CLIENT_ID (sandbox) or PAYPAL_CLIENT_ID_PROD (live)."
    );
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
  const primary = { mode, clientId, clientSecret, apiBase };
  let tokenRes = await requestPayPalAccessToken(primary);
  let active = primary;

  // If mode is misconfigured for current credentials, auto-fallback once.
  if (!tokenRes.ok) {
    const detail =
      tokenRes?.data?.error_description || tokenRes?.data?.error || "";
    if (isPayPalAuthError(tokenRes.status, detail)) {
      const alternateMode = mode === "live" ? "sandbox" : "live";
      const alternate = getPayPalCredentialsForMode(env, alternateMode);
      const hasAlternate =
        alternate.clientId &&
        alternate.clientSecret &&
        (alternate.clientId !== primary.clientId ||
          alternate.clientSecret !== primary.clientSecret);
      if (hasAlternate) {
        const fallbackRes = await requestPayPalAccessToken(alternate);
        if (fallbackRes.ok) {
          tokenRes = fallbackRes;
          active = alternate;
        }
      }
    }
  }

  if (!tokenRes.ok) {
    const detail =
      tokenRes?.data?.error_description ||
      tokenRes?.data?.error ||
      "PayPal token request failed.";
    throw new Error(
      `${detail} (Mode: ${mode}, ClientID: ${clientId.substring(0, 8)}..., API: ${apiBase})`
    );
  }

  const accessToken = String(tokenRes?.data?.access_token || "");
  const expiresInSec = Number(tokenRes?.data?.expires_in || 0);
  paypalTokenCache = {
    mode: active.mode,
    clientId: active.clientId,
    accessToken,
    expiresAtMs: now + Math.max(0, expiresInSec) * 1000,
  };
  return { accessToken, apiBase: active.apiBase };
};

const paypalApiFetch = async (env, path, init = {}) => {
  const { accessToken, apiBase } = await getPayPalAccessToken(env);
  const url = `${apiBase}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = new Headers(init.headers || {});
  headers.set("Authorization", `Bearer ${accessToken}`);
  headers.set(
    "Content-Type",
    headers.get("Content-Type") || "application/json"
  );
  headers.set("Accept", headers.get("Accept") || "application/json");
  return fetch(url, { ...init, headers });
};

const getPayPalClientToken = async (env) => {
  const { apiBase } = await getPayPalAccessToken(env);
  const res = await paypalApiFetch(env, "/v1/identity/generate-token", {
    method: "POST",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error(data?.message || "Failed to generate PayPal client token.");
  return data.client_token;
};

// Standardized error response helper
const createErrorResponse = (status, message, code = null) => {
  return jsonResponse(status, {
    success: false,
    error: message,
    code: code,
    timestamp: new Date().toISOString(),
  });
};

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const normalizeBlogPostId = (value) => {
  const raw = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");
  return raw || "general";
};

const getClientIp = (request) =>
  request.headers.get("CF-Connecting-IP") ||
  request.headers.get("x-forwarded-for") ||
  "unknown";

const loadBlogComments = async (env, postId) => {
  if (!env.KV) return [];
  const key = `blog:comments:${postId}`;
  const raw = await env.KV.get(key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
};

const saveBlogComments = async (env, postId, comments) => {
  if (!env.KV) return;
  const key = `blog:comments:${postId}`;
  const trimmed = Array.isArray(comments) ? comments.slice(0, 200) : [];
  await env.KV.put(key, JSON.stringify(trimmed));
};

const blogCommentRateLimit = async (env, ip) => {
  if (!env.KV || !ip || ip === "unknown") return true;
  const key = `blog:rate:${ip}`;
  const raw = await env.KV.get(key);
  const count = Number.parseInt(raw || "0", 10) || 0;
  if (count >= 6) return false;
  await env.KV.put(key, String(count + 1), { expirationTtl: 3600 });
  return true;
};

const getPayPalPlanLinks = (env, origin) => {
  const fallback = (plan) =>
    `${origin}/store.html?plan=${encodeURIComponent(plan)}&pay=paypal`;
  const fromEnv = (key, plan) =>
    String(env[key] || "").trim() || fallback(plan);
  return [
    {
      plan: "starter",
      label: "Starter Site",
      link: fromEnv("PAYPAL_PAYMENT_LINK_STARTER", "starter"),
    },
    {
      plan: "growth",
      label: "Growth Voice",
      link: fromEnv("PAYPAL_PAYMENT_LINK_GROWTH", "growth"),
    },
    {
      plan: "enterprise",
      label: "Enterprise Edge",
      link: fromEnv("PAYPAL_PAYMENT_LINK_ENTERPRISE", "enterprise"),
    },
    {
      plan: "lifetime",
      label: "Lifetime App",
      link: fromEnv("PAYPAL_PAYMENT_LINK_LIFETIME", "lifetime"),
    },
  ];
};

const buildDemoEmailHtml = ({ previewUrl, prompt, plans }) => {
  const promptSafe = escapeHtml(prompt || "");
  const planLinks = plans
    .map(
      (p) =>
        `<li style="margin:8px 0;"><a href="${escapeHtml(p.link)}" target="_blank" rel="noopener noreferrer">${escapeHtml(p.label)}</a></li>`
    )
    .join("");
  return `
    <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.5;color:#111;">
      <h2>Your VoiceToWebsite preview is ready</h2>
      <p><strong>Live preview:</strong> <a href="${escapeHtml(previewUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(previewUrl)}</a></p>
      <p><strong>Your request:</strong> ${promptSafe || "Website build request"}</p>
      <h3>Purchase options (PayPal)</h3>
      <ul style="padding-left:18px;">${planLinks}</ul>
      <p>You can reply to this email if you want us to publish directly to your domain.</p>
    </div>
  `;
};

const buildDemoEmailText = ({ previewUrl, prompt, plans }) => {
  const options = plans.map((p) => `- ${p.label}: ${p.link}`).join("\n");
  return `Your VoiceToWebsite preview is ready.\n\nLive preview: ${previewUrl}\n\nRequest: ${prompt || "Website build request"}\n\nPayPal options:\n${options}\n`;
};

const sendDemoEmail = async (env, { to, subject, html, text }) => {
  const resendKey = String(env.RESEND_API_KEY || "").trim();
  const sendgridKey = String(env.SENDGRID_API_KEY || "").trim();
  const from = String(
    env.DEMO_EMAIL_FROM ||
      env.EMAIL_FROM ||
      "VoiceToWebsite <noreply@voicetowebsite.com>"
  ).trim();

  if (resendKey) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html,
        text,
      }),
    });
    const data = await res.json().catch(() => ({}));
    return { sent: res.ok, provider: "resend", details: data };
  }

  if (sendgridKey) {
    const fromEmailMatch = from.match(/<([^>]+)>/);
    const fromEmail = fromEmailMatch ? fromEmailMatch[1] : from;
    const fromName = fromEmailMatch
      ? from.replace(/\s*<[^>]+>\s*/, "")
      : "VoiceToWebsite";
    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sendgridKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: fromEmail, name: fromName },
        subject,
        content: [
          { type: "text/plain", value: text },
          { type: "text/html", value: html },
        ],
      }),
    });
    const details = await res.text().catch(() => "");
    return { sent: res.ok, provider: "sendgrid", details };
  }

  // MailChannels fallback (no API key required for many Worker setups).
  const fromEmailMatch = from.match(/<([^>]+)>/);
  const fromEmail = fromEmailMatch ? fromEmailMatch[1] : from;
  const fromName = fromEmailMatch
    ? from.replace(/\s*<[^>]+>\s*/, "")
    : "VoiceToWebsite";
  const mcRes = await fetch("https://api.mailchannels.net/tx/v1/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: fromEmail, name: fromName },
      subject,
      content: [
        { type: "text/plain", value: text },
        { type: "text/html", value: html },
      ],
    }),
  });
  const details = await mcRes.text().catch(() => "");
  return { sent: mcRes.ok, provider: "mailchannels", details };
};

// Generate HMAC signature using Web Crypto API
const generateSignature = async (data, secret) => {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(data);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
};

const getSignatureSecret = (env) => String(env.SIGNATURE_SECRET || "").trim();

// Generate signed URL with expiration
const generateSignedUrl = async (
  env,
  appId,
  licenseKey,
  expiresMinutes = 60
) => {
  const expires = Date.now() + expiresMinutes * 60 * 1000;
  const data = `${appId}:${licenseKey}:${expires}`;
  const secret = getSignatureSecret(env);
  if (!secret) {
    throw new Error("SIGNATURE_SECRET is required to generate signed URLs.");
  }
  const signature = await generateSignature(data, secret);
  return `/api/apps/download/${appId}?license=${licenseKey}&expires=${expires}&sig=${signature}`;
};

// Verify signed URL
const verifySignedUrl = async (env, appId, licenseKey, expires, signature) => {
  try {
    const secret = getSignatureSecret(env);
    if (!secret) return false;
    const data = `${appId}:${licenseKey}:${expires}`;
    const expectedSignature = await generateSignature(data, secret);
    return (
      signature === expectedSignature && Date.now() < parseInt(expires, 10)
    );
  } catch {
    return false;
  }
};

// Simple dynamic-price PayPal helpers (mirrors existing catalog flow)
// Simple dynamic-price PayPal helper (supports single item or array)
export const createPayPalOrder = async (env, itemsOrProduct) => {
  const items = Array.isArray(itemsOrProduct)
    ? itemsOrProduct
    : [itemsOrProduct];
  if (items.length === 0) throw new Error("No items provided.");

  const total = items.reduce((sum, item) => sum + Number(item.price || 0), 0);
  const currency = (items[0].currency || "USD").toUpperCase();
  const amountStr = toUsdString(total);

  if (!amountStr) throw new Error("Invalid total price.");

  const body = {
    intent: "CAPTURE",
    purchase_units: [
      {
        reference_id: items[0].sku || "custom",
        description:
          items
            .map((i) => i.name)
            .join(", ")
            .slice(0, 127) || "Order",
        amount: {
          currency_code: currency,
          value: amountStr,
          breakdown: {
            item_total: { currency_code: currency, value: amountStr },
          },
        },
        items: items.map((i) => ({
          name: (i.name || "Product").slice(0, 127),
          unit_amount: { currency_code: currency, value: toUsdString(i.price) },
          quantity: "1",
        })),
      },
    ],
  };

  const res = await paypalApiFetch(env, "/v2/checkout/orders", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error(
      data?.message ||
        data?.details?.[0]?.description ||
        "PayPal order create failed"
    );
  return data;
};

export const capturePayPalOrder = async (env, orderID) => {
  const id = String(orderID || "").trim();
  if (!id) throw new Error("orderID required.");
  const res = await paypalApiFetch(
    env,
    `/v2/checkout/orders/${encodeURIComponent(id)}/capture`,
    {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({}),
    }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error(
      data?.message ||
        data?.details?.[0]?.description ||
        "PayPal capture failed"
    );
  return data;
};

const toUsdString = (amount) => {
  const n = Number(amount || 0);
  if (!Number.isFinite(n) || n <= 0) return "";
  return n.toFixed(2);
};

const findProduct = (idOrSlug) => {
  const searchId = String(idOrSlug || "")
    .trim()
    .toLowerCase();
  if (!searchId) return null;
  const all = [
    ...(catalog.products || []),
    ...(catalog.apps || []),
    ...(catalog.subscriptions || []),
  ];
  return all.find(
    (p) =>
      String(p.id || "").toLowerCase() === searchId ||
      String(p.title || "").toLowerCase() === searchId
  );
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
       license_key TEXT,
       ts DATETIME DEFAULT CURRENT_TIMESTAMP
     );`
  ).run();

  // Add license_key column if it doesn't exist (for backward compatibility)
  try {
    await env.D1.prepare(
      `ALTER TABLE orders ADD COLUMN license_key TEXT`
    ).run();
  } catch (err) {
    // Column already exists, ignore error
  }
};

const base64UrlEncode = (input) => {
  const bytes =
    input instanceof Uint8Array
      ? input
      : new TextEncoder().encode(String(input));
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
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
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payloadB64)
  );
  return base64UrlEncode(new Uint8Array(sig));
};

const issueLicenseToken = async (env, { email, term, plan, orderId }) => {
  const secret = String(env.LICENSE_SECRET || "").trim();
  if (!secret) throw new Error("License secret missing. Set LICENSE_SECRET.");

  const now = Math.floor(Date.now() / 1000);
  const termKey = String(term || "week").toLowerCase();
  const days =
    termKey === "month"
      ? 30
      : termKey === "year"
        ? 365
        : termKey === "perpetual"
          ? 3650
          : 7;
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
  if (parts.length !== 3 || parts[0] !== "vtw1")
    throw new Error("Invalid license format.");
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

    // Allow API routes to function even if the static assets binding is misconfigured.
    // This helps with emergency debugging and admin recovery.
    if (!assets && !url.pathname.startsWith("/api/")) {
      return jsonResponse(500, {
        error: "Static assets binding is missing on this Worker route.",
      });
    }

    // Admin access code validation
    if (
      url.pathname === "/api/admin/access-code" &&
      request.method === "POST"
    ) {
      try {
        const body = await request.clone().json();
        const { accessCode } = body;

        // Access-code gate. Prefer a distinct ADMIN_ACCESS_CODE, but fall back to CONTROL_PASSWORD
        // so a single configured value can unlock the admin UX flow.
        const validAccessCode = String(
          env.ADMIN_ACCESS_CODE || env.CONTROL_PASSWORD || ""
        ).trim();
        if (!validAccessCode) {
          return createErrorResponse(
            503,
            "Admin access code is not configured",
            "ADMIN_ACCESS_DISABLED"
          );
        }

        if (!accessCode || String(accessCode).trim() !== validAccessCode) {
          return createErrorResponse(
            401,
            "Invalid access code",
            "INVALID_ACCESS_CODE"
          );
        }

        return jsonResponse(200, {
          success: true,
          message: "Access code validated",
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        return createErrorResponse(500, err.message, "ACCESS_CODE_ERROR");
      }
    }

    // Admin auth (server-issued, signed cookie)
    if (url.pathname === "/api/admin/login" && request.method === "POST") {
      try {
        if (!isAdminEnabled(env)) {
          return jsonResponse(503, {
            error:
              "Admin is disabled. Set CONTROL_PASSWORD (recommended) or ADMIN_ACCESS_CODE to enable admin login.",
          });
        }

        const contentType = request.headers.get("content-type") || "";
        let accessCode = "";
        if (contentType.includes("application/json")) {
          const body = await request.clone().json();
          accessCode = String(body?.accessCode || body?.password || "");
        } else if (
          contentType.includes("application/x-www-form-urlencoded") ||
          contentType.includes("multipart/form-data")
        ) {
          const form = await request.clone().formData();
          accessCode = String(
            form.get("accessCode") || form.get("password") || ""
          );
        } else {
          accessCode = String(await request.clone().text());
        }

        const validAccessCode = String(env.CONTROL_PASSWORD || "").trim();
        const validAltCode = String(env.ADMIN_ACCESS_CODE || "").trim();

        if (!validAccessCode && !validAltCode) {
          return jsonResponse(503, {
            error:
              "Admin is disabled. Set CONTROL_PASSWORD (recommended) or ADMIN_ACCESS_CODE to enable admin login.",
          });
        }

        const provided = String(accessCode || "").trim();
        const ok =
          (validAccessCode && provided === validAccessCode) ||
          (validAltCode && provided === validAltCode);

        if (!ok) {
          return jsonResponse(401, { error: "Invalid access code." });
        }
        const cookieValue = await mintAdminCookieValue(env);
        const headers = new Headers({ "Content-Type": "application/json" });
        setAdminCookieHeaders(headers, cookieValue, {
          secure: url.protocol === "https:",
        });
        return addSecurityHeaders(
          new Response(JSON.stringify({ ok: true }), { status: 200, headers })
        );
      } catch (err) {
        return jsonResponse(500, { error: err.message });
      }
    }

    if (url.pathname === "/api/admin/logout" && request.method === "POST") {
      const headers = new Headers({ "Content-Type": "application/json" });
      clearAdminCookieHeaders(headers, { secure: url.protocol === "https:" });
      return addSecurityHeaders(
        new Response(JSON.stringify({ ok: true }), { status: 200, headers })
      );
    }

    if (url.pathname === "/api/blog/comments") {
      if (!env.KV) {
        return jsonResponse(503, {
          error: "Comments storage unavailable.",
        });
      }
      if (request.method === "GET") {
        const postId = normalizeBlogPostId(url.searchParams.get("post"));
        const comments = await loadBlogComments(env, postId);
        return jsonResponse(200, { ok: true, post: postId, comments });
      }
      if (request.method === "POST") {
        try {
          const body = await request.clone().json();
          const postId = normalizeBlogPostId(body?.post);
          const name = String(body?.name || "Anonymous")
            .trim()
            .slice(0, 60);
          const message = String(body?.message || "")
            .trim()
            .slice(0, 800);
          if (!message) {
            return jsonResponse(400, { error: "Message is required." });
          }
          const ip = getClientIp(request);
          const allowed = await blogCommentRateLimit(env, ip);
          if (!allowed) {
            return jsonResponse(429, {
              error: "Rate limit reached. Try again later.",
            });
          }
          const comments = await loadBlogComments(env, postId);
          const entry = {
            id: crypto.randomUUID(),
            name,
            message,
            ts: new Date().toISOString(),
          };
          comments.unshift(entry);
          await saveBlogComments(env, postId, comments);
          return jsonResponse(200, { ok: true, comment: entry });
        } catch (err) {
          return jsonResponse(500, { error: err.message });
        }
      }
      return jsonResponse(405, { error: "Method not allowed." });
    }

    // Voice-to-layout routes (edge / Workers AI + D1 + R2)
    if (url.pathname === "/api/generate" && request.method === "POST") {
      return addSecurityHeaders(
        await handleGenerateRequest({ request, env, ctx })
      );
    }
    if (url.pathname === "/api/preview" && request.method === "GET") {
      return addSecurityHeaders(
        await handlePreviewApiRequest({ request, env, ctx })
      );
    }
    if (url.pathname.startsWith("/preview/") && request.method === "GET") {
      return addSecurityHeaders(
        await handlePreviewPageRequest({ request, env, ctx })
      );
    }
    if (url.pathname === "/api/publish" && request.method === "POST") {
      return addSecurityHeaders(
        await handlePublishRequest({ request, env, ctx })
      );
    }
    if (url.pathname === "/api/style-packs" && request.method === "GET") {
      return addSecurityHeaders(
        await handleStylePacksRequest({ request, env, ctx })
      );
    }
    if (url.pathname === "/api/demo/save" && request.method === "POST") {
      try {
        const body = await request.clone().json();
        const email = String(body?.email || "")
          .trim()
          .toLowerCase();
        const prompt = String(body?.prompt || "").trim();
        const transcript = String(body?.transcript || "").trim();
        const siteType = String(body?.siteType || "").trim();
        const theme = String(body?.theme || "").trim();
        const stylePackIds = Array.isArray(body?.stylePackIds)
          ? body.stylePackIds.map((v) => String(v || "").trim()).filter(Boolean)
          : [];

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return jsonResponse(400, { error: "Valid email required." });
        }
        if (!prompt) {
          return jsonResponse(400, { error: "Prompt required." });
        }

        // Generate a live preview first so the email always contains a concrete link.
        const generateReq = new Request(new URL("/api/generate", request.url), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            transcript,
            tone: theme || siteType || "default",
            stylePackIds,
          }),
        });
        const generateRes = await handleGenerateRequest({
          request: generateReq,
          env,
          ctx,
        });
        const generateData = await generateRes
          .clone()
          .json()
          .catch(() => ({}));
        if (!generateRes.ok || !generateData?.siteId) {
          return jsonResponse(generateRes.status || 500, {
            error: generateData?.error || "Failed to generate preview.",
          });
        }

        const origin = `${url.protocol}//${url.host}`;
        const previewUrl = new URL(
          String(generateData.previewUrl || `/preview/${generateData.siteId}`),
          origin
        ).toString();
        const paymentOptions = getPayPalPlanLinks(env, origin);

        const subject = "Your VoiceToWebsite preview + PayPal options";
        const html = buildDemoEmailHtml({
          previewUrl,
          prompt,
          plans: paymentOptions,
        });
        const text = buildDemoEmailText({
          previewUrl,
          prompt,
          plans: paymentOptions,
        });
        const emailResult = await sendDemoEmail(env, {
          to: email,
          subject,
          html,
          text,
        });

        if (env.D1) {
          try {
            await env.D1.prepare(
              `CREATE TABLE IF NOT EXISTS demo_leads (
                 id TEXT PRIMARY KEY,
                 ts DATETIME DEFAULT CURRENT_TIMESTAMP,
                 email TEXT,
                 prompt TEXT,
                 site_type TEXT,
                 theme TEXT,
                 style_pack_ids TEXT,
                 site_id TEXT,
                 preview_url TEXT,
                 email_provider TEXT,
                 email_sent INTEGER
               );`
            ).run();
            await env.D1.prepare(
              `INSERT INTO demo_leads (id, email, prompt, site_type, theme, style_pack_ids, site_id, preview_url, email_provider, email_sent)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            )
              .bind(
                crypto.randomUUID(),
                email,
                prompt,
                siteType,
                theme,
                JSON.stringify(stylePackIds),
                String(generateData.siteId),
                previewUrl,
                String(emailResult?.provider || ""),
                emailResult?.sent ? 1 : 0
              )
              .run();
          } catch (err) {
            console.warn("demo_leads insert failed:", err);
          }
        }

        return jsonResponse(200, {
          ok: true,
          siteId: String(generateData.siteId),
          previewUrl,
          layout: generateData.layout || null,
          paymentOptions,
          email: {
            sent: Boolean(emailResult?.sent),
            provider: emailResult?.provider || "",
            error: emailResult?.sent
              ? ""
              : String(emailResult?.details || "Email delivery failed."),
          },
        });
      } catch (err) {
        return jsonResponse(500, {
          error: err.message || "Failed to save demo lead.",
        });
      }
    }

    // Bot hub (coordination + shared brief for multiple AI bots)
    if (url.pathname.startsWith("/api/bot-hub")) {
      return addSecurityHeaders(
        await handleBotHubRequest({ request, env, ctx })
      );
    }

    // PayPal Client Token for v6 SDK
    if (
      url.pathname === "/api/paypal/client-token" &&
      request.method === "POST"
    ) {
      try {
        const token = await getPayPalClientToken(env);
        return jsonResponse(200, { clientToken: token });
      } catch (err) {
        return jsonResponse(500, { error: err.message });
      }
    }

    // Bot status feed for the voice command center UI.
    // Keeps payload small and tolerates missing tables.
    if (url.pathname === "/api/bots/status" && request.method === "GET") {
      if (!env.D1) {
        return jsonResponse(503, { error: "D1 database not available." });
      }
      try {
        // Legacy orchestrator commands (written by /api/orchestrator).
        let legacyCommands = [];
        try {
          const commandsRes = await env.D1.prepare(
            "SELECT id, ts, command, actions, files, deployment_status FROM commands ORDER BY ts DESC LIMIT 5"
          ).all();
          legacyCommands = commandsRes.results || [];
        } catch (_) {
          legacyCommands = [];
        }

        // Canonical execute events (written by /api/execute; Custom GPT uses this).
        // We project them into the same shape as `commands` so the existing UI shows them.
        let executeCommands = [];
        try {
          const execRes = await env.D1.prepare(
            "SELECT event_id AS id, ts, action, idempotency_key, status, response_json FROM execute_events ORDER BY ts DESC LIMIT 5"
          ).all();
          const rows = execRes.results || [];
          executeCommands = rows.map((row) => {
            let commandText = null;
            let files = null;
            try {
              const payload = JSON.parse(row.response_json || "{}");
              commandText = payload?.action?.command || null;
              const file = payload?.action?.file || null;
              const page =
                payload?.action?.page || payload?.action?.path || null;
              files = [file, page].filter(Boolean).join(", ") || null;
              if (!commandText) {
                const a = payload?.action?.action || row.action || "execute";
                commandText =
                  `[${a}] ${row.idempotency_key || row.id || ""}`.trim();
              }
            } catch (_) {
              // Ignore parsing failures; fallback below.
            }

            if (!commandText) {
              commandText =
                `[${row.action || "execute"}] ${row.idempotency_key || row.id || ""}`.trim();
            }

            const statusCode = Number(row.status || 0);
            const deploymentStatus = statusCode >= 400 ? "failed" : "ok";
            return {
              id: `exec:${row.id}`,
              ts: row.ts,
              command: commandText,
              actions: row.action,
              files,
              deployment_status: deploymentStatus,
              source: "execute",
            };
          });
        } catch (_) {
          executeCommands = [];
        }

        const combinedCommands = [...legacyCommands, ...executeCommands]
          .filter((c) => c && c.ts)
          .sort((a, b) => new Date(b.ts) - new Date(a.ts))
          .slice(0, 5);

        let builds = [];
        try {
          const buildsRes = await env.D1.prepare(
            "SELECT id, ts, status, message FROM builds ORDER BY ts DESC LIMIT 5"
          ).all();
          builds = buildsRes.results || [];
        } catch (_) {
          builds = [];
        }
        return jsonResponse(200, {
          commands: combinedCommands,
          builds,
        });
      } catch (err) {
        return jsonResponse(500, { error: err.message });
      }
    }

    // UI Command API (Custom GPT webhook + device UI control)
    if (url.pathname === "/api/ui-command" && request.method === "POST") {
      return addSecurityHeaders(await handleUICommand(request, env, ctx));
    }

    // Execute API (canonical orchestration endpoint for Custom GPT)
    if (url.pathname === "/api/execute" && request.method === "POST") {
      return addSecurityHeaders(
        await handleExecuteRequest({ request, env, ctx })
      );
    }

    // Public customer chat (AI assistant) used by the site widget.
    if (url.pathname === "/api/chat" && request.method === "POST") {
      return addSecurityHeaders(await handleChatRequest({ request, env, ctx }));
    }

    // Support inbox (customer -> admin) + admin replies.
    if (url.pathname.startsWith("/api/support/")) {
      return addSecurityHeaders(
        await handleSupportChatRequest({ request, env, ctx })
      );
    }

    // Image & Video Discovery API (for Custom GPT "add image of X" commands)
    if (
      url.pathname === "/api/image-search" &&
      (request.method === "POST" || request.method === "GET")
    ) {
      return addSecurityHeaders(
        await handleImageSearchRequest(request, env, ctx)
      );
    }

    // Godmode NL inference + preview (admin-only)
    if (url.pathname === "/api/godmode/infer" && request.method === "POST") {
      return addSecurityHeaders(
        await handleGodmodeInferRequest({ request, env, ctx })
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

      const isAdmin = await isAdminRequest(request, env);
      if (!isAdmin) {
        return jsonResponse(401, {
          error: "Unauthorized. Admin access required.",
        });
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
        // Ensure schema exists so first-run doesn't 500.
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
        const columns = await env.D1.prepare(
          "PRAGMA table_info(commands);"
        ).all();
        const columnNames = new Set(
          (columns.results || []).map((col) => col.name)
        );
        if (!columnNames.has("intent_json"))
          await env.D1.prepare(
            "ALTER TABLE commands ADD COLUMN intent_json TEXT;"
          ).run();
        if (!columnNames.has("deployment_id"))
          await env.D1.prepare(
            "ALTER TABLE commands ADD COLUMN deployment_id TEXT;"
          ).run();
        if (!columnNames.has("deployment_status"))
          await env.D1.prepare(
            "ALTER TABLE commands ADD COLUMN deployment_status TEXT;"
          ).run();
        if (!columnNames.has("deployment_message"))
          await env.D1.prepare(
            "ALTER TABLE commands ADD COLUMN deployment_message TEXT;"
          ).run();

        const data = await env.D1.prepare(
          "SELECT id, ts, command, actions, files, commit_sha, intent_json, deployment_id, deployment_status, deployment_message FROM commands ORDER BY ts DESC LIMIT 20"
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
      const hasAdmin = await hasValidAdminCookie(request, env);
      if (!hasAdmin) {
        return jsonResponse(401, { error: "Unauthorized" });
      }
      const isAdmin = await isAdminRequest(request, env);
      if (!isAdmin) {
        return jsonResponse(401, {
          error: "Unauthorized. Admin access required.",
        });
      }

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

    // Capability manifest (machine-readable). Used by admin tooling, Voice Command Center,
    // and Custom GPT clients to self-calibrate against the canonical command surface.
    if (url.pathname === "/api/capabilities" && request.method === "GET") {
      const isAdmin = await isAdminRequest(request, env);
      const provided = String(request.headers.get("x-orch-token") || "").trim();
      const orchToken = String(
        env.ORCH_TOKEN || env.X_ORCH_TOKEN || env["x-orch-token"] || ""
      ).trim();
      const orchOk = Boolean(provided && orchToken && provided === orchToken);

      if (!isAdmin && !orchOk) {
        return jsonResponse(401, { error: "Unauthorized" });
      }

      return jsonResponse(200, {
        ok: true,
        manifest: getCapabilityManifest(env),
      });
    }

    if (url.pathname === "/api/config/status" && request.method === "GET") {
      const hasAdmin = await hasValidAdminCookie(request, env);
      if (!hasAdmin) {
        return jsonResponse(401, { error: "Unauthorized" });
      }
      const adminAccessCodeConfigured = Boolean(
        String(env.ADMIN_ACCESS_CODE || env.CONTROL_PASSWORD || "").trim()
      );
      return jsonResponse(200, {
        admin_access_code_configured: adminAccessCodeConfigured,
        orch_token: !!(env.ORCH_TOKEN || env.X_ORCH_TOKEN),
        stripe_publishable: !!(env.STRIPE_PUBLISHABLE_KEY || env.STRIPE_PUBLIC),
        stripe_secret: !!env.STRIPE_SECRET_KEY,
        paypal_client_id: !!(env.PAYPAL_CLIENT_ID_PROD || env.PAYPAL_CLIENT_ID),
        paypal_secret: !!(
          env.PAYPAL_CLIENT_SECRET_PROD || env.PAYPAL_CLIENT_SECRET
        ),
        paypal_mode: getPayPalMode(env),
        paypal_payment_links: {
          starter: !!env.PAYPAL_PAYMENT_LINK_STARTER,
          growth: !!env.PAYPAL_PAYMENT_LINK_GROWTH,
          enterprise: !!env.PAYPAL_PAYMENT_LINK_ENTERPRISE,
          lifetime: !!env.PAYPAL_PAYMENT_LINK_LIFETIME,
        },
        adsense_publisher: !!(
          env.ADSENSE_PUBLISHER || env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID
        ),
        adsense_customer_id: !!env.ADSENSE_CUSTOMER_ID,
        adsense_mode: String(env.ADSENSE_MODE || "auto")
          .trim()
          .toLowerCase(),
        adsense_slots: {
          slot: !!env.ADSENSE_SLOT,
          top: !!env.ADSENSE_SLOT_TOP,
          mid: !!env.ADSENSE_SLOT_MID,
          bottom: !!env.ADSENSE_SLOT_BOTTOM,
        },
        cloudflare_analytics: {
          zone_id: !!(request.cf?.zoneId || env.CF_ZONE_ID),
          api_token: !!(
            env.CF_API_TOKEN ||
            env.CF_API_TOKEN2 ||
            env.CF_USER_TOKEN ||
            env.CLOUDFLARE_API_TOKEN
          ),
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
        env.D1.prepare(
          `SELECT COUNT(*) AS count FROM commands WHERE ts > ${since}`
        ).first(),
        env.D1.prepare(
          `SELECT COUNT(*) AS count FROM errors WHERE ts > ${since}`
        )
          .first()
          .catch(() => ({ count: 0 })),
      ]);
      return jsonResponse(200, {
        window: "24h",
        commands: commands?.count || 0,
        errors: errors?.count || 0,
        deployments: null,
        revenue: null,
        ts: new Date().toISOString(),
      });
    }

    if (url.pathname === "/api/session" && request.method === "POST") {
      if (!env.D1) return jsonResponse(200, { ok: true });
      const id = crypto.randomUUID();
      const ua = request.headers.get("user-agent") || "unknown";
      await env.D1.prepare(
        "INSERT OR IGNORE INTO sessions (id, user_agent) VALUES (?,?)"
      )
        .bind(id, ua)
        .run();
      return jsonResponse(200, { ok: true });
    }

    // Catalog API (single source of truth JSON)
    if (url.pathname === "/api/products" || url.pathname === "/api/catalog") {
      return jsonResponse(200, catalog);
    }

    // App Store Purchase API
    if (url.pathname === "/api/apps/purchase" && request.method === "POST") {
      return jsonResponse(410, {
        error: "Deprecated. Use /api/checkout for payments.",
      });
    }

    // App Store Download API
    if (
      url.pathname.startsWith("/api/apps/download/") &&
      request.method === "GET"
    ) {
      return jsonResponse(410, {
        error: "Deprecated. Use direct /downloads/*.zip links.",
      });
    }

    // App Store License Verification API
    if (
      url.pathname === "/api/apps/verify-license" &&
      request.method === "POST"
    ) {
      return jsonResponse(410, { error: "Deprecated." });
    }

    // App Store PayPal Capture API
    if (
      url.pathname === "/api/apps/paypal/capture" &&
      request.method === "POST"
    ) {
      return jsonResponse(410, {
        error: "Deprecated. Use /api/paypal/capture.",
      });
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
          const body = await request.clone().json();
          // generate random ID if not provided
          const genId =
            "order-" +
            Date.now().toString(36) +
            Math.random().toString(36).slice(2);
          const { id, product_id, amount, customer_email } = body;
          const finalId = id || genId;

          await env.D1.prepare(
            `INSERT INTO orders (id, product_id, amount, customer_email) VALUES (?, ?, ?, ?)`
          )
            .bind(
              finalId,
              product_id || "unknown",
              Number(amount || 0),
              customer_email || ""
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
          "SELECT * FROM orders ORDER BY ts DESC LIMIT 50"
        ).all();
        return jsonResponse(200, { results: results || [] });
      }
    }

    // Sales statistics (real data only; reads D1 orders table)
    if (url.pathname === "/api/sales/stats" && request.method === "GET") {
      const hasAdmin = await hasValidAdminCookie(request, env);
      if (!hasAdmin) return jsonResponse(401, { error: "Unauthorized" });
      const isAdmin = await isAdminRequest(request, env);
      if (!isAdmin)
        return jsonResponse(401, {
          error: "Unauthorized. Admin access required.",
        });

      if (!env.D1) {
        return jsonResponse(501, {
          error: "Sales database not configured (D1 missing).",
        });
      }

      try {
        // Ensure orders table exists; if empty, zeros are real.
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

        const recent = await env.D1.prepare(
          "SELECT id, ts, product_id, amount, currency, status FROM orders ORDER BY ts DESC LIMIT 25"
        ).all();
        const summary = await env.D1.prepare(
          "SELECT COUNT(*) AS total_orders, COALESCE(SUM(amount), 0) AS total_amount FROM orders"
        ).first();

        const totalOrders = Number(summary?.total_orders || 0);
        const totalAmount = Number(summary?.total_amount || 0);
        const looksLikeCents =
          totalAmount > 1000 && Number.isInteger(totalAmount);
        const totalRevenueUsd = looksLikeCents
          ? totalAmount / 100
          : totalAmount;

        return jsonResponse(200, {
          total_orders: totalOrders,
          total_revenue_usd: totalRevenueUsd,
          recent_orders: (recent.results || []).map((row) => {
            const amt =
              typeof row.amount === "number"
                ? row.amount
                : Number(row.amount || 0);
            const amtLooksLikeCents = amt > 1000 && Number.isInteger(amt);
            return {
              id: row.id,
              ts: row.ts,
              product_id: row.product_id,
              currency: row.currency || "USD",
              status: row.status || null,
              amount_usd: amtLooksLikeCents ? amt / 100 : amt,
            };
          }),
          ts: new Date().toISOString(),
        });
      } catch (err) {
        return jsonResponse(500, { error: err.message });
      }
    }

    // Unified Checkout API (Stripe + PayPal)
    // Supports: { provider, id/itemId/product/sku, successUrl, cancelUrl, items: [] }
    if (
      (url.pathname === "/api/checkout" ||
        url.pathname === "/api/stripe/checkout" ||
        url.pathname === "/api/paypal/checkout" ||
        url.pathname === "/api/paypal/order/create" ||
        url.pathname === "/api/paypal/create-order") &&
      request.method === "POST"
    ) {
      try {
        const payload = await request
          .clone()
          .json()
          .catch(() => ({}));
        const provider = String(
          payload?.provider ||
            (url.pathname.includes("stripe") ? "stripe" : "paypal")
        ).toLowerCase();

        // Multi-item support (basket)
        const rawItems = Array.isArray(payload?.items) ? payload.items : [];
        const isBasket = rawItems.length > 0;

        let normalizedItems = [];
        if (isBasket) {
          // Resolve items from catalog if possible
          normalizedItems = rawItems.map((p) => {
            const found = findProduct(p.id || p.itemId || p.sku);
            return found
              ? {
                  sku: found.id,
                  name: found.title,
                  price: found.price,
                  currency: found.currency || "USD",
                  type: found.type,
                  stripePriceId: found.stripePriceId || found.priceId,
                }
              : {
                  sku: p.id || p.sku || "custom",
                  name: p.name || p.title || "Custom Item",
                  price: Number(p.price || 0),
                  currency: p.currency || "USD",
                  type: "one-time",
                };
          });
        } else {
          const targetId = String(
            payload?.id ||
              payload?.itemId ||
              payload?.product ||
              payload?.sku ||
              payload?.productId ||
              ""
          ).trim();
          const item = findProduct(targetId);
          if (item) {
            normalizedItems = [
              {
                sku: item.id,
                name: item.title,
                price: item.price,
                currency: item.currency || "USD",
                type: item.type,
                stripePriceId: item.stripePriceId || item.priceId,
              },
            ];
          } else if (targetId) {
            // Check if it's a custom dynamic item passed in payload
            if (payload.price && payload.name) {
              normalizedItems = [
                {
                  sku: targetId || "custom",
                  name: payload.name,
                  price: Number(payload.price),
                  currency: payload.currency || "USD",
                  type: "one-time",
                },
              ];
            } else {
              return jsonResponse(404, {
                error: `Product not found: ${targetId}`,
                supported: [
                  ...(catalog.products || []),
                  ...(catalog.apps || []),
                ].map((p) => p.id),
              });
            }
          }
        }

        if (normalizedItems.length === 0) {
          return jsonResponse(400, {
            error: "No items provided for checkout.",
          });
        }

        // PayPal Flow
        if (provider === "paypal") {
          const order = await createPayPalOrder(env, normalizedItems);
          return jsonResponse(200, {
            id: order.id,
            orderId: order.id,
            status: order.status || "CREATED",
          });
        }

        // Stripe Flow
        if (provider === "stripe") {
          const stripeKey = env.STRIPE_SECRET_KEY || env.STRIPE_SECRET;
          if (!stripeKey)
            return jsonResponse(501, { error: "Stripe not configured" });

          const params = new URLSearchParams();
          const firstItem = normalizedItems[0];
          const hasSubscription = normalizedItems.some(
            (i) => i.type === "subscription"
          );
          const mode = hasSubscription ? "subscription" : "payment";

          params.append("mode", mode);
          params.append(
            "success_url",
            payload?.successUrl ||
              `${url.origin}/store.html?checkout=success&product=${firstItem.sku}`
          );
          params.append(
            "cancel_url",
            payload?.cancelUrl || `${url.origin}/store.html?checkout=cancel`
          );

          normalizedItems.forEach((item, idx) => {
            if (item.stripePriceId && item.stripePriceId.startsWith("price_")) {
              params.append(`line_items[${idx}][price]`, item.stripePriceId);
              params.append(`line_items[${idx}][quantity]`, "1");
            } else {
              params.append(
                `line_items[${idx}][price_data][currency]`,
                (item.currency || "USD").toLowerCase()
              );
              params.append(
                `line_items[${idx}][price_data][product_data][name]`,
                item.name
              );
              params.append(
                `line_items[${idx}][price_data][unit_amount]`,
                Math.round(item.price * 100)
              );
              params.append(`line_items[${idx}][quantity]`, "1");
              if (item.type === "subscription") {
                params.append(
                  `line_items[${idx}][price_data][recurring][interval]`,
                  "month"
                );
              }
            }
          });

          const stRes = await fetch(
            "https://api.stripe.com/v1/checkout/sessions",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${stripeKey}`,
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: params,
            }
          );
          const data = await stRes.json();
          if (!stRes.ok)
            throw new Error(data.error?.message || "Stripe session failed");
          return jsonResponse(200, {
            url: data.url,
            sessionId: data.id,
            id: data.id,
            orderId: data.id,
          });
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
        const payload = await request
          .clone()
          .json()
          .catch(() => ({}));
        const email = String(payload?.email || "").trim();
        const term = String(payload?.term || "week").trim();
        const plan = String(payload?.plan || "starter").trim();
        const orderId = String(payload?.orderId || "").trim();
        if (!email) return jsonResponse(400, { error: "Email required." });

        const license = await issueLicenseToken(env, {
          email,
          term,
          plan,
          orderId,
        });

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
        const payload = await request
          .clone()
          .json()
          .catch(() => ({}));
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
            const row = await env.D1.prepare(
              "SELECT status FROM licenses WHERE id = ? LIMIT 1"
            )
              .bind(license)
              .first();
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

    // Unified PayPal Capture
    if (
      (url.pathname === "/api/paypal/capture" ||
        url.pathname === "/api/paypal/order/capture" ||
        url.pathname === "/api/paypal/capture-order" ||
        url.pathname === "/api/apps/paypal/capture") &&
      request.method === "POST"
    ) {
      try {
        const payload = await request
          .clone()
          .json()
          .catch(() => ({}));
        const orderId = String(
          payload?.orderId || payload?.orderID || payload?.id || ""
        ).trim();
        if (!orderId) return jsonResponse(400, { error: "Missing orderId." });

        const capture = await capturePayPalOrder(env, orderId);
        const status = String(capture?.status || "").toLowerCase();
        const purchaseUnit = capture?.purchase_units?.[0] || {};
        const cap = purchaseUnit.payments?.captures?.[0] || {};
        const payerEmail = String(
          capture?.payer?.email_address || payload?.email || ""
        );

        const captureAmount = Number(
          cap?.amount?.value || purchaseUnit.amount?.value || 0
        );
        const currency = String(
          cap?.amount?.currency_code ||
            purchaseUnit.amount?.currency_code ||
            "USD"
        );
        const productRef =
          String(
            purchaseUnit.custom_id || purchaseUnit.reference_id || ""
          ).trim() || "paypal:unknown";

        if (env.D1) {
          try {
            await ensureOrdersTable(env);
            const rowId = `paypal:${orderId}`;
            await env.D1.prepare(
              "INSERT OR REPLACE INTO orders (id, product_id, amount, currency, status, customer_email) VALUES (?, ?, ?, ?, ?, ?)"
            )
              .bind(
                rowId,
                productRef,
                Number.isFinite(captureAmount) ? captureAmount : 0,
                currency,
                status,
                payerEmail
              )
              .run();
          } catch (err) {
            console.warn("PayPal order log failed:", err);
          }
        }

        // Email Notification for successful capture
        if (
          status === "completed" &&
          (env.RESEND_API_KEY || env.SENDGRID_API_KEY)
        ) {
          try {
            const subject = "Order Confirmation - VoiceToWebsite";
            const text = `Thank you for your purchase!\n\nOrder ID: ${orderId}\nProduct: ${productRef}\nAmount: ${currency} ${captureAmount}\n\nWe are processing your order.`;
            const html = `
               <div style="font-family: sans-serif; padding: 20px;">
                 <h2>Thank you for your purchase!</h2>
                 <p>Order ID: <strong>${orderId}</strong></p>
                 <p>Product: ${productRef}</p>
                 <p>Amount: ${currency} ${captureAmount}</p>
                 <p>We are processing your order. If this was an app purchase, you will receive a license key shortly.</p>
               </div>
             `;
            await sendDemoEmail(env, {
              to: payerEmail,
              subject,
              html,
              text,
            }).catch((e) => console.warn("Email notify failed:", e));
          } catch (err) {
            console.warn("Follow-up email logic failed:", err);
          }
        }

        return jsonResponse(200, {
          ok: true,
          success: true,
          id: orderId,
          orderId,
          status,
          amount: Number.isFinite(captureAmount) ? captureAmount : 0,
          currency,
          captureId: cap.id,
        });
      } catch (err) {
        return jsonResponse(500, { error: err.message });
      }
    }

    // (Merged into Unified Checkout above)

    // PayPal Webhook Handler (signature-verified)
    // Route: POST /api/paypal-webhook
    // IMPORTANT: PayPal webhooks MUST be signature-verified. Otherwise, anyone can spoof payments.
    if (url.pathname === "/api/paypal-webhook" && request.method === "POST") {
      try {
        const mode = getPayPalMode(env);
        const webhookId = String(
          (mode === "live"
            ? env.PAYPAL_WEBHOOK_ID_PROD
            : env.PAYPAL_WEBHOOK_ID) ||
            env.PAYPAL_WEBHOOK_ID_PROD ||
            env.PAYPAL_WEBHOOK_ID ||
            ""
        ).trim();
        if (!webhookId) {
          return jsonResponse(501, {
            error:
              "PayPal webhook not configured. Set PAYPAL_WEBHOOK_ID (sandbox) or PAYPAL_WEBHOOK_ID_PROD (live).",
          });
        }

        const bodyText = await request.clone().text();
        let payload = {};
        try {
          payload = bodyText ? JSON.parse(bodyText) : {};
        } catch (_) {
          return jsonResponse(400, { error: "Invalid JSON body." });
        }

        const transmissionId =
          request.headers.get("PAYPAL-TRANSMISSION-ID") || "";
        const transmissionTime =
          request.headers.get("PAYPAL-TRANSMISSION-TIME") || "";
        const transmissionSig =
          request.headers.get("PAYPAL-TRANSMISSION-SIG") || "";
        const certUrl = request.headers.get("PAYPAL-CERT-URL") || "";
        const authAlgo = request.headers.get("PAYPAL-AUTH-ALGO") || "";

        if (
          !transmissionId ||
          !transmissionTime ||
          !transmissionSig ||
          !certUrl ||
          !authAlgo
        ) {
          return jsonResponse(400, {
            error: "Missing PayPal signature headers.",
          });
        }

        const verifyRes = await paypalApiFetch(
          env,
          "/v1/notifications/verify-webhook-signature",
          {
            method: "POST",
            body: JSON.stringify({
              auth_algo: authAlgo,
              cert_url: certUrl,
              transmission_id: transmissionId,
              transmission_sig: transmissionSig,
              transmission_time: transmissionTime,
              webhook_id: webhookId,
              webhook_event: payload,
            }),
          }
        );
        const verifyData = await verifyRes.json().catch(() => ({}));
        if (!verifyRes.ok) {
          const detail =
            verifyData?.message ||
            verifyData?.details?.[0]?.description ||
            "PayPal signature verify failed.";
          return jsonResponse(verifyRes.status || 500, { error: detail });
        }

        const status = String(
          verifyData?.verification_status || ""
        ).toUpperCase();
        if (status !== "SUCCESS") {
          return jsonResponse(401, { error: "Invalid webhook signature." });
        }

        const eventId = String(payload?.id || crypto.randomUUID());
        const eventType = String(payload?.event_type || "");
        const resource = payload?.resource || {};

        const resourceId = String(resource?.id || "");
        const resourceStatus = String(
          resource?.status || payload?.summary || ""
        );
        const email =
          String(
            resource?.payer?.email_address ||
              resource?.subscriber?.email_address ||
              resource?.email_address ||
              ""
          ) || "";

        const amountValue =
          Number(resource?.amount?.value) ||
          Number(resource?.purchase_units?.[0]?.amount?.value) ||
          Number(
            resource?.purchase_units?.[0]?.payments?.captures?.[0]?.amount
              ?.value
          ) ||
          0;
        const currencyCode =
          String(
            resource?.amount?.currency_code ||
              resource?.purchase_units?.[0]?.amount?.currency_code ||
              resource?.purchase_units?.[0]?.payments?.captures?.[0]?.amount
                ?.currency_code ||
              "USD"
          ) || "USD";

        // Extract related order id for capture events where possible.
        const relatedOrderId = String(
          resource?.supplementary_data?.related_ids?.order_id ||
            resource?.invoice_id ||
            resourceId ||
            ""
        ).trim();

        // Persist minimal audit record.
        if (env.D1) {
          try {
            await env.D1.prepare(
              `CREATE TABLE IF NOT EXISTS paypal_webhook_events (
                 id TEXT PRIMARY KEY,
                 event_type TEXT,
                 resource_id TEXT,
                 related_order_id TEXT,
                 status TEXT,
                 amount REAL,
                 currency TEXT,
                 email TEXT,
                 ts DATETIME DEFAULT CURRENT_TIMESTAMP
               );`
            ).run();

            await env.D1.prepare(
              "INSERT OR IGNORE INTO paypal_webhook_events (id, event_type, resource_id, related_order_id, status, amount, currency, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
            )
              .bind(
                eventId,
                eventType,
                resourceId,
                relatedOrderId,
                resourceStatus,
                Number.isFinite(amountValue) ? amountValue : 0,
                currencyCode,
                email
              )
              .run();

            // If we already recorded a PayPal checkout capture as an order, update it to reflect the latest status.
            if (relatedOrderId) {
              await ensureOrdersTable(env);
              const rowId = `paypal:${relatedOrderId}`;
              await env.D1.prepare(
                "UPDATE orders SET status = ?, ts = CURRENT_TIMESTAMP WHERE id = ?"
              )
                .bind(String(resourceStatus || "webhook").toLowerCase(), rowId)
                .run();
            }
          } catch (err) {
            console.warn("PayPal webhook D1 log failed:", err);
          }
        }

        console.log(
          "PayPal webhook verified:",
          eventType,
          resourceId || eventId
        );
        return jsonResponse(200, { ok: true });
      } catch (err) {
        console.error("PayPal webhook error:", err);
        return jsonResponse(500, { error: "Webhook processing failed" });
      }
    }

    const ADMIN_PUBLIC_PATHS = new Set([
      "/admin/access.html",
      "/admin/login.html",
      "/admin/admin.css",
      "/admin/access-guard.js",
    ]);
    const isAdminRoot =
      url.pathname === "/admin" ||
      url.pathname === "/admin/" ||
      url.pathname === "/admin/index.html";
    if (url.pathname.startsWith("/admin/") || isAdminRoot) {
      const isPublic = ADMIN_PUBLIC_PATHS.has(url.pathname);
      if (!isPublic) {
        const hasAdmin = await hasValidAdminCookie(request, env);
        const isAdmin = hasAdmin ? await isAdminRequest(request, env) : false;
        if (!hasAdmin || !isAdmin) {
          return Response.redirect(
            new URL("/admin/access.html", url.origin),
            302
          );
        }
      }
    }

    if (url.pathname === "/admin" || url.pathname === "/admin/") {
      return Response.redirect(
        new URL("/admin/integrated-dashboard.html", url.origin),
        302
      );
    }

    if (url.pathname.startsWith("/admin/")) {
      const adminRes = await assets.fetch(request);
      if (adminRes.status !== 404) {
        return addSecurityHeaders(adminRes, {
          cacheControl: "no-store",
          pragmaNoCache: true,
        });
      }
      const adminUrl = new URL("/admin/index.html", url.origin);
      const res = await assets.fetch(new Request(adminUrl, request));
      return addSecurityHeaders(res, {
        cacheControl: "no-store",
        pragmaNoCache: true,
      });
    }

    // Canonical storefront
    if (
      url.pathname === "/appstore" ||
      url.pathname === "/appstore/" ||
      url.pathname === "/appstore.html" ||
      url.pathname === "/appstore-new" ||
      url.pathname === "/appstore-new.html"
    ) {
      return Response.redirect(new URL("/store", url.origin), 302);
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
      return addSecurityHeaders(assetRes, {
        cacheControl: "no-store",
        pragmaNoCache: true,
      });
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
            PAYPAL_PAYMENT_LINK_STARTER: "${env.PAYPAL_PAYMENT_LINK_STARTER || ""}",
            PAYPAL_PAYMENT_LINK_GROWTH: "${env.PAYPAL_PAYMENT_LINK_GROWTH || ""}",
            PAYPAL_PAYMENT_LINK_ENTERPRISE: "${env.PAYPAL_PAYMENT_LINK_ENTERPRISE || ""}",
            PAYPAL_PAYMENT_LINK_LIFETIME: "${env.PAYPAL_PAYMENT_LINK_LIFETIME || ""}",
            STRIPE_BUY_BUTTON_ID_STARTER: "${env.STRIPE_BUY_BUTTON_ID_STARTER || ""}",
            STRIPE_BUY_BUTTON_ID_GROWTH: "${env.STRIPE_BUY_BUTTON_ID_GROWTH || ""}",
            STRIPE_BUY_BUTTON_ID_ENTERPRISE: "${env.STRIPE_BUY_BUTTON_ID_ENTERPRISE || ""}",
            STRIPE_BUY_BUTTON_ID_LIFETIME: "${env.STRIPE_BUY_BUTTON_ID_LIFETIME || ""}",
            ADSENSE_PUBLISHER: "${env.ADSENSE_PUBLISHER || env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID || ADSENSE_CLIENT_ID}",
            ADSENSE_CUSTOMER_ID: "${env.ADSENSE_CUSTOMER_ID || ""}",
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
      const isSearchPage =
        url.pathname === "/search" || url.pathname === "/search.html";
      const robotsTag =
        isAdminPage || isSecretPage || isSearchPage
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
        0
      );

      // Inject strict replacements for legacy placeholders + new __ENV
      /*
       * Note: We inject __ENV before the closing </head> or <body> for availability.
       * We also continue to support direct text replacement for HTML-embedded tokens.
       */
      const injected = text
        .replace(
          /__PAYPAL_CLIENT_ID__/g,
          env.PAYPAL_CLIENT_ID_PROD || env.PAYPAL_CLIENT_ID || ""
        )
        .replace(
          /__STRIPE_PUBLISHABLE_KEY__/g,
          env.STRIPE_PUBLISHABLE_KEY || env.STRIPE_PUBLIC || ""
        )
        .replace(
          /__ADSENSE_PUBLISHER__/g,
          env.ADSENSE_PUBLISHER ||
            env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID ||
            ADSENSE_CLIENT_ID
        )
        .replace(
          /ca-pub-YOUR_PUBLISHER_ID/g,
          env.ADSENSE_PUBLISHER ||
            env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID ||
            ADSENSE_CLIENT_ID
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
        .replace(
          /<meta\b[^>]*(?:name|property)=["']twitter:url["'][^>]*>\s*/gi,
          ""
        )
        .replace(
          /<script\b[^>]*type=["']application\/ld\+json["'][^>]*id=["']vtw-jsonld["'][\s\S]*?<\/script>\s*/gi,
          ""
        );

      const hasOgImage = /<meta\b[^>]*property=["']og:image["']/i.test(
        seoInjected
      );
      const hasTwitterImage =
        /<meta\b[^>]*(?:name|property)=["']twitter:image["']/i.test(
          seoInjected
        );
      const hasTwitterCard =
        /<meta\b[^>]*(?:name|property)=["']twitter:card["']/i.test(seoInjected);
      const hasOgType = /<meta\b[^>]*property=["']og:type["']/i.test(
        seoInjected
      );
      const hasOgSiteName = /<meta\b[^>]*property=["']og:site_name["']/i.test(
        seoInjected
      );
      const hasDescription = /<meta\b[^>]*name=["']description["']/i.test(
        seoInjected
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
        `${sanitizedSeoBlock}\n</head>`
      );

      const adsenseMode = String(env.ADSENSE_MODE || "auto")
        .trim()
        .toLowerCase();
      const adsenseAllowAll =
        String(env.ADSENSE_ALLOW_ALL_PAGES || "").trim() === "1" ||
        adsenseMode === "auto";

      // In auto mode we allow global public-page loading; in slot mode we require explicit slot markup.
      const wantsAds =
        adsenseMode === "auto" ||
        /\badsbygoogle\b/.test(seoInjected) ||
        seoInjected.includes("__ADSENSE_SLOT__");
      const isAdsAllowedByPath =
        normalizedPath === "/blog" ||
        normalizedPath === "/projects" ||
        normalizedPath === "/studio3000" ||
        url.pathname === "/blog.html" ||
        url.pathname === "/projects.html" ||
        url.pathname === "/studio3000.html";
      const isAdsAllowed = adsenseAllowAll || isAdsAllowedByPath;

      const shouldInjectAdsense =
        wantsAds && isAdsAllowed && !isAdminPage && !isSecretPage;

      const adsensePublisher =
        env.ADSENSE_PUBLISHER ||
        env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID ||
        ADSENSE_CLIENT_ID;
      const hasAdsenseAccountMeta =
        /<meta\b[^>]*name=["']google-adsense-account["'][^>]*>\s*/i.test(
          seoInjected
        );
      if (
        adsensePublisher &&
        !isAdminPage &&
        !isSecretPage &&
        !hasAdsenseAccountMeta
      ) {
        seoInjected = seoInjected.replace(
          "</head>",
          `<meta name="google-adsense-account" content="${adsensePublisher}" />\n</head>`
        );
      }

      const adsenseScriptTag = `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsensePublisher}" crossorigin="anonymous"></script>`;

      const withAdsense = shouldInjectAdsense
        ? seoInjected.includes(
            "pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"
          )
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

export { BotHubDO };
