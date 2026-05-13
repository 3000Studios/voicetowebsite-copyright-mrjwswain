import { performance } from "perf_hooks";

// Mock Configuration
const LATENCY_MS = 50;
const UPDATES_COUNT = 10;

// Mock githubRequest
const githubRequest = async (path, options) => {
  await new Promise((resolve) => setTimeout(resolve, LATENCY_MS));
  return { sha: "mock-sha-" + Math.random().toString(36).substring(7) };
};

// Generate mock updates
const updates = {};
for (let i = 0; i < UPDATES_COUNT; i++) {
  updates[`path/to/file_${i}.txt`] = `Content ${i}`;
}
const owner = "owner";
const repo = "repo";

// Sequential Implementation (Baseline)
const createCommitSequential = async () => {
  const treeItems = [];
  for (const [path, content] of Object.entries(updates)) {
    const blob = await githubRequest(`/repos/${owner}/${repo}/git/blobs`, {
      method: "POST",
      body: JSON.stringify({ content, encoding: "utf-8" }),
    });
    treeItems.push({ path, mode: "100644", type: "blob", sha: blob.sha });
  }
  return treeItems;
};

// Parallel Implementation (Optimized)
const createCommitParallel = async () => {
  const blobPromises = Object.entries(updates).map(async ([path, content]) => {
    const blob = await githubRequest(`/repos/${owner}/${repo}/git/blobs`, {
      method: "POST",
      body: JSON.stringify({ content, encoding: "utf-8" }),
    });
    return { path, mode: "100644", type: "blob", sha: blob.sha };
  });
  const treeItems = await Promise.all(blobPromises);
  return treeItems;
};

async function runBenchmark() {
  console.log(
    `Running benchmark with ${UPDATES_COUNT} files and ${LATENCY_MS}ms latency per request...`
  );

  // Warmup (optional, but good practice)
  await createCommitSequential();
  await createCommitParallel();

  const startSeq = performance.now();
  await createCommitSequential();
  const endSeq = performance.now();
  const durationSeq = endSeq - startSeq;

  const startPar = performance.now();
  await createCommitParallel();
  const endPar = performance.now();
  const durationPar = endPar - startPar;

  console.log(`Sequential Implementation: ${durationSeq.toFixed(2)} ms`);
  console.log(`Parallel Implementation: ${durationPar.toFixed(2)} ms`);
  console.log(`Improvement: ${(durationSeq / durationPar).toFixed(2)}x faster`);
}

runBenchmark();
