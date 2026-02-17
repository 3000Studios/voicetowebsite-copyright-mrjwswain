const { performance } = require("perf_hooks");

// Mock D1 Database
class MockD1 {
  constructor() {
    this.tables = {};
  }

  prepare(query) {
    return {
      run: async () => {
        // Simulate some latency for DB operations
        await new Promise((resolve) => setTimeout(resolve, 1));
        if (query.includes("CREATE TABLE")) {
          this.tables["commands"] = true;
        }
        return {};
      },
      all: async () => {
        await new Promise((resolve) => setTimeout(resolve, 1));
        if (query.includes("PRAGMA table_info")) {
          return {
            results: [
              { name: "id" },
              { name: "ts" },
              { name: "command" },
              { name: "actions" },
              { name: "files" },
              { name: "commit_sha" },
            ],
          };
        }
        return { results: [] };
      },
      bind: () => ({
        run: async () => {
          await new Promise((resolve) => setTimeout(resolve, 1));
          return {};
        },
      }),
    };
  }
}

const db = new MockD1();

// Current Implementation
const logToDB_Current = async () => {
  try {
    await db
      .prepare(
        `CREATE TABLE IF NOT EXISTS commands (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         ts DATETIME DEFAULT CURRENT_TIMESTAMP,
         command TEXT,
         actions TEXT,
         files TEXT,
         commit_sha TEXT,
         intent_json TEXT,
         deployment_id TEXT,
         deployment_status TEXT,
         deployment_message TEXT
       );`
      )
      .run();
    const columns = await db.prepare("PRAGMA table_info(commands);").all();
    const columnNames = new Set((columns.results || []).map((col) => col.name));
    if (!columnNames.has("intent_json")) {
      await db
        .prepare("ALTER TABLE commands ADD COLUMN intent_json TEXT;")
        .run();
    }
    if (!columnNames.has("deployment_id")) {
      await db
        .prepare("ALTER TABLE commands ADD COLUMN deployment_id TEXT;")
        .run();
    }
    if (!columnNames.has("deployment_status")) {
      await db
        .prepare("ALTER TABLE commands ADD COLUMN deployment_status TEXT;")
        .run();
    }
    if (!columnNames.has("deployment_message")) {
      await db
        .prepare("ALTER TABLE commands ADD COLUMN deployment_message TEXT;")
        .run();
    }
    await db
      .prepare(
        "INSERT INTO commands (command, actions, files, commit_sha, intent_json, deployment_id, deployment_status, deployment_message) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      )
      .bind(
        "test command",
        "[]",
        "[]",
        "sha123",
        "{}",
        "dep123",
        "success",
        "deployed"
      )
      .run();
  } catch (_) {
    // ignore logging errors
  }
};

// Optimized Implementation (Schema assumed to exist)
const logToDB_Optimized = async () => {
  try {
    // Only the INSERT statement
    await db
      .prepare(
        "INSERT INTO commands (command, actions, files, commit_sha, intent_json, deployment_id, deployment_status, deployment_message) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      )
      .bind(
        "test command",
        "[]",
        "[]",
        "sha123",
        "{}",
        "dep123",
        "success",
        "deployed"
      )
      .run();
  } catch (_) {
    // ignore logging errors
  }
};

async function runBenchmark() {
  const iterations = 100;

  console.log(`Running benchmark with ${iterations} iterations...`);

  const startCurrent = performance.now();
  for (let i = 0; i < iterations; i++) {
    await logToDB_Current();
  }
  const endCurrent = performance.now();
  const durationCurrent = endCurrent - startCurrent;

  const startOptimized = performance.now();
  for (let i = 0; i < iterations; i++) {
    await logToDB_Optimized();
  }
  const endOptimized = performance.now();
  const durationOptimized = endOptimized - startOptimized;

  console.log(`Current Implementation: ${durationCurrent.toFixed(2)} ms`);
  console.log(`Optimized Implementation: ${durationOptimized.toFixed(2)} ms`);
  console.log(
    `Improvement: ${(durationCurrent / durationOptimized).toFixed(2)}x faster`
  );
}

runBenchmark();
