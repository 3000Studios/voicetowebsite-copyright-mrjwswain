const normalize = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const maxRisk = (a, b) => {
  const order = { low: 0, medium: 1, high: 2 };
  const aa = order[String(a || "low")] ?? 0;
  const bb = order[String(b || "low")] ?? 0;
  return aa >= bb ? a : b;
};

export function inferRiskLevel(rawInput, intents, riskPolicies) {
  const t = normalize(rawInput);
  let risk = "low";

  const hi = riskPolicies?.highRiskWords || [];
  const mid = riskPolicies?.mediumRiskWords || [];

  if (hi.some((w) => t.includes(normalize(w)))) risk = maxRisk(risk, "high");
  if (mid.some((w) => t.includes(normalize(w)))) risk = maxRisk(risk, "medium");

  const intentRisk = riskPolicies?.intentRisk || {};
  (intents || []).forEach((i) => {
    const r = intentRisk[String(i?.intent || "")];
    if (r) risk = maxRisk(risk, r);
  });

  return risk;
}
