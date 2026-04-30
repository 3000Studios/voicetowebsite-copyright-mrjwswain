export interface Env {
  DB: D1Database;
  ORDERS_KV: KVNamespace;
}

function json(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...(init.headers || {}),
    },
  });
}

function nowIso() {
  return new Date().toISOString();
}

function newId() {
  return `ord_${crypto.randomUUID()}`;
}

const VALID_PLANS = new Set(['starter', 'pro', 'enterprise', 'commands']);
const VALID_STYLES = new Set(['dark-premium', 'clean-minimal', 'bold-energetic', 'warm-trustworthy']);

type CreateOrderBody = {
  email?: string;
  plan?: string;
  cadence?: 'month' | 'year';
  launch_discount?: boolean;
  business_description?: string;
  industry?: string;
  style_preference?: string;
  stripe_session_id?: string;
};

async function parseRequestBody(request: Request): Promise<CreateOrderBody> {
  const url = new URL(request.url);
  if (url.searchParams.get('stripe_session_id')) {
    return {
      email: url.searchParams.get('email') || '',
      plan: url.searchParams.get('plan') || '',
      cadence: (url.searchParams.get('cadence') || 'month') as 'month' | 'year',
      launch_discount: String(url.searchParams.get('launch_discount') || '').toLowerCase() === 'true',
      business_description: url.searchParams.get('business_description') || '',
      industry: url.searchParams.get('industry') || '',
      style_preference: url.searchParams.get('style_preference') || '',
      stripe_session_id: url.searchParams.get('stripe_session_id') || '',
    };
  }

  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    const raw = await request.text();
    if (!raw.trim()) throw new Error('Empty request body');
    return JSON.parse(raw) as CreateOrderBody;
  }

  if (contentType.includes('application/x-www-form-urlencoded')) {
    const raw = await request.text();
    const form = new URLSearchParams(raw);
    return {
      email: form.get('email') || '',
      plan: form.get('plan') || '',
      cadence: (form.get('cadence') || 'month') as 'month' | 'year',
      launch_discount: String(form.get('launch_discount') || '').toLowerCase() === 'true',
      business_description: form.get('business_description') || '',
      industry: form.get('industry') || '',
      style_preference: form.get('style_preference') || '',
      stripe_session_id: form.get('stripe_session_id') || '',
    };
  }

  throw new Error('Unsupported content type');
}

async function writeAuditLog(db: D1Database, action: string, targetId: string, detail: string) {
  await db
    .prepare('INSERT INTO audit_log (created_at, actor, action, target_id, detail) VALUES (?, ?, ?, ?, ?)')
    .bind(nowIso(), 'system', action, targetId, detail.slice(0, 4000))
    .run();
}

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  if (!context.env.DB || !context.env.ORDERS_KV) return json({ error: 'Bindings not configured' }, { status: 500 });

  let body: CreateOrderBody;
  try {
    body = await parseRequestBody(context.request);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Invalid request body' }, { status: 400 });
  }

  const email = (body.email || '').trim().toLowerCase();
  const plan = (body.plan || '').trim().toLowerCase();
  const cadence = body.cadence === 'year' ? 'year' : 'month';
  const launchDiscount = body.launch_discount ? 1 : 0;
  const stripeSessionId = (body.stripe_session_id || '').trim();
  const industry = (body.industry || '').trim().toLowerCase();
  const stylePreference = (body.style_preference || '').trim().toLowerCase();
  const businessDescription = (body.business_description || '').trim();

  if (!email || !email.includes('@')) return json({ error: 'Invalid email' }, { status: 400 });
  if (!VALID_PLANS.has(plan)) return json({ error: 'Invalid plan' }, { status: 400 });
  if (!stripeSessionId) return json({ error: 'Missing stripe_session_id' }, { status: 400 });
  if (!industry) return json({ error: 'Missing industry' }, { status: 400 });
  if (!stylePreference || !VALID_STYLES.has(stylePreference)) return json({ error: 'Invalid style_preference' }, { status: 400 });
  if (!businessDescription || businessDescription.length < 20) {
    return json({ error: 'Business description must be at least 20 characters.' }, { status: 400 });
  }

  const existingOrder = await context.env.DB.prepare(
    `SELECT id, status, site_url FROM orders WHERE stripe_session_id = ? ORDER BY created_at DESC LIMIT 1`
  )
    .bind(stripeSessionId)
    .first<{ id: string; status: string; site_url: string | null }>();

  if (existingOrder) {
    await context.env.ORDERS_KV.put(
      `order:${existingOrder.id}`,
      JSON.stringify({ id: existingOrder.id, status: existingOrder.status, site_url: existingOrder.site_url }),
      { expirationTtl: 60 * 60 * 24 * 30 }
    );
    return json({ id: existingOrder.id, status: existingOrder.status, siteUrl: existingOrder.site_url || undefined });
  }

  const id = newId();
  const createdAt = nowIso();

  await context.env.DB.prepare(
    `INSERT INTO orders
      (id, created_at, email, plan, cadence, launch_discount, status, business_description, industry, style_preference, stripe_session_id)
     VALUES
      (?, ?, ?, ?, ?, ?, 'created', ?, ?, ?, ?)`
  )
    .bind(id, createdAt, email, plan, cadence, launchDiscount, businessDescription.slice(0, 5000), industry.slice(0, 120), stylePreference.slice(0, 120), stripeSessionId.slice(0, 255))
    .run();

  await context.env.ORDERS_KV.put(`order:${id}`, JSON.stringify({ id, created_at: createdAt, status: 'created' }), {
    expirationTtl: 60 * 60 * 24 * 30,
  });

  await writeAuditLog(context.env.DB, 'order_created', id, JSON.stringify({ plan, cadence, email, industry }));

  return json({ id, status: 'created' });
};

export const onRequestGet = async () => json({ error: 'Method not allowed' }, { status: 405 });
