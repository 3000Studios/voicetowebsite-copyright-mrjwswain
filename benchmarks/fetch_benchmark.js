async function getFileContent(path, ref) {
  // Simulate network latency between 100ms and 300ms
  const delay = Math.floor(Math.random() * 200) + 100;
  return new Promise((resolve) => setTimeout(() => resolve(`Content of ${path}`), delay));
}

async function runSequential(needsIndex, needsApp, needsStyles) {
  const start = performance.now();
  let indexHtml = null;
  let appJs = null;
  let styles = null;

  if (needsIndex) indexHtml = await getFileContent("index.html", "main");
  if (needsApp) appJs = await getFileContent("app.js", "main");
  if (needsStyles) styles = await getFileContent("styles.css", "main");

  const end = performance.now();
  return end - start;
}

async function runConcurrent(needsIndex, needsApp, needsStyles) {
  const start = performance.now();

  // Mimic the proposed optimization
  const results = await Promise.all([
    needsIndex ? getFileContent("index.html", "main") : Promise.resolve(null),
    needsApp ? getFileContent("app.js", "main") : Promise.resolve(null),
    needsStyles ? getFileContent("styles.css", "main") : Promise.resolve(null),
  ]);

  let indexHtml = results[0];
  let appJs = results[1];
  let styles = results[2];

  const end = performance.now();
  return end - start;
}

async function benchmark() {
  console.log("Running Fetch Benchmark...");

  // Scenario: All files needed
  console.log("\nScenario: All files needed");
  const seqTime = await runSequential(true, true, true);
  console.log(`Sequential: ${seqTime.toFixed(2)}ms`);

  const concTime = await runConcurrent(true, true, true);
  console.log(`Concurrent: ${concTime.toFixed(2)}ms`);

  const improvement = seqTime - concTime;
  const percent = (improvement / seqTime) * 100;
  console.log(`Improvement: ${improvement.toFixed(2)}ms (${percent.toFixed(1)}%)`);

  // Scenario: Index and Styles needed
  console.log("\nScenario: Index and Styles needed");
  const seqTime2 = await runSequential(true, false, true);
  console.log(`Sequential: ${seqTime2.toFixed(2)}ms`);

  const concTime2 = await runConcurrent(true, false, true);
  console.log(`Concurrent: ${concTime2.toFixed(2)}ms`);

  const improvement2 = seqTime2 - concTime2;
  const percent2 = (improvement2 / seqTime2) * 100;
  console.log(`Improvement: ${improvement2.toFixed(2)}ms (${percent2.toFixed(1)}%)`);
}

benchmark();
