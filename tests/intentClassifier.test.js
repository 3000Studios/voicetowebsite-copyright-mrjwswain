import { describe, it, expect } from "vitest";
import { classifyIntents } from "../worker/intentClassifier.js";

describe("classifyIntents", () => {
  const intentMap = {
    "make me money": ["make_money"],
    "ads": ["enable_adsense", "create_ad_placements"],
    "midnight steel": ["update_theme_midnight_steel"],
  };

  it("should classify intents correctly based on phrase matching", () => {
    const rawInput = "I want to make me money and add ads";
    const entities = { features: [] };
    const results = classifyIntents(rawInput, entities, intentMap);

    const intents = results.map(r => r.intent);
    expect(intents).toContain("make_money");
    expect(intents).toContain("enable_ads"); // "enable_adsense" is normalized to "enable_ads"
    expect(intents).toContain("create_ad_placements");
  });

  it("should handle base intent normalization", () => {
    const rawInput = "midnight steel theme";
    const entities = { features: [] };
    const results = classifyIntents(rawInput, entities, intentMap);

    const intents = results.map(r => r.intent);
    expect(intents).toContain("update_theme");
  });

  it("should use entities for backstops", () => {
    const rawInput = "optimize something";
    const entities = { features: ["affiliate"] };
    const results = classifyIntents(rawInput, entities, {});

    const intents = results.map(r => r.intent);
    expect(intents).toContain("enable_affiliate_engine");
  });

  it("should keep max confidence per intent", () => {
     // "ads" matches "ads" key (confidence 0.85 as it is length 3)
     // feature "ads" also gives "enable_ads" with confidence 0.86
     const rawInput = "ads";
     const entities = { features: ["ads"] };
     const results = classifyIntents(rawInput, entities, intentMap);

     const adIntent = results.find(r => r.intent === "enable_ads");
     expect(adIntent.confidence).toBe(0.86);
  });
});
