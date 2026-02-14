import { getLogger, initializeLogger, LOG_LEVELS, loggingMiddleware } from "./logger.js";

const JSON_HEADERS = { "Content-Type": "application/json" };

const json = (status, payload) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: JSON_HEADERS,
  });

const pickAiText = (result) => {
  if (!result) return "";
  if (typeof result === "string") return result;
  if (typeof result.response === "string") return result.response;
  if (typeof result.text === "string") return result.text;
  if (typeof result.output_text === "string") return result.output_text;
  return "";
};

const buildSystemPrompt = () => `You are VoiceToWebsite's customer assistant.
You help visitors understand what VoiceToWebsite does, pricing, demo flow, and admin safety model.

Rules:
- Do not claim to have performed actions on the user's website.
- Do not ask for secrets, tokens, passwords, or API keys.
- If asked to change the site, instruct them to use /demo or the Admin Voice Commands page.
- Keep replies concise, helpful, and concrete.`;

const callWorkersAI = async (env, messages) => {
  if (!env?.AI) return "";
  const result = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
    messages,
    temperature: 0.2,
    max_tokens: 600,
  });
  return pickAiText(result);
};

const callOpenAI = async (env, messages) => {
  const OPENAI_API = env?.OPENAI_API || env?.OPENAI_API_KEY || env?.OPENAI_API_KEY3;
  const OPENAI_MODEL = env?.OPENAI_MODEL || "gpt-4o-mini";
  if (!OPENAI_API) return "";
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages,
      temperature: 0.2,
    }),
  });
  const raw = await res.text();
  if (!res.ok) throw new Error(`OpenAI error ${res.status}: ${raw}`);
  const data = JSON.parse(raw);
  return String(data?.choices?.[0]?.message?.content || "").trim();
};

export async function onRequestPost(context) {
  const { request, env } = context;

  const logger = initializeLogger({
    level: env.LOG_LEVEL ? LOG_LEVELS[env.LOG_LEVEL.toUpperCase()] : LOG_LEVELS.INFO,
    enableConsole: true,
    enableStructured: env.NODE_ENV === "production",
  });
  const { traceId, requestId } = loggingMiddleware(request);
  logger.setContext({ traceId, requestId, action: "public-chat" });

  try {
    const body = await request.json().catch(() => null);
    const message = String(body?.message || "").trim();
    const history = Array.isArray(body?.history) ? body.history : [];

    if (!message) return json(400, { error: "Missing message.", traceId });
    if (message.length > 2000) return json(413, { error: "Message too long.", traceId });

    const safeHistory = history
      .slice(-8)
      .map((m) => ({
        role: m?.role === "assistant" ? "assistant" : "user",
        content: String(m?.content || "").slice(0, 2000),
      }))
      .filter((m) => m.content);

    const messages = [
      { role: "system", content: buildSystemPrompt() },
      ...safeHistory,
      { role: "user", content: message },
    ];

    let reply = "";
    if (env?.AI) {
      reply = (await callWorkersAI(env, messages)).trim();
    } else {
      reply = (await callOpenAI(env, messages)).trim();
    }

    if (!reply) {
      reply =
        'I can help with pricing, demo, and how the Admin voice workflow works. Try asking: "How does preview/apply/deploy work?"';
    }

    return json(200, { ok: true, reply, traceId });
  } catch (err) {
    getLogger()?.error?.("Public chat failed", { error: err?.message || String(err) });
    return json(500, { error: err?.message || "Chat failed.", traceId: request.headers.get("x-trace-id") || "" });
  }
}
