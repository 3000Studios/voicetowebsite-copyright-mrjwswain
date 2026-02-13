/**
 * Rate Limiting System for API Abuse Prevention
 * Implements sliding window rate limiting with Redis/D1 backend
 */

// Rate limit configurations
const RATE_LIMIT_CONFIGS = {
  // General API limits
  default: {
    windowMs: 60000, // 1 minute window
    maxRequests: 100, // 100 requests per minute
    blockDurationMs: 300000, // 5 minute block
  },

  // Heavy operations (apply, deploy, rollback)
  heavy: {
    windowMs: 300000, // 5 minute window
    maxRequests: 10, // 10 heavy operations per 5 minutes
    blockDurationMs: 900000, // 15 minute block
  },

  // Token operations (preview, apply)
  token: {
    windowMs: 60000, // 1 minute window
    maxRequests: 20, // 20 token operations per minute
    blockDurationMs: 180000, // 3 minute block
  },

  // Auto mode (instant changes)
  auto: {
    windowMs: 300000, // 5 minute window
    maxRequests: 5, // 5 auto operations per 5 minutes
    blockDurationMs: 600000, // 10 minute block
  },
};

/**
 * Rate Limiter Class
 */
class RateLimiter {
  constructor(db, config = RATE_LIMIT_CONFIGS) {
    this.db = db;
    this.config = config;
    this.memoryStore = new Map(); // Fallback for when DB is unavailable
  }

  /**
   * Get rate limit config for an action
   */
  getConfigForAction(action) {
    switch (action) {
      case "apply":
      case "deploy":
      case "rollback":
        return this.config.heavy;
      case "preview":
      case "plan":
        return this.config.token;
      case "auto":
        return this.config.auto;
      default:
        return this.config.default;
    }
  }

  /**
   * Generate rate limit key
   */
  generateKey(identifier, action) {
    const clientIp = identifier.ip || "unknown";
    const userId = identifier.userId || "anonymous";
    return `rate_limit:${action}:${userId}:${clientIp}`;
  }

  /**
   * Clean old entries from memory store
   */
  cleanMemoryStore() {
    const now = Date.now();
    for (const [key, data] of this.memoryStore.entries()) {
      if (data.windowStart + data.windowMs < now) {
        this.memoryStore.delete(key);
      }
    }
  }

  /**
   * Check rate limit using database
   */
  async checkRateLimitDB(key, config) {
    const now = Date.now();
    const windowStart = now - config.windowMs;

    try {
      // Clean old entries
      await this.db.prepare(`DELETE FROM rate_limits WHERE timestamp < ?`).bind(windowStart).run();

      // Count current requests in window
      const result = await this.db
        .prepare(`SELECT COUNT(*) as count FROM rate_limits WHERE key = ? AND timestamp >= ?`)
        .bind(key, windowStart)
        .first();

      const currentCount = result?.count || 0;

      // Check if blocked
      const blockResult = await this.db
        .prepare(`SELECT blocked_until FROM rate_limit_blocks WHERE key = ? AND blocked_until > ?`)
        .bind(key, now)
        .first();

      if (blockResult) {
        return {
          allowed: false,
          blocked: true,
          blockedUntil: blockResult.blocked_until,
          resetTime: blockResult.blocked_until,
          limit: config.maxRequests,
          remaining: 0,
          windowMs: config.windowMs,
        };
      }

      // Check if rate limit exceeded
      if (currentCount >= config.maxRequests) {
        const blockedUntil = now + config.blockDurationMs;

        // Add block
        await this.db
          .prepare(`INSERT OR REPLACE INTO rate_limit_blocks (key, blocked_until) VALUES (?, ?)`)
          .bind(key, blockedUntil)
          .run();

        return {
          allowed: false,
          blocked: true,
          blockedUntil,
          resetTime: blockedUntil,
          limit: config.maxRequests,
          remaining: 0,
          windowMs: config.windowMs,
        };
      }

      // Add current request
      await this.db.prepare(`INSERT INTO rate_limits (key, timestamp) VALUES (?, ?)`).bind(key, now).run();

      return {
        allowed: true,
        blocked: false,
        limit: config.maxRequests,
        remaining: config.maxRequests - currentCount - 1,
        windowMs: config.windowMs,
        resetTime: now + config.windowMs,
      };
    } catch (error) {
      console.error("Rate limit database check failed:", error);
      // Fallback to memory store
      return this.checkRateLimitMemory(key, config);
    }
  }

  /**
   * Check rate limit using memory store (fallback)
   */
  checkRateLimitMemory(key, config) {
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Clean old entries periodically
    if (Math.random() < 0.1) {
      // 10% chance to clean
      this.cleanMemoryStore();
    }

    const existing = this.memoryStore.get(key);

    if (!existing || existing.windowStart < windowStart) {
      // New window
      this.memoryStore.set(key, {
        count: 1,
        windowStart: now,
        windowMs: config.windowMs,
        blockedUntil: null,
      });

      return {
        allowed: true,
        blocked: false,
        limit: config.maxRequests,
        remaining: config.maxRequests - 1,
        windowMs: config.windowMs,
        resetTime: now + config.windowMs,
      };
    }

    // Check if currently blocked
    if (existing.blockedUntil && existing.blockedUntil > now) {
      return {
        allowed: false,
        blocked: true,
        blockedUntil: existing.blockedUntil,
        resetTime: existing.blockedUntil,
        limit: config.maxRequests,
        remaining: 0,
        windowMs: config.windowMs,
      };
    }

    // Check rate limit
    if (existing.count >= config.maxRequests) {
      existing.blockedUntil = now + config.blockDurationMs;

      return {
        allowed: false,
        blocked: true,
        blockedUntil: existing.blockedUntil,
        resetTime: existing.blockedUntil,
        limit: config.maxRequests,
        remaining: 0,
        windowMs: config.windowMs,
      };
    }

    // Increment count
    existing.count++;

    return {
      allowed: true,
      blocked: false,
      limit: config.maxRequests,
      remaining: config.maxRequests - existing.count,
      windowMs: config.windowMs,
      resetTime: existing.windowStart + existing.windowMs,
    };
  }

  /**
   * Check rate limit for a request
   */
  async checkLimit(identifier, action) {
    const config = this.getConfigForAction(action);
    const key = this.generateKey(identifier, action);

    if (this.db) {
      return await this.checkRateLimitDB(key, config);
    } else {
      return this.checkRateLimitMemory(key, config);
    }
  }

  /**
   * Initialize database tables
   */
  async initializeTables() {
    if (!this.db) return;

    try {
      // Rate limits table
      await this.db
        .prepare(
          `
          CREATE TABLE IF NOT EXISTS rate_limits (
            key TEXT NOT NULL,
            timestamp INTEGER NOT NULL,
            PRIMARY KEY (key, timestamp)
          )
        `
        )
        .run();

      // Rate limit blocks table
      await this.db
        .prepare(
          `
          CREATE TABLE IF NOT EXISTS rate_limit_blocks (
            key TEXT PRIMARY KEY,
            blocked_until INTEGER NOT NULL
          )
        `
        )
        .run();

      // Create indexes for performance
      await this.db.prepare(`CREATE INDEX IF NOT EXISTS idx_rate_limits_timestamp ON rate_limits(timestamp)`).run();

      await this.db
        .prepare(`CREATE INDEX IF NOT EXISTS idx_rate_limits_key_timestamp ON rate_limits(key, timestamp)`)
        .run();

      await this.db
        .prepare(`CREATE INDEX IF NOT EXISTS idx_rate_limit_blocks_until ON rate_limit_blocks(blocked_until)`)
        .run();
    } catch (error) {
      console.error("Failed to initialize rate limit tables:", error);
    }
  }
}

/**
 * Rate limiting middleware
 */
export function createRateLimitMiddleware(db) {
  const rateLimiter = new RateLimiter(db);

  // Initialize tables asynchronously
  rateLimiter.initializeTables().catch(console.error);

  return async (request, action) => {
    const identifier = {
      ip:
        request.headers.get("cf-connecting-ip") ||
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown",
      userId: request.headers.get("x-user-id") || "anonymous",
    };

    const result = await rateLimiter.checkLimit(identifier, action);

    return {
      ...result,
      headers: {
        "X-RateLimit-Limit": result.limit.toString(),
        "X-RateLimit-Remaining": result.remaining.toString(),
        "X-RateLimit-Reset": new Date(result.resetTime).toISOString(),
        ...(result.blocked && { "X-RateLimit-Retry-After": new Date(result.blockedUntil).toISOString() }),
      },
    };
  };
}

/**
 * Express/Cloudflare Workers middleware
 */
export function rateLimitMiddleware(rateLimitFn) {
  return async (request, action) => {
    const rateLimitResult = await rateLimitFn(request, action);

    if (!rateLimitResult.allowed) {
      return {
        blocked: true,
        response: {
          status: rateLimitResult.blocked ? 429 : 429,
          headers: {
            "Content-Type": "application/json",
            ...rateLimitResult.headers,
          },
          body: JSON.stringify({
            error: rateLimitResult.blocked
              ? "Too many requests. You have been temporarily blocked due to excessive requests."
              : "Rate limit exceeded. Please try again later.",
            retryAfter: rateLimitResult.blockedUntil
              ? Math.ceil((rateLimitResult.blockedUntil - Date.now()) / 1000)
              : Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
            limit: rateLimitResult.limit,
            windowMs: rateLimitResult.windowMs,
          }),
        },
      };
    }

    return {
      blocked: false,
      headers: rateLimitResult.headers,
    };
  };
}

/**
 * Rate limit status endpoint
 */
export async function getRateLimitStatus(request, db) {
  const rateLimiter = new RateLimiter(db);
  const identifier = {
    ip: request.headers.get("cf-connecting-ip") || "unknown",
    userId: request.headers.get("x-user-id") || "anonymous",
  };

  const actions = ["default", "heavy", "token", "auto"];
  const status = {};

  for (const action of actions) {
    const result = await rateLimiter.checkLimit(identifier, action);
    status[action] = {
      limit: result.limit,
      remaining: result.remaining,
      resetTime: result.resetTime,
      blocked: result.blocked,
      blockedUntil: result.blockedUntil,
    };
  }

  return status;
}

export { RateLimiter, RATE_LIMIT_CONFIGS };
