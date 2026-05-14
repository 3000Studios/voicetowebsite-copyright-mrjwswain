// functions/api/renovate.js
// Renovate an existing website: fetch its public HTML, extract text content,
// then generate 3 improved variations through the same generate.js pipeline.
//
// Key never leaves the server. Subject-media is reused (Pexels → Workers AI →
// Coverr) so the rebuild has subject-matched hero video + photos.
//
// Request:  POST { url: "https://example.com" }
// Response: same shape as /api/generate — { brief, variations: [...] }

import { selectMedia } from './_media.js';

// Hard limits to avoid abuse / runaway costs.
const MAX_HTML_BYTES = 600_000;   // ~600 KB raw HTML max
const MAX_TEXT_CHARS = 8_000;     // truncate extracted text before sending to model
const FETCH_TIMEOUT_MS = 12_000;

export async function onRequestPost(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return corsResponse();

  try {
    const body = await request.json().catch(() => ({}));
    const rawUrl = (body.url || '').trim();
    if (!rawUrl) return jsonR({ error: 'URL is required' }, 400);

    // Validate URL — must be http(s), public.
    let target;
    try {
      target = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`);
    } catch {
      return jsonR({ error: 'Invalid URL' }, 400);
    }
    if (!/^https?:$/.test(target.protocol)) {
      return jsonR({ error: 'Only http(s) URLs allowed' }, 400);
    }
    // Block private/loopback ranges so this can't be used to probe internal infra.
    const host = target.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host.endsWith('.local') ||
      host.startsWith('10.') ||
      host.startsWith('127.') ||
      host.startsWith('169.254.') ||
      host.startsWith('192.168.') ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host)
    ) {
      return jsonR({ error: 'Private or loopback hosts not allowed' }, 400);
    }

    // Fetch source HTML with timeout.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    let html;
    try {
      const r = await fetch(target.href, {
        signal: controller.signal,
        headers: {
          'user-agent': 'Mozilla/5.0 (compatible; VoiceToWebsiteRenovator/1.0)',
          accept: 'text/html,application/xhtml+xml',
        },
        redirect: 'follow',
        cf: { cacheTtl: 300 },
      });
      if (!r.ok) return jsonR({ error: `Source site returned ${r.status}` }, 502);
      const ct = r.headers.get('content-type') || '';
      if (!/text\/html|application\/xhtml/i.test(ct)) {
        return jsonR({ error: 'Source is not HTML' }, 400);
      }
      const buf = await r.arrayBuffer();
      if (buf.byteLength > MAX_HTML_BYTES) {
        return jsonR({ error: 'Source page too large' }, 413);
      }
      html = new TextDecoder().decode(buf);
    } catch (e) {
      const msg = e.name === 'AbortError' ? 'Source site timed out' : `Fetch failed: ${e.message}`;
      return jsonR({ error: msg }, 502);
    } finally {
      clearTimeout(timeoutId);
    }

    // Pull useful signal out of the HTML: title, meta, headings, first few paragraphs.
    const extracted = extractContent(html, target);

    // Reuse the existing generator by POSTing internally. This way we don't
    // duplicate the prompt logic or media selection — single source of truth.
    const origin = new URL(request.url).origin;
    const synthPrompt = buildRenovatePrompt(extracted);

    // Get subject-matched media using the SAME pipeline as /api/generate.
    const media = await selectMedia(synthPrompt, env, origin);

    // Call /api/generate internally so we get identical output shape +
    // fallback rendering + watermark + prompt-match scoring.
    const genResp = await fetch(`${origin}/api/generate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        prompt: synthPrompt,
        imageUrls: media.imageUrls,
        videoUrl: media.videoUrl,
      }),
    });

    const text = await genResp.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { error: 'Generator returned invalid JSON', details: text.slice(0, 200) }; }

    if (!genResp.ok) return jsonR(data, genResp.status);

    return jsonR({
      ...data,
      source: {
        url: target.href,
        title: extracted.title,
        wordCount: extracted.bodyText.split(/\s+/).filter(Boolean).length,
      },
    });
  } catch (err) {
    return jsonR({ error: 'Internal error', details: err.message }, 500);
  }
}

/**
 * Extract title, meta description, headings, and first paragraphs from raw HTML
 * without using a DOM parser (we're in Workers — no jsdom).
 */
function extractContent(html, url) {
  const decode = (s) => s
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');

  const stripTags = (s) => decode(s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());

  const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || url.hostname).trim();
  const description =
    html.match(/<meta\s+name=["']description["']\s+content=["']([^"']{0,400})["']/i)?.[1] ||
    html.match(/<meta\s+content=["']([^"']{0,400})["']\s+name=["']description["']/i)?.[1] ||
    '';

  const headings = [];
  for (const m of html.matchAll(/<h([1-3])[^>]*>([\s\S]{0,200}?)<\/h\1>/gi)) {
    const text = stripTags(m[2]);
    if (text && text.length > 2 && text.length < 200) headings.push(text);
    if (headings.length >= 10) break;
  }

  // Body text: strip script/style first, then tags.
  const clean = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ');
  const bodyText = stripTags(clean).slice(0, MAX_TEXT_CHARS);

  return { title: decode(title), description: decode(description), headings, bodyText, hostname: url.hostname };
}

/**
 * Build a generator prompt from extracted content. The generator will run its
 * own prompt analyzer over this, so we keep it natural-language.
 */
function buildRenovatePrompt({ title, description, headings, bodyText, hostname }) {
  const parts = [];
  parts.push(`Renovate the website "${title}" (${hostname}) into a premium modern site.`);
  if (description) parts.push(`Original tagline: ${description}`);
  if (headings.length) parts.push(`Existing sections: ${headings.slice(0, 6).join(', ')}.`);

  // Drop in a short body excerpt so the rebuild reflects what the business actually does.
  const excerpt = bodyText.slice(0, 800).replace(/\s+/g, ' ').trim();
  if (excerpt) parts.push(`Business context: ${excerpt}`);

  parts.push('Keep the business identity, services, and tone. Improve typography, layout, motion, and conversion.');
  return parts.join(' ');
}

function corsResponse() {
  return new Response(null, { headers: corsHeaders() });
}
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type',
  };
}
function jsonR(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...corsHeaders() },
  });
}
