// functions/api/_media.js
// Subject-aware media selector for VoiceToWebsite.com generator.
// Free-first, no paid APIs. Selection order:
//   1. Pexels (free key, 200 req/hr) — photos AND a subject video
//   2. Unsplash (free key, 50 req/hr) — fills gallery if Pexels short
//   3. Workers AI Flux Schnell via /api/img — no-key fallback, edge-cached
//   4. Coverr default video — guaranteed hero video if Pexels gave none
//
// Reads keys from env when present. If neither key is set, falls through
// to Workers AI for photos and Coverr default for the video. Always returns
// { videoUrl, imageUrls } with at least 1 image and 1 video.

const FALLBACK_VIDEO =
  'https://cdn.coverr.co/videos/coverr-working-in-a-modern-office-1565/1080p.mp4';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1600&q=80';

// Word-level stop list. Compared to lowercased tokens after stripping
// punctuation, so we never eat letters inside real words like "plumbing".
const STOP_WORDS = new Set([
  // pronouns / determiners
  'i', "i'm", 'im', 'we', "we're", 'were', 'my', 'mine', 'our', 'ours', 'the', 'a', 'an', 'this', 'that',
  'me', 'us', 'you', 'your',
  // verbs / verb phrases
  'own', 'owns', 'run', 'runs', 'have', 'has', 'had', 'operate', 'operates', 'operating',
  'start', 'starts', 'started', 'starting', 'need', 'needs', 'want', 'wants',
  'would', 'like', 'looking', 'love', 'thinking',
  'serve', 'serves', 'serving', 'based', 'located', 'living', 'work', 'works', 'working',
  'build', 'builds', 'building', 'make', 'makes', 'making',
  'create', 'creates', 'creating', 'design', 'designs', 'designing',
  'generate', 'generates', 'generating', 'get', 'gets',
  'help', 'helps', 'helping', 'show', 'shows',
  // generic business nouns to strip
  'company', 'business', 'businesses', 'shop', 'shops', 'service', 'services',
  'store', 'stores', 'firm', 'firms', 'practice', 'practices', 'agency', 'agencies',
  'website', 'site', 'page', 'pages', 'web', 'webpage', 'app', 'application',
  // prepositions / connectives
  'in', 'at', 'on', 'near', 'around', 'from', 'to', 'for', 'of', 'with', 'and', 'or', 'but',
  'is', 'are', 'am', 'be', 'do', 'does',
  // filler
  'please', 'just', 'really', 'so', 'very', 'kinda', 'sorta',
]);

// Strip a trailing "in/near/at City" only when the location words come AFTER
// a connective and look like a proper noun. Operates on the original string
// before we lowercase + tokenise, so we keep case info to recognise cities.
function stripLocationTail(s) {
  return s.replace(
    /\s+(?:in|near|at|from|around|based\s+in|located\s+in|serving)\s+[A-Z][a-zA-Z]*(?:\s+[A-Z][a-zA-Z]*){0,2}\s*$/,
    ''
  );
}

/**
 * Distill a user prompt down to 1–3 subject keywords suitable for stock search.
 * Examples:
 *   "I own a plumbing company in Miami"           → "plumbing"
 *   "We run a dental clinic near Phoenix"         → "dental clinic"
 *   "Build me a website for my Italian restaurant"→ "italian restaurant"
 *   "Personal injury attorney in Houston"         → "personal injury attorney"
 *   "Auto repair garage near Dallas"              → "auto repair garage"
 */
export function distillSubject(prompt) {
  if (!prompt || typeof prompt !== 'string') return 'business';
  // 1. Strip "in/near City" tail BEFORE lowercasing.
  let s = stripLocationTail(prompt.trim());
  // 2. Lowercase + strip punctuation, then tokenise.
  s = s.toLowerCase().replace(/[^\p{L}\p{N}\s']/gu, ' ');
  const tokens = s.split(/\s+/).filter(Boolean);
  // 3. Drop stop words.
  const kept = tokens.filter(t => !STOP_WORDS.has(t));
  // 4. Take first 3 content tokens — that's the search query.
  const subject = kept.slice(0, 3).join(' ').trim();
  return subject.length >= 3 ? subject : 'business';
}

async function pexelsPhotos(query, key, n = 6) {
  if (!key) return [];
  try {
    const r = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${n}&orientation=landscape`,
      { headers: { Authorization: key }, cf: { cacheTtl: 86400 } }
    );
    if (!r.ok) return [];
    const j = await r.json();
    return (j.photos || []).map(p => p.src?.large2x || p.src?.large).filter(Boolean);
  } catch { return []; }
}

async function pexelsVideo(query, key) {
  if (!key) return null;
  try {
    const r = await fetch(
      `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`,
      { headers: { Authorization: key }, cf: { cacheTtl: 86400 } }
    );
    if (!r.ok) return null;
    const j = await r.json();
    for (const v of (j.videos || [])) {
      const file = (v.video_files || [])
        .filter(f => f.quality === 'hd' && (f.width || 0) >= 1280)
        .sort((a, b) => (b.width || 0) - (a.width || 0))[0];
      if (file?.link) return file.link;
    }
    return null;
  } catch { return null; }
}

async function unsplashPhotos(query, key, n = 4) {
  if (!key) return [];
  try {
    const r = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${n}&orientation=landscape`,
      { headers: { Authorization: `Client-ID ${key}` }, cf: { cacheTtl: 86400 } }
    );
    if (!r.ok) return [];
    const j = await r.json();
    return (j.results || []).map(p => p.urls?.regular).filter(Boolean);
  } catch { return []; }
}

/**
 * Build Workers AI image URLs that point at our own /api/img endpoint.
 * The endpoint generates Flux Schnell images on demand and edge-caches for
 * 1 year, so each unique (subject,seed) is generated once across all users.
 */
function workersAiImages(origin, subject, n = 4) {
  const base = `${origin}/api/img?q=${encodeURIComponent(subject)}`;
  return Array.from({ length: n }, (_, i) => `${base}&seed=${i + 1}`);
}

/**
 * Main entry. Pass the raw user prompt + env + origin.
 * Returns { videoUrl, imageUrls, subject, sources }.
 */
export async function selectMedia(prompt, env, origin) {
  const subject = distillSubject(prompt);
  const pexKey = env.PEXELS_API_KEY || '';
  const unsKey = env.UNSPLASH_API_KEY || '';
  const sources = [];

  // Photos: Pexels → Unsplash → Workers AI → fallback. Aim for 6 images.
  let imageUrls = [];
  if (pexKey) {
    imageUrls = await pexelsPhotos(subject, pexKey, 6);
    if (imageUrls.length) sources.push('pexels');
  }
  if (imageUrls.length < 6 && unsKey) {
    const extra = await unsplashPhotos(subject, unsKey, 6 - imageUrls.length);
    if (extra.length) { imageUrls.push(...extra); sources.push('unsplash'); }
  }
  if (imageUrls.length < 4 && origin) {
    const ai = workersAiImages(origin, subject, 4 - imageUrls.length);
    imageUrls.push(...ai);
    sources.push('workers-ai');
  }
  if (!imageUrls.length) {
    imageUrls = [FALLBACK_IMAGE];
    sources.push('fallback-image');
  }

  // Video: Pexels first, else Coverr default. Always one.
  let videoUrl = null;
  if (pexKey) {
    videoUrl = await pexelsVideo(subject, pexKey);
    if (videoUrl) sources.push('pexels-video');
  }
  if (!videoUrl) {
    videoUrl = FALLBACK_VIDEO;
    sources.push('fallback-video');
  }

  return { videoUrl, imageUrls, subject, sources };
}
