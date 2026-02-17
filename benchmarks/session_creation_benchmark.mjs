import { DatabaseSync } from "node:sqlite";
import { performance } from "node:perf_hooks";

// Setup DB
const db = new DatabaseSync(":memory:");

// Cleanup helper
function cleanup() {
  db.exec("DROP TABLE IF EXISTS sessions");
}

const ITERATIONS = 10000;
const UA = "Mozilla/5.0 (Benchmark)";

// Scenario 1: Current Implementation (Create Table + Insert)
function runCurrent() {
  cleanup();
  // Pre-create table to simulate steady state where table exists
  db.exec(`CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      ts DATETIME DEFAULT CURRENT_TIMESTAMP,
      user_agent TEXT
    )`);

  const start = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    const id = `current-${i}`;

    // The code in worker.js:
    // It prepares and runs the CREATE statement every time
    const createStmt = db.prepare(`CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      ts DATETIME DEFAULT CURRENT_TIMESTAMP,
      user_agent TEXT
    )`);
    createStmt.run();

    const insertStmt = db.prepare(
      "INSERT OR IGNORE INTO sessions (id, user_agent) VALUES (?,?)"
    );
    insertStmt.run(id, UA);
  }
  const end = performance.now();
  return end - start;
}

// Scenario 2: Optimized Implementation (Just Insert)
function runOptimized() {
  cleanup();
  // Ensure table exists (migration behavior)
  db.exec(`CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      ts DATETIME DEFAULT CURRENT_TIMESTAMP,
      user_agent TEXT
    )`);

  const start = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    const id = `optimized-${i}`;

    // Optimized code: Just insert
    const stmt = db.prepare(
      "INSERT OR IGNORE INTO sessions (id, user_agent) VALUES (?,?)"
    );
    stmt.run(id, UA);
  }
  const end = performance.now();
  return end - start;
}

console.log(`Running benchmark with ${ITERATIONS} iterations...`);

const currentDuration = runCurrent();
console.log(`Current (Create Check + Insert): ${currentDuration.toFixed(2)}ms`);

const optimizedDuration = runOptimized();
console.log(`Optimized (Insert Only): ${optimizedDuration.toFixed(2)}ms`);

const improvement =
  ((currentDuration - optimizedDuration) / currentDuration) * 100;
console.log(`Improvement: ${improvement.toFixed(2)}%`);
