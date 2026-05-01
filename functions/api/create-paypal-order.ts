export interface Env {
  PAYPAL_CLIENT_ID: string;
  PAYPAL_CLIENT_SECRET: string;
  PAYPAL_ENV: string;
  APP_URL: string;
  PAYPAL_PLAN_STARTER?: string;
  PAYPAL_PLAN_PRO?: string;
  PAYPAL_PLAN_ENTERPRISE?: string;
}

const FALLBACK_CHECKOUT_URLS: Record<string, { month?: string; year?: string }> = {
  starter: {
    month: "https://buy.stripe.com/9B65kD2Kx5mK5le8nUbAs0u",
    year: "https://buy.stripe.com/28E5kD70N02q7tm8nUbAs0v",
  },
  pro: {
    month: "https://buy.stripe.com/dRmfZhbh35mK2927jQbAs0w",
    year: "https://buy.stripe.com/4gM00j3OB6qO9BudIebAs0x",
  },
  enterprise: {
    month: "https://buy.stripe.com/bJe7sLetfcPcdRK1ZwbAs0y",
    year: "https://buy.stripe.com/dRm00jacZ4iG9Bu0VsbAs0z",
  },
  commands: {
    month: "https://buy.stripe.com/fZubJ12Kx02q9Bu6fMbAs0A",
  },
};

const PLAN_AMOUNTS: Record<string, { value: string; description: string }> = {
  starter: { value: "9.99", description: "VoiceToWebsite.com Starter - 50 commands per month" },
  pro: { value: "19.99", description: "VoiceToWebsite.com Pro - 150 commands per month" },
  enterprise: { value: "49.99", description: "VoiceToWebsite.com Ultimate - 500 commands per month" },
  commands: { value: "2.99", description: "VoiceToWebsite.com More Commands - one-time add-on" },
};

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init.headers || {}),
    },
  });
}

function paypalBaseUrl(env: Env) {
  return (env.PAYPAL_ENV || "").toLowerCase() === "sandbox"
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";
}

async function getPayPalAccessToken(env: Env) {
  const credentials = btoa(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`);
  const res = await fetch(`${paypalBaseUrl(env)}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const data = (await res.json()) as { access_token?: string; error_description?: string };
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || "PayPal token failed");
  }
  return data.access_token;
}

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  try {
    const url = new URL(context.request.url);
    let body: { plan?: string; cadence?: string } = {};
    if (url.searchParams.get("plan")) {
      body.plan = url.searchParams.get("plan") || "";
      body.cadence = url.searchParams.get("cadence") || "";
    } else {
      const raw = await context.request.text();
      body = raw.trim() ? (JSON.parse(raw) as { plan?: string; cadence?: string }) : {};
    }
    const plan = body.plan?.toLowerCase();
    if (!plan) return jsonResponse({ error: "Missing plan" }, { status: 400 });
    const cadence = body.cadence?.toLowerCase() === "year" ? "year" : "month";
    const fallbackUrl =
      plan === "commands"
        ? FALLBACK_CHECKOUT_URLS.commands.month
        : FALLBACK_CHECKOUT_URLS[plan]?.[cadence];

    const appUrl = (context.env.APP_URL || "").trim().replace(/\/+$/, "");
    if (!appUrl) {
      if (fallbackUrl) return jsonResponse({ url: fallbackUrl, fallback: true });
      return jsonResponse({ error: "APP_URL not configured" }, { status: 500 });
    }

    let token: string;
    try {
      token = await getPayPalAccessToken(context.env);
    } catch {
      if (fallbackUrl) return jsonResponse({ url: fallbackUrl, fallback: true });
      return jsonResponse({ error: "PayPal token failed" }, { status: 500 });
    }

    if (plan === "starter" || plan === "pro" || plan === "enterprise") {
      const planId =
        plan === "starter"
          ? context.env.PAYPAL_PLAN_STARTER
          : plan === "pro"
            ? context.env.PAYPAL_PLAN_PRO
            : context.env.PAYPAL_PLAN_ENTERPRISE;

      if (!planId) {
        const amount = PLAN_AMOUNTS[plan];
        if (!amount) return jsonResponse({ error: "Invalid plan" }, { status: 400 });
        const orderRes = await fetch(`${paypalBaseUrl(context.env)}/v2/checkout/orders`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            intent: "CAPTURE",
            purchase_units: [
              {
                amount: { currency_code: "USD", value: amount.value },
                description: amount.description,
              },
            ],
            application_context: {
              brand_name: "VoiceToWebsite.com",
              shipping_preference: "NO_SHIPPING",
              user_action: "PAY_NOW",
              return_url: `${appUrl}/setup?provider=paypal&plan=${encodeURIComponent(plan)}`,
              cancel_url: `${appUrl}/pricing?canceled=1&provider=paypal`,
            },
          }),
        });
        const order = (await orderRes.json()) as { links?: Array<{ rel: string; href: string }> };
        const approveUrl = order.links?.find((l) => l.rel === "approve")?.href;
        if (!orderRes.ok || !approveUrl) {
          if (fallbackUrl) return jsonResponse({ url: fallbackUrl, fallback: true });
          return jsonResponse({ error: "PayPal order creation failed" }, { status: 500 });
        }
        return jsonResponse({ url: approveUrl, fallback: false, note: "One-time PayPal checkout used because subscription plan IDs are not configured." });
      }

      const subRes = await fetch(`${paypalBaseUrl(context.env)}/v1/billing/subscriptions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          plan_id: planId,
          application_context: {
            brand_name: "VoiceToWebsite.com",
            locale: "en-US",
            user_action: "SUBSCRIBE_NOW",
            return_url: `${appUrl}/setup?provider=paypal&plan=${encodeURIComponent(plan)}`,
            cancel_url: `${appUrl}/pricing?canceled=1&provider=paypal`,
          },
        }),
      });

      const sub = (await subRes.json()) as { links?: Array<{ rel: string; href: string }> };
      const approveUrl = sub.links?.find((l) => l.rel === "approve")?.href;
      if (!subRes.ok || !approveUrl) {
        if (fallbackUrl) return jsonResponse({ url: fallbackUrl, fallback: true });
        return jsonResponse({ error: "PayPal subscription creation failed" }, { status: 500 });
      }
      return jsonResponse({ url: approveUrl });
    }

    if (plan !== "commands") return jsonResponse({ error: "Invalid plan" }, { status: 400 });

    const orderRes = await fetch(`${paypalBaseUrl(context.env)}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: { currency_code: "USD", value: "2.99" },
            description: PLAN_AMOUNTS.commands.description,
          },
        ],
        application_context: {
          brand_name: "VoiceToWebsite.com",
          shipping_preference: "NO_SHIPPING",
          user_action: "PAY_NOW",
          return_url: `${appUrl}/setup?provider=paypal&plan=commands`,
          cancel_url: `${appUrl}/pricing?canceled=1&provider=paypal`,
        },
      }),
    });

    const order = (await orderRes.json()) as { links?: Array<{ rel: string; href: string }> };
    const approveUrl = order.links?.find((l) => l.rel === "approve")?.href;
    if (!orderRes.ok || !approveUrl) {
      if (fallbackUrl) return jsonResponse({ url: fallbackUrl, fallback: true });
      return jsonResponse({ error: "PayPal order creation failed" }, { status: 500 });
    }
    return jsonResponse({ url: approveUrl });
  } catch {
    return jsonResponse({ error: "PayPal request failed" }, { status: 500 });
  }
};
