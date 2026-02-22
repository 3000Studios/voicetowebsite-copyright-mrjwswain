import { adminCookieName, verifyAdminCookieValue } from "./adminAuth.js";
import {
  DatabaseHelper,
  createCachedDatabase,
  createDatabaseMonitor,
} from "./database-cache.js";
import {
  LOG_LEVELS,
  getLogger,
  initializeLogger,
  loggingMiddleware,
} from "./logger.js";
import {
  CONFIRMATION_PHRASE,
  handleCommandCenterRequest,
  isCommandCenterPath,
} from "./commandCenterApi.js";
import { onRequestPost as handleOrchestrator } from "./orchestrator.js";
import { createRateLimitMiddleware } from "./rate-limiter.js";
import {
  SchemaValidationError,
  validateErrorResponse,
  validateRequest,
  validateResponse,
} from "./schema-validator.js";

const JSON_HEADERS = { "Content-Type": "application/json" };
const CONFIRM_TTL_MS = 10 * 60 * 1000;
const VALID_ACTIONS = new Set([
  "plan",
  "preview",
  "apply",
  "deploy",
  "status",
  "rollback",
  "auto",
  "list_pages",
  "read_page",
]);
const VALID_SAFETY_LEVELS = new Set(["low", "medium", "high"]);
const JSON_BODY_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const CC_ROUTABLE_ACTIONS = new Set(["plan", "preview", "apply", "auto"]);
const ALLOWED_CC_METHODS = new Set(["GET", "POST", "PUT", "DELETE"]);

// Public page targeting: allow any safe `slug(.html)` or "all".
// We intentionally block paths/directories so callers can't target `admin/*` or traverse.
const VALID_PUBLIC_PAGE_RE = /^[a-z0-9-]+(?:\.html)?$/;

const toJsonResponse = (status, payload, env) => {
  // Validate response schema only if enabled (default: production only)
  const enableValidation =
    env?.ENABLE_RESPONSE_VALIDATION === "true" ||
    (env?.NODE_ENV === "production" &&
      env?.ENABLE_RESPONSE_VALIDATION !== "false");

  if (enableValidation && status >= 200 && status < 300) {
    try {
      validateResponse(payload, "ExecuteResponse");
    } catch (error) {
      // Log validation errors but don't break responses
      console.warn("Response validation failed:", error.message);
    }
  } else if (status >= 400) {
    try {
      validateErrorResponse(payload);
    } catch (error) {
      // Log error response validation failures
      console.warn("Error response validation failed:", error.message);
    }
  }

  return new Response(JSON.stringify(payload), {
    status,
    headers: JSON_HEADERS,
  });
};

const toIso = (value) => new Date(value).toISOString();

const getTraceId = (request) =>
  request.headers.get("x-trace-id") || crypto.randomUUID();

const readJsonBody = async (request) => {
  try {
    // Check request size limit (default: 1MB)
    const contentLength = request.headers.get("content-length");
    const maxSize = 1024 * 1024; // 1MB

    if (contentLength && parseInt(contentLength) > maxSize) {
      return { error: "Request body too large", size: parseInt(contentLength) };
    }

    // Always clone before reading the body so downstream code can still use the original Request.
    // Workers requests have a one-time-readable body stream.
    const body = await request.clone().text();
    if (body.length > maxSize) {
      return { error: "Request body too large", size: body.length };
    }

    return body ? JSON.parse(body) : null;
  } catch (error) {
    if (error.message === "Request body too large") {
      return { error: "Request body too large" };
    }
    return null;
  }
};

const validatePageName = (page) => {
  if (!page || typeof page !== "string") {
    return { valid: false, error: "Page name must be a non-empty string" };
  }

  let trimmedPage = page.trim().toLowerCase();
  // Accept leading slash or ./ from callers.
  trimmedPage = trimmedPage.replace(/^\/+/, "").replace(/^\.\//, "");

  if (!trimmedPage) {
    return { valid: false, error: "Page name must be a non-empty string" };
  }

  if (trimmedPage === "all") return { valid: true, page: "all" };

  // Block any attempt to target directories or parent traversal.
  if (
    trimmedPage.includes("/") ||
    trimmedPage.includes("\\") ||
    trimmedPage.includes("..")
  ) {
    return {
      valid: false,
      error: `Invalid page '${trimmedPage}'. Use a public page like 'partners.html'.`,
    };
  }

  if (!VALID_PUBLIC_PAGE_RE.test(trimmedPage)) {
    return {
      valid: false,
      error: `Invalid page '${trimmedPage}'. Use a public page like 'partners.html'.`,
    };
  }

  // Canonicalize to .html so downstream (orchestrator) is consistent.
  if (!trimmedPage.endsWith(".html")) trimmedPage = `${trimmedPage}.html`;

  // Extra safety: don't allow the admin root to be targeted even without a slash.
  if (trimmedPage === "admin.html") {
    return { valid: false, error: "Admin pages cannot be targeted." };
  }

  return { valid: true, page: trimmedPage };
};

const normalizeActionPayload = (payload) => {
  const parameters =
    payload?.parameters &&
    typeof payload.parameters === "object" &&
    !Array.isArray(payload.parameters)
      ? payload.parameters
      : {};
  const pageValidation = validatePageName(
    payload?.page || parameters?.page || ""
  );
  const page = pageValidation.valid ? pageValidation.page : "";
  const path = String(payload?.path || parameters?.path || "").trim();
  const file = String(payload?.file || parameters?.file || "").trim();
  const action = String(payload?.action || "")
    .trim()
    .toLowerCase();
  const idempotencyKey = String(payload?.idempotencyKey || "").trim();
  const safetyLevel = VALID_SAFETY_LEVELS.has(
    String(payload?.safetyLevel || "").toLowerCase()
  )
    ? String(payload.safetyLevel).toLowerCase()
    : "medium";
  const command = String(
    payload?.command || payload?.parameters?.command || ""
  ).trim();
  const target = payload?.target === "sandbox" ? "sandbox" : "site";
  const confirmToken = String(
    payload?.confirmToken || payload?.parameters?.confirmToken || ""
  ).trim();
  const actor =
    typeof payload?.actor === "string" && payload.actor.trim()
      ? payload.actor.trim()
      : typeof payload?.actor?.type === "string" && payload.actor.type.trim()
        ? payload.actor.type.trim()
        : "bot";

  return {
    raw: payload || {},
    action,
    idempotencyKey,
    safetyLevel,
    command,
    target,
    confirmToken,
    actor,
    page,
    path,
    file,
  };
};

const getOrchestratorToken = (env) =>
  String(
    env.ORCH_TOKEN || env.X_ORCH_TOKEN || env["x-orch-token"] || ""
  ).trim();

const hasValidHeaderToken = (request, env) => {
  const provided = String(request.headers.get("x-orch-token") || "").trim();
  if (!provided) return false;
  return provided === getOrchestratorToken(env);
};

const isSameOriginRequest = (request) => {
  const origin = request.headers.get("origin");
  if (!origin) return true; // Non-browser or same-origin fetch without Origin header.
  try {
    return origin === new URL(request.url).origin;
  } catch (_) {
    return false;
  }
};

const getCookieValue = (cookieHeader, name) => {
  const parts = String(cookieHeader || "").split(";");
  for (const part of parts) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return rest.join("=");
  }
  return "";
};

const hasVerifiedAdminCookie = async (request, env) => {
  const cookieHeader = request.headers.get("cookie") || "";
  const cookieValue = getCookieValue(cookieHeader, adminCookieName);
  if (!cookieValue) return false;
  return verifyAdminCookieValue(env, cookieValue);
};

const isAuthorized = async (request, env) => {
  if (hasValidHeaderToken(request, env)) return true;
  return hasVerifiedAdminCookie(request, env);
};

const dbFromEnv = (env) => env.D1 || env.DB || null;

const ensureExecuteTables = async (db) => {
  if (!db) return;
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS execute_events (
         event_id TEXT PRIMARY KEY,
         ts DATETIME DEFAULT CURRENT_TIMESTAMP,
         action TEXT NOT NULL,
         idempotency_key TEXT NOT NULL,
         trace_id TEXT,
         status INTEGER NOT NULL,
         response_json TEXT NOT NULL,
         UNIQUE(action, idempotency_key)
       );`
    )
    .run();

  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS execute_confirm_tokens (
         token_hash TEXT PRIMARY KEY,
         action TEXT NOT NULL,
         idempotency_key TEXT NOT NULL,
         trace_id TEXT,
         expires_at TEXT NOT NULL,
         used_at TEXT
       );`
    )
    .run();
};

const findExistingEvent = async (db, action, idempotencyKey) => {
  if (!db) return null;
  try {
    return await db
      .prepare(
        "SELECT status, response_json FROM execute_events WHERE action = ? AND idempotency_key = ? LIMIT 1"
      )
      .bind(action, idempotencyKey)
      .first();
  } catch (_) {
    return null;
  }
};

const writeEventRecord = async (
  db,
  { eventId, action, idempotencyKey, traceId, status, payload }
) => {
  if (!db) return;
  try {
    await db
      .prepare(
        `INSERT OR IGNORE INTO execute_events
         (event_id, action, idempotency_key, trace_id, status, response_json)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .bind(
        eventId,
        action,
        idempotencyKey,
        traceId,
        status,
        JSON.stringify(payload)
      )
      .run();
  } catch (_) {
    // Ignore logging failures; execution should still return a result.
  }
};

const makeActionRecord = ({
  action,
  idempotencyKey,
  safetyLevel,
  command,
  target,
  actor,
}) => ({
  action,
  idempotencyKey,
  safetyLevel,
  command,
  target,
  actor,
});

const makeEvent = ({
  eventType,
  actionPayload,
  traceId,
  result,
  error,
  eventId = crypto.randomUUID(),
  timestamp = toIso(Date.now()),
}) => ({
  eventId,
  timestamp,
  traceId,
  eventType,
  action: actionPayload,
  result,
  error,
});

const decodeJsonResponse = async (response) => {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch (_) {
    return { raw: text };
  }
};

const encodeBase64Url = (value) =>
  btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");

const decodeBase64Url = (value) => {
  const input = String(value || "")
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const padded = input + "=".repeat((4 - (input.length % 4 || 4)) % 4);
  return atob(padded);
};

const importHmacKey = async (secret) =>
  crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );

const signHmac = async (secret, message) => {
  const key = await importHmacKey(secret);
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message)
  );
  return encodeBase64Url(String.fromCharCode(...new Uint8Array(signature)));
};

const sha256Hex = async (value) => {
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value)
  );
  return [...new Uint8Array(hash)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

const getConfirmSecret = (env) =>
  String(env.CONFIRM_TOKEN_SECRET || getOrchestratorToken(env)).trim();

const createConfirmToken = async (
  env,
  db,
  { action, idempotencyKey, traceId }
) => {
  const secret = getConfirmSecret(env);
  const expiresAtMs = Date.now() + CONFIRM_TTL_MS;
  const payload = JSON.stringify({
    v: 1,
    action,
    idempotencyKey,
    exp: expiresAtMs,
    nonce: crypto.randomUUID(),
  });
  const payloadB64 = encodeBase64Url(payload);
  const sig = await signHmac(secret, payloadB64);
  const token = `vtwcfm.${payloadB64}.${sig}`;

  if (db) {
    const tokenHash = await sha256Hex(token);
    try {
      await db
        .prepare(
          `INSERT OR REPLACE INTO execute_confirm_tokens
           (token_hash, action, idempotency_key, trace_id, expires_at, used_at)
           VALUES (?, ?, ?, ?, ?, NULL)`
        )
        .bind(tokenHash, action, idempotencyKey, traceId, toIso(expiresAtMs))
        .run();
    } catch (_) {
      // Token can still be used in stateless mode if D1 insert fails.
    }
  }

  return {
    confirmToken: token,
    confirmBy: toIso(expiresAtMs),
  };
};

const matchesTokenAction = (tokenAction, requestedAction) => {
  // Exact match for most actions
  if (tokenAction === requestedAction) {
    return true;
  }

  // Allow preview tokens to be used for apply (workflow: preview -> apply -> deploy)
  if (tokenAction === "preview" && requestedAction === "apply") {
    return true;
  }

  // Allow preview tokens to be used for deploy, but only after apply has succeeded.
  // The "after apply" gate is enforced later via the database + apply event check.
  if (tokenAction === "preview" && requestedAction === "deploy") {
    return true;
  }

  // Legacy compatibility: "execute" tokens can be used for apply/deploy
  if (
    tokenAction === "execute" &&
    (requestedAction === "apply" || requestedAction === "deploy")
  ) {
    return true;
  }

  return false;
};

const canReuseConsumedTokenForDeploy = async (
  db,
  row,
  idempotencyKey,
  action
) => {
  if (action !== "deploy") return false;
  if (row?.action !== "preview" && row?.action !== "execute") return false;
  if (row?.idempotency_key !== idempotencyKey) return false;

  const applied = await findExistingEvent(db, "apply", idempotencyKey);
  const appliedStatus = Number(applied?.status || 0);
  return (
    Number.isFinite(appliedStatus) &&
    appliedStatus >= 200 &&
    appliedStatus < 300
  );
};

const validateAndConsumeConfirmToken = async (
  env,
  db,
  { token, action, idempotencyKey }
) => {
  const logger = getLogger();

  if (!token)
    return { ok: false, error: "confirmToken is required for this action." };

  const parts = String(token).split(".");
  if (parts.length !== 3 || parts[0] !== "vtwcfm") {
    logger.warn("Invalid token format received", { tokenPrefix: parts[0] });
    return { ok: false, error: "Invalid confirmToken format." };
  }

  const payloadB64 = parts[1];
  const signature = parts[2];
  const secret = getConfirmSecret(env);
  const expectedSig = await signHmac(secret, payloadB64);
  if (signature !== expectedSig) {
    logger.logSecurity("Invalid token signature", { action, idempotencyKey });
    return { ok: false, error: "Invalid confirmToken signature." };
  }

  let tokenPayload;
  try {
    tokenPayload = JSON.parse(decodeBase64Url(payloadB64));
  } catch (error) {
    logger.warn("Failed to parse token payload", { error: error.message });
    return { ok: false, error: "Invalid confirmToken payload." };
  }

  if (!tokenPayload?.exp || Date.now() > Number(tokenPayload.exp)) {
    logger.logSecurity("Expired token used", {
      action,
      idempotencyKey,
      expiredAt: tokenPayload?.exp,
      currentTime: Date.now(),
    });
    return { ok: false, error: "confirmToken has expired." };
  }

  if (
    !matchesTokenAction(tokenPayload?.action, action) ||
    tokenPayload?.idempotencyKey !== idempotencyKey
  ) {
    logger.logSecurity("Token action/idempotency key mismatch", {
      tokenAction: tokenPayload?.action,
      requestedAction: action,
      tokenIdempotencyKey: tokenPayload?.idempotencyKey,
      requestedIdempotencyKey: idempotencyKey,
    });
    return {
      ok: false,
      error: "confirmToken does not match action/idempotencyKey.",
    };
  }

  if (!db) {
    logger.debug(
      "Token validation proceeding without database (stateless mode)"
    );
    return { ok: true };
  }

  const tokenHash = await sha256Hex(token);
  const now = toIso(Date.now());

  try {
    // Accept either a raw D1-like database (prepare/bind/run) or our cached wrapper (execute).
    const cachedDb =
      db && typeof db.execute === "function"
        ? db
        : db && typeof db.prepare === "function"
          ? createCachedDatabase(db)
          : null;
    if (!cachedDb) {
      logger.warn(
        "Database missing execute/prepare; falling back to stateless token validation"
      );
      return { ok: true };
    }

    // Use cached database and query templates for token consumption.
    const dbHelper = new DatabaseHelper(cachedDb, logger);

    const timer = logger.startTimer("token-consumption-update");
    const updateResult = await dbHelper.consumeToken(tokenHash, now);
    timer.end({ changes: updateResult.changes });

    if (!updateResult || updateResult.changes === 0) {
      // Check if token exists but was already used or expired
      const existingToken = await dbHelper.findToken(tokenHash);

      if (!existingToken) {
        logger.warn("Token not found in database", { tokenHash });
        return { ok: false, error: "confirmToken not found." };
      }

      // If apply succeeded but token consumption wasn't recorded (rare), allow deploy based on the apply event.
      // This keeps the UX consistent: deploy-after-apply with the same confirmToken should work.
      if (!existingToken.used_at && action === "deploy") {
        const allowDeployReuse = await canReuseConsumedTokenForDeploy(
          db,
          existingToken,
          idempotencyKey,
          action
        );
        if (allowDeployReuse) {
          logger.info("Token reuse allowed for deploy action", {
            idempotencyKey,
          });
          return { ok: true };
        }
      }

      if (existingToken.used_at) {
        logger.logSecurity("Attempted reuse of consumed token", {
          tokenHash,
          usedAt: existingToken.used_at,
          action,
          idempotencyKey,
        });

        // Check if this is a deploy action that can reuse consumed tokens
        const allowDeployReuse = await canReuseConsumedTokenForDeploy(
          db,
          existingToken,
          idempotencyKey,
          action
        );
        if (!allowDeployReuse) {
          return { ok: false, error: "confirmToken already used." };
        }
        logger.info("Token reuse allowed for deploy action", {
          idempotencyKey,
        });
        return { ok: true };
      }

      if (Date.now() > new Date(existingToken.expires_at).getTime()) {
        logger.warn("Token expired during validation", {
          tokenHash,
          expiresAt: existingToken.expires_at,
        });
        return { ok: false, error: "confirmToken has expired." };
      }

      logger.error("Token consumption failed - possible race condition", {
        tokenHash,
      });
      return {
        ok: false,
        error: "confirmToken could not be consumed (race condition).",
      };
    }

    logger.info("Token successfully consumed", { action, idempotencyKey });
    return { ok: true };
  } catch (error) {
    logger.error(
      "Token consumption failed",
      { action, idempotencyKey, error: error.message },
      error
    );
    return {
      ok: false,
      error: "Database transaction failed. Please try again.",
    };
  }
};

// Export internal helpers for unit tests.
export { createConfirmToken, sha256Hex, validateAndConsumeConfirmToken };

const buildOrchestratorRequest = (request, payload) =>
  new Request(request.url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

const runOrchestrator = async (context, payload) => {
  const request = buildOrchestratorRequest(context.request, payload);
  return handleOrchestrator({
    ...context,
    request,
  });
};

const asObject = (value) =>
  value && typeof value === "object" && !Array.isArray(value) ? value : {};

const normalizeText = (value) =>
  String(value || "")
    .replace(/\s+/g, " ")
    .trim();

const extractPathCandidate = (payload, command) => {
  const params = asObject(payload.raw?.parameters);
  const direct = String(
    params.path || params.file || payload.path || payload.file || ""
  ).trim();
  if (direct) return direct;
  const match = String(command || "").match(
    /(?:file|path)\s+([a-zA-Z0-9._/-]+)/i
  );
  return match ? String(match[1] || "").trim() : "";
};

const extractSearchQuery = (payload, command) => {
  const params = asObject(payload.raw?.parameters);
  const direct = String(params.q || params.query || "").trim();
  if (direct) return direct;
  const quoted = String(command || "").match(/["']([^"']{2,})["']/);
  if (quoted?.[1]) return String(quoted[1]).trim();
  const forMatch = String(command || "").match(/\bfor\s+(.+)$/i);
  return forMatch?.[1] ? String(forMatch[1]).trim() : "";
};

const extractStoreId = (payload, command) => {
  const params = asObject(payload.raw?.parameters);
  const direct = String(params.id || params.productId || "").trim();
  if (direct) return direct;
  const match = String(command || "").match(
    /\bproduct\s+([a-z0-9][a-z0-9_-]{2,})\b/i
  );
  return match ? String(match[1] || "").trim() : "";
};

const toBooleanOrUndefined = (value) => {
  if (typeof value === "boolean") return value;
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  if (!normalized) return undefined;
  if (["1", "true", "yes", "on", "enable", "enabled"].includes(normalized))
    return true;
  if (["0", "false", "no", "off", "disable", "disabled"].includes(normalized))
    return false;
  return undefined;
};

const extractInteger = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.round(value);
  }
  const normalized = String(value || "").trim();
  if (!normalized) return undefined;
  const parsed = Number.parseInt(normalized, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const looksLikeContentEdit = (command) => {
  const lower = String(command || "").toLowerCase();
  const editVerb =
    /\b(update|change|set|edit|replace|make|insert|add|rewrite)\b/.test(lower);
  const contentTarget =
    /\b(headline|subhead|title|description|copy|text|cta|button|hero|theme|font|color|page|section|image|video|background)\b/.test(
      lower
    );
  return editVerb && contentTarget;
};

const parseExplicitApiOperation = (payload) => {
  const params = asObject(payload.raw?.parameters);
  const api = asObject(params.api);
  const path = String(api.path || api.endpoint || "").trim();
  if (!path) return null;
  const method = String(api.method || "GET")
    .trim()
    .toUpperCase();
  if (!ALLOWED_CC_METHODS.has(method)) {
    return {
      invalid: true,
      reason:
        "Explicit API method must be one of GET, POST, PUT, DELETE for command center operations.",
      method,
    };
  }
  const body = api.body;
  const url = new URL(`https://execute.local${path}`);
  const query = {
    ...Object.fromEntries(url.searchParams.entries()),
    ...asObject(api.query),
  };
  if (!isCommandCenterPath(url)) {
    return {
      invalid: true,
      reason: "Explicit API path is not within the Command Center surface.",
      path,
    };
  }
  return {
    source: "explicit-api",
    endpoint: url.pathname,
    method,
    query,
    body,
    description: `Execute ${method} ${url.pathname}`,
    deployRequired: url.pathname === "/api/deploy/run",
  };
};

const parseCommandCenterOperation = (payload) => {
  if (!CC_ROUTABLE_ACTIONS.has(payload.action)) return null;
  const explicit = parseExplicitApiOperation(payload);
  if (explicit) return explicit;

  const raw = normalizeText(payload.command);
  if (!raw) return null;

  const opsPrefix = raw.match(/^(ops|operation|admin ops)\s*:\s*/i);
  const command = opsPrefix ? raw.slice(opsPrefix[0].length).trim() : raw;
  const lower = command.toLowerCase();

  // Avoid hijacking normal site-edit commands unless operation mode is explicit.
  if (!opsPrefix && looksLikeContentEdit(lower)) return null;

  const params = asObject(payload.raw?.parameters);
  const deploySummary = asObject(params.summary);

  if (/\b(deploy|deployment)\s+logs?\b|\btail\s+deploy\b/i.test(lower)) {
    return {
      source: "nl",
      endpoint: "/api/deploy/logs",
      method: "GET",
      description: "Fetch deploy logs",
      deployRequired: false,
    };
  }

  if (/\bdeploy\s+(meter|quota)\b|\bremaining deploys?\b/i.test(lower)) {
    return {
      source: "nl",
      endpoint: "/api/deploy/meter",
      method: "GET",
      description: "Fetch deploy quota and metering",
      deployRequired: false,
    };
  }

  if (/\benv(ironment)?\s+audit\b|\bcheck\s+env\b/i.test(lower)) {
    return {
      source: "nl",
      endpoint: "/api/env/audit",
      method: "GET",
      description: "Run environment audit",
      deployRequired: false,
    };
  }

  if (/\bgovernance\s+check\b|\bvalidation checklist\b/i.test(lower)) {
    return {
      source: "nl",
      endpoint: "/api/governance/check",
      method: "GET",
      description: "Run governance checks",
      deployRequired: false,
    };
  }

  if (/\b(show|run|get)\s+analytics\b|\banalytics metrics\b/i.test(lower)) {
    return {
      source: "nl",
      endpoint: "/api/analytics/metrics",
      method: "GET",
      description: "Fetch analytics metrics",
      deployRequired: false,
    };
  }

  if (/\brepo\s+status\b|\bstaged changes\b|\bshadow status\b/i.test(lower)) {
    return {
      source: "nl",
      endpoint: "/api/repo/status",
      method: "GET",
      description: "Fetch staged shadow repo status",
      deployRequired: false,
    };
  }

  if (/\b(file tree|repo tree|list files?)\b/i.test(lower)) {
    return {
      source: "nl",
      endpoint: "/api/fs/tree",
      method: "GET",
      description: "List repository file tree",
      deployRequired: false,
    };
  }

  if (/\b(search|find|grep)\b.*\b(files?|repo|code)\b/i.test(lower)) {
    const query = extractSearchQuery(payload, command);
    if (!query) {
      return {
        invalid: true,
        reason:
          "Search operation requires parameters.query (or quoted query text).",
      };
    }
    return {
      source: "nl",
      endpoint: "/api/fs/search",
      method: "GET",
      query: { q: query },
      description: `Search files for "${query}"`,
      deployRequired: false,
    };
  }

  if (/\b(read|open|show|view)\s+file\b/i.test(lower)) {
    const path = extractPathCandidate(payload, command);
    if (!path) {
      return {
        invalid: true,
        reason:
          "Read file operation requires parameters.path or a file/path in the command.",
      };
    }
    return {
      source: "nl",
      endpoint: "/api/fs/read",
      method: "GET",
      query: { path },
      description: `Read file ${path}`,
      deployRequired: false,
    };
  }

  if (/\b(write|update|edit|create)\s+file\b/i.test(lower)) {
    const path = extractPathCandidate(payload, command);
    const content = String(params.content ?? params.text ?? params.value ?? "");
    if (!path) {
      return {
        invalid: true,
        reason:
          "Write file operation requires parameters.path or a file/path in the command.",
      };
    }
    if (!content) {
      return {
        invalid: true,
        reason: "Write file operation requires parameters.content.",
      };
    }
    return {
      source: "nl",
      endpoint: "/api/fs/write",
      method: "POST",
      body: { path, content },
      description: `Write file ${path}`,
      deployRequired: false,
    };
  }

  if (/\b(delete|remove)\s+file\b/i.test(lower)) {
    const path = extractPathCandidate(payload, command);
    if (!path) {
      return {
        invalid: true,
        reason:
          "Delete file operation requires parameters.path or a file/path in the command.",
      };
    }
    return {
      source: "nl",
      endpoint: "/api/fs/delete",
      method: "POST",
      body: { path },
      description: `Delete file ${path}`,
      deployRequired: false,
    };
  }

  if (/\b(build|generate)\s+preview\b|\bpreview routes?\b/i.test(lower)) {
    const routes = Array.isArray(params.routes)
      ? params.routes.filter((v) => typeof v === "string" && v.trim())
      : [];
    const files = Array.isArray(params.files)
      ? params.files.filter((v) => typeof v === "string" && v.trim())
      : [];
    const showMonetizationZones = Boolean(params.showMonetizationZones);
    return {
      source: "nl",
      endpoint: "/api/preview/build",
      method: "POST",
      body: { routes, files, showMonetizationZones },
      description: "Build preview routes from shadow state",
      deployRequired: false,
    };
  }

  if (/\b(commit|save)\s+(staged|shadow|repo|changes?)\b/i.test(lower)) {
    const message = String(
      params.message || `Command Center commit: ${command}`
    )
      .trim()
      .slice(0, 240);
    return {
      source: "nl",
      endpoint: "/api/repo/commit",
      method: "POST",
      body: { message },
      description: "Commit staged shadow changes to repository",
      deployRequired: false,
    };
  }

  if (/\b(list|show|get)\s+(store\s+)?products?\b/i.test(lower)) {
    return {
      source: "nl",
      endpoint: "/api/store/products",
      method: "GET",
      description: "List store products",
      deployRequired: false,
    };
  }

  if (/\b(create|add)\s+product\b/i.test(lower)) {
    return {
      source: "nl",
      endpoint: "/api/store/products",
      method: "POST",
      body: asObject(params.product),
      description: "Create store product",
      deployRequired: false,
    };
  }

  if (/\b(update|edit)\s+product\b/i.test(lower)) {
    const id = extractStoreId(payload, command);
    if (!id) {
      return {
        invalid: true,
        reason:
          "Update product operation requires parameters.id (or a product id in the command).",
      };
    }
    return {
      source: "nl",
      endpoint: `/api/store/${id}`,
      method: "PUT",
      body: asObject(params.product),
      description: `Update store product ${id}`,
      deployRequired: false,
    };
  }

  if (/\b(delete|remove)\s+product\b/i.test(lower)) {
    const id = extractStoreId(payload, command);
    if (!id) {
      return {
        invalid: true,
        reason:
          "Delete product operation requires parameters.id (or a product id in the command).",
      };
    }
    return {
      source: "nl",
      endpoint: `/api/store/${id}`,
      method: "DELETE",
      description: `Delete store product ${id}`,
      deployRequired: false,
    };
  }

  if (/\b(list|show|get)\s+media\b|\bmedia assets?\b/i.test(lower)) {
    return {
      source: "nl",
      endpoint: "/api/media/list",
      method: "GET",
      description: "List media assets",
      deployRequired: false,
    };
  }

  if (
    /\b(list|show|get)\s+audio\b|\baudio assets?\b|\bsoundboard\b/i.test(lower)
  ) {
    return {
      source: "nl",
      endpoint: "/api/audio/list",
      method: "GET",
      description: "List audio assets",
      deployRequired: false,
    };
  }

  if (
    /\b(live|stream)\s+(state|status)\b|\bshow\s+live\b/i.test(lower) &&
    !/\b(set|update|enable|disable)\b/i.test(lower)
  ) {
    return {
      source: "nl",
      endpoint: "/api/live/state",
      method: "GET",
      description: "Fetch live stream state",
      deployRequired: false,
    };
  }

  if (
    /\b(set|update|enable|disable)\b.*\b(live|stream|superchat|actions|bitrate)\b/i.test(
      lower
    )
  ) {
    const stateBody = {
      streamState: String(params.streamState || "").trim() || undefined,
      websocketState: String(params.websocketState || "").trim() || undefined,
      superchatEnabled: toBooleanOrUndefined(params.superchatEnabled),
      actionsEnabled: toBooleanOrUndefined(params.actionsEnabled),
      bitrateKbps: extractInteger(params.bitrateKbps),
    };
    if (/\benable superchat\b/i.test(lower)) stateBody.superchatEnabled = true;
    if (/\bdisable superchat\b/i.test(lower))
      stateBody.superchatEnabled = false;
    if (/\benable actions\b/i.test(lower)) stateBody.actionsEnabled = true;
    if (/\bdisable actions\b/i.test(lower)) stateBody.actionsEnabled = false;
    return {
      source: "nl",
      endpoint: "/api/live/state",
      method: "POST",
      body: stateBody,
      description: "Update live stream state",
      deployRequired: false,
    };
  }

  if (/\b(monetization|monetisation)\b/.test(lower)) {
    const isWrite = /\b(set|update|enable|disable|change)\b/i.test(lower);
    if (!isWrite) {
      return {
        source: "nl",
        endpoint: "/api/monetization/config",
        method: "GET",
        description: "Fetch monetization config",
        deployRequired: false,
      };
    }
    const nextConfig = asObject(params.config);
    const adDensityCap = extractInteger(params.adDensityCap);
    if (adDensityCap !== undefined) nextConfig.adDensityCap = adDensityCap;
    return {
      source: "nl",
      endpoint: "/api/monetization/config",
      method: "POST",
      body: nextConfig,
      description: "Update monetization config",
      deployRequired: false,
    };
  }

  if (/\bvoice\b.*\b(command|execute|plan)\b/i.test(lower)) {
    const voiceCommand = String(params.voiceCommand || params.command || "")
      .trim()
      .slice(0, 1000);
    if (!voiceCommand) {
      return {
        invalid: true,
        reason: "Voice execution requires parameters.voiceCommand.",
      };
    }
    return {
      source: "nl",
      endpoint: "/api/voice/execute",
      method: "POST",
      body: { command: voiceCommand },
      description: "Generate voice execution plan",
      deployRequired: false,
    };
  }

  if (
    /\b(deploy|ship|publish|push live|go live)\b/i.test(lower) &&
    !/\blogs?\b|\bmeter\b|\bquota\b/i.test(lower)
  ) {
    const confirmation = String(
      params.confirmation || payload.raw?.confirmation || ""
    ).trim();
    return {
      source: "nl",
      endpoint: "/api/deploy/run",
      method: "POST",
      body: {
        confirmation,
        summary: deploySummary,
      },
      description: "Run deployment pipeline",
      deployRequired: true,
      note: `Deployment requires confirmation phrase "${CONFIRMATION_PHRASE}" exactly.`,
    };
  }

  return null;
};

const callCommandCenter = async (context, payload, operation) => {
  if (!operation || operation.invalid) {
    const reason =
      operation?.reason || "Invalid command center operation request.";
    throw new Error(reason);
  }

  const method = String(operation.method || "GET")
    .trim()
    .toUpperCase();
  if (!ALLOWED_CC_METHODS.has(method)) {
    throw new Error(
      "Operation method is not allowed. Use GET, POST, PUT, or DELETE."
    );
  }
  const requestUrl = new URL(context.request.url);
  requestUrl.pathname = String(operation.endpoint || "").trim();
  requestUrl.search = "";

  for (const [k, v] of Object.entries(asObject(operation.query))) {
    if (v === undefined || v === null) continue;
    requestUrl.searchParams.set(k, String(v));
  }

  if (!isCommandCenterPath(requestUrl)) {
    throw new Error("Operation endpoint is outside command center scope.");
  }

  const headers = new Headers();
  const actor = String(payload.actor || "bot")
    .trim()
    .slice(0, 120);
  headers.set("x-cc-actor", `execute:${actor || "bot"}`);
  if (context.env?.DEPLOY_PLAN_TIER) {
    headers.set("x-cc-plan-tier", String(context.env.DEPLOY_PLAN_TIER));
  }
  if (context.env?.DEPLOY_BILLING_STATUS) {
    headers.set(
      "x-cc-billing-status",
      String(context.env.DEPLOY_BILLING_STATUS)
    );
  }
  if (JSON_BODY_METHODS.has(method)) {
    headers.set("Content-Type", "application/json");
  }

  const init = { method, headers };
  if (JSON_BODY_METHODS.has(method)) {
    init.body = JSON.stringify(operation.body || {});
  }

  const internalRequest = new Request(requestUrl.toString(), init);
  const ccResponse = await handleCommandCenterRequest({
    request: internalRequest,
    env: context.env,
    url: requestUrl,
    assets: context.env?.ASSETS || context.env?.SITE_ASSETS || null,
  });

  if (!ccResponse) {
    throw new Error("Command Center endpoint did not resolve.");
  }

  const ccPayload = await decodeJsonResponse(ccResponse);
  if (!ccResponse.ok) {
    throw new Error(
      ccPayload?.error ||
        ccPayload?.message ||
        `Operation failed (${ccResponse.status}).`
    );
  }

  return {
    operation: {
      source: operation.source || "nl",
      endpoint: requestUrl.pathname,
      method,
      query: asObject(operation.query),
      deployRequired: Boolean(operation.deployRequired),
    },
    ...ccPayload,
  };
};

const buildCommandCenterPlan = (operation) => ({
  ok: true,
  mode: "plan",
  operation: {
    source: operation.source || "nl",
    endpoint: operation.endpoint,
    method: operation.method,
    query: asObject(operation.query),
    body: asObject(operation.body),
    deployRequired: Boolean(operation.deployRequired),
  },
  executionPlan: {
    intent: "command_center_operation",
    targets: {
      endpoint: operation.endpoint,
      method: operation.method,
    },
    operations: [operation.method || "GET"],
    validations: [
      "env-audit",
      "governance-check",
      "preview-integrity",
      "shell-integrity",
    ],
    previewRoutes: [],
    deployRequired: Boolean(operation.deployRequired),
  },
  whatChanged: [
    operation.description ||
      `Planned operation ${operation.method} ${operation.endpoint}`,
  ],
  note:
    operation.note ||
    "Operation planned only. Use apply/auto to execute against backend state.",
});

const mapActionToEventType = (action) => {
  switch (action) {
    case "plan":
      return "planned";
    case "preview":
      return "previewed";
    case "apply":
      return "applied";
    case "deploy":
      return "deployed";
    case "rollback":
      return "rolled_back";
    case "auto":
      return "applied"; // Auto action applies changes immediately
    case "list_pages":
      return "planned"; // List pages is a read-only planning operation
    case "read_page":
      return "planned"; // Read page is a read-only planning operation
    case "status":
      return "planned"; // Status check is a read-only planning operation
    default:
      return "planned";
  }
};

const fetchStatus = async (db) => {
  if (!db) {
    return {
      commands: [],
      builds: [],
      executeEvents: [],
      warnings: ["D1 database not available in this environment."],
    };
  }

  const commandsPromise = db
    .prepare(
      "SELECT id, ts, command, actions, files, commit_sha, deployment_status FROM commands ORDER BY ts DESC LIMIT 10"
    )
    .all()
    .then((res) => res.results || [])
    .catch(() => []);

  const buildsPromise = db
    .prepare(
      "SELECT id, ts, status, message FROM builds ORDER BY ts DESC LIMIT 10"
    )
    .all()
    .then((res) => res.results || [])
    .catch(() => []);

  const executeEventsPromise = db
    .prepare(
      "SELECT ts, action, idempotency_key, status, trace_id FROM execute_events ORDER BY ts DESC LIMIT 10"
    )
    .all()
    .then((res) => res.results || [])
    .catch(() => []);

  const [commands, builds, executeEvents] = await Promise.all([
    commandsPromise,
    buildsPromise,
    executeEventsPromise,
  ]);
  return { commands, builds, executeEvents };
};

export async function onRequestPost(context) {
  const { request, env } = context;
  const startTime = performance.now();

  // Initialize logger and set up request context
  const logger = initializeLogger({
    level: env.LOG_LEVEL
      ? LOG_LEVELS[env.LOG_LEVEL.toUpperCase()]
      : LOG_LEVELS.INFO,
    enableConsole: true,
    enableStructured: env.NODE_ENV === "production",
  });

  const { traceId, requestId } = loggingMiddleware(request);
  logger.setContext({
    traceId,
    requestId,
    action: "execute-api-request",
  });

  try {
    logger.info("Execute API request started", {
      method: request.method,
      url: request.url,
    });

    const usesHeaderToken = hasValidHeaderToken(request, env);

    // CSRF defense-in-depth for cookie-authenticated browser requests.
    if (!usesHeaderToken && !isSameOriginRequest(request)) {
      return toJsonResponse(403, { error: "Forbidden.", traceId }, env);
    }

    if (!(await isAuthorized(request, env))) {
      logger.logSecurity("Unauthorized access attempt", {
        userAgent: request.headers.get("user-agent"),
        ip: request.headers.get("cf-connecting-ip"),
      });
      return toJsonResponse(
        401,
        {
          error: "Unauthorized. Provide valid admin cookie or x-orch-token.",
          auth: {
            header: "x-orch-token",
            env: ["ORCH_TOKEN", "X_ORCH_TOKEN"],
            adminLogin: "/api/admin/login",
            note: "This endpoint requires either a matching x-orch-token header or a signed admin cookie.",
          },
          traceId,
        },
        env
      );
    }

    const rawPayload = await readJsonBody(request);
    if (!rawPayload) {
      logger.warn("Invalid JSON payload received");
      return toJsonResponse(
        400,
        { error: "Invalid JSON payload.", traceId },
        env
      );
    }

    if (rawPayload.error === "Request body too large") {
      logger.warn("Request body too large", { size: rawPayload.size });
      return toJsonResponse(
        413,
        {
          error: "Request body too large. Maximum size is 1MB.",
          traceId,
          received: rawPayload.size,
          max: 1024 * 1024,
        },
        env
      );
    }

    // Validate request schema
    let payload;
    try {
      payload = validateRequest(rawPayload, "ExecuteRequest");
    } catch (error) {
      if (error instanceof SchemaValidationError) {
        logger.warn("Request schema validation failed", {
          error: error.message,
          field: error.field,
          value: error.value,
        });
        return toJsonResponse(
          400,
          {
            error: "Invalid request format.",
            details: error.message,
            traceId,
          },
          env
        );
      }
      throw error;
    }

    logger.setContext({ action: payload.action });

    if (!VALID_ACTIONS.has(payload.action)) {
      logger.warn("Invalid action requested", { action: payload.action });
      return toJsonResponse(
        400,
        {
          error:
            "Invalid action. Use plan, preview, apply, deploy, status, rollback, auto, list_pages, or read_page.",
          traceId,
        },
        env
      );
    }

    if (!payload.idempotencyKey) {
      logger.warn("Missing required idempotency key");
      return toJsonResponse(
        400,
        { error: "Missing required field: idempotencyKey.", traceId },
        env
      );
    }

    if (
      (payload.action === "plan" ||
        payload.action === "preview" ||
        payload.action === "apply" ||
        payload.action === "auto") &&
      !payload.command
    ) {
      logger.warn("Missing required command field", { action: payload.action });
      return toJsonResponse(
        400,
        { error: `Action '${payload.action}' requires command.`, traceId },
        env
      );
    }

    // Rate limiting check
    const db = dbFromEnv(env);
    const cachedDb = db ? createDatabaseMonitor(db, logger) : null;
    const rateLimitFn = createRateLimitMiddleware(cachedDb);
    const rateLimitCheck = await rateLimitFn(request, payload.action);

    if (!rateLimitCheck.allowed) {
      logger.logSecurity("Rate limit exceeded", {
        action: payload.action,
        limit: rateLimitCheck.limit,
        remaining: rateLimitCheck.remaining,
        blocked: rateLimitCheck.blocked,
        blockedUntil: rateLimitCheck.blockedUntil,
      });

      return new Response(
        JSON.stringify({
          error: rateLimitCheck.blocked
            ? "Too many requests. You have been temporarily blocked due to excessive requests."
            : "Rate limit exceeded. Please try again later.",
          retryAfter: rateLimitCheck.blockedUntil
            ? Math.ceil((rateLimitCheck.blockedUntil - Date.now()) / 1000)
            : Math.ceil((rateLimitCheck.resetTime - Date.now()) / 1000),
          limit: rateLimitCheck.limit,
          windowMs: rateLimitCheck.windowMs,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            ...rateLimitCheck.headers,
          },
        }
      );
    }

    // Validate page names for actions that target specific pages
    if (
      payload.action === "read_page" ||
      payload.action === "auto" ||
      payload.action === "apply" ||
      payload.action === "plan" ||
      payload.action === "preview"
    ) {
      const pageCandidate = String(payload.page || payload.path || "").trim();
      if (pageCandidate) {
        const pageValidation = validatePageName(pageCandidate);
        if (!pageValidation.valid) {
          logger.warn("Invalid page name provided", { page: pageCandidate });
          return toJsonResponse(
            400,
            { error: pageValidation.error, traceId },
            env
          );
        }
        payload.page = pageValidation.page;
      }
    }

    if (cachedDb) {
      await ensureExecuteTables(cachedDb);

      const dbHelper = new DatabaseHelper(cachedDb, logger);
      const existing = await dbHelper.findEvent(
        payload.action,
        payload.idempotencyKey
      );
      if (existing?.response_json) {
        logger.info("Returning cached response for idempotent request", {
          action: payload.action,
          idempotencyKey: payload.idempotencyKey,
        });
        return new Response(existing.response_json, {
          status: Number(existing.status) || 200,
          headers: JSON_HEADERS,
        });
      }
    }

    const actionRecord = makeActionRecord(payload);
    const eventId = crypto.randomUUID();
    const commandCenterOperation = parseCommandCenterOperation(payload);
    if (commandCenterOperation) {
      logger.info("Command Center operation resolved from execute command", {
        action: payload.action,
        endpoint: commandCenterOperation.endpoint,
        method: commandCenterOperation.method,
        source: commandCenterOperation.source,
        invalid: Boolean(commandCenterOperation.invalid),
      });
    }

    try {
      if (commandCenterOperation?.invalid) {
        const message =
          commandCenterOperation.reason ||
          "Invalid command center operation request.";
        const eventPayload = makeEvent({
          eventType: "error",
          actionPayload: actionRecord,
          traceId,
          eventId,
          error: { message },
        });
        await writeEventRecord(db, {
          eventId,
          action: payload.action,
          idempotencyKey: payload.idempotencyKey,
          traceId,
          status: 400,
          payload: eventPayload,
        });
        return toJsonResponse(400, eventPayload, env);
      }

      if (payload.action === "status") {
        const statusTimer = logger.startTimer("status-fetch");
        const statusData = await fetchStatus(db);
        statusTimer.end();

        const eventPayload = makeEvent({
          eventType: "planned",
          actionPayload: actionRecord,
          traceId,
          eventId,
          result: statusData,
        });
        await writeEventRecord(db, {
          eventId,
          action: payload.action,
          idempotencyKey: payload.idempotencyKey,
          traceId,
          status: 200,
          payload: eventPayload,
        });
        return toJsonResponse(200, eventPayload, env);
      }

      if (payload.action === "list_pages") {
        logger.info("Listing all site pages");
        const listPayload = {
          mode: "plan",
          command: "List all site pages",
          target: payload.target,
        };
        const listResponse = await runOrchestrator(context, listPayload);
        const listResult = await decodeJsonResponse(listResponse);

        // Safely extract pages with fallback
        const pages =
          listResult?.plan?.intent?.scope?.files ||
          listResult?.files ||
          listResult?.pages ||
          [];

        const eventPayload = makeEvent({
          eventType: "planned",
          actionPayload: actionRecord,
          traceId,
          eventId,
          result: {
            pages,
            note: "These are the HTML pages currently in the site repository.",
          },
        });
        await writeEventRecord(db, {
          eventId,
          action: payload.action,
          idempotencyKey: payload.idempotencyKey,
          traceId,
          status: 200,
          payload: eventPayload,
        });
        return toJsonResponse(200, eventPayload, env);
      }

      if (payload.action === "read_page") {
        const targetPage =
          payload.page || payload.path || payload.file || "index.html";

        // Validate the target page
        const pageValidation = validatePageName(targetPage);
        if (!pageValidation.valid) {
          const eventPayload = makeEvent({
            eventType: "error",
            actionPayload: actionRecord,
            traceId,
            eventId,
            error: { message: pageValidation.error },
          });
          await writeEventRecord(db, {
            eventId,
            action: payload.action,
            idempotencyKey: payload.idempotencyKey,
            traceId,
            status: 400,
            payload: eventPayload,
          });
          return toJsonResponse(400, eventPayload, env);
        }

        logger.info("Reading page content", { page: pageValidation.page });
        const readPayload = {
          mode: "plan",
          command: `Read the current content of ${pageValidation.page}`,
          target: payload.target,
          page: pageValidation.page,
        };
        const readResponse = await runOrchestrator(context, readPayload);
        const readResult = await decodeJsonResponse(readResponse);

        // Safely handle potentially undefined content
        const safeContent =
          readResult && typeof readResult === "object"
            ? readResult
            : { error: "Invalid response format" };

        const eventPayload = makeEvent({
          eventType: "planned",
          actionPayload: actionRecord,
          traceId,
          eventId,
          result: { page: pageValidation.page, content: safeContent },
        });
        await writeEventRecord(db, {
          eventId,
          action: payload.action,
          idempotencyKey: payload.idempotencyKey,
          traceId,
          status: 200,
          payload: eventPayload,
        });
        return toJsonResponse(200, eventPayload, env);
      }

      if (payload.action === "auto") {
        if (commandCenterOperation) {
          const autoTimer = logger.startTimer("auto-command-center-operation");
          const commandCenterResult = await callCommandCenter(
            context,
            payload,
            commandCenterOperation
          );
          const operationSteps =
            commandCenterOperation.endpoint === "/api/deploy/run"
              ? ["planned", "deploy_triggered"]
              : commandCenterOperation.method === "GET"
                ? ["planned", "queried"]
                : ["planned", "applied"];
          const result = {
            ...commandCenterResult,
            autoMode: true,
            steps: operationSteps,
            message:
              commandCenterOperation.description ||
              "Command Center operation executed through auto mode.",
          };
          autoTimer.end({ steps: result.steps });
          const eventPayload = makeEvent({
            eventType: "applied",
            actionPayload: actionRecord,
            traceId,
            eventId,
            result,
          });
          await writeEventRecord(db, {
            eventId,
            action: payload.action,
            idempotencyKey: payload.idempotencyKey,
            traceId,
            status: 200,
            payload: eventPayload,
          });
          return toJsonResponse(200, eventPayload, env);
        }

        logger.info("Executing auto mode", { command: payload.command });
        const autoTimer = logger.startTimer("auto-execution");

        const autoApplyPayload = {
          mode: "apply",
          command: payload.command,
          target: payload.target,
          confirmation: CONFIRMATION_PHRASE,
          page: payload.page,
          path: payload.path,
          file: payload.file,
        };
        const applyResponse = await runOrchestrator(context, autoApplyPayload);
        const applyResult = await decodeJsonResponse(applyResponse);

        if (!applyResponse.ok) {
          const errorMessage =
            applyResult?.error ||
            applyResult?.message ||
            "Auto-apply failed with unknown error.";
          const normalizedError = String(errorMessage).toLowerCase();
          const isNoOpPlan = normalizedError.includes(
            "no supported changes were produced by the plan"
          );
          if (isNoOpPlan) {
            logger.info(
              "Auto apply produced no supported changes; triggering deploy fallback",
              { command: payload.command }
            );
            const deployResponse = await runOrchestrator(context, {
              mode: "deploy",
              command: payload.command || "Deploy latest approved changes",
              target: payload.target,
              page: payload.page,
              path: payload.path,
              file: payload.file,
            });
            const deployResult = await decodeJsonResponse(deployResponse);
            if (!deployResponse.ok) {
              const deployError =
                deployResult?.error ||
                deployResult?.message ||
                "Deploy fallback failed.";
              logger.error("Auto deploy fallback failed", {
                error: deployError,
              });
              throw new Error(deployError);
            }
            const result = {
              ...deployResult,
              autoMode: true,
              noChanges: true,
              steps: ["planned", "no_changes", "deploy_triggered"],
              message:
                "No content delta was produced by apply; deployment fallback was triggered for the latest commit.",
            };
            autoTimer.end({ steps: result.steps });
            const eventPayload = makeEvent({
              eventType: "applied",
              actionPayload: actionRecord,
              traceId,
              eventId,
              result,
            });
            await writeEventRecord(db, {
              eventId,
              action: payload.action,
              idempotencyKey: payload.idempotencyKey,
              traceId,
              status: 200,
              payload: eventPayload,
            });
            return toJsonResponse(200, eventPayload, env);
          }
          logger.error("Auto mode failed", { error: errorMessage });
          throw new Error(errorMessage);
        }

        const result = {
          ...applyResult,
          autoMode: true,
          steps: [
            "planned",
            "applied",
            applyResult?.deployment?.status === "skipped"
              ? "deploy_skipped"
              : "deploy_triggered",
          ],
          message:
            "Change was planned, applied, and deployment triggered in a single call.",
        };

        autoTimer.end({ steps: result.steps });

        const eventPayload = makeEvent({
          eventType: "applied",
          actionPayload: actionRecord,
          traceId,
          eventId,
          result,
        });
        await writeEventRecord(db, {
          eventId,
          action: payload.action,
          idempotencyKey: payload.idempotencyKey,
          traceId,
          status: 200,
          payload: eventPayload,
        });
        return toJsonResponse(200, eventPayload, env);
      }

      if (
        payload.action === "apply" ||
        payload.action === "deploy" ||
        payload.action === "rollback"
      ) {
        logger.info("Validating confirm token", { action: payload.action });
        const tokenCheck = await validateAndConsumeConfirmToken(env, db, {
          token: payload.confirmToken,
          action: payload.action,
          idempotencyKey: payload.idempotencyKey,
        });
        if (!tokenCheck.ok) {
          logger.logSecurity("Token validation failed", {
            action: payload.action,
            error: tokenCheck.error,
          });
          return toJsonResponse(403, { error: tokenCheck.error, traceId }, env);
        }
      }

      if (
        commandCenterOperation &&
        (payload.action === "plan" ||
          payload.action === "preview" ||
          payload.action === "apply")
      ) {
        let result =
          payload.action === "plan" || payload.action === "preview"
            ? buildCommandCenterPlan(commandCenterOperation)
            : await callCommandCenter(context, payload, commandCenterOperation);

        if (payload.action === "preview") {
          const confirm = await createConfirmToken(env, db, {
            action: "execute",
            idempotencyKey: payload.idempotencyKey,
            traceId,
          });
          result = {
            ...result,
            ...confirm,
            confirmInstructions:
              "Use this confirmToken with the same idempotencyKey for apply, and optionally deploy right after apply.",
          };
        }

        const eventPayload = makeEvent({
          eventType: mapActionToEventType(payload.action),
          actionPayload: actionRecord,
          traceId,
          eventId,
          result,
        });

        await writeEventRecord(db, {
          eventId,
          action: payload.action,
          idempotencyKey: payload.idempotencyKey,
          traceId,
          status: 200,
          payload: eventPayload,
        });

        return toJsonResponse(200, eventPayload, env);
      }

      let orchestratorPayload = null;
      if (payload.action === "plan" || payload.action === "preview") {
        orchestratorPayload = {
          mode: "plan",
          command: payload.command,
          target: payload.target,
          page: payload.page,
          path: payload.path,
          file: payload.file,
        };
      } else if (payload.action === "apply") {
        orchestratorPayload = {
          mode: "apply",
          command: payload.command,
          target: payload.target,
          confirmation: CONFIRMATION_PHRASE,
          page: payload.page,
          path: payload.path,
          file: payload.file,
        };
      } else if (payload.action === "deploy") {
        orchestratorPayload = {
          mode: "deploy",
          command: payload.command || "Deploy latest changes",
          target: payload.target,
          page: payload.page,
          path: payload.path,
          file: payload.file,
        };
      } else if (payload.action === "rollback") {
        orchestratorPayload = {
          mode: "rollback_last",
          command: payload.command || "Rollback last change",
          target: payload.target,
          page: payload.page,
          path: payload.path,
          file: payload.file,
        };
      }

      logger.info("Calling orchestrator", {
        action: payload.action,
        mode: orchestratorPayload?.mode,
      });

      const orchestratorTimer = logger.startTimer("orchestrator-call");
      const orchestratorResponse = await runOrchestrator(
        context,
        orchestratorPayload
      );
      const orchestratorResult = await decodeJsonResponse(orchestratorResponse);
      orchestratorTimer.end();

      if (!orchestratorResponse.ok) {
        throw new Error(
          orchestratorResult?.error || "Orchestrator request failed."
        );
      }

      let result = orchestratorResult;
      if (payload.action === "preview") {
        const confirm = await createConfirmToken(env, db, {
          action: "execute",
          idempotencyKey: payload.idempotencyKey,
          traceId,
        });
        result = {
          ...orchestratorResult,
          ...confirm,
          confirmInstructions:
            "Use this confirmToken with the same idempotencyKey for apply, and optionally deploy right after apply.",
        };
      }

      const eventPayload = makeEvent({
        eventType: mapActionToEventType(payload.action),
        actionPayload: actionRecord,
        traceId,
        eventId,
        result,
      });

      await writeEventRecord(db, {
        eventId,
        action: payload.action,
        idempotencyKey: payload.idempotencyKey,
        traceId,
        status: 200,
        payload: eventPayload,
      });

      return toJsonResponse(200, eventPayload, env);
    } catch (err) {
      logger.error(
        "Request processing failed",
        {
          action: payload.action,
          error: err.message,
        },
        err
      );

      const errorPayload = makeEvent({
        eventType: "error",
        actionPayload: actionRecord,
        traceId,
        eventId,
        error: {
          message: err instanceof Error ? err.message : "Unknown error",
        },
      });

      await writeEventRecord(db, {
        eventId,
        action: payload.action,
        idempotencyKey: payload.idempotencyKey,
        traceId,
        status: 500,
        payload: errorPayload,
      });

      return toJsonResponse(500, errorPayload, env);
    } finally {
      // Log request completion with timing
      const responseTime = performance.now() - startTime;
      logger.logRequest(request, responseTime);
      logger.clearContext();
    }
  } catch (error) {
    // This catches errors outside the main try block (e.g., initialization errors)
    console.error("Execute API critical error:", error);
    return toJsonResponse(
      500,
      {
        error: "Internal server error",
        traceId: traceId || "unknown",
      },
      env
    );
  }
}
