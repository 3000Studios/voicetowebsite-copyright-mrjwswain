const env = {
  ASSETS: {}, // Mock assets
  D1: {
    prepare: (query) => {
      return {
        run: async () => {
          // Simulate DB latency for schema operations
          // 2ms is a very conservative estimate for a schema check/migration run against a remote D1
          if (query.includes("CREATE TABLE") || query.includes("ALTER TABLE")) {
            await new Promise((r) => setTimeout(r, 2));
          }
          return {};
        },
        all: async () => {
          if (query.includes("PRAGMA")) {
            // Simulate PRAGMA call
            await new Promise((r) => setTimeout(r, 2));
            // Return columns to simulate that some might be missing if we want to test that path,
            // but in the "happy path" where they exist, we still pay the PRAGMA cost.
            // Let's assume all columns exist so we don't pay the ALTER TABLE cost in the benchmark for the "current" state
            // (simulating a warmed up state where only the checks run).
            return {
              results: [
                { name: "id" },
                { name: "ts" },
                { name: "command" },
                { name: "actions" },
                { name: "files" },
                { name: "commit_sha" },
                { name: "intent_json" },
                { name: "deployment_id" },
                { name: "deployment_status" },
                { name: "deployment_message" },
              ],
            };
          }
          // Select query
          await new Promise((r) => setTimeout(r, 5)); // 5ms for select
          return { results: [] };
        },
        first: async () => ({}),
      };
    },
  },
};

const jsonResponse = (status, payload) => ({
  status,
  body: JSON.stringify(payload),
});

async function currentHandler(request, env) {
  if (!env.D1) {
    return jsonResponse(503, { error: "D1 database not available." });
  }
  try {
    await env.D1.prepare(
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
    ).run();

    const columns = await env.D1.prepare("PRAGMA table_info(commands);").all();
    const columnNames = new Set((columns.results || []).map((col) => col.name));

    if (!columnNames.has("intent_json")) {
      await env.D1.prepare(
        "ALTER TABLE commands ADD COLUMN intent_json TEXT;"
      ).run();
    }
    if (!columnNames.has("deployment_id")) {
      await env.D1.prepare(
        "ALTER TABLE commands ADD COLUMN deployment_id TEXT;"
      ).run();
    }
    if (!columnNames.has("deployment_status")) {
      await env.D1.prepare(
        "ALTER TABLE commands ADD COLUMN deployment_status TEXT;"
      ).run();
    }
    if (!columnNames.has("deployment_message")) {
      await env.D1.prepare(
        "ALTER TABLE commands ADD COLUMN deployment_message TEXT;"
      ).run();
    }

    const data = await env.D1.prepare(
      "SELECT id, ts, command, actions, files, commit_sha, intent_json, deployment_id, deployment_status, deployment_message FROM commands ORDER BY ts DESC LIMIT 20"
    ).all();
    return jsonResponse(200, { logs: data.results || [] });
  } catch (err) {
    return jsonResponse(500, { error: err.message });
  }
}

async function optimizedHandler(request, env) {
  if (!env.D1) {
    return jsonResponse(503, { error: "D1 database not available." });
  }
  try {
    const data = await env.D1.prepare(
      "SELECT id, ts, command, actions, files, commit_sha, intent_json, deployment_id, deployment_status, deployment_message FROM commands ORDER BY ts DESC LIMIT 20"
    ).all();
    return jsonResponse(200, { logs: data.results || [] });
  } catch (err) {
    return jsonResponse(500, { error: err.message });
  }
}

async function runBenchmark() {
  console.log("Starting benchmark...");
  const iterations = 1000;

  const start1 = performance.now();
  for (let i = 0; i < iterations; i++) {
    await currentHandler({}, env);
  }
  const end1 = performance.now();
  const time1 = end1 - start1;
  console.log(
    `Current Handler: ${time1.toFixed(2)}ms total, ${(time1 / iterations).toFixed(2)}ms per request`
  );

  const start2 = performance.now();
  for (let i = 0; i < iterations; i++) {
    await optimizedHandler({}, env);
  }
  const end2 = performance.now();
  const time2 = end2 - start2;
  console.log(
    `Optimized Handler: ${time2.toFixed(2)}ms total, ${(time2 / iterations).toFixed(2)}ms per request`
  );

  const improvement = ((time1 - time2) / time1) * 100;
  console.log(`Improvement: ${improvement.toFixed(2)}%`);
}

runBenchmark();
