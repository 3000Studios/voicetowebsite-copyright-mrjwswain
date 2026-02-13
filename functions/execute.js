import { adminCookieName, verifyAdminCookieValue } from "./adminAuth.js";
import { DatabaseHelper, createCachedDatabase, createDatabaseMonitor } from "./database-cache.js";
import { LOG_LEVELS, getLogger, initializeLogger, loggingMiddleware } from "./logger.js";
import { onRequestPost as handleOrchestrator } from "./orchestrator.js";
import { createRateLimitMiddleware } from "./rate-limiter.js";
import { SchemaValidationError, validateErrorResponse, validateRequest, validateResponse } from "./schema-validator.js";

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

// Public page targeting: allow any safe `slug(.html)` or "all".
// We intentionally block paths/directories so callers can't target `admin/*` or traverse.
const VALID_PUBLIC_PAGE_RE = /^[a-z0-9-]+(?:\.html)?$/;

const toJsonResponse = (status, payload, env) => {
  // Validate response schema only if enabled (default: production only)
  const enableValidation =
    env?.ENABLE_RESPONSE_VALIDATION === "true" ||
    (env?.NODE_ENV === "production" && env?.ENABLE_RESPONSE_VALIDATION !== "false");

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

const getTraceId = (request) => request.headers.get("x-trace-id") || crypto.randomUUID();

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
  if (trimmedPage.includes("/") || trimmedPage.includes("\\") || trimmedPage.includes("..")) {
    return { valid: false, error: `Invalid page '${trimmedPage}'. Use a public page like 'partners.html'.` };
  }

  if (!VALID_PUBLIC_PAGE_RE.test(trimmedPage)) {
    return { valid: false, error: `Invalid page '${trimmedPage}'. Use a public page like 'partners.html'.` };
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
    payload?.parameters && typeof payload.parameters === "object" && !Array.isArray(payload.parameters)
      ? payload.parameters
      : {};
  const pageValidation = validatePageName(payload?.page || parameters?.page || "");
  const page = pageValidation.valid ? pageValidation.page : "";
  const path = String(payload?.path || parameters?.path || "").trim();
  const file = String(payload?.file || parameters?.file || "").trim();
  const action = String(payload?.action || "")
    .trim()
    .toLowerCase();
  const idempotencyKey = String(payload?.idempotencyKey || "").trim();
  const safetyLevel = VALID_SAFETY_LEVELS.has(String(payload?.safetyLevel || "").toLowerCase())
    ? String(payload.safetyLevel).toLowerCase()
    : "medium";
  const command = String(payload?.command || payload?.parameters?.command || "").trim();
  const target = payload?.target === "sandbox" ? "sandbox" : "site";
  const confirmToken = String(payload?.confirmToken || payload?.parameters?.confirmToken || "").trim();
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

const getOrchestratorToken = (env) => String(env.ORCH_TOKEN || env.X_ORCH_TOKEN || "supersecret").trim();

const hasValidHeaderToken = (request, env) => {
  const provided = String(request.headers.get("x-orch-token") || "").trim();
  if (!provided) return false;
  return provided === getOrchestratorToken(env);
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
      .prepare("SELECT status, response_json FROM execute_events WHERE action = ? AND idempotency_key = ? LIMIT 1")
      .bind(action, idempotencyKey)
      .first();
  } catch (_) {
    return null;
  }
};

const writeEventRecord = async (db, { eventId, action, idempotencyKey, traceId, status, payload }) => {
  if (!db) return;
  try {
    await db
      .prepare(
        `INSERT OR IGNORE INTO execute_events
         (event_id, action, idempotency_key, trace_id, status, response_json)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .bind(eventId, action, idempotencyKey, traceId, status, JSON.stringify(payload))
      .run();
  } catch (_) {
    // Ignore logging failures; execution should still return a result.
  }
};

const makeActionRecord = ({ action, idempotencyKey, safetyLevel, command, target, actor }) => ({
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

const encodeBase64Url = (value) => btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");

const decodeBase64Url = (value) => {
  const input = String(value || "")
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const padded = input + "=".repeat((4 - (input.length % 4 || 4)) % 4);
  return atob(padded);
};

const importHmacKey = async (secret) =>
  crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);

const signHmac = async (secret, message) => {
  const key = await importHmacKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return encodeBase64Url(String.fromCharCode(...new Uint8Array(signature)));
};

const sha256Hex = async (value) => {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
};

const getConfirmSecret = (env) => String(env.CONFIRM_TOKEN_SECRET || getOrchestratorToken(env)).trim();

const createConfirmToken = async (env, db, { action, idempotencyKey, traceId }) => {
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

  // Legacy compatibility: "execute" tokens can be used for apply/deploy
  if (tokenAction === "execute" && (requestedAction === "apply" || requestedAction === "deploy")) {
    return true;
  }

  return false;
};

const canReuseConsumedTokenForDeploy = async (db, row, idempotencyKey, action) => {
  if (action !== "deploy") return false;
  if (row?.action !== "preview" && row?.action !== "execute") return false;
  if (row?.idempotency_key !== idempotencyKey) return false;

  const applied = await findExistingEvent(db, "apply", idempotencyKey);
  const appliedStatus = Number(applied?.status || 0);
  return Number.isFinite(appliedStatus) && appliedStatus >= 200 && appliedStatus < 300;
};

const validateAndConsumeConfirmToken = async (env, db, { token, action, idempotencyKey }) => {
  const logger = getLogger();

  if (!token) return { ok: false, error: "confirmToken is required for this action." };

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

  if (!matchesTokenAction(tokenPayload?.action, action) || tokenPayload?.idempotencyKey !== idempotencyKey) {
    logger.logSecurity("Token action/idempotency key mismatch", {
      tokenAction: tokenPayload?.action,
      requestedAction: action,
      tokenIdempotencyKey: tokenPayload?.idempotencyKey,
      requestedIdempotencyKey: idempotencyKey,
    });
    return { ok: false, error: "confirmToken does not match action/idempotencyKey." };
  }

  if (!db) {
    logger.debug("Token validation proceeding without database (stateless mode)");
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
      logger.warn("Database missing execute/prepare; falling back to stateless token validation");
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
        const allowDeployReuse = await canReuseConsumedTokenForDeploy(db, existingToken, idempotencyKey, action);
        if (allowDeployReuse) {
          logger.info("Token reuse allowed for deploy action", { idempotencyKey });
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
        const allowDeployReuse = await canReuseConsumedTokenForDeploy(db, existingToken, idempotencyKey, action);
        if (!allowDeployReuse) {
          return { ok: false, error: "confirmToken already used." };
        }
        logger.info("Token reuse allowed for deploy action", { idempotencyKey });
        return { ok: true };
      }

      if (Date.now() > new Date(existingToken.expires_at).getTime()) {
        logger.warn("Token expired during validation", {
          tokenHash,
          expiresAt: existingToken.expires_at,
        });
        return { ok: false, error: "confirmToken has expired." };
      }

      logger.error("Token consumption failed - possible race condition", { tokenHash });
      return { ok: false, error: "confirmToken could not be consumed (race condition)." };
    }

    logger.info("Token successfully consumed", { action, idempotencyKey });
    return { ok: true };
  } catch (error) {
    logger.error("Token consumption failed", { action, idempotencyKey, error: error.message }, error);
    return { ok: false, error: "Database transaction failed. Please try again." };
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
    .prepare("SELECT id, ts, status, message FROM builds ORDER BY ts DESC LIMIT 10")
    .all()
    .then((res) => res.results || [])
    .catch(() => []);

  const executeEventsPromise = db
    .prepare("SELECT ts, action, idempotency_key, status, trace_id FROM execute_events ORDER BY ts DESC LIMIT 10")
    .all()
    .then((res) => res.results || [])
    .catch(() => []);

  const [commands, builds, executeEvents] = await Promise.all([commandsPromise, buildsPromise, executeEventsPromise]);
  return { commands, builds, executeEvents };
};

export async function onRequestPost(context) {
  const { request, env } = context;
  const startTime = performance.now();

  // Initialize logger and set up request context
  const logger = initializeLogger({
    level: env.LOG_LEVEL ? LOG_LEVELS[env.LOG_LEVEL.toUpperCase()] : LOG_LEVELS.INFO,
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

    if (!(await isAuthorized(request, env))) {
      logger.logSecurity("Unauthorized access attempt", {
        userAgent: request.headers.get("user-agent"),
        ip: request.headers.get("cf-connecting-ip"),
      });
      return toJsonResponse(
        401,
        {
          error: "Unauthorized. Provide valid admin cookie or x-orch-token.",
          traceId,
        },
        env
      );
    }

    const rawPayload = await readJsonBody(request);
    if (!rawPayload) {
      logger.warn("Invalid JSON payload received");
      return toJsonResponse(400, { error: "Invalid JSON payload.", traceId }, env);
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
          error: "Invalid action. Use plan, preview, apply, deploy, status, rollback, auto, list_pages, or read_page.",
          traceId,
        },
        env
      );
    }

    if (!payload.idempotencyKey) {
      logger.warn("Missing required idempotency key");
      return toJsonResponse(400, { error: "Missing required field: idempotencyKey.", traceId }, env);
    }

    if (
      (payload.action === "plan" ||
        payload.action === "preview" ||
        payload.action === "apply" ||
        payload.action === "auto") &&
      !payload.command
    ) {
      logger.warn("Missing required command field", { action: payload.action });
      return toJsonResponse(400, { error: `Action '${payload.action}' requires command.`, traceId }, env);
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
          return toJsonResponse(400, { error: pageValidation.error, traceId }, env);
        }
        payload.page = pageValidation.page;
      }
    }

    if (cachedDb) {
      await ensureExecuteTables(cachedDb);

      const dbHelper = new DatabaseHelper(cachedDb, logger);
      const existing = await dbHelper.findEvent(payload.action, payload.idempotencyKey);
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

    try {
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
        const pages = listResult?.plan?.intent?.scope?.files || listResult?.files || listResult?.pages || [];

        const eventPayload = makeEvent({
          eventType: "planned",
          actionPayload: actionRecord,
          traceId,
          eventId,
          result: { pages, note: "These are the HTML pages currently in the site repository." },
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
        const targetPage = payload.page || payload.path || payload.file || "index.html";

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
          readResult && typeof readResult === "object" ? readResult : { error: "Invalid response format" };

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
        logger.info("Executing auto mode", { command: payload.command });
        const autoTimer = logger.startTimer("auto-execution");

        const autoApplyPayload = {
          mode: "apply",
          command: payload.command,
          target: payload.target,
          confirmation: "ship it",
          page: payload.page,
          path: payload.path,
          file: payload.file,
        };
        const applyResponse = await runOrchestrator(context, autoApplyPayload);
        const applyResult = await decodeJsonResponse(applyResponse);

        if (!applyResponse.ok) {
          const errorMessage = applyResult?.error || applyResult?.message || "Auto-apply failed with unknown error.";
          logger.error("Auto mode failed", { error: errorMessage });
          throw new Error(errorMessage);
        }

        const result = {
          ...applyResult,
          autoMode: true,
          steps: [
            "planned",
            "applied",
            applyResult?.deployment?.status === "skipped" ? "deploy_skipped" : "deploy_triggered",
          ],
          message: "Change was planned, applied, and deployment triggered in a single call.",
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

      if (payload.action === "apply" || payload.action === "deploy" || payload.action === "rollback") {
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
          confirmation: "ship it",
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
      const orchestratorResponse = await runOrchestrator(context, orchestratorPayload);
      const orchestratorResult = await decodeJsonResponse(orchestratorResponse);
      orchestratorTimer.end();

      if (!orchestratorResponse.ok) {
        throw new Error(orchestratorResult?.error || "Orchestrator request failed.");
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
