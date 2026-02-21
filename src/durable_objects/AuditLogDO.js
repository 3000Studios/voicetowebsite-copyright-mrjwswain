const LOG_LIMIT = 2000;

const json = (status, payload) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });

export class AuditLogDO {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.logs = [];
    this.state.blockConcurrencyWhile(async () => {
      this.logs = (await this.state.storage.get("logs")) || [];
    });
  }

  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/log" && request.method === "POST") {
      const entry = await request
        .clone()
        .json()
        .catch(() => ({}));
      await this.append(entry);
      return json(200, { ok: true });
    }
    if (url.pathname === "/list" && request.method === "GET") {
      const limit = Math.max(
        1,
        Math.min(
          500,
          Number.parseInt(url.searchParams.get("limit") || "100", 10) || 100
        )
      );
      return json(200, {
        ok: true,
        events: this.logs.slice(this.logs.length - limit),
      });
    }
    return json(404, { ok: false, error: "Not found." });
  }

  async append(entry) {
    const next = {
      id: String(entry?.id || crypto.randomUUID()),
      ts: String(entry?.ts || new Date().toISOString()),
      actor: String(entry?.actor || "admin"),
      action: String(entry?.action || "unknown"),
      details: entry?.details || {},
    };
    this.logs.push(next);
    if (this.logs.length > LOG_LIMIT) {
      this.logs = this.logs.slice(this.logs.length - LOG_LIMIT);
    }
    await this.state.storage.put("logs", this.logs);
  }
}
