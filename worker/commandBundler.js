const clamp01 = (n) => Math.max(0, Math.min(1, Number(n || 0)));

const intentTargets = (intent) => {
  switch (intent) {
    case "update_theme":
      return ["global.theme"];
    case "enable_affiliate_engine":
      return ["config/affiliates.json"];
    case "enable_ads":
      return ["config/ads.json"];
    case "enable_email_capture":
      return ["site.components"];
    case "update_background_video":
      return ["global.background.video"];
    default:
      return [];
  }
};

const intentPayload = (intent, entities, providerDefaults) => {
  switch (intent) {
    case "update_theme":
      return { theme: entities?.design?.theme || "" };
    case "enable_affiliate_engine":
      return { networks: providerDefaults?.affiliates?.defaultNetworks || ["amazon", "impact", "cj"] };
    case "enable_ads":
      return { provider: providerDefaults?.ads?.default || "adsense", mode: "auto" };
    case "enable_email_capture":
      return { placement: "sticky", provider: providerDefaults?.email?.default || "default" };
    case "update_background_video":
      return { src: "" };
    default:
      return {};
  }
};

export function bundleIntents(classified, entities, providerDefaults) {
  const bundle = (classified || []).map((i) => ({
    intent: String(i.intent || ""),
    targets: intentTargets(String(i.intent || "")),
    payload: intentPayload(String(i.intent || ""), entities, providerDefaults),
    confidence: clamp01(i.confidence ?? 0.8),
  }));

  // Deterministic stable order: by intent name.
  bundle.sort((a, b) => a.intent.localeCompare(b.intent));
  return bundle;
}
