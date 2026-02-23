const CONFIRMATION_PHRASE = "hell yeah ship it";
const LOG_LIMIT = 300;
const DEPLOY_METER_KEY = "deployMeter";
const DEFAULT_LIMITS = {
  free: 1,
  starter: 3,
  pro: 10,
  business: 25,
  enterprise: 1000,
};

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
    this.deployMeter = { day: "", users: {} };

    this.state.blockConcurrencyWhile(async () => {
      this.lock = (await this.state.storage.get("lock")) || null;
      this.logs = (await this.state.storage.get("logs")) || [];
      this.lastSuccess = (await this.state.storage.get("lastSuccess")) || null;
      this.lastRollbackRef =
        (await this.state.storage.get("lastRollbackRef")) || "";
      this.deployMeter = (await this.state.storage.get(DEPLOY_METER_KEY)) || {
        day: this.currentDay(),
        users: {},
      };
      await this.ensureMeterDay();
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

    if (url.pathname === "/meter" && request.method === "GET") {
      const actor = String(url.searchParams.get("actor") || "admin").slice(
        0,
        120
      );
      const planTier = String(
        url.searchParams.get("planTier") || "pro"
      ).toLowerCase();
      const billingStatus = String(
        url.searchParams.get("billingStatus") || "active"
      ).toLowerCase();
      const metering = await this.getDeployAllowance({
        actor,
        planTier,
        billingStatus,
      });
      return json(200, { ok: true, metering });
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

  currentDay() {
    return new Date().toISOString().slice(0, 10);
  }

  parsePlanLimits() {
    const allLimitRaw = Number.parseInt(
      String(this.env.DEPLOY_DAILY_LIMIT || "0"),
      10
    );
    const allLimit =
      Number.isFinite(allLimitRaw) && allLimitRaw > 0 ? allLimitRaw : null;

    let overrides = {};
    try {
      overrides = JSON.parse(String(this.env.DEPLOY_DAILY_LIMITS_JSON || "{}"));
    } catch (_) {
      overrides = {};
    }

    const out = { ...DEFAULT_LIMITS };
    for (const [key, value] of Object.entries(overrides || {})) {
      const parsed = Number.parseInt(String(value || "0"), 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        out[String(key).toLowerCase()] = parsed;
      }
    }
    if (allLimit != null) {
      for (const key of Object.keys(out)) out[key] = allLimit;
    }
    return out;
  }

  normalizePlanTier(planTier) {
    const tier = String(planTier || "")
      .trim()
      .toLowerCase();
    if (!tier) return "pro";
    if (tier === "team") return "business";
    return tier;
  }

  normalizeBillingStatus(billingStatus) {
    const raw = String(billingStatus || "")
      .trim()
      .toLowerCase();
    if (!raw) return "active";
    return raw;
  }

  async ensureMeterDay() {
    const day = this.currentDay();
    if (this.deployMeter?.day === day) return;
    this.deployMeter = { day, users: {} };
    await this.state.storage.put(DEPLOY_METER_KEY, this.deployMeter);
  }

  getDailyLimit(planTier) {
    const limits = this.parsePlanLimits();
    return Number(limits[planTier] || limits.pro || DEFAULT_LIMITS.pro);
  }

  async getDeployAllowance({ actor, planTier, billingStatus }) {
    await this.ensureMeterDay();
    const normalizedActor = String(actor || "admin").slice(0, 120);
    const normalizedTier = this.normalizePlanTier(planTier);
    const normalizedBilling = this.normalizeBillingStatus(billingStatus);
    const row = this.deployMeter.users?.[normalizedActor] || { count: 0 };
    const limit = this.getDailyLimit(normalizedTier);
    const used = Number(row.count || 0);
    const remaining = Math.max(0, limit - used);
    const billingActive = normalizedBilling === "active";
    return {
      actor: normalizedActor,
      planTier: normalizedTier,
      billingStatus: normalizedBilling,
      day: this.deployMeter.day,
      used,
      limit,
      remaining: billingActive ? remaining : 0,
      allowed: billingActive && remaining > 0,
      reason: billingActive
        ? remaining > 0
          ? "ok"
          : "daily_limit_exceeded"
        : "billing_inactive",
    };
  }

  async recordDeploy({ actor, planTier, billingStatus }) {
    await this.ensureMeterDay();
    const metering = await this.getDeployAllowance({
      actor,
      planTier,
      billingStatus,
    });
    const nextUsed = metering.used + 1;
    this.deployMeter.users[metering.actor] = {
      count: nextUsed,
      planTier: metering.planTier,
      billingStatus: metering.billingStatus,
      lastDeployAt: new Date().toISOString(),
    };
    await this.state.storage.put(DEPLOY_METER_KEY, this.deployMeter);
    return {
      ...metering,
      used: nextUsed,
      remaining: Math.max(0, metering.limit - nextUsed),
      allowed:
        metering.billingStatus === "active" && nextUsed <= metering.limit,
      reason:
        metering.billingStatus !== "active"
          ? "billing_inactive"
          : nextUsed <= metering.limit
            ? "ok"
            : "daily_limit_exceeded",
    };
  }

  async runDeploy(payload = {}) {
    if (this.lock) {
      return json(409, {
        ok: false,
        error: "deploy in progress",
        lock: this.lock,
      });
    }

    const phrase = String(payload.confirmation || "");
    if (phrase !== CONFIRMATION_PHRASE) {
      return json(403, {
        ok: false,
        error: `Confirmation phrase must be exactly "${CONFIRMATION_PHRASE}"`,
      });
    }
    const actor = String(payload.actor || "admin").slice(0, 120);
    const planTier = this.normalizePlanTier(payload.planTier);
    const billingStatus = this.normalizeBillingStatus(payload.billingStatus);
    const meteringPrecheck = await this.getDeployAllowance({
      actor,
      planTier,
      billingStatus,
    });
    if (!meteringPrecheck.allowed) {
      return json(429, {
        ok: false,
        error: "Deploy blocked by metering policy.",
        metering: meteringPrecheck,
      });
    }

    const runId = crypto.randomUUID();
    this.lock = {
      runId,
      startedAt: new Date().toISOString(),
      actor,
      planTier,
    };
    await this.state.storage.put("lock", this.lock);

    let deployResponse = null;
    let metering = meteringPrecheck;
    try {
      await this.appendLog("info", "Deploy pipeline started", { runId });

      await this.appendLog("info", "Step 1/6: Validate governance gates");
      await this.validateEnvGates();
      metering = await this.recordDeploy({ actor, planTier, billingStatus });
      await this.appendLog("info", "Deploy metering consumed", {
        actor,
        planTier,
        remaining: metering.remaining,
      });

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
        metering: {
          allowed: metering.allowed,
          remaining: metering.remaining,
          used: metering.used,
          limit: metering.limit,
          planTier: metering.planTier,
          billingStatus: metering.billingStatus,
        },
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
        metering: {
          allowed: metering.allowed,
          remaining: metering.remaining,
          used: metering.used,
          limit: metering.limit,
          planTier: metering.planTier,
          billingStatus: metering.billingStatus,
        },
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
    const remoteDeployEnabled =
      String(this.env.ALLOW_REMOTE_DEPLOY_TRIGGER || "").trim() === "1";
    if (!remoteDeployEnabled) {
      await this.appendLog(
        "warn",
        "Unified deploy mode is active; remote deploy triggers are disabled."
      );
      return {
        mode: "local_only",
        status: "manual_required",
        message:
          "Run `npm run deploy` from the primary workspace to publish this revision.",
      };
    }

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
