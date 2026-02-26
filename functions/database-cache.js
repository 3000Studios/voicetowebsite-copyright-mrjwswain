/**
 * Prepared Statement Caching for Database Performance
 * Reduces database preparation overhead by caching prepared statements
 */

/**
 * Statement Cache Class
 */
class StatementCache {
  constructor(maxSize = 100, ttlMs = 300000) {
    // 5 minute TTL
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
    this.queryNormalizations = new Map(); // Cache normalized queries
  }

  /**
   * Generate cache key from query and parameters
   */
  generateKey(query, params = []) {
    // Use cached normalization if available
    if (this.queryNormalizations.has(query)) {
      const normalized = this.queryNormalizations.get(query);
      return `${normalized}:${params.length}`;
    }

    // Normalize and cache the query
    const normalizedQuery = query.trim().toLowerCase().replace(/\s+/g, " ");
    this.queryNormalizations.set(query, normalizedQuery);

    return `${normalizedQuery}:${params.length}`;
  }

  /**
   * Check if cache entry is still valid
   */
  isValid(entry) {
    return entry && Date.now() - entry.createdAt < this.ttlMs;
  }

  /**
   * Clean expired entries
   */
  cleanExpired() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.createdAt > this.ttlMs) {
        this.cache.delete(key);
        this.evictions++;
      }
    }
  }

  /**
   * Evict oldest entries if cache is full
   */
  evictOldest() {
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
      this.evictions++;
    }
  }

  /**
   * Get cached statement
   */
  get(query, params = []) {
    const key = this.generateKey(query, params);
    const entry = this.cache.get(key);

    if (this.isValid(entry)) {
      this.hits++;
      // Move to end (LRU)
      this.cache.delete(key);
      this.cache.set(key, entry);
      return entry.statement;
    }

    this.misses++;
    return null;
  }

  /**
   * Store prepared statement in cache
   */
  set(query, params = [], statement) {
    const key = this.generateKey(query, params);

    this.cleanExpired();
    this.evictOldest();

    this.cache.set(key, {
      statement,
      createdAt: Date.now(),
      query,
      paramCount: params.length,
    });
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
      hitRate: total > 0 ? this.hits / total : 0,
      ttlMs: this.ttlMs,
    };
  }

  /**
   * Clear cache and reset statistics
   */
  clear() {
    this.cache.clear();
    this.queryNormalizations.clear();
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
  }
}

/**
 * Database wrapper with statement caching
 */
class CachedDatabase {
  constructor(db, cacheOptions = {}) {
    this.db = db;
    this.cache = new StatementCache(cacheOptions.maxSize, cacheOptions.ttlMs);
    this.queryStats = new Map();
    this.monitoringInterval = null;
  }

  /**
   * Track query statistics
   */
  trackQuery(query, duration, success = true) {
    const normalizedQuery = query.trim().toLowerCase().replace(/\s+/g, " ");

    if (!this.queryStats.has(normalizedQuery)) {
      this.queryStats.set(normalizedQuery, {
        count: 0,
        totalTime: 0,
        avgTime: 0,
        errors: 0,
        lastUsed: null,
      });
    }

    const stats = this.queryStats.get(normalizedQuery);
    stats.count++;
    stats.totalTime += duration;
    stats.avgTime = stats.totalTime / stats.count;
    if (!success) stats.errors++;
    stats.lastUsed = Date.now();
  }

  /**
   * Prepare statement with caching
   */
  prepare(query) {
    const cached = this.cache.get(query);

    if (cached) {
      return cached;
    }

    const startTime = performance.now();
    try {
      const statement = this.db.prepare(query);
      const duration = performance.now() - startTime;

      this.trackQuery(query, duration, true);
      this.cache.set(query, [], statement);

      return statement;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.trackQuery(query, duration, false);
      throw error;
    }
  }

  /**
   * Execute query with automatic statement preparation
   */
  async execute(query, params = []) {
    const statement = this.prepare(query);
    const boundStatement =
      params.length > 0 ? statement.bind(...params) : statement;

    const normalizedQuery = query.trim().toLowerCase();

    // SELECT handling:
    // - Prefer `.first()` for `LIMIT 1` queries (common in this codebase and keeps return shape consistent).
    // - Use `.all()` for other limited selects (pagination, lists).
    if (normalizedQuery.startsWith("select")) {
      if (/\blimit\s+1\b/.test(normalizedQuery)) {
        return await boundStatement.first();
      }
      if (normalizedQuery.includes("limit")) {
        return await boundStatement.all();
      }
      return await boundStatement.first();
    }

    return await boundStatement.run();
  }

  /**
   * Execute multiple queries in a batch
   */
  async batch(queries) {
    const statements = queries.map(({ query, params = [] }) => {
      const statement = this.prepare(query);
      return params.length > 0 ? statement.bind(...params) : statement;
    });

    return await this.db.batch(statements);
  }

  /**
   * Get comprehensive performance statistics
   */
  getPerformanceStats() {
    const cacheStats = this.cache.getStats();
    const queryStats = Array.from(this.queryStats.entries())
      .map(([query, stats]) => ({ query, ...stats }))
      .sort((a, b) => b.totalTime - a.totalTime)
      .slice(0, 10); // Top 10 slowest queries

    return {
      cache: cacheStats,
      queries: {
        total: this.queryStats.size,
        topSlowest: queryStats,
        totalExecutions: Array.from(this.queryStats.values()).reduce(
          (sum, stats) => sum + stats.count,
          0
        ),
      },
    };
  }

  /**
   * Clear cache and reset statistics
   */
  reset() {
    this.cache.clear();
    this.queryStats.clear();
  }

  /**
   * Cleanup resources and stop monitoring
   */
  destroy() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.reset();
  }
}

/**
 * Create cached database wrapper
 */
export function createCachedDatabase(db, options = {}) {
  return new CachedDatabase(db, options);
}

/**
 * Database performance monitoring middleware.
 * Returns a cached DB wrapper; no interval is set (caller may log stats as needed)
 * to avoid leaking intervals when createDatabaseMonitor is invoked per request.
 */
export function createDatabaseMonitor(db, logger) {
  const cachedDb = createCachedDatabase(db);
  if (logger && typeof logger.debug === "function") {
    try {
      const stats = cachedDb.getPerformanceStats();
      logger.debug("Database performance metrics", stats);
    } catch (_) {
      // ignore
    }
  }
  return cachedDb;
}

/**
 * Common query templates for better caching
 */
export const QUERY_TEMPLATES = {
  // Token operations
  INSERT_TOKEN: `INSERT OR REPLACE INTO execute_confirm_tokens
    (token_hash, action, idempotency_key, trace_id, expires_at, used_at)
    VALUES (?, ?, ?, ?, ?, ?)`,

  CONSUME_TOKEN: `UPDATE execute_confirm_tokens
    SET used_at = ?
    WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?`,

  FIND_TOKEN: `SELECT used_at, expires_at, action, idempotency_key FROM execute_confirm_tokens
    WHERE token_hash = ? LIMIT 1`,

  // Event operations
  INSERT_EVENT: `INSERT OR IGNORE INTO execute_events
    (event_id, action, idempotency_key, trace_id, status, response_json)
    VALUES (?, ?, ?, ?, ?, ?)`,

  FIND_EVENT: `SELECT status, response_json FROM execute_events
    WHERE action = ? AND idempotency_key = ? LIMIT 1`,

  // Rate limiting
  CLEAN_RATE_LIMITS: `DELETE FROM rate_limits WHERE timestamp < ?`,

  COUNT_RATE_LIMITS: `SELECT COUNT(*) as count FROM rate_limits
    WHERE key = ? AND timestamp >= ?`,

  INSERT_RATE_LIMIT: `INSERT INTO rate_limits (key, timestamp) VALUES (?, ?)`,

  CHECK_BLOCK: `SELECT blocked_until FROM rate_limit_blocks
    WHERE key = ? AND blocked_until > ?`,

  ADD_BLOCK: `INSERT OR REPLACE INTO rate_limit_blocks (key, blocked_until)
    VALUES (?, ?)`,
};

/**
 * Helper function for common database operations
 */
export class DatabaseHelper {
  constructor(cachedDb, logger) {
    this.db = cachedDb;
    this.logger = logger;
  }

  /**
   * Execute token consumption with caching
   */
  async consumeToken(tokenHash, now) {
    const timer = this.logger.startTimer("db-consume-token");

    try {
      const result = await this.db.execute(QUERY_TEMPLATES.CONSUME_TOKEN, [
        now,
        tokenHash,
        now,
      ]);
      const changes = Number(result?.changes ?? result?.meta?.changes ?? 0);
      timer.end({ changes });
      return result && typeof result === "object"
        ? { ...result, changes }
        : { changes };
    } catch (error) {
      timer.end({ error: error.message });
      throw error;
    }
  }

  /**
   * Find existing token
   */
  async findToken(tokenHash) {
    const timer = this.logger.startTimer("db-find-token");

    try {
      const result = await this.db.execute(QUERY_TEMPLATES.FIND_TOKEN, [
        tokenHash,
      ]);
      timer.end();
      return result;
    } catch (error) {
      timer.end({ error: error.message });
      throw error;
    }
  }

  /**
   * Insert event record
   */
  async insertEvent(eventData) {
    const timer = this.logger.startTimer("db-insert-event");

    try {
      const result = await this.db.execute(QUERY_TEMPLATES.INSERT_EVENT, [
        eventData.eventId,
        eventData.action,
        eventData.idempotencyKey,
        eventData.traceId,
        eventData.status,
        JSON.stringify(eventData.payload),
      ]);
      timer.end();
      return result;
    } catch (error) {
      timer.end({ error: error.message });
      throw error;
    }
  }

  /**
   * Find existing event
   */
  async findEvent(action, idempotencyKey) {
    const timer = this.logger.startTimer("db-find-event");

    try {
      const result = await this.db.execute(QUERY_TEMPLATES.FIND_EVENT, [
        action,
        idempotencyKey,
      ]);
      timer.end();
      return result;
    } catch (error) {
      timer.end({ error: error.message });
      throw error;
    }
  }
}

export { CachedDatabase, StatementCache };
