export interface Env {
  DB: D1Database;
  SITES_BUCKET: R2Bucket;
  ORDERS_KV: KVNamespace;
  BRANDFETCH_CLIENT_ID?: string;
  STORYBLOK_OAUTH_TOKEN?: string;
  STORYBLOK_SPACE_ID?: string;
  UNSPLASH_API_KEY?: string;
  PEXELS_API_KEY?: string;
  COVER_API_KEY?: string;
}

import { compileLayoutFromPrompt, type BrandAsset, type LayoutTree } from "../../src/lib/layoutCompiler";

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

async function parseRequestBody(request: Request): Promise<{ orderId?: string; prompt?: string; mode?: string; token?: string }> {
  const url = new URL(request.url);
  if (url.searchParams.get('orderId')) {
    return { orderId: url.searchParams.get('orderId') || '' };
  }

  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    const raw = await request.text();
    if (!raw.trim()) throw new Error('Empty request body');
    return JSON.parse(raw) as { orderId?: string; prompt?: string; mode?: string; token?: string };
  }

  if (contentType.includes('application/x-www-form-urlencoded')) {
    const raw = await request.text();
    const form = new URLSearchParams(raw);
    return { orderId: form.get('orderId') || '', prompt: form.get('prompt') || '' };
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

async function fetchBrandAssets(queryText: string, env: Env): Promise<Partial<BrandAsset>> {
  const brandQuery = (queryText || 'business').slice(0, 80);
  if (!env.BRANDFETCH_CLIENT_ID) return {};

  try {
    const search = await fetch(
      `https://api.brandfetch.io/v2/search/${encodeURIComponent(brandQuery)}?c=${encodeURIComponent(env.BRANDFETCH_CLIENT_ID)}`,
    );
    if (!search.ok) return {};
    const results = (await search.json()) as Array<{
      name?: string;
      domain?: string;
      icon?: string;
      logo?: string;
      claimed?: boolean;
    }>;
    const match = results.find((item) => item.domain) || results[0];
    if (!match?.domain) return {};

    const brand = await fetch(`https://api.brandfetch.io/v2/brands/${encodeURIComponent(match.domain)}`, {
      headers: {
        Authorization: `Bearer ${env.BRANDFETCH_CLIENT_ID}`,
      },
    });
    if (!brand.ok) {
      return {
        name: match.name,
        domain: match.domain,
        logoUrl: match.icon || match.logo,
      };
    }

    const data = (await brand.json()) as {
      name?: string;
      domain?: string;
      logos?: Array<{ formats?: Array<{ src?: string; format?: string }> }>;
      colors?: Array<{ hex?: string }>;
    };
    const logoUrl =
      data.logos?.flatMap((logo) => logo.formats || []).find((format) => format.src && (format.format === 'svg' || format.format === 'png'))?.src ||
      match.icon ||
      match.logo;

    return {
      name: data.name || match.name,
      domain: data.domain || match.domain,
      logoUrl,
      colors: (data.colors || []).map((color) => color.hex).filter((value): value is string => !!value).slice(0, 4),
    };
  } catch {
    return {};
  }
}

async function fetchMediaAssets(queryText: string, env: Env): Promise<BrandAsset["media"]> {
  const query = (queryText || "business website").slice(0, 100);
  const media: NonNullable<BrandAsset["media"]> = {};

  try {
    if (env.UNSPLASH_API_KEY) {
      const res = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&orientation=landscape&per_page=6`,
        { headers: { Authorization: `Client-ID ${env.UNSPLASH_API_KEY}` } },
      );
      if (res.ok) {
        const data = (await res.json()) as {
          results?: Array<{ urls?: { regular?: string }; alt_description?: string }>;
        };
        const gallery = (data.results || [])
          .map((item) => item.urls?.regular)
          .filter((value): value is string => Boolean(value));
        media.imageUrl = gallery[0];
        media.gallery = gallery.slice(0, 3);
      }
    }
  } catch {}

  try {
    if (env.PEXELS_API_KEY) {
      const res = await fetch(
        `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&orientation=landscape&per_page=5`,
        { headers: { Authorization: env.PEXELS_API_KEY } },
      );
      if (res.ok) {
        const data = (await res.json()) as {
          videos?: Array<{ video_files?: Array<{ quality?: string; width?: number; link?: string }> }>;
        };
        const files = data.videos?.flatMap((video) => video.video_files || []) || [];
        const best =
          files.find((file) => file.quality === "hd" && (file.width || 0) >= 1280) ||
          files.find((file) => (file.width || 0) >= 960) ||
          files[0];
        media.videoUrl = best?.link;
      }
    }
  } catch {}

  return media;
}

async function storeStoryblokTree(tree: LayoutTree, orderId: string, env: Env) {
  if (!env.STORYBLOK_OAUTH_TOKEN || !env.STORYBLOK_SPACE_ID) return { stored: false, reason: 'storyblok_not_configured' };

  try {
    const response = await fetch(`https://mapi.storyblok.com/v1/spaces/${env.STORYBLOK_SPACE_ID}/stories/`, {
      method: 'POST',
      headers: {
        Authorization: env.STORYBLOK_OAUTH_TOKEN,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        story: {
          name: `${tree.name} ${orderId}`.slice(0, 80),
          slug: `generated-${orderId}`,
          content: {
            component: 'generated_site',
            prompt: tree.prompt,
            brand: tree.brand,
            body: tree.bloks.map((blok) => ({
              _uid: `${orderId}-${blok.order}`,
              ...blok,
            })),
          },
        },
        publish: 1,
      }),
    });
    return { stored: response.ok, status: response.status };
  } catch {
    return { stored: false, reason: 'storyblok_request_failed' };
  }
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

  let body: { orderId?: string; prompt?: string; mode?: string; token?: string };
  try {
    body = await parseRequestBody(context.request);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Invalid request body' }, { status: 400 });
  }

  const orderId = (body.orderId || '').trim();
  const promptOnly = (body.prompt || '').trim();
  if (!orderId && promptOnly) {
    const [brandAssets, media] = await Promise.all([
      fetchBrandAssets(promptOnly, context.env),
      fetchMediaAssets(promptOnly, context.env),
    ]);
    const brand = { ...brandAssets, media };
    const compiled = compileLayoutFromPrompt(promptOnly, brand);
    await writeAuditLog(
      context.env.DB,
      'preview_layout_compiled',
      `preview-${Date.now()}`,
      JSON.stringify({
        compiler: 'layout-compiler-v1',
        mode: body.mode || 'preview',
        grid: compiled.tree.bloks.map((blok) => ({ component: blok.component, order: blok.order, grid_span: blok.grid_span })),
      }),
    );
    return json({
      html: compiled.html,
      title: `${compiled.tree.name} Generated Site`,
      layoutTree: compiled.tree,
      variations: compiled.variants.map((variant) => ({
        id: variant.id,
        name: variant.name,
        mood: variant.mood,
        fontPair: variant.fontPair,
        html: variant.html,
      })),
    });
  }
  if (!orderId) return json({ error: 'Missing orderId or prompt' }, { status: 400 });

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

  const prompt = [
    order.business_description || '',
    order.industry ? `Industry: ${order.industry}` : '',
    order.style_preference ? `Style: ${order.style_preference}` : '',
  ]
    .filter(Boolean)
    .join('\n');
  const [brandAssets, media] = await Promise.all([
    fetchBrandAssets(`${order.business_description || ''} ${order.industry || ''}`, context.env),
    fetchMediaAssets(`${order.business_description || ''} ${order.industry || ''}`, context.env),
  ]);
  const brand = { ...brandAssets, media };
  const compiled = compileLayoutFromPrompt(prompt || 'Generate a business website with features, pricing, FAQ, and contact.', brand);
  const html = compiled.html.replace(
    '</footer>',
    `<div class="mt-4">Order ID: ${escapeHtml(orderId)} • Generated by VoiceToWebsite Layout Compiler • You are responsible for final content and compliance.</div></footer>`,
  );
  const storyblokResult = await storeStoryblokTree(compiled.tree, orderId, context.env);

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
  await writeAuditLog(
    context.env.DB,
    'generation_delivered',
    orderId,
    JSON.stringify({
      siteUrl,
      compiler: 'layout-compiler-v1',
      storyblok: storyblokResult,
      grid: compiled.tree.bloks.map((blok) => ({ component: blok.component, order: blok.order, grid_span: blok.grid_span })),
    }),
  );

  return json({ orderId, status: 'delivered', siteUrl });
};
