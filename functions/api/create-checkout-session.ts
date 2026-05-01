export interface Env {
  STRIPE_SECRET_KEY: string;
  APP_URL: string;
  STRIPE_PRICE_STARTER_MONTH: string;
  STRIPE_PRICE_STARTER_YEAR: string;
  STRIPE_PRICE_PRO_MONTH: string;
  STRIPE_PRICE_PRO_YEAR: string;
  STRIPE_PRICE_ENTERPRISE_MONTH: string;
  STRIPE_PRICE_ENTERPRISE_YEAR: string;
  STRIPE_PRICE_COMMANDS: string;
  PAYPAL_CLIENT_ID?: string;
  PAYPAL_CLIENT_SECRET?: string;
  PAYPAL_ENV?: string;
}

const STRIPE_SESSIONS_URL = 'https://api.stripe.com/v1/checkout/sessions';

const PRICE_DATA: Record<string, { name: string; amount: number; recurring: boolean }> = {
  starter: { name: "VoiceToWebsite.com Starter", amount: 999, recurring: true },
  pro: { name: "VoiceToWebsite.com Pro", amount: 1999, recurring: true },
  enterprise: { name: "VoiceToWebsite.com Ultimate", amount: 4999, recurring: true },
  commands: { name: "VoiceToWebsite.com More Commands", amount: 299, recurring: false },
};

function paypalBaseUrl(env: Env) {
  return (env.PAYPAL_ENV || "").toLowerCase() === "sandbox"
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";
}

async function createPayPalFallback(env: Env, plan: string, appUrl: string) {
  const price = PRICE_DATA[plan];
  if (!price || !env.PAYPAL_CLIENT_ID || !env.PAYPAL_CLIENT_SECRET || !appUrl) return null;
  const credentials = btoa(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`);
  const tokenRes = await fetch(`${paypalBaseUrl(env)}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const token = (await tokenRes.json()) as { access_token?: string };
  if (!tokenRes.ok || !token.access_token) return null;
  const orderRes = await fetch(`${paypalBaseUrl(env)}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: { currency_code: "USD", value: (price.amount / 100).toFixed(2) },
          description: price.name,
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
  return orderRes.ok ? order.links?.find((link) => link.rel === "approve")?.href || null : null;
}

const FALLBACK_STRIPE_LINKS: Record<string, { month?: string; year?: string }> = {
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

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...(init.headers || {}),
    },
  });
}

async function parseRequestBody(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get('plan')) {
    return {
      plan: String(url.searchParams.get('plan') || ''),
      cadence: String(url.searchParams.get('cadence') || ''),
      launch_discount: String(url.searchParams.get('launch_discount') || '').toLowerCase() === 'true',
    };
  }

  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    const raw = await request.text();
    if (!raw.trim()) {
      return {};
    }
    return JSON.parse(raw) as { plan?: string; cadence?: string; launch_discount?: boolean };
  }

  if (contentType.includes('application/x-www-form-urlencoded')) {
    const raw = await request.text();
    const params = new URLSearchParams(raw);
    return {
      plan: String(params.get('plan') || ''),
      cadence: String(params.get('cadence') || ''),
      launch_discount: String(params.get('launch_discount') || '').toLowerCase() === 'true',
    };
  }

  throw new Error('Unsupported content type');
}

function getStripePriceForPlan(env: Env, plan: string, cadence: 'month' | 'year') {
  switch (plan) {
    case 'starter':
      return cadence === 'year' ? env.STRIPE_PRICE_STARTER_YEAR : env.STRIPE_PRICE_STARTER_MONTH;
    case 'pro':
      return cadence === 'year' ? env.STRIPE_PRICE_PRO_YEAR : env.STRIPE_PRICE_PRO_MONTH;
    case 'enterprise':
      return cadence === 'year' ? env.STRIPE_PRICE_ENTERPRISE_YEAR : env.STRIPE_PRICE_ENTERPRISE_MONTH;
    case 'commands':
      return env.STRIPE_PRICE_COMMANDS;
    default:
      return null;
  }
}

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  try {
    const body = await parseRequestBody(context.request);
    const plan = body.plan?.toLowerCase().trim();
    if (!plan) return jsonResponse({ error: 'Missing plan' }, { status: 400 });
    const cadence = body.cadence?.toLowerCase() === 'year' ? 'year' : 'month';

    const priceId = getStripePriceForPlan(context.env, plan, cadence);
    const fallbackUrl =
      plan === "commands"
        ? FALLBACK_STRIPE_LINKS.commands.month
        : FALLBACK_STRIPE_LINKS[plan]?.[cadence];

    if (!priceId && !PRICE_DATA[plan]) {
      if (fallbackUrl) return jsonResponse({ url: fallbackUrl, fallback: true });
      return jsonResponse({ error: 'Invalid plan' }, { status: 400 });
    }

    const appUrl = (context.env.APP_URL || '').trim().replace(/\/+$/, '');
    if (!appUrl) {
      if (fallbackUrl) return jsonResponse({ url: fallbackUrl, fallback: true });
      return jsonResponse({ error: 'APP_URL not configured' }, { status: 500 });
    }

    if (!context.env.STRIPE_SECRET_KEY) {
      if (fallbackUrl) return jsonResponse({ url: fallbackUrl, fallback: true });
      return jsonResponse({ error: 'STRIPE_SECRET_KEY not configured' }, { status: 500 });
    }

    const mode = plan === 'commands' ? 'payment' : 'subscription';
    const form = new URLSearchParams();
    form.set('mode', mode);
    form.set('success_url', `${appUrl}/success?provider=stripe&plan=${encodeURIComponent(plan)}&session_id={CHECKOUT_SESSION_ID}`);
    form.set('cancel_url', `${appUrl}/pricing?canceled=1`);
    if (priceId) {
      form.set('line_items[0][price]', priceId);
    } else {
      const priceData = PRICE_DATA[plan];
      if (!priceData) return jsonResponse({ error: 'Invalid plan' }, { status: 400 });
      form.set('line_items[0][price_data][currency]', 'usd');
      form.set('line_items[0][price_data][product_data][name]', priceData.name);
      form.set('line_items[0][price_data][unit_amount]', String(priceData.amount));
      if (priceData.recurring) {
        form.set('line_items[0][price_data][recurring][interval]', cadence === 'year' ? 'year' : 'month');
      }
    }
    form.set('line_items[0][quantity]', '1');
    form.set('client_reference_id', `voice2website_${plan}_${Date.now()}`);
    form.set('metadata[plan]', plan);
    form.set('metadata[cadence]', cadence);
    if (body.launch_discount) form.set('metadata[launch_discount]', 'true');

    const response = await fetch(STRIPE_SESSIONS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${context.env.STRIPE_SECRET_KEY}`,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
    });

    const raw = await response.text();
    let data: { url?: string; error?: { message?: string } } = {};
    if (raw.trim()) {
      try {
        data = JSON.parse(raw) as { url?: string; error?: { message?: string } };
      } catch {
        data = {};
      }
    }
    if (!response.ok || !data.url) {
      const paypalFallback = await createPayPalFallback(context.env, plan, appUrl);
      if (paypalFallback) return jsonResponse({ url: paypalFallback, fallback: "paypal" });
      if (fallbackUrl) return jsonResponse({ url: fallbackUrl, fallback: true });
      return jsonResponse({ error: data?.error?.message || 'Stripe session creation failed' }, { status: 500 });
    }

    return jsonResponse({ url: data.url });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Invalid request' },
      { status: 400 }
    );
  }
};
