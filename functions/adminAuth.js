const textEncoder = new TextEncoder();

const base64UrlEncode = (data) =>
  btoa(String.fromCharCode(...data))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const timingSafeEqual = (a, b) => {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
};

const getCookie = (cookieHeader, name) => {
  const header = cookieHeader || "";
  const parts = header.split(";");
  for (const part of parts) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return rest.join("=");
  }
  return "";
};

const importHmacKey = async (secret) =>
  crypto.subtle.importKey(
    "raw",
    textEncoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );

const sign = async (secret, message) => {
  const key = await importHmacKey(secret);
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    textEncoder.encode(message)
  );
  return base64UrlEncode(new Uint8Array(sig));
};

export const getAdminSigningSecret = (env) =>
  String(env.ADMIN_COOKIE_SECRET || "").trim();

export const isAdminEnabled = (env) => Boolean(env.CONTROL_PASSWORD);

export const adminCookieName = "vtw_admin";
export const adminCookieTtlSeconds = 60 * 60 * 2; // 2 hours

export const mintAdminCookieValue = async (env) => {
  const secret = getAdminSigningSecret(env);
  const allowInsecureFallback =
    String(env.ALLOW_INSECURE_ADMIN_COOKIE_SECRET || "").trim() === "1";
  const fallbackSecret = String(env.CONTROL_PASSWORD || "").trim();
  const effectiveSecret =
    secret || (allowInsecureFallback ? fallbackSecret : "");
  if (!effectiveSecret) {
    throw new Error(
      "Missing ADMIN_COOKIE_SECRET. Set ADMIN_COOKIE_SECRET (recommended) or set ALLOW_INSECURE_ADMIN_COOKIE_SECRET=1 to fall back to CONTROL_PASSWORD."
    );
  }
  const ts = Date.now();
  const msg = `1.${ts}`;
  const sig = await sign(effectiveSecret, msg);
  return `${msg}.${sig}`;
};

export const verifyAdminCookieValue = async (env, value) => {
  const secret = getAdminSigningSecret(env);
  const allowInsecureFallback =
    String(env.ALLOW_INSECURE_ADMIN_COOKIE_SECRET || "").trim() === "1";
  const fallbackSecret = String(env.CONTROL_PASSWORD || "").trim();
  const effectiveSecret =
    secret || (allowInsecureFallback ? fallbackSecret : "");
  if (!effectiveSecret) return false;
  const parts = String(value || "").split(".");
  if (parts.length !== 3) return false;
  const [v, tsRaw, sig] = parts;
  if (v !== "1") return false;
  const ts = Number(tsRaw);
  if (!Number.isFinite(ts) || ts <= 0) return false;
  const ageSeconds = (Date.now() - ts) / 1000;
  if (ageSeconds < 0 || ageSeconds > adminCookieTtlSeconds) return false;
  const msg = `1.${ts}`;
  const expected = await sign(effectiveSecret, msg);
  return timingSafeEqual(sig, expected);
};

export const hasValidAdminCookie = async (request, env) => {
  const cookieHeader = request.headers.get("cookie") || "";
  const value = getCookie(cookieHeader, adminCookieName);
  return verifyAdminCookieValue(env, value);
};

export const isAdminRequest = async (request, env) => {
  // Allows non-browser admin callers (e.g., internal tools) to authenticate without cookies.
  const allowHeaderToken =
    String(env.ALLOW_ADMIN_HEADER_TOKEN || "").trim() === "1";
  const headerToken = request.headers.get("x-admin-token") || "";
  if (
    allowHeaderToken &&
    headerToken &&
    env.CONTROL_PASSWORD &&
    timingSafeEqual(headerToken, String(env.CONTROL_PASSWORD))
  ) {
    return true;
  }
  return hasValidAdminCookie(request, env);
};

export const setAdminCookieHeaders = (
  headers,
  cookieValue,
  { secure = true } = {}
) => {
  headers.append(
    "Set-Cookie",
    `${adminCookieName}=${cookieValue}; Path=/; Max-Age=${adminCookieTtlSeconds}; ${
      secure ? "Secure; " : ""
    }HttpOnly; SameSite=Lax`
  );
};

export const clearAdminCookieHeaders = (headers, { secure = true } = {}) => {
  headers.append(
    "Set-Cookie",
    `${adminCookieName}=; Path=/; Max-Age=0; ${secure ? "Secure; " : ""}HttpOnly; SameSite=Lax`
  );
};
