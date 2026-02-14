import { hasValidAdminCookie, isAdminRequest } from "./adminAuth.js";
import { getLogger, initializeLogger, LOG_LEVELS, loggingMiddleware } from "./logger.js";

const JSON_HEADERS = { "Content-Type": "application/json" };

const json = (status, payload) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: JSON_HEADERS,
  });

const cookieName = "vtw_support_session";

const getCookie = (request, name) => {
  const header = request.headers.get("cookie") || "";
  const parts = header.split(";").map((p) => p.trim());
  for (const part of parts) {
    const [k, ...rest] = part.split("=");
    if (k === name) return rest.join("=");
  }
  return "";
};

const setCookie = (headers, name, value) => {
  const secure = "Secure; SameSite=Lax; Path=/";
  headers.append("Set-Cookie", `${name}=${value}; ${secure}`);
};

const ensureTables = async (db) => {
  if (!db) return;
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS support_sessions (
         session_id TEXT PRIMARY KEY,
         created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
         last_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP,
         customer_email TEXT,
         customer_name TEXT,
         customer_meta TEXT
       );`
    )
    .run();

  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS support_messages (
         id TEXT PRIMARY KEY,
         session_id TEXT NOT NULL,
         ts DATETIME DEFAULT CURRENT_TIMESTAMP,
         sender TEXT NOT NULL,
         message TEXT NOT NULL
       );`
    )
    .run();

  await db
    .prepare("CREATE INDEX IF NOT EXISTS idx_support_messages_session_ts ON support_messages(session_id, ts);")
    .run();
};

const buildSupportSystemPrompt = () => `You are VoiceToWebsite support.
You help customers understand the product and troubleshoot basic issues.
If the user asks to change the site, tell them to use the demo or Admin Voice Commands.
Do not request secrets. Keep it concise.`;

const pickAiText = (result) => {
  if (!result) return "";
  if (typeof result === "string") return result;
  if (typeof result.response === "string") return result.response;
  if (typeof result.text === "string") return result.text;
  if (typeof result.output_text === "string") return result.output_text;
  return "";
};

const generateAutoReply = async (env, message) => {
  const userText = String(message || "").trim();
  if (!userText) return "";

  const messages = [
    { role: "system", content: buildSupportSystemPrompt() },
    { role: "user", content: userText.slice(0, 2000) },
  ];

  if (env?.AI) {
    const result = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
      messages,
      temperature: 0.2,
      max_tokens: 500,
    });
    return pickAiText(result).trim();
  }

  const OPENAI_API = env?.OPENAI_API || env?.OPENAI_API_KEY || env?.OPENAI_API_KEY3;
  const OPENAI_MODEL = env?.OPENAI_MODEL || "gpt-4o-mini";
  if (!OPENAI_API) return "";

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_API}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: OPENAI_MODEL, messages, temperature: 0.2 }),
  });
  const raw = await res.text();
  if (!res.ok) return "";
  const data = JSON.parse(raw);
  return String(data?.choices?.[0]?.message?.content || "").trim();
};

const requireAdmin = async (request, env) => {
  const okCookie = await hasValidAdminCookie(request, env);
  if (!okCookie) return false;
  return await isAdminRequest(request, env);
};

const nowIso = () => new Date().toISOString();

const readJson = async (request) => {
  try {
    return await request.json();
  } catch (_) {
    return null;
  }
};

export async function handleSupportChatRequest({ request, env }) {
  const logger = initializeLogger({
    level: env.LOG_LEVEL ? LOG_LEVELS[env.LOG_LEVEL.toUpperCase()] : LOG_LEVELS.INFO,
    enableConsole: true,
    enableStructured: env.NODE_ENV === "production",
  });
  const { traceId, requestId } = loggingMiddleware(request);
  logger.setContext({ traceId, requestId, action: "support-chat" });

  const url = new URL(request.url);
  const db = env?.D1 || env?.DB || null;
  await ensureTables(db);

  // Visitor: create/restore session
  if (url.pathname === "/api/support/start" && request.method === "POST") {
    const body = await readJson(request);
    const customer_email = String(body?.email || "")
      .trim()
      .slice(0, 200);
    const customer_name = String(body?.name || "")
      .trim()
      .slice(0, 200);

    const existing = getCookie(request, cookieName);
    const sessionId = existing || crypto.randomUUID();

    if (db) {
      await db
        .prepare(
          `INSERT OR IGNORE INTO support_sessions (session_id, customer_email, customer_name, customer_meta)
           VALUES (?, ?, ?, ?)`
        )
        .bind(sessionId, customer_email, customer_name, JSON.stringify({ ua: request.headers.get("user-agent") || "" }))
        .run();
      await db
        .prepare("UPDATE support_sessions SET last_seen_at = ? WHERE session_id = ?")
        .bind(nowIso(), sessionId)
        .run();
    }

    const headers = new Headers(JSON_HEADERS);
    setCookie(headers, cookieName, sessionId);
    return new Response(JSON.stringify({ ok: true, sessionId, traceId }), { status: 200, headers });
  }

  // Visitor: send message
  if (url.pathname === "/api/support/message" && request.method === "POST") {
    const body = await readJson(request);
    const message = String(body?.message || "").trim();
    const sessionId = String(body?.sessionId || getCookie(request, cookieName) || "").trim();

    if (!sessionId) return json(400, { error: "Missing sessionId. Call /api/support/start first.", traceId });
    if (!message) return json(400, { error: "Missing message.", traceId });
    if (message.length > 2000) return json(413, { error: "Message too long.", traceId });

    const customerMessageId = crypto.randomUUID();
    if (db) {
      await db
        .prepare("INSERT INTO support_messages (id, session_id, sender, message) VALUES (?, ?, ?, ?)")
        .bind(customerMessageId, sessionId, "customer", message)
        .run();
      await db
        .prepare("UPDATE support_sessions SET last_seen_at = ? WHERE session_id = ?")
        .bind(nowIso(), sessionId)
        .run();
    }

    // Optional: auto-reply (AI). On by default.
    let reply = "";
    let replyMessageId = "";
    try {
      if (String(env?.PUBLIC_SUPPORT_AI || "1") !== "0") {
        reply = await generateAutoReply(env, message);
      }
    } catch (_) {
      reply = "";
    }

    if (db && reply) {
      replyMessageId = crypto.randomUUID();
      await db
        .prepare("INSERT INTO support_messages (id, session_id, sender, message) VALUES (?, ?, ?, ?)")
        .bind(replyMessageId, sessionId, "bot", reply)
        .run();
    }

    return json(200, { ok: true, reply, traceId, messageId: customerMessageId, replyId: replyMessageId });
  }

  // Visitor: poll messages for current session (used by the site widget)
  if (url.pathname === "/api/support/messages" && request.method === "GET") {
    const sessionId = String(url.searchParams.get("sessionId") || getCookie(request, cookieName) || "").trim();
    if (!sessionId) return json(400, { error: "Missing sessionId.", traceId });
    if (!db) return json(503, { error: "D1 database not available.", traceId });

    const rows = await db
      .prepare("SELECT id, ts, sender, message FROM support_messages WHERE session_id = ? ORDER BY ts ASC LIMIT 80")
      .bind(sessionId)
      .all();
    return json(200, { ok: true, messages: rows.results || [], traceId });
  }

  // Admin: list sessions
  if (url.pathname === "/api/support/admin/sessions" && request.method === "GET") {
    if (!(await requireAdmin(request, env))) return json(401, { error: "Unauthorized", traceId });
    if (!db) return json(503, { error: "D1 database not available.", traceId });

    const rows = await db
      .prepare(
        `SELECT s.session_id, s.created_at, s.last_seen_at, s.customer_email, s.customer_name,
                (SELECT message FROM support_messages m WHERE m.session_id = s.session_id ORDER BY ts DESC LIMIT 1) AS last_message
         FROM support_sessions s
         ORDER BY s.last_seen_at DESC
         LIMIT 50`
      )
      .all();
    return json(200, { ok: true, sessions: rows.results || [], traceId });
  }

  // Admin: list messages
  if (url.pathname === "/api/support/admin/messages" && request.method === "GET") {
    if (!(await requireAdmin(request, env))) return json(401, { error: "Unauthorized", traceId });
    if (!db) return json(503, { error: "D1 database not available.", traceId });
    const sessionId = String(url.searchParams.get("sessionId") || "").trim();
    if (!sessionId) return json(400, { error: "Missing sessionId.", traceId });

    const rows = await db
      .prepare("SELECT id, ts, sender, message FROM support_messages WHERE session_id = ? ORDER BY ts ASC LIMIT 200")
      .bind(sessionId)
      .all();
    return json(200, { ok: true, messages: rows.results || [], traceId });
  }

  // Admin: reply
  if (url.pathname === "/api/support/admin/reply" && request.method === "POST") {
    if (!(await requireAdmin(request, env))) return json(401, { error: "Unauthorized", traceId });
    if (!db) return json(503, { error: "D1 database not available.", traceId });

    const body = await readJson(request);
    const sessionId = String(body?.sessionId || "").trim();
    const message = String(body?.message || "").trim();
    if (!sessionId) return json(400, { error: "Missing sessionId.", traceId });
    if (!message) return json(400, { error: "Missing message.", traceId });
    if (message.length > 4000) return json(413, { error: "Message too long.", traceId });

    const adminMessageId = crypto.randomUUID();
    await db
      .prepare("INSERT INTO support_messages (id, session_id, sender, message) VALUES (?, ?, ?, ?)")
      .bind(adminMessageId, sessionId, "admin", message)
      .run();
    await db
      .prepare("UPDATE support_sessions SET last_seen_at = ? WHERE session_id = ?")
      .bind(nowIso(), sessionId)
      .run();

    return json(200, { ok: true, traceId, messageId: adminMessageId });
  }

  getLogger()?.warn?.("Support chat route not found", { path: url.pathname });
  return json(404, { error: "Not found.", traceId });
}
