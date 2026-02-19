const normalize = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const uniq = (arr) => [...new Set((arr || []).filter(Boolean))];

const baseIntentFromPhrase = (phraseIntent) => {
  // intent-map.json can contain helper labels; normalize those into actual intents we use in the IOO.
  switch (phraseIntent) {
    case "update_theme_midnight_steel":
      return "update_theme";
    case "update_theme_midnight":
      return "update_theme";
    case "enable_adsense":
      return "enable_ads";
    default:
      return phraseIntent;
  }
};

const intentMapCache = new WeakMap();

function getPreparedIntentMap(intentMap) {
  if (!intentMap) return [];
  let prepared = intentMapCache.get(intentMap);
  if (!prepared) {
    // Phrase-based intent extraction (deterministic: stable order by key length desc, then key).
    const keys = Object.keys(intentMap).sort((a, b) => b.length - a.length || a.localeCompare(b));
    prepared = keys
      .filter(Boolean)
      .map((key) => ({
        key,
        normalizedKey: normalize(key),
        intents: Array.isArray(intentMap[key]) ? intentMap[key] : [intentMap[key]],
      }));
    intentMapCache.set(intentMap, prepared);
  }
  return prepared;
}

export function classifyIntents(rawInput, entities, intentMap) {
  const t = normalize(rawInput);
  const intentBundle = [];

  const prepared = getPreparedIntentMap(intentMap);
  for (const { key, normalizedKey, intents } of prepared) {
    if (!t.includes(normalizedKey)) continue;
    intents.forEach((i) => {
      const intent = baseIntentFromPhrase(String(i || ""));
      if (!intent) return;
      intentBundle.push({
        intent,
        confidence: key.length > 8 ? 0.92 : 0.85,
        source: `phrase:${key}`,
      });
    });
  }

  // Entity-based backstops.
  const features = new Set(entities?.features || []);
  if (features.has("affiliate")) {
    intentBundle.push({
      intent: "enable_affiliate_engine",
      confidence: 0.9,
      source: "feature:affiliate",
    });
  }
  if (features.has("ads")) {
    intentBundle.push({
      intent: "enable_ads",
      confidence: 0.86,
      source: "feature:ads",
    });
  }
  if (features.has("email")) {
    intentBundle.push({
      intent: "enable_email_capture",
      confidence: 0.84,
      source: "feature:email",
    });
  }
  if (features.has("background_video")) {
    intentBundle.push({
      intent: "update_background_video",
      confidence: 0.8,
      source: "feature:background_video",
    });
  }

  // Theme intent if detected.
  if (entities?.design?.theme) {
    intentBundle.push({
      intent: "update_theme",
      confidence: 0.95,
      source: "design:theme",
    });
  }

  // Deterministic de-dupe: keep max confidence per intent.
  const byIntent = new Map();
  for (const entry of intentBundle) {
    const prev = byIntent.get(entry.intent);
    if (!prev || Number(entry.confidence) > Number(prev.confidence))
      byIntent.set(entry.intent, entry);
  }

  return uniq([...byIntent.values()]);
}
