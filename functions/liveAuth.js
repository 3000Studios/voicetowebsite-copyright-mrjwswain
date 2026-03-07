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

const importHmacKey = async (secret) =>
  crypto.subtle.importKey(
    "raw",
    textEncoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
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

export const getLiveTokenSigningSecret = (env) =>
  String(
    env.ADMIN_COOKIE_SECRET ||
      env.LIVE_ROOM_ADMIN_TOKEN ||
      env.LIVE_ROOM_VIEWER_TOKEN ||
      env.CONTROL_PASSWORD ||
      ""
  ).trim();

export const mintLiveViewerToken = async (env, ttlSeconds = 60 * 10) => {
  const secret = getLiveTokenSigningSecret(env);
  if (!secret) return "";
  const expiresAt = Date.now() + Math.max(30, Number(ttlSeconds || 0)) * 1000;
  const msg = `viewer.${expiresAt}`;
  const sig = await sign(secret, msg);
  return `${msg}.${sig}`;
};

export const verifyLiveViewerToken = async (env, value) => {
  const secret = getLiveTokenSigningSecret(env);
  if (!secret) return false;
  const parts = String(value || "").split(".");
  if (parts.length !== 3) return false;
  const [role, expiresAtRaw, sig] = parts;
  if (role !== "viewer") return false;
  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return false;
  const msg = `viewer.${expiresAt}`;
  const expected = await sign(secret, msg);
  return timingSafeEqual(sig, expected);
};
