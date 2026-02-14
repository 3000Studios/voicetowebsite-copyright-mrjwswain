import intentMap from "../config/intent-map.json";
import monetizationMap from "../config/monetization-map.json";
import providerDefaults from "../config/provider-defaults.json";
import riskPolicies from "../config/risk-policies.json";
import moneyStrategies from "../config/money-strategies.json";
import synonyms from "../config/synonyms.json";

import { extractEntities } from "./entityExtractor.js";
import { classifyIntents } from "./intentClassifier.js";
import { selectStrategy } from "./strategySelector.js";
import { inferRiskLevel } from "./riskPolicies.js";
import { bundleIntents } from "./commandBundler.js";
import { buildDependencies, buildPreviewPlan } from "./patchPlanner.js";
import { estimateRevenue } from "./revenueEstimator.js";
import { buildPredictiveQueue } from "./predictiveQueue.js";
import { interpretConfirmation } from "./confirmationInterpreter.js";

const looksLikeRush = (raw) => /\b(rush|asap|urgent|now)\b/i.test(String(raw || ""));

const primaryGoalFrom = (raw, entities, confirmation) => {
  const t = String(raw || "").toLowerCase();
  if (confirmation === "deploy") return "deploy";
  if (confirmation === "rollback") return "rollback";
  if (t.includes("seo") || t.includes("blog") || t.includes("posts")) return "seo";
  if (t.includes("speed") || t.includes("performance")) return "performance";
  if (entities?.moneyKeywords?.length) return "monetization";
  if (entities?.design?.theme || entities?.design?.tone) return "ui";
  return "content";
};

export class NaturalLanguageInferenceEngine {
  infer(rawInput, { siteId = "voicetowebsite" } = {}) {
    const commandId = crypto.randomUUID();
    const entities = extractEntities(rawInput);
    const confirmation = interpretConfirmation(rawInput, synonyms)?.command || "";

    const classified = classifyIntents(rawInput, entities, intentMap);
    const { strategy, stack } = selectStrategy(rawInput, entities, monetizationMap, moneyStrategies);
    const intentBundle = bundleIntents(classified, entities, providerDefaults);

    const confidence =
      intentBundle.length === 0 ? 0.7 : Math.max(...intentBundle.map((i) => Number(i.confidence || 0.7)));
    const riskLevel = inferRiskLevel(rawInput, intentBundle, riskPolicies);

    const ioo = {
      commandId,
      rawInput: String(rawInput || ""),
      siteId,
      environment: "preview",
      inference: {
        primaryGoal: primaryGoalFrom(rawInput, entities, confirmation),
        confidence: Number(confidence.toFixed(2)),
        riskLevel,
        urgency: looksLikeRush(rawInput) ? "rush" : "normal",
        strategy,
        tone: entities?.design?.tone || "premium",
        targetRevenue: { daily: null, monthly: null, yearly: null },
      },
      intentBundle,
      dependencies: buildDependencies(intentBundle, moneyStrategies, strategy),
      predictedNextCommands: buildPredictiveQueue({ intentBundle, strategy }),
      previewPlan: buildPreviewPlan({ riskLevel, confidence }),
    };

    const revenue = estimateRevenue({ strategy, stack });
    const suggestions = (ioo.predictedNextCommands || []).slice(0, 8);

    return { ioo, entities, revenue, suggestions };
  }
}
