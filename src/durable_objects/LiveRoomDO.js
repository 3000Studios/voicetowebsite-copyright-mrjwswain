const RATE_WINDOW_MS = 60_000;
const MAX_MESSAGES_PER_WINDOW = 60;
const HISTORY_LIMIT = 200;

const json = (status, payload) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });

export class LiveRoomDO {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.clients = new Map();
    this.rate = new Map();
    this.history = [];
    this.state.blockConcurrencyWhile(async () => {
      this.history = (await this.state.storage.get("history")) || [];
    });
  }

  async fetch(request) {
    const url = new URL(request.url);
    if (
      request.headers.get("Upgrade") === "websocket" &&
      url.pathname === "/ws"
    ) {
      return this.handleWebSocket(request, url);
    }
    if (url.pathname === "/event" && request.method === "POST") {
      if (!this.hasValidToken(request, "admin", url)) {
        return json(401, { ok: false, error: "Unauthorized" });
      }
      const payload = await request
        .clone()
        .json()
        .catch(() => ({}));
      await this.broadcast({
        type: String(payload.type || "event"),
        payload: payload.payload || {},
        ts: new Date().toISOString(),
      });
      return json(200, { ok: true });
    }
    if (url.pathname === "/status") {
      return json(200, {
        ok: true,
        clients: this.clients.size,
        historySize: this.history.length,
      });
    }
    return json(404, { ok: false, error: "Not found." });
  }

  getAdminToken() {
    return String(
      this.env.LIVE_ROOM_ADMIN_TOKEN ||
        this.env.ADMIN_BEARER_TOKEN ||
        this.env.CONTROL_PASSWORD ||
        ""
    ).trim();
  }

  getViewerToken() {
    const explicitViewer = String(this.env.LIVE_ROOM_VIEWER_TOKEN || "").trim();
    if (explicitViewer) return explicitViewer;
    return this.getAdminToken();
  }

  extractToken(request, url) {
    const headerToken = String(
      request.headers.get("Authorization") || ""
    ).replace(/^bearer\s+/i, "");
    const queryToken = String(url.searchParams.get("token") || "");
    const fallbackToken = String(request.headers.get("x-live-token") || "");
    return (headerToken || queryToken || fallbackToken).trim();
  }

  hasValidToken(request, role, url) {
    const token = this.extractToken(request, url);
    const expected =
      role === "admin" ? this.getAdminToken() : this.getViewerToken();
    if (!expected) return false;
    return token === expected;
  }

  handleWebSocket(request, url) {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    const sessionId = crypto.randomUUID();
    const role = String(url.searchParams.get("role") || "viewer");
    if (!this.hasValidToken(request, role, url)) {
      return json(401, { ok: false, error: "Unauthorized" });
    }

    server.accept();
    this.clients.set(sessionId, { socket: server, role, joinedAt: Date.now() });
    this.send(server, {
      type: "system",
      payload: {
        sessionId,
        role,
        connected: true,
      },
      ts: new Date().toISOString(),
    });

    server.addEventListener("message", (event) =>
      this.onClientMessage({ sessionId, role, raw: event.data })
    );
    server.addEventListener("close", () => this.disconnect(sessionId));
    server.addEventListener("error", () => this.disconnect(sessionId));

    return new Response(null, { status: 101, webSocket: client });
  }

  isRateLimited(sessionId) {
    const now = Date.now();
    const key = String(sessionId || "");
    const row = this.rate.get(key) || { count: 0, startedAt: now };
    if (now - row.startedAt > RATE_WINDOW_MS) {
      this.rate.set(key, { count: 1, startedAt: now });
      return false;
    }
    row.count += 1;
    this.rate.set(key, row);
    return row.count > MAX_MESSAGES_PER_WINDOW;
  }

  async onClientMessage({ sessionId, role, raw }) {
    if (this.isRateLimited(sessionId)) {
      const client = this.clients.get(sessionId);
      if (client) {
        this.send(client.socket, {
          type: "rate_limit",
          payload: {
            message: "Rate limit exceeded for this minute.",
          },
          ts: new Date().toISOString(),
        });
      }
      return;
    }

    let payload = {};
    try {
      payload = JSON.parse(String(raw || "{}"));
    } catch (_) {
      payload = { message: String(raw || "") };
    }
    const event = {
      type: String(payload.type || "chat"),
      payload: {
        ...payload,
        role,
        sessionId,
      },
      ts: new Date().toISOString(),
    };
    await this.broadcast(event);
  }

  async broadcast(event) {
    this.history.push(event);
    if (this.history.length > HISTORY_LIMIT) {
      this.history = this.history.slice(this.history.length - HISTORY_LIMIT);
    }
    await this.state.storage.put("history", this.history);

    for (const { socket } of this.clients.values()) {
      this.send(socket, event);
    }
  }

  send(socket, payload) {
    try {
      socket.send(JSON.stringify(payload));
    } catch (_) {}
  }

  disconnect(sessionId) {
    const client = this.clients.get(sessionId);
    if (!client) return;
    this.clients.delete(sessionId);
    try {
      client.socket.close();
    } catch (_) {}
  }
}
