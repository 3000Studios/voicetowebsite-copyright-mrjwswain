export interface Env {
  PAYPAL_CLIENT_ID: string;
  PAYPAL_CLIENT_SECRET: string;
  PAYPAL_ENV: string;
  APP_URL: string;
  PAYPAL_PLAN_STARTER?: string;
  PAYPAL_PLAN_PRO?: string;
  PAYPAL_PLAN_ENTERPRISE?: string;
}

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
    let body: { plan?: string } = {};
    if (url.searchParams.get("plan")) {
      body.plan = url.searchParams.get("plan") || "";
    } else {
      body = (await context.request.json()) as { plan?: string };
    }
    const plan = body.plan?.toLowerCase();
    if (!plan) return jsonResponse({ error: "Missing plan" }, { status: 400 });

    const appUrl = (context.env.APP_URL || "").trim().replace(/\/+$/, "");
    if (!appUrl) return jsonResponse({ error: "APP_URL not configured" }, { status: 500 });

    const token = await getPayPalAccessToken(context.env);

    if (plan === "starter" || plan === "pro" || plan === "enterprise") {
      const planId =
        plan === "starter"
          ? context.env.PAYPAL_PLAN_STARTER
          : plan === "pro"
            ? context.env.PAYPAL_PLAN_PRO
            : context.env.PAYPAL_PLAN_ENTERPRISE;

      if (!planId) {
        return jsonResponse(
          { error: "PayPal subscription plans not configured yet" },
          { status: 500 }
        );
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
            brand_name: "Voice2Website",
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
            description: "Voice2Website Extra Commands Pack — Adds 5 more commands (one-time, repeatable).",
          },
        ],
        application_context: {
          brand_name: "Voice2Website",
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
      return jsonResponse({ error: "PayPal order creation failed" }, { status: 500 });
    }
    return jsonResponse({ url: approveUrl });
  } catch {
    return jsonResponse({ error: "PayPal request failed" }, { status: 500 });
  }
};
