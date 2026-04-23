export interface Env {
  STRIPE_SECRET_KEY: string;
  APP_URL: string;
  STRIPE_PRICE_STARTER: string;
  STRIPE_PRICE_PRO: string;
  STRIPE_PRICE_BOSS: string;
  STRIPE_PRICE_COMMANDS: string;
}

const STRIPE_SESSIONS_URL = "https://api.stripe.com/v1/checkout/sessions";

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init.headers || {}),
    },
  });
}

function getStripePriceForPlan(env: Env, plan: string) {
  switch (plan) {
    case "starter":
      return env.STRIPE_PRICE_STARTER;
    case "pro":
      return env.STRIPE_PRICE_PRO;
    case "boss":
      return env.STRIPE_PRICE_BOSS;
    case "commands":
      return env.STRIPE_PRICE_COMMANDS;
    default:
      return null;
  }
}

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  try {
    const body = (await context.request.json()) as { plan?: string };
    const plan = body.plan?.toLowerCase();
    if (!plan) return jsonResponse({ error: "Missing plan" }, { status: 400 });

    const priceId = getStripePriceForPlan(context.env, plan);
    if (!priceId) return jsonResponse({ error: "Invalid plan" }, { status: 400 });

    const appUrl = (context.env.APP_URL || "").trim().replace(/\/+$/, "");
    if (!appUrl) return jsonResponse({ error: "APP_URL not configured" }, { status: 500 });

    const mode = plan === "commands" ? "payment" : "subscription";
    const form = new URLSearchParams();
    form.set("mode", mode);
    form.set("success_url", `${appUrl}/dashboard?success=1&plan=${encodeURIComponent(plan)}`);
    form.set("cancel_url", `${appUrl}/pricing?canceled=1`);
    form.set("line_items[0][price]", priceId);
    form.set("line_items[0][quantity]", "1");
    form.set("client_reference_id", `voice2website_${plan}_${Date.now()}`);
    form.set("metadata[plan]", plan);

    const res = await fetch(STRIPE_SESSIONS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${context.env.STRIPE_SECRET_KEY}`,
        "content-type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });

    const data = (await res.json()) as { url?: string; error?: { message?: string } };
    if (!res.ok || !data.url) {
      return jsonResponse(
        { error: data?.error?.message || "Stripe session creation failed" },
        { status: 500 }
      );
    }

    return jsonResponse({ url: data.url });
  } catch {
    return jsonResponse({ error: "Invalid request" }, { status: 400 });
  }
};
