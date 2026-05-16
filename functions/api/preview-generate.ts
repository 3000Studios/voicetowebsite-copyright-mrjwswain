// Free preview endpoint — no auth, no order, no R2 write.
// Generates a sandbox homepage from a one-line brief, returns it as raw HTML
// embedded in the JSON response. Rate-limited per IP via KV to prevent abuse.
//
// The output gets a visible watermark + upsell ribbon so previewers know it's
// a sandbox and there is a clear path to checkout.

import {
  compileLayoutFromPrompt,
  type BrandAsset,
  type GeneratedCopy,
} from "../../src/lib/layoutCompiler";

export interface Env {
  ORDERS_KV: KVNamespace;
  GEMINI_API_KEY?: string;
  UNSPLASH_API_KEY?: string;
}

// gemini-2.0-flash-exp was retired. gemini-flash-latest auto-tracks the
// current stable flash model so we don't have to chase deprecations.
const GEMINI_MODEL = "gemini-flash-latest";
const DAILY_LIMIT_PER_IP = 3;
const COOLDOWN_SECONDS = 60;

function json(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...(init.headers || {}),
    },
  });
}

function clientIp(request: Request) {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "anon"
  );
}

function todayBucket() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function detectIndustry(brief: string) {
  const p = brief.toLowerCase();
  if (/(restaurant|cafe|coffee|bakery|bar |bistro|dining|menu)/.test(p)) return "food";
  if (/(gym|fitness|yoga|coach|trainer|crossfit|pilates)/.test(p)) return "fitness";
  if (/(realtor|real estate|property|broker|listing)/.test(p)) return "realestate";
  if (/(salon|beauty|hair|nails|spa|wax|brow)/.test(p)) return "beauty";
  if (/(law|attorney|legal|counsel|advocate)/.test(p)) return "law";
  if (/(saas|software|app |startup|tech|platform|api)/.test(p)) return "tech";
  if (/(photographer|photo|portrait|wedding|video)/.test(p)) return "creative";
  return "general";
}

async function generateCopyWithGemini(
  apiKey: string,
  brief: string,
  industry: string,
): Promise<GeneratedCopy | null> {
  const instruction = `You write conversion copy for a small-business homepage. Output STRICT JSON only, no prose, matching this TypeScript type:

{
  "headline": string,
  "subhead": string,
  "intro": string,
  "services": string[],
  "proof": string[],
  "testimonials": string[],
  "faqs": [string, string][]
}

Constraints:
- headline: 4-10 words, punchy, specific. No generic filler.
- subhead: one sentence, ~15-25 words, explains the offer.
- intro: 1-2 short sentences, conversational.
- services: exactly 4 distinct offers as short noun phrases.
- proof: exactly 4 specific differentiators (3-6 words each).
- testimonials: exactly 3 plausible 1-sentence first-person quotes. No names.
- faqs: exactly 3 [question, answer] pairs. Answers under 30 words.
- Do not mention "AI" or "generated".

Industry: ${industry}
Business brief: ${brief}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 18000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: instruction }] }],
        generationConfig: { temperature: 0.85, responseMimeType: "application/json" },
      }),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;
    const parsed = JSON.parse(text) as Partial<GeneratedCopy>;
    if (
      typeof parsed.headline !== "string" ||
      typeof parsed.subhead !== "string" ||
      typeof parsed.intro !== "string" ||
      !Array.isArray(parsed.services) ||
      !Array.isArray(parsed.proof) ||
      !Array.isArray(parsed.testimonials) ||
      !Array.isArray(parsed.faqs)
    ) {
      return null;
    }
    return {
      headline: parsed.headline.slice(0, 200),
      subhead: parsed.subhead.slice(0, 400),
      intro: parsed.intro.slice(0, 500),
      services: parsed.services.filter((s): s is string => typeof s === "string").slice(0, 4),
      proof: parsed.proof.filter((s): s is string => typeof s === "string").slice(0, 4),
      testimonials: parsed.testimonials.filter((s): s is string => typeof s === "string").slice(0, 3),
      faqs: parsed.faqs
        .filter((f): f is [string, string] => Array.isArray(f) && f.length === 2 && typeof f[0] === "string" && typeof f[1] === "string")
        .slice(0, 6),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchUnsplashImage(env: Env, query: string): Promise<string | undefined> {
  if (!env.UNSPLASH_API_KEY) return undefined;
  try {
    const r = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`, {
      headers: { Authorization: `Client-ID ${env.UNSPLASH_API_KEY}` },
    });
    if (!r.ok) return undefined;
    const data = (await r.json()) as { results?: Array<{ urls?: { regular?: string } }> };
    return data.results?.[0]?.urls?.regular;
  } catch {
    return undefined;
  }
}

function injectPreviewChrome(html: string) {
  // Insert a watermark ribbon + sticky upsell bar before </body>
  const watermark = `<style>
    .vtw-preview-ribbon{position:fixed;top:14px;left:14px;z-index:9999;font:600 11px/1 system-ui,sans-serif;letter-spacing:0.18em;text-transform:uppercase;color:#04060a;background:linear-gradient(90deg,#67e8f9,#f0abfc);padding:8px 14px;border-radius:999px;box-shadow:0 14px 40px -10px rgba(34,211,238,0.55)}
    .vtw-preview-cta{position:fixed;bottom:18px;left:50%;transform:translateX(-50%);z-index:9999;display:inline-flex;align-items:center;gap:10px;background:rgba(5,7,11,0.86);backdrop-filter:blur(18px);color:#fff;font:700 13px/1 system-ui,sans-serif;padding:14px 22px;border-radius:999px;border:1px solid rgba(255,255,255,0.16);box-shadow:0 24px 60px -16px rgba(0,0,0,0.7);text-decoration:none}
    .vtw-preview-cta b{background:linear-gradient(90deg,#67e8f9,#f0abfc);-webkit-background-clip:text;background-clip:text;color:transparent}
    .vtw-preview-cta:hover{transform:translateX(-50%) translateY(-2px);transition:transform .2s}
    .vtw-preview-watermark{position:fixed;right:18px;bottom:18px;z-index:9998;font:800 10px/1 system-ui,sans-serif;letter-spacing:0.32em;color:rgba(255,255,255,0.55);text-transform:uppercase;background:rgba(0,0,0,0.5);padding:8px 12px;border-radius:999px;backdrop-filter:blur(12px)}
  </style>
  <div class="vtw-preview-ribbon">Free preview · sandbox</div>
  <a class="vtw-preview-cta" href="https://voicetowebsite.com/pricing" target="_top">Like it? <b>Host it for $9.99</b> →</a>
  <div class="vtw-preview-watermark">VoiceToWebsite preview</div>`;
  if (html.includes("</body>")) {
    return html.replace("</body>", `${watermark}</body>`);
  }
  return html + watermark;
}

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;
  let body: { brief?: string };
  try {
    body = (await request.json()) as { brief?: string };
  } catch {
    return json({ error: "Invalid request body" }, { status: 400 });
  }

  const brief = (body.brief || "").trim();
  if (brief.length < 12) {
    return json({ error: "Brief must be at least 12 characters." }, { status: 400 });
  }
  if (brief.length > 1000) {
    return json({ error: "Brief must be under 1000 characters." }, { status: 400 });
  }

  const ip = clientIp(request);
  const rateKey = `preview:${ip}:${todayBucket()}`;
  const cooldownKey = `preview-cool:${ip}`;

  if (env.ORDERS_KV) {
    const onCooldown = await env.ORDERS_KV.get(cooldownKey);
    if (onCooldown) {
      return json({ error: `Slow down — try again in a minute.` }, { status: 429 });
    }
    const used = parseInt((await env.ORDERS_KV.get(rateKey)) || "0", 10);
    if (used >= DAILY_LIMIT_PER_IP) {
      return json(
        {
          error: `Free preview limit reached for today (${DAILY_LIMIT_PER_IP}/day). Start a real build for $9.99/mo to keep generating.`,
        },
        { status: 429 },
      );
    }
  }

  const industry = detectIndustry(brief);
  const [copy, heroImage] = await Promise.all([
    env.GEMINI_API_KEY ? generateCopyWithGemini(env.GEMINI_API_KEY, brief, industry) : Promise.resolve(null),
    fetchUnsplashImage(env, `${industry} business`),
  ]);

  const brand: Partial<BrandAsset> = {
    name: copy?.headline?.split(/\s+/).slice(0, 2).join(" ") || brief.split(/\s+/).slice(0, 2).join(" "),
    colors: ["#22d3ee", "#a78bfa", "#0f172a"],
    media: heroImage ? { imageUrl: heroImage } : undefined,
  };

  const compiled = compileLayoutFromPrompt(brief, brand, copy || undefined);
  const html = injectPreviewChrome(compiled.html);

  if (env.ORDERS_KV) {
    const used = parseInt((await env.ORDERS_KV.get(rateKey)) || "0", 10);
    await env.ORDERS_KV.put(rateKey, String(used + 1), { expirationTtl: 60 * 60 * 28 });
    await env.ORDERS_KV.put(cooldownKey, "1", { expirationTtl: COOLDOWN_SECONDS });
  }

  return json({
    ok: true,
    html,
    industry,
    geminiCopyUsed: !!copy,
    previewsUsedToday: env.ORDERS_KV
      ? Math.min(DAILY_LIMIT_PER_IP, parseInt((await env.ORDERS_KV.get(rateKey)) || "1", 10))
      : 1,
    dailyLimit: DAILY_LIMIT_PER_IP,
  });
};

export const onRequestGet = () =>
  json({ error: "Method not allowed. POST { brief } to generate." }, { status: 405 });
