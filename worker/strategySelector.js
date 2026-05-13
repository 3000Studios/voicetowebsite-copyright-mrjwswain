const normalize = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const keysCache = new WeakMap();

export function selectStrategy(
  rawInput,
  entities,
  monetizationMap,
  moneyStrategies
) {
  const t = normalize(rawInput);

  // Phrase-first mapping for determinism.
  const useCache = monetizationMap && typeof monetizationMap === "object";
  let keys = useCache ? keysCache.get(monetizationMap) : null;

  if (!keys) {
    keys = Object.keys(monetizationMap || {}).sort(
      (a, b) => b.length - a.length || a.localeCompare(b)
    );
    if (useCache) keysCache.set(monetizationMap, keys);
  }

  for (const key of keys) {
    if (t.includes(normalize(key))) {
      const strategy = String(monetizationMap[key] || "").trim();
      if (strategy)
        return { strategy, stack: moneyStrategies?.[strategy]?.stack || [] };
    }
  }

  const features = new Set(entities?.features || []);
  if (features.has("affiliate"))
    return {
      strategy: "affiliate",
      stack: moneyStrategies?.affiliate?.stack || [],
    };
  if (features.has("ads"))
    return { strategy: "ads", stack: moneyStrategies?.ads?.stack || [] };
  if (features.has("email"))
    return {
      strategy: "leadgen",
      stack: moneyStrategies?.leadgen?.stack || [],
    };
  if (features.has("payments"))
    return {
      strategy: "digitalProducts",
      stack: moneyStrategies?.digitalProducts?.stack || [],
    };

  return { strategy: "hybrid", stack: moneyStrategies?.hybrid?.stack || [] };
}
