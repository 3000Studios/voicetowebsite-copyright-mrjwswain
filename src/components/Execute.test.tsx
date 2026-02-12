import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../functions/adminAuth.js", () => ({
  adminCookieName: "vtw_admin",
  verifyAdminCookieValue: vi.fn(),
}));

vi.mock("../../functions/orchestrator.js", () => ({
  onRequestPost: vi.fn(),
}));

import { verifyAdminCookieValue } from "../../functions/adminAuth.js";
import { onRequestPost as handleExecute } from "../../functions/execute.js";
import { onRequestPost as handleOrchestrator } from "../../functions/orchestrator.js";

const mockedVerifyAdminCookieValue = vi.mocked(verifyAdminCookieValue);
const mockedHandleOrchestrator = vi.mocked(handleOrchestrator);

const makeRequest = (body: Record<string, unknown>, headers: Record<string, string> = {}) =>
  new Request("https://example.com/api/execute", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });

class InMemoryD1 {
  private executeEvents = new Map<string, { status: number; response_json: string }>();
  private confirmTokens = new Map<
    string,
    {
      token_hash: string;
      action: string;
      idempotency_key: string;
      trace_id: string;
      expires_at: string;
      used_at: string | null;
    }
  >();

  prepare(query: string) {
    const sql = String(query).toLowerCase().replace(/\s+/g, " ").trim();
    let params: unknown[] = [];
    const self = this;

    return {
      bind(...args: unknown[]) {
        params = args;
        return this;
      },
      async run() {
        if (sql.startsWith("create table")) return;

        if (sql.includes("insert or ignore into execute_events")) {
          const [, action, idempotencyKey, , status, responseJson] = params as [
            string,
            string,
            string,
            string,
            number,
            string,
          ];
          const key = `${action}::${idempotencyKey}`;
          if (!self.executeEvents.has(key)) {
            self.executeEvents.set(key, { status, response_json: responseJson });
          }
          return;
        }

        if (sql.includes("insert or replace into execute_confirm_tokens")) {
          const [tokenHash, action, idempotencyKey, traceId, expiresAt] = params as [
            string,
            string,
            string,
            string,
            string,
          ];
          self.confirmTokens.set(tokenHash, {
            token_hash: tokenHash,
            action,
            idempotency_key: idempotencyKey,
            trace_id: traceId,
            expires_at: expiresAt,
            used_at: null,
          });
          return;
        }

        if (sql.startsWith("update execute_confirm_tokens set used_at")) {
          const [usedAt, tokenHash] = params as [string, string];
          const row = self.confirmTokens.get(tokenHash);
          if (row) {
            row.used_at = usedAt;
            self.confirmTokens.set(tokenHash, row);
          }
        }
      },
      async first() {
        if (sql.includes("from execute_events where action = ? and idempotency_key = ?")) {
          const [action, idempotencyKey] = params as [string, string];
          const row = self.executeEvents.get(`${action}::${idempotencyKey}`);
          return row ? { ...row } : null;
        }

        if (sql.includes("from execute_confirm_tokens")) {
          const [tokenHash] = params as [string];
          const row = self.confirmTokens.get(tokenHash);
          return row ? { ...row } : null;
        }

        return null;
      },
      async all() {
        return { results: [] };
      },
    };
  }
}

describe("/api/execute", () => {
  let lastOrchestratorPayload: Record<string, unknown> | null = null;

  beforeEach(() => {
    lastOrchestratorPayload = null;
    vi.clearAllMocks();
    mockedVerifyAdminCookieValue.mockResolvedValue(false);
    mockedHandleOrchestrator.mockImplementation(async ({ request }: { request: Request }) => {
      const payload = await request.json();
      lastOrchestratorPayload = payload;
      return new Response(
        JSON.stringify({
          mode: payload.mode,
          command: payload.command,
          ok: true,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    });
  });

  it("returns 401 when auth is missing", async () => {
    const response = await handleExecute({
      request: makeRequest({
        action: "preview",
        idempotencyKey: "preview-001",
        command: "Update hero copy",
      }),
      env: {},
      ctx: {},
    });

    expect(response.status).toBe(401);
  });

  it("maps preview to orchestrator plan mode and returns confirmToken", async () => {
    const response = await handleExecute({
      request: makeRequest(
        {
          action: "preview",
          idempotencyKey: "preview-002",
          command: "Update pricing hero copy",
        },
        { "x-orch-token": "supersecret" }
      ),
      env: {},
      ctx: {},
    });

    expect(response.status).toBe(200);
    expect(lastOrchestratorPayload?.mode).toBe("plan");

    const body = await response.json();
    expect(body.eventType).toBe("previewed");
    expect(typeof body.result.confirmToken).toBe("string");
  });

  it("blocks apply when confirmToken is missing", async () => {
    const response = await handleExecute({
      request: makeRequest(
        {
          action: "apply",
          idempotencyKey: "apply-001",
          command: "Apply homepage update",
        },
        { "x-orch-token": "supersecret" }
      ),
      env: {},
      ctx: {},
    });

    expect(response.status).toBe(403);
  });

  it("accepts apply with preview confirmToken and forwards confirmation phrase", async () => {
    const preview = await handleExecute({
      request: makeRequest(
        {
          action: "preview",
          idempotencyKey: "apply-002",
          command: "Change homepage headline to Edge-native Growth",
        },
        { "x-orch-token": "supersecret" }
      ),
      env: {},
      ctx: {},
    });
    const previewBody = await preview.json();

    const apply = await handleExecute({
      request: makeRequest(
        {
          action: "apply",
          idempotencyKey: "apply-002",
          command: "Change homepage headline to Edge-native Growth",
          confirmToken: previewBody.result.confirmToken,
        },
        { "x-orch-token": "supersecret" }
      ),
      env: {},
      ctx: {},
    });

    expect(apply.status).toBe(200);
    expect(lastOrchestratorPayload?.mode).toBe("apply");
    expect(lastOrchestratorPayload?.confirmation).toBe("ship it");

    const applyBody = await apply.json();
    expect(applyBody.eventType).toBe("applied");
  });

  it("maps deploy action to orchestrator deploy mode", async () => {
    const preview = await handleExecute({
      request: makeRequest(
        {
          action: "preview",
          idempotencyKey: "deploy-001",
          command: "Deploy latest approved changes",
        },
        { "x-orch-token": "supersecret" }
      ),
      env: {},
      ctx: {},
    });
    const previewBody = await preview.json();

    const deploy = await handleExecute({
      request: makeRequest(
        {
          action: "deploy",
          idempotencyKey: "deploy-001",
          command: "Deploy latest approved changes",
          confirmToken: previewBody.result.confirmToken,
        },
        { "x-orch-token": "supersecret" }
      ),
      env: {},
      ctx: {},
    });

    expect(deploy.status).toBe(200);
    expect(lastOrchestratorPayload?.mode).toBe("deploy");
    const deployBody = await deploy.json();
    expect(deployBody.eventType).toBe("deployed");
  });

  it("allows deploy after apply with the same confirmToken when D1 is enabled", async () => {
    const env = { D1: new InMemoryD1() };

    const preview = await handleExecute({
      request: makeRequest(
        {
          action: "preview",
          idempotencyKey: "chain-001",
          command: "Change homepage headline to Voice-native launch mode",
        },
        { "x-orch-token": "supersecret" }
      ),
      env,
      ctx: {},
    });
    const previewBody = await preview.json();

    const apply = await handleExecute({
      request: makeRequest(
        {
          action: "apply",
          idempotencyKey: "chain-001",
          command: "Change homepage headline to Voice-native launch mode",
          confirmToken: previewBody.result.confirmToken,
        },
        { "x-orch-token": "supersecret" }
      ),
      env,
      ctx: {},
    });
    expect(apply.status).toBe(200);

    const deploy = await handleExecute({
      request: makeRequest(
        {
          action: "deploy",
          idempotencyKey: "chain-001",
          command: "Deploy latest approved changes",
          confirmToken: previewBody.result.confirmToken,
        },
        { "x-orch-token": "supersecret" }
      ),
      env,
      ctx: {},
    });

    expect(deploy.status).toBe(200);
    const deployBody = await deploy.json();
    expect(deployBody.eventType).toBe("deployed");
  });
});
