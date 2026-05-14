// functions/api/img.js
// Workers AI image generation endpoint with aggressive edge caching.
// Generates a subject image via Flux Schnell (@cf/black-forest-labs/flux-1-schnell).
// Each unique (q,seed) tuple is generated once and cached at the edge for 1 year.
// Free tier: 10,000 neurons/day, no API key required.
//
// Usage:  /api/img?q=plumbing&seed=1
//
// Requires Workers AI binding in wrangler.toml:
//   [ai]
//   binding = "AI"

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const q = (url.searchParams.get('q') || 'modern business').trim().slice(0, 80);
  const seed = parseInt(url.searchParams.get('seed') || '1', 10) || 1;

  // Cache key = canonical URL. Cloudflare cache + CDN handles dedupe.
  const cacheKey = new Request(`${url.origin}/api/img?q=${encodeURIComponent(q)}&seed=${seed}`, request);
  const cache = caches.default;

  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  if (!env.AI) {
    // No AI binding — return 302 to a stable Unsplash search.
    return Response.redirect(
      `https://source.unsplash.com/1600x900/?${encodeURIComponent(q)}&sig=${seed}`,
      302
    );
  }

  try {
    const prompt = `professional photograph of ${q}, cinematic lighting, sharp focus, 4k, editorial quality, no text, no logos`;
    const result = await env.AI.run('@cf/black-forest-labs/flux-1-schnell', {
      prompt,
      seed,
      // num_steps default 4 — fast + cheap
    });

    // Workers AI returns { image: base64 } for flux models.
    const b64 = result?.image;
    if (!b64) throw new Error('no image data');

    const bin = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const resp = new Response(bin, {
      headers: {
        'content-type': 'image/jpeg',
        'cache-control': 'public, max-age=31536000, immutable',
        'x-source': 'workers-ai-flux-schnell',
      },
    });

    // Stash in edge cache for next caller. Don't await — fire & forget.
    context.waitUntil(cache.put(cacheKey, resp.clone()));
    return resp;
  } catch (err) {
    // Last-resort redirect so the page never renders a broken image.
    return Response.redirect(
      `https://source.unsplash.com/1600x900/?${encodeURIComponent(q)}&sig=${seed}`,
      302
    );
  }
}
