const normalize = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

export function selectStrategy(rawInput, entities, monetizationMap, moneyStrategies) {
  const t = normalize(rawInput);

  // Phrase-first mapping for determinism.
  const keys = Object.keys(monetizationMap || {}).sort((a, b) => b.length - a.length || a.localeCompare(b));
  for (const key of keys) {
    if (t.includes(normalize(key))) {
      const strategy = String(monetizationMap[key] || "").trim();
      if (strategy) return { strategy, stack: moneyStrategies?.[strategy]?.stack || [] };
    }
  }

  const features = new Set(entities?.features || []);
  if (features.has("affiliate")) return { strategy: "affiliate", stack: moneyStrategies?.affiliate?.stack || [] };
  if (features.has("ads")) return { strategy: "ads", stack: moneyStrategies?.ads?.stack || [] };
  if (features.has("email")) return { strategy: "leadgen", stack: moneyStrategies?.leadgen?.stack || [] };
  if (features.has("payments"))
    return { strategy: "digitalProducts", stack: moneyStrategies?.digitalProducts?.stack || [] };

  return { strategy: "hybrid", stack: moneyStrategies?.hybrid?.stack || [] };
}
