const { performance } = require("perf_hooks");

const allowedFields = ["eyebrow", "headline", "subhead", "cta", "price", "metric1", "metric2", "metric3"];

const toSafeJsString = (v) => v.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

// Current Implementation
const updateAppState_Current = (content, field, value) => {
  if (!allowedFields.includes(field)) return content;
  const safeValue = toSafeJsString(value);
  const pattern = new RegExp(`${field}:\\s*'[^']*'`);
  return content.replace(pattern, `${field}: '${safeValue}'`);
};

// Optimized Implementation (Cached)
const regexCache = new Map();
const updateAppState_Optimized = (content, field, value) => {
  if (!allowedFields.includes(field)) return content;
  const safeValue = toSafeJsString(value);

  let pattern = regexCache.get(field);
  if (!pattern) {
    pattern = new RegExp(`${field}:\\s*'[^']*'`);
    regexCache.set(field, pattern);
  }

  return content.replace(pattern, `${field}: '${safeValue}'`);
};

async function runBenchmark() {
  const iterations = 100000;
  const content = "headline: 'Old Headline', subhead: 'Old Subhead', cta: 'Old CTA'";
  const value = "New Value";

  console.log(`Running regex benchmark with ${iterations} iterations...`);

  // Warmup
  for (let i = 0; i < 100; i++) {
    const field = allowedFields[i % allowedFields.length];
    updateAppState_Current(content, field, value);
    updateAppState_Optimized(content, field, value);
  }

  const startCurrent = performance.now();
  for (let i = 0; i < iterations; i++) {
    const field = allowedFields[i % allowedFields.length];
    updateAppState_Current(content, field, value);
  }
  const endCurrent = performance.now();
  const durationCurrent = endCurrent - startCurrent;

  const startOptimized = performance.now();
  for (let i = 0; i < iterations; i++) {
    const field = allowedFields[i % allowedFields.length];
    updateAppState_Optimized(content, field, value);
  }
  const endOptimized = performance.now();
  const durationOptimized = endOptimized - startOptimized;

  console.log(`Current Implementation: ${durationCurrent.toFixed(2)} ms`);
  console.log(`Optimized Implementation: ${durationOptimized.toFixed(2)} ms`);
  console.log(`Improvement: ${(durationCurrent / durationOptimized).toFixed(2)}x faster`);
}

runBenchmark();
