import { adminCookieName, verifyAdminCookieValue } from "./adminAuth.js";
import { onRequestPost as handleOrchestrator } from "./orchestrator.js";

const JSON_HEADERS = { "Content-Type": "application/json" };
const CONFIRM_TTL_MS = 10 * 60 * 1000;
const VALID_ACTIONS = new Set(["plan", "preview", "apply", "deploy", "status", "rollback"]);
const VALID_SAFETY_LEVELS = new Set(["low", "medium", "high"]);

const toJsonResponse = (status, payload) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: JSON_HEADERS,
  });

const toIso = (value) => new Date(value).toISOString();

const getTraceId = (request) => request.headers.get("x-trace-id") || crypto.randomUUID();

const readJsonBody = async (request) => {
  try {
    return await request.json();
  } catch (_) {
    return null;
  }
};

const normalizeActionPayload = (payload) => {
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

const matchesTokenAction = (tokenAction, requestedAction) =>
  tokenAction === requestedAction || tokenAction === "execute";

const validateAndConsumeConfirmToken = async (env, db, { token, action, idempotencyKey }) => {
  if (!token) return { ok: false, error: "confirmToken is required for this action." };

  const parts = String(token).split(".");
  if (parts.length !== 3 || parts[0] !== "vtwcfm") {
    return { ok: false, error: "Invalid confirmToken format." };
  }

  const payloadB64 = parts[1];
  const signature = parts[2];
  const secret = getConfirmSecret(env);
  const expectedSig = await signHmac(secret, payloadB64);
  if (signature !== expectedSig) {
    return { ok: false, error: "Invalid confirmToken signature." };
  }

  let tokenPayload;
  try {
    tokenPayload = JSON.parse(decodeBase64Url(payloadB64));
  } catch (_) {
    return { ok: false, error: "Invalid confirmToken payload." };
  }

  if (!tokenPayload?.exp || Date.now() > Number(tokenPayload.exp)) {
    return { ok: false, error: "confirmToken has expired." };
  }

  if (!matchesTokenAction(tokenPayload?.action, action) || tokenPayload?.idempotencyKey !== idempotencyKey) {
    return { ok: false, error: "confirmToken does not match action/idempotencyKey." };
  }

  if (!db) return { ok: true };

  const tokenHash = await sha256Hex(token);
  let row = null;
  try {
    row = await db
      .prepare(
        `SELECT token_hash, action, idempotency_key, expires_at, used_at
         FROM execute_confirm_tokens
         WHERE token_hash = ?
         LIMIT 1`
      )
      .bind(tokenHash)
      .first();
  } catch (_) {
    row = null;
  }

  if (!row) return { ok: false, error: "confirmToken not found." };
  if (row.used_at) return { ok: false, error: "confirmToken already used." };
  if (Date.now() > new Date(row.expires_at).getTime()) return { ok: false, error: "confirmToken has expired." };
  if (!matchesTokenAction(row.action, action) || row.idempotency_key !== idempotencyKey) {
    return { ok: false, error: "confirmToken does not match action/idempotencyKey." };
  }

  try {
    await db
      .prepare("UPDATE execute_confirm_tokens SET used_at = ? WHERE token_hash = ?")
      .bind(toIso(Date.now()), tokenHash)
      .run();
  } catch (_) {
    return { ok: false, error: "Failed to consume confirmToken." };
  }

  return { ok: true };
};

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
  const traceId = getTraceId(request);

  if (!(await isAuthorized(request, env))) {
    return toJsonResponse(401, {
      error: "Unauthorized. Provide valid admin cookie or x-orch-token.",
      traceId,
    });
  }

  const rawPayload = await readJsonBody(request);
  if (!rawPayload) {
    return toJsonResponse(400, { error: "Invalid JSON payload.", traceId });
  }

  const payload = normalizeActionPayload(rawPayload);
  if (!VALID_ACTIONS.has(payload.action)) {
    return toJsonResponse(400, {
      error: "Invalid action. Use plan, preview, apply, deploy, status, or rollback.",
      traceId,
    });
  }
  if (!payload.idempotencyKey) {
    return toJsonResponse(400, { error: "Missing required field: idempotencyKey.", traceId });
  }
  if ((payload.action === "plan" || payload.action === "preview" || payload.action === "apply") && !payload.command) {
    return toJsonResponse(400, { error: `Action '${payload.action}' requires command.`, traceId });
  }

  const db = dbFromEnv(env);
  await ensureExecuteTables(db);

  const existing = await findExistingEvent(db, payload.action, payload.idempotencyKey);
  if (existing?.response_json) {
    return new Response(existing.response_json, {
      status: Number(existing.status) || 200,
      headers: JSON_HEADERS,
    });
  }

  const actionRecord = makeActionRecord(payload);
  const eventId = crypto.randomUUID();

  try {
    if (payload.action === "status") {
      const statusData = await fetchStatus(db);
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
      return toJsonResponse(200, eventPayload);
    }

    if (payload.action === "apply" || payload.action === "deploy" || payload.action === "rollback") {
      const tokenCheck = await validateAndConsumeConfirmToken(env, db, {
        token: payload.confirmToken,
        action: payload.action,
        idempotencyKey: payload.idempotencyKey,
      });
      if (!tokenCheck.ok) {
        return toJsonResponse(403, { error: tokenCheck.error, traceId });
      }
    }

    let orchestratorPayload = null;
    if (payload.action === "plan" || payload.action === "preview") {
      orchestratorPayload = {
        mode: "plan",
        command: payload.command,
        target: payload.target,
      };
    } else if (payload.action === "apply") {
      orchestratorPayload = {
        mode: "apply",
        command: payload.command,
        target: payload.target,
        confirmation: "ship it",
      };
    } else if (payload.action === "deploy") {
      orchestratorPayload = {
        mode: "deploy",
        command: payload.command || "Deploy latest changes",
        target: payload.target,
      };
    } else if (payload.action === "rollback") {
      orchestratorPayload = {
        mode: "rollback_last",
        command: payload.command || "Rollback last change",
        target: payload.target,
      };
    }

    const orchestratorResponse = await runOrchestrator(context, orchestratorPayload);
    const orchestratorResult = await decodeJsonResponse(orchestratorResponse);
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
        confirmInstructions: "Use this confirmToken once with action=apply or action=deploy and same idempotencyKey.",
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

    return toJsonResponse(200, eventPayload);
  } catch (err) {
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

    return toJsonResponse(500, errorPayload);
  }
}
