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
});
