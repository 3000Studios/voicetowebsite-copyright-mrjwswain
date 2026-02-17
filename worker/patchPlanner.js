const uniq = (arr) => [...new Set((arr || []).filter(Boolean))];

export function buildDependencies(intents, moneyStrategies, strategy) {
  const deps = new Set();

  // Strategy dependencies first (deterministic).
  const stratDeps = moneyStrategies?.[strategy]?.dependencies || [];
  stratDeps.forEach((d) => deps.add(d));

  for (const i of intents || []) {
    switch (String(i.intent || "")) {
      case "enable_affiliate_engine":
        [
          "add disclosure page",
          "generate affiliate landing pages",
          "add CTA blocks",
          "install tracking",
        ].forEach((d) => deps.add(d));
        break;
      case "enable_ads":
        ["verify adsense publisher + slots", "add ad placements"].forEach((d) =>
          deps.add(d)
        );
        break;
      case "enable_email_capture":
        ["add email capture form", "set up newsletter drip campaign"].forEach(
          (d) => deps.add(d)
        );
        break;
      default:
        break;
    }
  }

  return uniq([...deps]);
}

export function buildPreviewPlan({ riskLevel, confidence }) {
  return {
    requiresPreview: true,
    requiresDiff: true,
    requiresQA: String(riskLevel) !== "low" || Number(confidence || 0) < 0.9,
    testSuite: ["format", "typecheck", "vitest"],
  };
}
