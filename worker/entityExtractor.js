const normalize = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const hasAny = (t, words) => {
  for (const w of words || []) {
    if (!w) continue;
    if (t.includes(String(w).toLowerCase())) return true;
  }
  return false;
};

const extractPages = (t) => {
  const pages = new Set();
  if (
    t.includes("home") ||
    t.includes("homepage") ||
    t.includes("landing page")
  )
    pages.add("homepage");
  if (t.includes("pricing")) pages.add("pricing");
  if (t.includes("blog") || t.includes("posts")) pages.add("blog");
  if (t.includes("admin")) pages.add("admin");
  return [...pages];
};

const extractFeatures = (t) => {
  const features = new Set();
  if (hasAny(t, ["adsense", "ads"])) features.add("ads");
  if (hasAny(t, ["affiliate", "affiliates"])) features.add("affiliate");
  if (hasAny(t, ["stripe", "paypal", "checkout", "payment"]))
    features.add("payments");
  if (hasAny(t, ["newsletter", "email capture", "drip", "lead magnet"]))
    features.add("email");
  if (hasAny(t, ["video background", "background video"]))
    features.add("background_video");
  if (hasAny(t, ["seo", "search", "rank"])) features.add("seo");
  if (
    hasAny(t, [
      "voice command",
      "voice commands",
      "speech to speech",
      "speech-to-speech",
    ])
  )
    features.add("voice");
  return [...features];
};

const extractDesign = (t) => {
  const design = {
    theme: "",
    tone: "",
  };

  if (
    t.includes("midnight steel") ||
    (t.includes("midnight") && t.includes("steel"))
  ) {
    design.theme = "midnight-steel";
    design.tone = "futuristic";
    return design;
  }
  if (t.includes("midnight")) {
    design.theme = "midnight";
    design.tone = "futuristic";
    return design;
  }
  if (hasAny(t, ["luxury", "premium"])) {
    design.tone = "premium";
    return design;
  }
  if (hasAny(t, ["futuristic", "command center", "cyber", "neon", "glow"])) {
    design.tone = "futuristic";
    return design;
  }
  design.tone = "minimal";
  return design;
};

const extractActions = (t) => {
  const actions = new Set();
  if (hasAny(t, ["add", "create", "build", "enable", "turn on"]))
    actions.add("add");
  if (hasAny(t, ["update", "change", "make", "turn into"]))
    actions.add("update");
  if (hasAny(t, ["remove", "delete", "wipe", "drop"])) actions.add("remove");
  if (hasAny(t, ["optimize", "improve", "fix"])) actions.add("optimize");
  if (hasAny(t, ["ship it", "deploy", "go live", "publish"]))
    actions.add("deploy");
  if (hasAny(t, ["rollback", "revert", "undo"])) actions.add("rollback");
  return [...actions];
};

export function extractEntities(rawInput) {
  const text = normalize(rawInput);
  return {
    text,
    pages: extractPages(text),
    features: extractFeatures(text),
    actions: extractActions(text),
    design: extractDesign(text),
    moneyKeywords: hasAny(text, [
      "make me money",
      "monetize",
      "revenue",
      "conversions",
    ])
      ? ["money"]
      : [],
  };
}
