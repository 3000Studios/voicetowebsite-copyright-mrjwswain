import { hasValidAdminCookie, isAdminRequest } from "./adminAuth.js";
import { createConfirmToken } from "./execute.js";
import { initializeLogger, LOG_LEVELS, loggingMiddleware } from "./logger.js";
import { onRequestPost as handleOrchestrator } from "./orchestrator.js";
import { NaturalLanguageInferenceEngine } from "../worker/inferenceEngine.js";

const JSON_HEADERS = { "Content-Type": "application/json" };

const json = (status, payload) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: JSON_HEADERS,
  });

const ensureInferenceTables = async (db) => {
  if (!db) return;
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS inference_events (
         command_id TEXT PRIMARY KEY,
         ts DATETIME DEFAULT CURRENT_TIMESTAMP,
         idempotency_key TEXT,
         raw_input TEXT NOT NULL,
         ioo_json TEXT NOT NULL
       );`
    )
    .run();
};

const ensureExecuteConfirmTables = async (db) => {
  if (!db) return;
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

const buildEnrichedCommand = (rawInput, ioo) => {
  const bundle = (ioo?.intentBundle || []).map((i) => i.intent).join(", ");
  // Keep the user text as-is, but add deterministic constraints for downstream planner.
  return `${rawInput}\n\n[NLIE]\nprimaryGoal=${ioo?.inference?.primaryGoal}; strategy=${ioo?.inference?.strategy}; tone=${
    ioo?.inference?.tone || ""
  }; intents=${bundle}\n\n[IOO]\n${JSON.stringify(ioo, null, 2)}`;
};

export async function onRequestPost(context) {
  const { request, env, ctx } = context;

  const logger = initializeLogger({
    level: env.LOG_LEVEL ? LOG_LEVELS[env.LOG_LEVEL.toUpperCase()] : LOG_LEVELS.INFO,
    enableConsole: true,
    enableStructured: env.NODE_ENV === "production",
  });
  const { traceId, requestId } = loggingMiddleware(request);
  logger.setContext({ traceId, requestId, action: "godmode-infer" });

  try {
    const okCookie = await hasValidAdminCookie(request, env);
    if (!okCookie) return json(401, { error: "Unauthorized", traceId });
    const okAdmin = await isAdminRequest(request, env);
    if (!okAdmin) return json(401, { error: "Unauthorized. Admin access required.", traceId });

    // CSRF defense-in-depth for cookie-authenticated browser requests.
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) {
      return json(403, { error: "Forbidden", traceId });
    }

    const body = await request.json().catch(() => null);
    const rawInput = String(body?.rawInput || body?.command || "").trim();
    if (!rawInput) return json(400, { error: "Missing rawInput.", traceId });

    const engine = new NaturalLanguageInferenceEngine();
    const { ioo, revenue, suggestions } = engine.infer(rawInput, { siteId: "voicetowebsite" });

    const idempotencyKey = String(body?.idempotencyKey || `infer-${ioo.commandId.slice(0, 8)}`)
      .trim()
      .slice(0, 200);

    const enrichedCommand = buildEnrichedCommand(rawInput, ioo);

    // Orchestrator plan (preview stage)
    const orchestratorUrl = new URL("/api/orchestrator", request.url).toString();
    const orchestratorReq = new Request(orchestratorUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "plan",
        command: enrichedCommand,
        target: "site",
      }),
    });
    const orchestratorRes = await handleOrchestrator({ request: orchestratorReq, env, ctx });
    const orchestratorText = await orchestratorRes.text();
    let orchestratorJson = {};
    try {
      orchestratorJson = orchestratorText ? JSON.parse(orchestratorText) : {};
    } catch (_) {
      orchestratorJson = { raw: orchestratorText };
    }

    // Confirm token (preview -> apply -> deploy workflow)
    const db = env?.D1 || env?.DB || null;
    await ensureInferenceTables(db);
    await ensureExecuteConfirmTables(db);
    if (db) {
      await db
        .prepare(
          "INSERT OR REPLACE INTO inference_events (command_id, idempotency_key, raw_input, ioo_json) VALUES (?, ?, ?, ?)"
        )
        .bind(ioo.commandId, idempotencyKey, rawInput, JSON.stringify(ioo))
        .run();
    }
    const token = await createConfirmToken(env, db, { action: "preview", idempotencyKey, traceId });

    return json(200, {
      ok: true,
      traceId,
      commandId: ioo.commandId,
      idempotencyKey,
      ioo,
      enrichedCommand,
      preview: orchestratorJson,
      estimatedRevenue: revenue,
      suggestions,
      confirmToken: token.confirmToken,
      confirmBy: token.confirmBy,
    });
  } catch (err) {
    logger.error("Godmode infer failed", { error: err?.message || String(err) }, err);
    return json(500, { error: err?.message || "Infer failed.", traceId: request.headers.get("x-trace-id") || "" });
  }
}
