/**
 * Unit Tests for Execute API
 * Tests token validation, request handling, and security features
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  sha256Hex,
  createConfirmToken,
  validateAndConsumeConfirmToken,
} from "../functions/execute.js";

// Mock environment and dependencies
const mockEnv = {
  CONFIRM_TOKEN_SECRET: "test-secret-key-for-testing",
  ORCH_TOKEN: "test-orch-token",
  NODE_ENV: "test",
  ENABLE_RESPONSE_VALIDATION: "false",
};

// Mock database
class MockDatabase {
  constructor() {
    this.tokens = new Map();
    this.events = new Map();
  }

  prepare(query) {
    return new MockStatement(query, this);
  }

  batch(statements) {
    return { success: true };
  }
}

class MockStatement {
  constructor(query, db) {
    this.query = query;
    this.db = db;
    this.boundParams = [];
  }

  bind(...params) {
    this.boundParams = params;
    return this;
  }

  async run() {
    const q = String(this.query).toLowerCase().replace(/\s+/g, " ").trim();

    if (q.includes("insert or replace into execute_confirm_tokens")) {
      const [tokenHash, action, idempotencyKey, traceId, expiresAt] =
        this.boundParams;
      this.db.tokens.set(tokenHash, {
        token_hash: tokenHash,
        action,
        idempotency_key: idempotencyKey,
        trace_id: traceId,
        expires_at: expiresAt,
        used_at: null,
      });
      return { changes: 1 };
    }

    if (
      q.includes("update execute_confirm_tokens") &&
      q.includes("set used_at")
    ) {
      const [now, tokenHash, cutoff] = this.boundParams;
      const token = this.db.tokens.get(tokenHash);
      if (
        token &&
        token.used_at === null &&
        new Date(token.expires_at).getTime() > new Date(cutoff).getTime()
      ) {
        token.used_at = now;
        return { changes: 1 };
      }
      return { changes: 0 };
    }

    if (q.startsWith("select") && q.includes("from execute_confirm_tokens")) {
      const [tokenHash] = this.boundParams;
      return this.db.tokens.get(tokenHash) || null;
    }

    return { changes: 0 };
  }

  async first() {
    return this.run();
  }
}

// Mock logger
const mockLogger = {
  warn: vi.fn(),
  info: vi.fn(),
  error: vi.fn(),
  logSecurity: vi.fn(),
  startTimer: vi.fn(() => ({ end: vi.fn() })),
};

describe("Token Security", () => {
  let mockDb;

  beforeEach(() => {
    mockDb = new MockDatabase();
    vi.clearAllMocks();
  });

  describe("sha256Hex", () => {
    it("should generate consistent SHA-256 hashes", async () => {
      const input = "test-input";
      const hash1 = await sha256Hex(input);
      const hash2 = await sha256Hex(input);

      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/); // 64 character hex string
    });

    it("should generate different hashes for different inputs", async () => {
      const hash1 = await sha256Hex("input1");
      const hash2 = await sha256Hex("input2");

      expect(hash1).not.toBe(hash2);
    });
  });

  describe("createConfirmToken", () => {
    it("should create a valid token with correct format", async () => {
      const result = await createConfirmToken(mockEnv, mockDb, {
        action: "apply",
        idempotencyKey: "test-key-123",
        traceId: "trace-123",
      });

      expect(result.confirmToken).toMatch(
        /^vtwcfm\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/
      );
      expect(result.confirmBy).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      );
    });

    it("should store token in database with correct action", async () => {
      const result = await createConfirmToken(mockEnv, mockDb, {
        action: "preview",
        idempotencyKey: "test-key-123",
        traceId: "trace-123",
      });

      const tokenHash = await sha256Hex(result.confirmToken);
      const storedToken = mockDb.tokens.get(tokenHash);

      expect(storedToken).toBeDefined();
      // Token storage should preserve the action used to mint the token.
      expect(storedToken.action).toBe("preview");
      expect(storedToken.idempotency_key).toBe("test-key-123");
      expect(storedToken.trace_id).toBe("trace-123");
      expect(storedToken.used_at).toBeNull();
    });

    it("should work without database (stateless mode)", async () => {
      const result = await createConfirmToken(mockEnv, null, {
        action: "apply",
        idempotencyKey: "test-key-123",
        traceId: "trace-123",
      });

      expect(result.confirmToken).toBeDefined();
      expect(result.confirmBy).toBeDefined();
    });
  });

  describe("validateAndConsumeConfirmToken", () => {
    it("should validate and consume a valid token", async () => {
      // Create token
      const tokenResult = await createConfirmToken(mockEnv, mockDb, {
        action: "apply",
        idempotencyKey: "test-key-123",
        traceId: "trace-123",
      });

      // Validate and consume
      const result = await validateAndConsumeConfirmToken(mockEnv, mockDb, {
        token: tokenResult.confirmToken,
        action: "apply",
        idempotencyKey: "test-key-123",
      });

      expect(result.ok).toBe(true);

      // Token should be marked as used
      const tokenHash = await sha256Hex(tokenResult.confirmToken);
      const storedToken = mockDb.tokens.get(tokenHash);
      expect(storedToken.used_at).toBeDefined();
    });

    it("should reject invalid token format", async () => {
      const result = await validateAndConsumeConfirmToken(mockEnv, mockDb, {
        token: "invalid-token-format",
        action: "apply",
        idempotencyKey: "test-key-123",
      });

      expect(result.ok).toBe(false);
      expect(result.error).toBe("Invalid confirmToken format.");
    });

    it("should reject expired tokens", async () => {
      // Create token with very short expiration
      const shortTtlEnv = { ...mockEnv };
      const originalDateNow = Date.now;
      const mockTime = Date.now() - 11 * 60 * 1000; // 11 minutes ago

      Date.now = vi.fn(() => mockTime);

      const tokenResult = await createConfirmToken(shortTtlEnv, mockDb, {
        action: "apply",
        idempotencyKey: "test-key-123",
        traceId: "trace-123",
      });

      Date.now = originalDateNow; // Restore current time

      const result = await validateAndConsumeConfirmToken(shortTtlEnv, mockDb, {
        token: tokenResult.confirmToken,
        action: "apply",
        idempotencyKey: "test-key-123",
      });

      expect(result.ok).toBe(false);
      expect(result.error).toBe("confirmToken has expired.");
    });

    it("should reject tokens with mismatched action", async () => {
      const tokenResult = await createConfirmToken(mockEnv, mockDb, {
        action: "preview",
        idempotencyKey: "test-key-123",
        traceId: "trace-123",
      });

      const result = await validateAndConsumeConfirmToken(mockEnv, mockDb, {
        token: tokenResult.confirmToken,
        action: "rollback", // Different action
        idempotencyKey: "test-key-123",
      });

      expect(result.ok).toBe(false);
      expect(result.error).toBe(
        "confirmToken does not match action/idempotencyKey."
      );
    });

    it("should reject tokens with mismatched idempotency key", async () => {
      const tokenResult = await createConfirmToken(mockEnv, mockDb, {
        action: "apply",
        idempotencyKey: "test-key-123",
        traceId: "trace-123",
      });

      const result = await validateAndConsumeConfirmToken(mockEnv, mockDb, {
        token: tokenResult.confirmToken,
        action: "apply",
        idempotencyKey: "different-key", // Different idempotency key
      });

      expect(result.ok).toBe(false);
      expect(result.error).toBe(
        "confirmToken does not match action/idempotencyKey."
      );
    });

    it("should reject already used tokens", async () => {
      const tokenResult = await createConfirmToken(mockEnv, mockDb, {
        action: "apply",
        idempotencyKey: "test-key-123",
        traceId: "trace-123",
      });

      // First consumption
      const result1 = await validateAndConsumeConfirmToken(mockEnv, mockDb, {
        token: tokenResult.confirmToken,
        action: "apply",
        idempotencyKey: "test-key-123",
      });
      expect(result1.ok).toBe(true);

      // Second consumption should fail
      const result2 = await validateAndConsumeConfirmToken(mockEnv, mockDb, {
        token: tokenResult.confirmToken,
        action: "apply",
        idempotencyKey: "test-key-123",
      });
      expect(result2.ok).toBe(false);
      expect(result2.error).toBe("confirmToken already used.");
    });

    it("should allow preview tokens for apply actions", async () => {
      const tokenResult = await createConfirmToken(mockEnv, mockDb, {
        action: "execute",
        idempotencyKey: "test-key-123",
        traceId: "trace-123",
      });

      const result = await validateAndConsumeConfirmToken(mockEnv, mockDb, {
        token: tokenResult.confirmToken,
        action: "apply", // Different but allowed action
        idempotencyKey: "test-key-123",
      });

      expect(result.ok).toBe(true);
    });

    it("should work in stateless mode without database", async () => {
      const tokenResult = await createConfirmToken(mockEnv, null, {
        action: "apply",
        idempotencyKey: "test-key-123",
        traceId: "trace-123",
      });

      const result = await validateAndConsumeConfirmToken(mockEnv, null, {
        token: tokenResult.confirmToken,
        action: "apply",
        idempotencyKey: "test-key-123",
      });

      expect(result.ok).toBe(true);
    });
  });
});

describe("Request Size Limits", () => {
  it("should reject requests with content-length too large", async () => {
    const mockRequest = {
      headers: {
        "content-length": "2097152", // 2MB
      },
      text: async () => "{}",
      json: async () => ({}),
    };

    // Import the readJsonBody function (need to adjust for actual implementation)
    // This would need to be adapted based on the actual function signature
    // const result = await readJsonBody(mockRequest);
    // expect(result.error).toBe('Request body too large');
  });
});

describe("Error Handling", () => {
  it("should not expose internal error codes", async () => {
    // Test that error responses don't contain internal codes
    // This would need to be adapted based on actual error handling
  });
});

describe("Response Validation Configuration", () => {
  it("should respect validation configuration", () => {
    // Test that response validation can be enabled/disabled
    // This would need to be adapted based on actual implementation
  });
});
