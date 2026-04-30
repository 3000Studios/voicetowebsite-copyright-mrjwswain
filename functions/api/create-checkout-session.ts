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
    if (!raw.trim()) throw new Error('Empty request body');
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
    if (!priceId) return jsonResponse({ error: 'Invalid plan' }, { status: 400 });

    const appUrl = (context.env.APP_URL || '').trim().replace(/\/+$/, '');
    if (!appUrl) return jsonResponse({ error: 'APP_URL not configured' }, { status: 500 });

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

    const data = (await response.json()) as { url?: string; error?: { message?: string } };
    if (!response.ok || !data.url) {
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
