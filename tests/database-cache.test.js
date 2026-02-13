/**
 * Unit Tests for Database Cache System
 * Tests statement caching, performance optimization, and cleanup
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { StatementCache, CachedDatabase, createCachedDatabase, QUERY_TEMPLATES } from "../functions/database-cache.js";

// Mock database for testing
class MockDatabase {
  constructor() {
    this.preparedStatements = new Map();
    this.queryResults = new Map();
  }

  prepare(query) {
    if (!this.preparedStatements.has(query)) {
      this.preparedStatements.set(query, new MockStatement(query, this.queryResults.get(query)));
    }
    return this.preparedStatements.get(query);
  }

  setQueryResult(query, result) {
    this.queryResults.set(query, result);
  }

  batch(statements) {
    return Promise.resolve({
      success: true,
      results: statements.map((stmt) => stmt.result || { changes: 1 }),
    });
  }
}

class MockStatement {
  constructor(query, result) {
    this.query = query;
    this.result = result || { changes: 1 };
    this.boundParams = [];
  }

  bind(...params) {
    this.boundParams = params;
    return this;
  }

  async first() {
    return this.result.first || null;
  }

  async all() {
    return this.result.all || { results: [] };
  }

  async run() {
    return this.result;
  }
}

describe("StatementCache", () => {
  let cache;

  beforeEach(() => {
    cache = new StatementCache(10, 1000); // 10 items, 1 second TTL
  });

  afterEach(() => {
    cache.clear();
  });

  it("should generate consistent cache keys", () => {
    const query1 = "SELECT * FROM users WHERE id = ?";
    const query2 = "select * from users where id = ?";
    const query3 = "SELECT   *   FROM   users   WHERE   id   =   ?";

    expect(cache.generateKey(query1, [1])).toBe(cache.generateKey(query2, [1]));
    expect(cache.generateKey(query1, [1])).toBe(cache.generateKey(query3, [1]));
    // Prepared statements are reusable across different param values; only count matters.
    expect(cache.generateKey(query1, [1])).toBe(cache.generateKey(query1, [2]));
    // Different parameter counts must not collide.
    expect(cache.generateKey(query1, [1])).not.toBe(cache.generateKey(query1, [1, 2]));
  });

  it("should cache and retrieve statements", () => {
    const query = "SELECT * FROM users";
    const statement = { query };

    expect(cache.get(query)).toBeNull();

    cache.set(query, [], statement);
    expect(cache.get(query)).toBe(statement);
  });

  it("should respect TTL and expire old entries", (done) => {
    const cache = new StatementCache(10, 50); // 50ms TTL
    const query = "SELECT * FROM users";
    const statement = { query };

    cache.set(query, [], statement);
    expect(cache.get(query)).toBe(statement);

    setTimeout(() => {
      expect(cache.get(query)).toBeNull();
      done();
    }, 100);
  });

  it("should evict oldest entries when cache is full", () => {
    const cache = new StatementCache(2, 1000); // Only 2 items
    const stmt1 = { query: "query1" };
    const stmt2 = { query: "query2" };
    const stmt3 = { query: "query3" };

    cache.set("query1", [], stmt1);
    cache.set("query2", [], stmt2);
    expect(cache.get("query1")).toBe(stmt1);
    expect(cache.get("query2")).toBe(stmt2);

    cache.set("query3", [], stmt3); // Should evict query1
    expect(cache.get("query1")).toBeNull();
    expect(cache.get("query2")).toBe(stmt2);
    expect(cache.get("query3")).toBe(stmt3);
  });

  it("should track statistics correctly", () => {
    const query = "SELECT * FROM users";
    const statement = { query };

    // Miss
    cache.get(query);
    expect(cache.hits).toBe(0);
    expect(cache.misses).toBe(1);

    // Hit
    cache.set(query, [], statement);
    cache.get(query);
    expect(cache.hits).toBe(1);
    expect(cache.misses).toBe(1);

    // Another miss
    cache.get("other query");
    expect(cache.hits).toBe(1);
    expect(cache.misses).toBe(2);
  });

  it("should provide accurate statistics", () => {
    const query = "SELECT * FROM users";
    const statement = { query };

    cache.set(query, [], statement);
    cache.get(query); // hit
    cache.get("other"); // miss

    const stats = cache.getStats();
    expect(stats.size).toBe(1);
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(1);
    expect(stats.hitRate).toBe(0.5);
  });
});

describe("CachedDatabase", () => {
  let mockDb;
  let cachedDb;

  beforeEach(() => {
    mockDb = new MockDatabase();
    cachedDb = createCachedDatabase(mockDb, { maxSize: 10, ttlMs: 1000 });
  });

  afterEach(() => {
    cachedDb.destroy();
  });

  it("should execute SELECT queries with .first()", async () => {
    const query = "SELECT * FROM users WHERE id = ?";
    const expectedResult = { id: 1, name: "John" };
    mockDb.setQueryResult(query, { first: expectedResult });

    const result = await cachedDb.execute(query, [1]);
    expect(result).toBe(expectedResult);
  });

  it("should execute SELECT with LIMIT using .all()", async () => {
    const query = "SELECT * FROM users LIMIT 10";
    const expectedResult = { results: [{ id: 1 }, { id: 2 }] };
    mockDb.setQueryResult(query, { all: expectedResult });

    const result = await cachedDb.execute(query);
    expect(result).toBe(expectedResult);
  });

  it("should execute INSERT/UPDATE/DELETE with .run()", async () => {
    const query = "INSERT INTO users (name) VALUES (?)";
    const expectedResult = { changes: 1 };
    mockDb.setQueryResult(query, expectedResult);

    const result = await cachedDb.execute(query, ["John"]);
    expect(result).toBe(expectedResult);
  });

  it("should cache prepared statements", async () => {
    const query = "SELECT * FROM users";

    // First call should prepare statement
    await cachedDb.execute(query);
    expect(mockDb.preparedStatements.size).toBe(1);

    // Second call should use cached statement
    await cachedDb.execute(query);
    expect(mockDb.preparedStatements.size).toBe(1); // Still only one
  });

  it("should track query performance", async () => {
    const query = "SELECT * FROM users";
    mockDb.setQueryResult(query, { first: { id: 1 } });

    await cachedDb.execute(query);

    const stats = cachedDb.getPerformanceStats();
    expect(stats.queries.total).toBe(1);
    expect(stats.queries.totalExecutions).toBe(1);
    expect(stats.queries.topSlowest).toHaveLength(1);
  });

  it("should execute batch operations", async () => {
    const queries = [
      { query: "INSERT INTO users (name) VALUES (?)", params: ["John"] },
      { query: "INSERT INTO users (name) VALUES (?)", params: ["Jane"] },
    ];

    const result = await cachedDb.batch(queries);
    expect(result.success).toBe(true);
    expect(result.results).toHaveLength(2);
  });

  it("should cleanup resources properly", () => {
    const query = "SELECT * FROM users";
    cachedDb.prepare(query);

    expect(cachedDb.cache.getStats().size).toBe(1);

    cachedDb.reset();

    expect(cachedDb.cache.getStats().size).toBe(0);
  });
});

describe("QUERY_TEMPLATES", () => {
  it("should contain all required templates", () => {
    expect(QUERY_TEMPLATES.INSERT_TOKEN).toBeDefined();
    expect(QUERY_TEMPLATES.CONSUME_TOKEN).toBeDefined();
    expect(QUERY_TEMPLATES.FIND_TOKEN).toBeDefined();
    expect(QUERY_TEMPLATES.INSERT_EVENT).toBeDefined();
    expect(QUERY_TEMPLATES.FIND_EVENT).toBeDefined();
    expect(QUERY_TEMPLATES.CLEAN_RATE_LIMITS).toBeDefined();
    expect(QUERY_TEMPLATES.COUNT_RATE_LIMITS).toBeDefined();
    expect(QUERY_TEMPLATES.INSERT_RATE_LIMIT).toBeDefined();
    expect(QUERY_TEMPLATES.CHECK_BLOCK).toBeDefined();
    expect(QUERY_TEMPLATES.ADD_BLOCK).toBeDefined();
  });

  it("should have properly formatted SQL", () => {
    Object.values(QUERY_TEMPLATES).forEach((template) => {
      expect(typeof template).toBe("string");
      expect(template).toContain("?"); // Should have parameter placeholders
    });
  });
});

describe("Cache Performance Optimization", () => {
  it("should cache query normalizations for performance", () => {
    const cache = new StatementCache();
    const query = "SELECT   *   FROM   users   WHERE   id   =   ?";

    const key1 = cache.generateKey(query, [1]);
    const key2 = cache.generateKey(query, [1]);
    expect(key1).toBe(key2);
  });

  it("should handle large numbers of cache operations efficiently", () => {
    const cache = new StatementCache(1000, 10000);
    const queries = Array.from({ length: 100 }, (_, i) => `SELECT * FROM table_${i} WHERE id = ?`);

    const startTime = performance.now();

    // Cache all queries
    queries.forEach((query, i) => {
      cache.set(query, [i], { query });
    });

    // Retrieve all queries
    queries.forEach((query, i) => {
      cache.get(query, [i]);
    });

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Should complete quickly (less than 100ms for 100 operations)
    expect(duration).toBeLessThan(100);
    expect(cache.hits).toBe(100);
    expect(cache.misses).toBe(0);
  });
});
