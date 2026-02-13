const DEFAULT_LOCK_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_LOCK_TTL_MS = 15 * 60 * 1000; // safety cap
const MIN_LOCK_TTL_MS = 15 * 1000; // 15 seconds to avoid thrash

export class BotHubDO {
  constructor(state, env) {
    this.state = state;
    this.env = env;

    // In-memory state
    this.systemState = "STABLE"; // STABLE, PATCHING, DEPLOYING, PERSISTING, ROLLING_BACK, ERROR
    this.locks = new Map(); // route -> lock object

    this.state.blockConcurrencyWhile(async () => {
      this.systemState = (await this.state.storage.get("systemState")) || "STABLE";
    });
  }

  async fetch(request) {
    const url = new URL(request.url);
    const action = url.searchParams.get("action");

    switch (action) {
      case "get_config":
        return this.handleGetConfig(request);
      case "patch_apply":
        return this.handlePatchApply(request);
      case "patch_preview":
        return this.handlePatchPreview(request);
      case "get_status":
        return this.handleGetStatus(request);
      case "acquire_lock":
        return this.handleAcquireLock(request);
      case "release_lock":
        return this.handleReleaseLock(request);
      default:
        // Fallback to legacy websocket logic or 404
        if (request.headers.get("Upgrade") === "websocket") {
          return this.handleWebSocket(request);
        }
        return new Response("Not Found", { status: 404 });
    }
  }

  async handleGetConfig(request) {
    const url = new URL(request.url);
    const route = url.searchParams.get("route") || "/";
    const overrides = (await this.state.storage.get(`overrides:${route}`)) || {};

    // TODO: Merge with base config from assets (this should probably happen in the Worker for performance)
    return new Response(JSON.stringify(overrides), {
      headers: { "Content-Type": "application/json" },
    });
  }

  async handlePatchApply(request) {
    if (this.env.SYSTEM_FREEZE === "true") {
      return new Response("System Freeze Enabled", { status: 403 });
    }

    const patch = await request.json().catch(() => ({}));
    const route = this.normalizeRoute(patch.route);
    const ops = Array.isArray(patch.ops) ? patch.ops : [];
    const { idempotencyKey, actor } = patch;

    if (!route || ops.length === 0) {
      return new Response("Invalid patch payload", { status: 400 });
    }

    // TODO: Implement idempotency check, allowlist, quotas

    const lock = await this.getActiveLock(route);
    if (lock && lock.expiresAt > Date.now() && lock.idempotencyKey !== idempotencyKey) {
      return new Response("Route Locked", { status: 409 });
    }

    // Apply patch
    const overrides = (await this.state.storage.get(`overrides:${route}`)) || {};
    this.applyOps(overrides, ops);

    await this.state.storage.put(`overrides:${route}`, overrides);

    // Audit log
    const auditEntry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      actor,
      action: "patch_apply",
      route,
      ops,
      success: true,
    };
    await this.state.storage.put(`audit:${auditEntry.id}`, auditEntry);

    return new Response(JSON.stringify({ success: true, route, overrides }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  async handlePatchPreview(request) {
    const patch = await request.json().catch(() => ({}));
    const route = this.normalizeRoute(patch.route);
    const ops = Array.isArray(patch.ops) ? patch.ops : [];

    if (!route || ops.length === 0) {
      return new Response("Invalid patch payload", { status: 400 });
    }

    const overrides = (await this.state.storage.get(`overrides:${route}`)) || {};
    const preview = structuredClone ? structuredClone(overrides) : JSON.parse(JSON.stringify(overrides));
    this.applyOps(preview, ops);

    return new Response(
      JSON.stringify({
        success: true,
        route,
        overrides: preview,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  async handleAcquireLock(request) {
    const payload = await request.json().catch(() => ({}));
    const route = this.normalizeRoute(payload.route);
    if (!route) {
      return new Response("Route required", { status: 400 });
    }

    const ttlMs = this.clampTtl(Number(payload.ttlMs) || DEFAULT_LOCK_TTL_MS);
    const actor = String(payload.actor || "unknown");
    const incomingKey = payload.idempotencyKey ? String(payload.idempotencyKey) : null;

    const existing = await this.getActiveLock(route);
    if (existing) {
      if (incomingKey && existing.idempotencyKey === incomingKey) {
        return new Response(JSON.stringify({ ok: true, lock: existing, reused: true }), {
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Route Locked", lock: existing }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }

    const lock = {
      id: crypto.randomUUID(),
      route,
      actor,
      acquiredAt: Date.now(),
      expiresAt: Date.now() + ttlMs,
      idempotencyKey: incomingKey || crypto.randomUUID(),
    };

    await this.persistLock(route, lock);

    return new Response(JSON.stringify({ ok: true, lock }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  async handleReleaseLock(request) {
    const payload = await request.json().catch(() => ({}));
    const route = this.normalizeRoute(payload.route);
    if (!route) {
      return new Response("Route required", { status: 400 });
    }

    const lock = await this.getActiveLock(route);
    const actor = payload.actor ? String(payload.actor) : null;
    const incomingKey = payload.idempotencyKey ? String(payload.idempotencyKey) : null;

    if (!lock) {
      await this.clearLock(route);
      return new Response(JSON.stringify({ ok: true, released: false }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const sameActor = actor && lock.actor === actor;
    const sameKey = incomingKey && lock.idempotencyKey === incomingKey;
    if (!sameActor && !sameKey && payload.force !== true) {
      return new Response(JSON.stringify({ error: "Lock owned by another actor", lock }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    await this.clearLock(route);
    return new Response(JSON.stringify({ ok: true, released: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  handleGetStatus() {
    return new Response(JSON.stringify({ state: this.systemState }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  applyOps(target, ops = []) {
    for (const op of ops) {
      if (!op || typeof op !== "object") continue;
      if (op.op === "set") {
        this.setDeep(target, op.path, op.value);
      } else if (op.op === "unset") {
        this.unsetDeep(target, op.path);
      }
    }
  }

  normalizeRoute(value) {
    if (!value && value !== "") return "/";
    const str = String(value).trim();
    if (!str) return "/";
    return str.startsWith("/") ? str : `/${str}`;
  }

  // Helper for deep set
  setDeep(obj, path, value) {
    const parts = path.split("/").filter((p) => p !== "");
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) current[parts[i]] = {};
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
  }

  unsetDeep(obj, path) {
    const parts = path.split("/").filter((p) => p !== "");
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) return;
      current = current[parts[i]];
    }
    delete current[parts[parts.length - 1]];
  }

  async handleWebSocket(request) {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    server.accept();
    // Legacy logic could go here
    return new Response(null, { status: 101, webSocket: client });
  }

  clampTtl(ttlMs) {
    if (!Number.isFinite(ttlMs)) return DEFAULT_LOCK_TTL_MS;
    return Math.max(MIN_LOCK_TTL_MS, Math.min(ttlMs, MAX_LOCK_TTL_MS));
  }

  getLockKey(route) {
    return `lock:${route}`;
  }

  async getActiveLock(route) {
    if (!route) return null;

    const inMemory = this.locks.get(route);
    if (inMemory) {
      if (inMemory.expiresAt > Date.now()) return inMemory;
      this.locks.delete(route);
    }

    const stored = await this.state.storage.get(this.getLockKey(route));
    if (stored && stored.expiresAt > Date.now()) {
      this.locks.set(route, stored);
      return stored;
    }

    if (stored) {
      await this.state.storage.delete(this.getLockKey(route));
    }
    return null;
  }

  async persistLock(route, lock) {
    this.locks.set(route, lock);
    await this.state.storage.put(this.getLockKey(route), lock);
  }

  async clearLock(route) {
    this.locks.delete(route);
    await this.state.storage.delete(this.getLockKey(route));
  }
}
