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
}

const STRIPE_SESSIONS_URL = 'https://api.stripe.com/v1/checkout/sessions';

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

    if (!priceId) {
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
    form.set('line_items[0][price]', priceId);
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
