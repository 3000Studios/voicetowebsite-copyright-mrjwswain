import { isAdminRequest } from "./adminAuth.js";

const json = (status, payload) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const ensureBotHubTables = async (env) => {
  if (!env.D1) return;
  await env.D1.prepare(
    `CREATE TABLE IF NOT EXISTS bot_agents (
      id TEXT PRIMARY KEY,
      ts DATETIME DEFAULT CURRENT_TIMESTAMP,
      name TEXT UNIQUE NOT NULL,
      kind TEXT NOT NULL,
      endpoint TEXT,
      notes TEXT
    );`
  ).run();
  await env.D1.prepare(
    `CREATE TABLE IF NOT EXISTS bot_tasks (
      id TEXT PRIMARY KEY,
      ts DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'queued',
      agent_name TEXT,
      input_json TEXT,
      output_json TEXT,
      error TEXT
    );`
  ).run();
};

const pickAiText = (result) => {
  if (!result) return "";
  if (typeof result === "string") return result;
  if (typeof result.response === "string") return result.response;
  if (typeof result.text === "string") return result.text;
  if (typeof result.output_text === "string") return result.output_text;
  return JSON.stringify(result);
};

const extractJson = (text) => {
  const raw = String(text || "").trim();
  if (!raw) throw new Error("AI response empty.");
  if (raw.startsWith("{")) return JSON.parse(raw);
  const match = raw.match(/```json\\s*([\\s\\S]*?)\\s*```/i);
  if (match) return JSON.parse(match[1]);
  const first = raw.indexOf("{");
  const last = raw.lastIndexOf("}");
  if (first >= 0 && last > first) return JSON.parse(raw.slice(first, last + 1));
  throw new Error("Failed to parse JSON.");
};

const brief = (env) => ({
  project: "VoiceToWebsite",
  stack: {
    edgeRouter: "Cloudflare Worker (worker.js)",
    state: "Cloudflare D1 (binding: D1)",
    storage: "Cloudflare R2 (binding: R2)",
    ai: "Cloudflare Workers AI (binding: AI)",
  },
  routes: {
    orchestrator: "/api/orchestrator (POST)",
    generate: "/api/generate (POST)",
    previewApi: "/api/preview?id=... (GET)",
    previewPage: "/preview/:id (GET)",
    publish: "/api/publish (POST)",
    botHub: "/api/bot-hub/*",
    adminLogin: "/api/admin/login (POST)",
    adminLogout: "/api/admin/logout (POST)",
  },
  policy: {
    productionEnv: String(env.ENVIRONMENT || "production"),
    adminCookie: "vtw_admin=1.<ts>.<sig> (signed by CONTROL_PASSWORD/ADMIN_COOKIE_SECRET)",
    note: "Do not leak secrets to the client; use server-issued signed cookies or x-admin-token header.",
  },
  coordination: {
    goal: "Keep multiple AI agents aligned (single brief + shared task log).",
    api: "POST /api/bot-hub/coordinate with notes from other bots.",
  },
});

export async function handleBotHubRequest({ request, env }) {
  const url = new URL(request.url);
  const path = url.pathname;

  if (!env.D1) return json(503, { error: "D1 database not available." });
  await ensureBotHubTables(env);

  if (path === "/api/bot-hub/brief" && request.method === "GET") {
    return json(200, { ok: true, brief: brief(env) });
  }

  // Everything else is admin-only (protects AI usage + prevents abuse).
  const isAdmin = await isAdminRequest(request, env);
  if (!isAdmin) return json(401, { error: "Admin required." });

  if (path === "/api/bot-hub/agents" && request.method === "GET") {
    const agents = await env.D1.prepare(
      "SELECT id, ts, name, kind, endpoint, notes FROM bot_agents ORDER BY ts DESC"
    ).all();
    return json(200, { ok: true, agents: agents.results || [] });
  }

  if (path === "/api/bot-hub/agents" && request.method === "POST") {
    const payload = await request.json().catch(() => ({}));
    const name = String(payload?.name || "").trim();
    const kind = String(payload?.kind || "agent").trim();
    const endpoint = payload?.endpoint ? String(payload.endpoint).trim() : null;
    const notes = payload?.notes ? String(payload.notes).trim() : null;
    if (!name) return json(400, { error: "Missing name." });
    const id = crypto.randomUUID();
    await env.D1.prepare("INSERT INTO bot_agents (id, name, kind, endpoint, notes) VALUES (?,?,?,?,?)")
      .bind(id, name, kind, endpoint, notes)
      .run();
    return json(200, { ok: true, id });
  }

  if (path === "/api/bot-hub/tasks" && request.method === "GET") {
    const tasks = await env.D1.prepare(
      "SELECT id, ts, status, agent_name, input_json, output_json, error FROM bot_tasks ORDER BY ts DESC LIMIT 25"
    ).all();
    return json(200, { ok: true, tasks: tasks.results || [] });
  }

  if (path === "/api/bot-hub/coordinate" && request.method === "POST") {
    const payload = await request.json().catch(() => ({}));
    const notes = String(payload?.notes || "").trim();
    const agents = Array.isArray(payload?.agents) ? payload.agents.map(String) : [];
    if (!notes) return json(400, { error: "Missing notes." });
    if (!env.AI) return json(501, { error: "Workers AI binding missing (AI)." });

    const system = `
You are a coordination orchestrator for multiple AI agents working on one codebase.
Return ONLY JSON:
{
  "summary":"1-2 sentences",
  "decisions":[{"id":"...","decision":"...","rationale":"..."}],
  "tasks":[{"agent":"...","task":"...","priority":"P0|P1|P2"}],
  "risks":[{"risk":"...","mitigation":"..."}]
}
Rules:
- Be concrete and action-oriented.
- Prefer fewer, higher-signal items.
`.trim();

    const user = `Agents: ${agents.join(", ") || "(unspecified)"}\n\nNotes:\n${notes}`.trim();

    const taskId = crypto.randomUUID();
    try {
      const aiResult = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.2,
        max_tokens: 900,
      });
      const output = extractJson(pickAiText(aiResult));

      await env.D1.prepare("INSERT INTO bot_tasks (id, status, agent_name, input_json, output_json) VALUES (?,?,?,?,?)")
        .bind(taskId, "done", agents.join(","), JSON.stringify({ notes, agents }), JSON.stringify(output))
        .run();

      return json(200, { ok: true, taskId, output });
    } catch (err) {
      await env.D1.prepare("INSERT INTO bot_tasks (id, status, agent_name, input_json, error) VALUES (?,?,?,?,?)")
        .bind(taskId, "error", agents.join(","), JSON.stringify({ notes, agents }), String(err.message || err))
        .run();
      return json(502, { error: err.message, taskId });
    }
  }

  return json(404, { error: "Not found." });
}
