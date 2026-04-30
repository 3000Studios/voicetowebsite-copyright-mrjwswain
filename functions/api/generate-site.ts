export interface Env {
  DB: D1Database;
  SITES_BUCKET: R2Bucket;
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

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function parseRequestBody(request: Request): Promise<{ orderId?: string }> {
  const url = new URL(request.url);
  if (url.searchParams.get('orderId')) {
    return { orderId: url.searchParams.get('orderId') || '' };
  }

  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    const raw = await request.text();
    if (!raw.trim()) throw new Error('Empty request body');
    return JSON.parse(raw) as { orderId?: string };
  }

  if (contentType.includes('application/x-www-form-urlencoded')) {
    const raw = await request.text();
    const form = new URLSearchParams(raw);
    return { orderId: form.get('orderId') || '' };
  }

  throw new Error('Unsupported content type');
}

function templateForIndustry(industry: string) {
  const value = (industry || '').toLowerCase();
  if (value.includes('fitness') || value.includes('coach')) return 'fitness';
  if (value.includes('law') || value.includes('attorney')) return 'law';
  if (value.includes('restaurant') || value.includes('food')) return 'restaurant';
  if (value.includes('ecommerce') || value.includes('shop') || value.includes('store')) return 'ecommerce';
  if (value.includes('saas') || value.includes('software')) return 'saas';
  return 'general';
}

function stylePalette(style: string) {
  switch ((style || '').toLowerCase()) {
    case 'clean-minimal':
      return { accent: '#2563eb', surface: '#eff6ff', text: '#0f172a' };
    case 'bold-energetic':
      return { accent: '#db2777', surface: '#fff1f2', text: '#111827' };
    case 'warm-trustworthy':
      return { accent: '#c2410c', surface: '#fff7ed', text: '#1f2937' };
    default:
      return { accent: '#7c3aed', surface: '#eef2ff', text: '#0f172a' };
  }
}

function renderSiteHtml(opts: { business: string; industry: string; style: string; email: string; orderId: string }) {
  const industryKey = templateForIndustry(opts.industry);
  const title = `${opts.industry || 'Business Website'} | VoiceToWebsite`;
  const description = escapeHtml(opts.business || 'A modern business website generated with VoiceToWebsite.');
  const palette = stylePalette(opts.style);
  const style = escapeHtml(opts.style || 'dark-premium');
  const email = escapeHtml(opts.email);
  const orderId = escapeHtml(opts.orderId);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${description.slice(0, 155)}" />
  <style>
    :root{--accent:${palette.accent};--surface:${palette.surface};--text:${palette.text};--bg:#ffffff;--muted:#475569}
    *{box-sizing:border-box}body{margin:0;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:linear-gradient(180deg,#ffffff 0%,#f8fafc 100%);color:var(--text)}
    header{padding:32px 20px 88px;background:radial-gradient(circle at top,#e0e7ff 0%,#c7d2fe 30%,#0f172a 100%);color:#fff}
    .wrap{max-width:1100px;margin:0 auto;padding:0 20px}.eyebrow{display:inline-flex;padding:8px 14px;border-radius:999px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.18);font-size:12px;letter-spacing:.18em;text-transform:uppercase;font-weight:700}
    h1{font-size:clamp(2.8rem,8vw,5.4rem);line-height:.95;margin:20px 0 16px;letter-spacing:-.04em}p{font-size:1.05rem;line-height:1.7;color:rgba(255,255,255,.82);max-width:760px}
    .hero-actions{display:flex;gap:14px;flex-wrap:wrap;margin-top:28px}.btn{display:inline-flex;align-items:center;justify-content:center;padding:14px 20px;border-radius:999px;font-weight:700;text-decoration:none}.btn-primary{background:#fff;color:#0f172a}.btn-secondary{border:1px solid rgba(255,255,255,.25);color:#fff}
    main{margin-top:-48px}.panel{border:1px solid rgba(15,23,42,.08);background:#fff;border-radius:28px;padding:28px;box-shadow:0 30px 90px rgba(15,23,42,.08)}
    .grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;margin-top:22px}.card{border:1px solid rgba(15,23,42,.08);background:var(--surface);border-radius:22px;padding:20px}.card h3{margin:0 0 10px;color:var(--text)}.card p{margin:0;color:var(--muted);font-size:.98rem}
    .section{padding:22px 0}.section h2{font-size:clamp(2rem,4vw,3rem);line-height:1.05;margin:0 0 12px;color:#0f172a}.section p{color:#475569;max-width:none}
    footer{padding:32px 20px 48px;color:#64748b}.footer-card{border-top:1px solid rgba(15,23,42,.1);padding-top:18px;font-size:.92rem}
    @media (max-width: 900px){.grid{grid-template-columns:1fr}.panel{padding:22px}header{padding-bottom:72px}}
  </style>
</head>
<body>
  <header>
    <div class="wrap">
      <span class="eyebrow">VoiceToWebsite delivery</span>
      <h1>${escapeHtml(opts.industry || 'Your business website')}</h1>
      <p>${description}</p>
      <div class="hero-actions">
        <a class="btn btn-primary" href="mailto:${email}">Contact</a>
        <a class="btn btn-secondary" href="#offer">See the offer</a>
      </div>
    </div>
  </header>
  <main class="wrap">
    <section class="panel" id="offer">
      <div class="section">
        <h2>Built for clarity and action</h2>
        <p>This starter site was generated for ${escapeHtml(opts.industry || industryKey)} using the ${style} design direction. It is structured to explain the offer, build trust, and drive the next step.</p>
      </div>
      <div class="grid">
        <article class="card">
          <h3>Offer framing</h3>
          <p>Your main service or product is presented with a clear first-screen call to action.</p>
        </article>
        <article class="card">
          <h3>Proof sections</h3>
          <p>Add testimonials, results, credentials, or project examples as the next upgrade layer.</p>
        </article>
        <article class="card">
          <h3>Conversion path</h3>
          <p>Use one primary action such as booking a call, requesting a quote, or starting checkout.</p>
        </article>
      </div>
    </section>
  </main>
  <footer>
    <div class="wrap footer-card">
      <div>Order ID: ${orderId}</div>
      <div>Generated by VoiceToWebsite • 3000 Studios LLC • You are responsible for final content and compliance.</div>
    </div>
  </footer>
</body>
</html>`;
}

async function writeAuditLog(db: D1Database, action: string, targetId: string, detail: string) {
  await db
    .prepare('INSERT INTO audit_log (created_at, actor, action, target_id, detail) VALUES (?, ?, ?, ?, ?)')
    .bind(nowIso(), 'system', action, targetId, detail.slice(0, 4000))
    .run();
}

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  if (!context.env.DB || !context.env.SITES_BUCKET || !context.env.ORDERS_KV) {
    return json({ error: 'Bindings not configured' }, { status: 500 });
  }

  let body: { orderId?: string };
  try {
    body = await parseRequestBody(context.request);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Invalid request body' }, { status: 400 });
  }

  const orderId = (body.orderId || '').trim();
  if (!orderId) return json({ error: 'Missing orderId' }, { status: 400 });

  const order = await context.env.DB.prepare(
    `SELECT id, email, business_description, industry, style_preference, status, site_url
     FROM orders WHERE id = ? LIMIT 1`
  )
    .bind(orderId)
    .first<{
      id: string;
      email: string;
      business_description: string | null;
      industry: string | null;
      style_preference: string | null;
      status: string;
      site_url: string | null;
    }>();

  if (!order) return json({ error: 'Order not found' }, { status: 404 });

  if (order.status === 'delivered' && order.site_url) {
    await context.env.ORDERS_KV.put(`order:${orderId}`, JSON.stringify({ id: orderId, status: 'delivered', site_url: order.site_url }), {
      expirationTtl: 60 * 60 * 24 * 30,
    });
    return json({ orderId, status: 'delivered', siteUrl: order.site_url });
  }

  await context.env.DB.prepare(`UPDATE orders SET status = 'generating', error = NULL WHERE id = ?`).bind(orderId).run();
  await context.env.ORDERS_KV.put(`order:${orderId}`, JSON.stringify({ id: orderId, status: 'generating' }), {
    expirationTtl: 60 * 60 * 24 * 30,
  });
  await writeAuditLog(context.env.DB, 'generation_started', orderId, JSON.stringify({ industry: order.industry, style: order.style_preference }));

  const html = renderSiteHtml({
    business: order.business_description || '',
    industry: order.industry || '',
    style: order.style_preference || '',
    email: order.email,
    orderId,
  });

  if (!html || html.length < 500) {
    await context.env.DB.prepare(`UPDATE orders SET status = 'failed', error = ? WHERE id = ?`).bind('Generated HTML was empty.', orderId).run();
    await writeAuditLog(context.env.DB, 'generation_failed', orderId, 'Generated HTML was empty.');
    return json({ error: 'Generated HTML was invalid.' }, { status: 500 });
  }

  await context.env.SITES_BUCKET.put(`sites/${orderId}/index.html`, html, {
    httpMetadata: { contentType: 'text/html; charset=utf-8' },
  });

  const stored = await context.env.SITES_BUCKET.head(`sites/${orderId}/index.html`);
  if (!stored) {
    await context.env.DB.prepare(`UPDATE orders SET status = 'failed', error = ? WHERE id = ?`).bind('Site storage verification failed.', orderId).run();
    await writeAuditLog(context.env.DB, 'generation_failed', orderId, 'R2 verification failed after put.');
    return json({ error: 'Site storage verification failed.' }, { status: 500 });
  }

  const siteUrl = `https://voicetowebsite.com/api/site/${encodeURIComponent(orderId)}`;
  await context.env.DB.prepare(`UPDATE orders SET status = 'delivered', site_url = ?, error = NULL WHERE id = ?`).bind(siteUrl, orderId).run();
  await context.env.ORDERS_KV.put(`order:${orderId}`, JSON.stringify({ id: orderId, status: 'delivered', site_url: siteUrl }), {
    expirationTtl: 60 * 60 * 24 * 30,
  });
  await writeAuditLog(context.env.DB, 'generation_delivered', orderId, JSON.stringify({ siteUrl }));

  return json({ orderId, status: 'delivered', siteUrl });
};
