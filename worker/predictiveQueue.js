const uniq = (arr) => [...new Set((arr || []).filter(Boolean))];

export function buildPredictiveQueue({ intentBundle, strategy }) {
  const intents = new Set((intentBundle || []).map((i) => i.intent));
  const q = [];

  if (intents.has("enable_affiliate_engine")) {
    q.push(
      "generate_comparison_pages",
      "add affiliate disclosure page",
      "enable link tracking",
      "add sticky CTA bar",
      "generate 10 SEO review posts"
    );
  }

  if (intents.has("enable_ads")) {
    q.push(
      "add above-the-fold ad placement",
      "add in-article ad slots",
      "verify ads.txt + policy pages"
    );
  }

  if (intents.has("enable_email_capture")) {
    q.push(
      "add lead magnet",
      "add newsletter popup",
      "enable newsletter drip campaign"
    );
  }

  if (String(strategy) === "hybrid") {
    q.push(
      "enable analytics",
      "add conversion dashboard",
      "run A/B test on hero CTA"
    );
  }

  return uniq(q).slice(0, 12);
}
