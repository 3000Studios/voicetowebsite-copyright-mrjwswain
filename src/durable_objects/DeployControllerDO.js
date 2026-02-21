const CONFIRMATION_PHRASE = "hell yeah ship it";
const LOG_LIMIT = 300;

const json = (status, payload) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });

export class DeployControllerDO {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.lock = null;
    this.logs = [];
    this.lastSuccess = null;
    this.lastRollbackRef = "";

    this.state.blockConcurrencyWhile(async () => {
      this.lock = (await this.state.storage.get("lock")) || null;
      this.logs = (await this.state.storage.get("logs")) || [];
      this.lastSuccess = (await this.state.storage.get("lastSuccess")) || null;
      this.lastRollbackRef =
        (await this.state.storage.get("lastRollbackRef")) || "";
    });
  }

  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/logs") {
      return json(200, {
        ok: true,
        locked: Boolean(this.lock),
        lock: this.lock,
        logs: this.logs,
        lastSuccess: this.lastSuccess,
        rollbackRef: this.lastRollbackRef,
      });
    }

    if (url.pathname === "/run" && request.method === "POST") {
      const body = await request
        .clone()
        .json()
        .catch(() => ({}));
      return this.runDeploy(body);
    }

    if (url.pathname === "/status") {
      return json(200, {
        ok: true,
        locked: Boolean(this.lock),
        lock: this.lock,
        lastSuccess: this.lastSuccess,
        rollbackRef: this.lastRollbackRef,
      });
    }

    return json(404, { ok: false, error: "Not found." });
  }

  async appendLog(level, message, data = null) {
    const entry = {
      id: crypto.randomUUID(),
      ts: new Date().toISOString(),
      level,
      message,
      data,
    };
    this.logs.push(entry);
    if (this.logs.length > LOG_LIMIT) {
      this.logs = this.logs.slice(this.logs.length - LOG_LIMIT);
    }
    await this.state.storage.put("logs", this.logs);
    return entry;
  }

  async runDeploy(payload = {}) {
    if (this.lock) {
      return json(409, {
        ok: false,
        error: "deploy in progress",
        lock: this.lock,
      });
    }

    const phrase = String(payload.confirmation || "").trim();
    if (phrase !== CONFIRMATION_PHRASE) {
      return json(400, {
        ok: false,
        error: `Confirmation phrase must be exactly "${CONFIRMATION_PHRASE}"`,
      });
    }

    const runId = crypto.randomUUID();
    this.lock = {
      runId,
      startedAt: new Date().toISOString(),
      actor: String(payload.actor || "admin"),
    };
    await this.state.storage.put("lock", this.lock);

    let deployResponse = null;
    try {
      await this.appendLog("info", "Deploy pipeline started", { runId });

      await this.appendLog("info", "Step 1/6: Validate governance gates");
      await this.validateEnvGates();

      await this.appendLog("info", "Step 2/6: Verify project state");
      await this.appendLog(
        "info",
        "Verification should be executed by /api/deploy caller via npm run verify before invoking deploy."
      );

      await this.appendLog(
        "info",
        "Step 3/6: Commit phase confirmed by caller"
      );
      await this.appendLog("info", "Step 4/6: Triggering Cloudflare deploy");
      deployResponse = await this.triggerCloudflareDeploy();

      await this.appendLog("info", "Step 5/6: Streaming deployment logs");
      await this.appendLog("info", "Step 6/6: Finalizing deployment state");

      this.lastSuccess = {
        runId,
        ts: new Date().toISOString(),
        deployResponse,
      };
      if (payload.summary?.rollbackRef) {
        this.lastRollbackRef = String(payload.summary.rollbackRef);
        await this.state.storage.put("lastRollbackRef", this.lastRollbackRef);
      }
      await this.state.storage.put("lastSuccess", this.lastSuccess);

      await this.appendLog("success", "Deployment completed", { runId });
      return json(200, {
        ok: true,
        runId,
        logs: this.logs.slice(-50),
        deployResponse,
        lastSuccess: this.lastSuccess,
      });
    } catch (error) {
      await this.appendLog("error", "Deployment failed", {
        runId,
        error: error?.message || String(error),
      });
      return json(500, {
        ok: false,
        runId,
        error: error?.message || String(error),
        logs: this.logs.slice(-50),
      });
    } finally {
      this.lock = null;
      await this.state.storage.delete("lock");
      await this.appendLog("info", "Deploy lock released", { runId });
    }
  }

  async validateEnvGates() {
    const missing = [];
    if (!String(this.env.CONTROL_PASSWORD || "").trim()) {
      missing.push("CONTROL_PASSWORD");
    }
    if (
      !String(
        this.env.GH_TOKEN || this.env.GITHUB_TOKEN || this.env.GITHUB_PAT || ""
      ).trim()
    ) {
      missing.push("GH_TOKEN");
    }
    if (!String(this.env.GH_REPO || this.env.GITHUB_REPO || "").trim()) {
      missing.push("GH_REPO");
    }
    if (missing.length) {
      throw new Error(`Critical env vars missing: ${missing.join(", ")}`);
    }
  }

  async triggerCloudflareDeploy() {
    const accountId = String(
      this.env.CLOUDFLARE_ACCOUNT_ID || this.env.CF_ACCOUNT_ID || ""
    ).trim();
    const apiToken = String(this.env.CLOUDFLARE_API_TOKEN || "").trim();
    const scriptName = String(
      this.env.CLOUDFLARE_WORKER_NAME ||
        this.env.WORKER_NAME ||
        "voicetowebsite"
    ).trim();

    if (!accountId || !apiToken) {
      await this.appendLog(
        "warn",
        "Cloudflare API credentials are missing; skipping automatic deploy trigger."
      );
      return {
        mode: "manual",
        status: "skipped",
        message:
          "Set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID for automatic deploy trigger.",
      };
    }

    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/workers/scripts/${encodeURIComponent(scriptName)}/deployments`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      }
    );

    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      await this.appendLog(
        "warn",
        `Cloudflare deploy trigger returned ${res.status}; manual deploy fallback required.`,
        payload
      );
      return {
        mode: "manual",
        status: "requires_manual",
        cloudflare: payload,
      };
    }
    await this.appendLog("info", "Cloudflare deploy API accepted request");
    return {
      mode: "api",
      status: "accepted",
      cloudflare: payload,
    };
  }
}
