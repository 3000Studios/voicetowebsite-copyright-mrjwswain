export class BotHub {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.sessions = new Set();
    this.currentTask = null;

    this.state.blockConcurrencyWhile(async () => {
      this.currentTask = (await this.state.storage.get("currentTask")) || null;
    });
  }

  async fetch(request) {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected Upgrade: websocket", { status: 426 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    this.handleSession(server);

    return new Response(null, { status: 101, webSocket: client });
  }

  handleSession(webSocket) {
    webSocket.accept();
    this.sessions.add(webSocket);

    if (this.currentTask) {
      webSocket.send(JSON.stringify({ type: "initial_state", task: this.currentTask }));
    }

    webSocket.addEventListener("message", async (event) => {
      try {
        const dataStr = event.data;
        let data;
        try {
          data = JSON.parse(dataStr);
        } catch (e) {
          // Not JSON, ignore parsing
        }

        if (data && data.type === "update_task") {
          this.currentTask = data.payload;
          await this.state.storage.put("currentTask", this.currentTask);
          this.broadcast(JSON.stringify({ type: "task_updated", payload: this.currentTask }), webSocket);
        } else {
          // Broadcast raw message
          this.broadcast(dataStr, webSocket);
        }
      } catch (err) {
        console.error("Error handling message:", err);
      }
    });

    const closeHandler = () => {
      this.sessions.delete(webSocket);
    };

    webSocket.addEventListener("close", closeHandler);
    webSocket.addEventListener("error", closeHandler);
  }

  broadcast(message, sourceWs) {
    for (const session of this.sessions) {
      if (session !== sourceWs && session.readyState === WebSocket.OPEN) {
        try {
          session.send(message);
        } catch (err) {
          console.error("Error broadcasting to session:", err);
          this.sessions.delete(session);
        }
      }
    }
  }
}
