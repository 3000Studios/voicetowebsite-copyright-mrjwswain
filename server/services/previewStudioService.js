import crypto from 'node:crypto'
import { readSystemDocument, writeSystemDocument } from './contentService.js'

const DEFAULT_PREVIEW_REQUESTS = {
  requests: [],
  updatedAt: null
}

const DELIVERY_FROM_EMAIL = process.env.SOURCE_DELIVERY_FROM_EMAIL ?? process.env.RESEND_FROM_EMAIL ?? ''
const RESEND_API_KEY = process.env.RESEND_API_KEY ?? ''
const SOURCE_DOWNLOAD_TTL_MS = Number(process.env.SOURCE_DOWNLOAD_TTL_MS ?? 1000 * 60 * 60 * 24 * 2)
const SOURCE_DOWNLOAD_MAX_COUNT = Number(process.env.SOURCE_DOWNLOAD_MAX_COUNT ?? 3)

function nowIso() {
  return new Date().toISOString()
}

function buildId(prefix) {
  return `${prefix}-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`
}

function createSecureToken() {
  return crypto.randomBytes(32).toString('base64url')
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function slugify(value) {
  return String(value ?? 'preview')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
}

function getThemePreset(websiteType, styleTone) {
  const presets = {
    saas: {
      palette: ['#0b1020', '#121a31', '#7cf7d4', '#f7f1e7'],
      accent: 'Launch faster',
      texture:
        'radial-gradient(circle at 20% 20%, rgba(124,247,212,0.18), transparent 35%), radial-gradient(circle at 80% 0%, rgba(255,141,71,0.22), transparent 28%)'
    },
    local_service: {
      palette: ['#101820', '#1f2d3a', '#ffc145', '#f6f2ea'],
      accent: 'Book more jobs',
      texture:
        'radial-gradient(circle at 0% 0%, rgba(255,193,69,0.28), transparent 34%), radial-gradient(circle at 90% 20%, rgba(99,179,237,0.2), transparent 30%)'
    },
    creator: {
      palette: ['#1a1024', '#28163a', '#ff8cc6', '#fbf4ee'],
      accent: 'Sell the offer',
      texture:
        'radial-gradient(circle at 10% 10%, rgba(255,140,198,0.25), transparent 38%), radial-gradient(circle at 100% 0%, rgba(138,92,246,0.22), transparent 32%)'
    },
    ecommerce: {
      palette: ['#111114', '#1d1e24', '#7effa1', '#f7f6f2'],
      accent: 'Move inventory',
      texture:
        'radial-gradient(circle at 20% 0%, rgba(126,255,161,0.18), transparent 34%), radial-gradient(circle at 100% 0%, rgba(255,255,255,0.12), transparent 26%)'
    }
  }

  if (styleTone === 'editorial') {
    return {
      palette: ['#120f14', '#201721', '#f2a8ff', '#fff6ef'],
      accent: 'Tell a stronger story',
      texture:
        'radial-gradient(circle at 15% 15%, rgba(242,168,255,0.22), transparent 36%), radial-gradient(circle at 85% 10%, rgba(255,220,180,0.18), transparent 30%)'
    }
  }

  return presets[websiteType] ?? presets.saas
}

function extractTitle(brief, websiteType) {
  const fragments = String(brief ?? '')
    .split(/[.!?]/)
    .map((entry) => entry.trim())
    .filter(Boolean)

  const first = fragments[0] ?? `${websiteType} launch site`
  const words = first.split(/\s+/).slice(0, 6)
  return words
    .map((word, index) => (index === 0 ? word[0]?.toUpperCase() + word.slice(1) : word))
    .join(' ')
}

function extractKeywords(brief, websiteType, audience) {
  const normalized = `${brief} ${websiteType} ${audience}`
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
  const stopWords = new Set([
    'the',
    'and',
    'for',
    'with',
    'that',
    'this',
    'your',
    'from',
    'into',
    'have',
    'will',
    'are',
    'you',
    'our',
    'about',
    'site',
    'website'
  ])
  const ranked = new Map()

  for (const token of normalized.split(/\s+/)) {
    if (!token || token.length < 4 || stopWords.has(token)) {
      continue
    }
    ranked.set(token, (ranked.get(token) ?? 0) + 1)
  }

  return Array.from(ranked.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([word]) => word)
}

function buildFaqEntries(primaryCta, audience, websiteType) {
  return [
    {
      question: 'How fast can this website concept go live?',
      answer:
        'Most teams can launch a production-ready first version in one to two days because the preview already maps hero, proof, offer, and conversion flow.'
    },
    {
      question: `Can this be customized for ${audience}?`,
      answer:
        'Yes. Messaging, visuals, and calls to action are designed to be edited quickly so the final build matches your real audience and sales process.'
    },
    {
      question: 'What happens after checkout?',
      answer:
        'After purchase, the source bundle is assigned to your checkout email so your team can deploy, extend, and optimize the experience immediately.'
    },
    {
      question: `Is this suitable for a ${websiteType.replace('_', ' ')} launch?`,
      answer: `Yes. The layout intentionally prioritizes conversion copy, trust signals, and a direct "${primaryCta}" path for high-intent traffic.`
    }
  ]
}

function estimateQualityScore({ brief, audience, primaryCta }) {
  const briefLength = String(brief ?? '').trim().length
  const audienceLength = String(audience ?? '').trim().length
  const ctaLength = String(primaryCta ?? '').trim().length

  let score = 55
  if (briefLength >= 70) score += 12
  if (briefLength >= 140) score += 10
  if (audienceLength >= 8) score += 8
  if (ctaLength >= 6) score += 7
  if (/buy|book|start|get|launch|build/i.test(primaryCta)) score += 8
  return Math.min(100, score)
}

function buildSectionData({ brief, audience, websiteType, primaryCta }) {
  const siteTypeLabel = {
    saas: 'Software product',
    local_service: 'Local service business',
    creator: 'Creator offer',
    ecommerce: 'Ecommerce launch'
  }[websiteType] ?? 'Digital offer'

  return [
    {
      eyebrow: 'Positioning',
      heading: `${siteTypeLabel} with a cleaner pitch`,
      body: `This preview turns "${brief}" into a concrete homepage structure that is easier to scan, easier to trust, and easier to buy from on mobile.`
    },
    {
      eyebrow: 'Audience',
      heading: `Built for ${audience}`,
      body: `The sections, calls to action, and benefit framing are tuned for ${audience.toLowerCase()} so the page reads like a live offer instead of a draft concept.`
    },
    {
      eyebrow: 'Conversion',
      heading: `Primary CTA: ${primaryCta}`,
      body: 'The preview includes a visible offer stack, proof sections, and a direct next step so the site can sell instead of just explain.'
    }
  ]
}

function getMediaSet(websiteType) {
  const sets = {
    saas: {
      heroVideo: 'https://cdn.coverr.co/videos/coverr-man-working-on-a-laptop-1579/1080p.mp4',
      gallery: [
        'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80'
      ]
    },
    local_service: {
      heroVideo: 'https://cdn.coverr.co/videos/coverr-smiling-electrician-2209/1080p.mp4',
      gallery: [
        'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=1200&q=80'
      ]
    },
    creator: {
      heroVideo: 'https://cdn.coverr.co/videos/coverr-video-production-team-discussing-1578/1080p.mp4',
      gallery: [
        'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80'
      ]
    },
    ecommerce: {
      heroVideo: 'https://cdn.coverr.co/videos/coverr-online-shopping-1572/1080p.mp4',
      gallery: [
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1607082350899-7e105aa886ae?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=1200&q=80'
      ]
    }
  }

  return sets[websiteType] ?? sets.saas
}

function buildPreviewDocument({ title, brief, audience, websiteType, styleTone, primaryCta }) {
  const theme = getThemePreset(websiteType, styleTone)
  const [canvas, surface, accent, ink] = theme.palette
  const sections = buildSectionData({ brief, audience, websiteType, primaryCta })
  const mediaSet = getMediaSet(websiteType)
  const seoKeywords = extractKeywords(brief, websiteType, audience)
  const faqEntries = buildFaqEntries(primaryCta, audience, websiteType)
  const qualityScore = estimateQualityScore({ brief, audience, primaryCta })
  const seoDescription = `${title}. ${brief}`.slice(0, 158)
  const bulletPoints = [
    'Hero video or motion-ready media slot',
    'Offer stack with direct checkout hooks',
    'SEO baseline: metadata, FAQ, and semantic structure',
    'Affiliate CTA lane and sponsor-ready ad placement',
    'Source-ready files that can be exported after purchase'
  ]
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqEntries.map((entry) => ({
      '@type': 'Question',
      name: entry.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: entry.answer
      }
    }))
  }

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="${escapeHtml(seoDescription)}" />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <meta name="keywords" content="${escapeHtml(seoKeywords.join(', '))}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(seoDescription)}" />
    <meta property="og:type" content="website" />
    <title>${escapeHtml(title)}</title>
    <script type="application/ld+json">${JSON.stringify(faqSchema)}</script>
    <style>
      :root {
        color-scheme: dark;
        --canvas: ${canvas};
        --surface: ${surface};
        --accent: ${accent};
        --ink: ${ink};
        --muted: rgba(247, 244, 238, 0.72);
        --line: rgba(255, 255, 255, 0.12);
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "Segoe UI", Inter, sans-serif;
        background: var(--canvas);
        color: var(--ink);
        line-height: 1.6;
      }
      .shell {
        min-height: 100vh;
        background-image: ${theme.texture};
      }
      .hero {
        padding: 64px 24px 46px;
        border-bottom: 1px solid var(--line);
      }
      .hero__inner,
      .section,
      .story-strip {
        width: min(1120px, calc(100% - 32px));
        margin: 0 auto;
      }
      .eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        text-transform: uppercase;
        letter-spacing: 0.18em;
        font-size: 12px;
        color: var(--accent);
      }
      h1, h2, h3, p { margin: 0; }
      h1 {
        font-size: clamp(2.3rem, 7vw, 4.8rem);
        line-height: 0.95;
        margin-top: 18px;
        max-width: 10ch;
      }
      .hero__lede {
        max-width: 58ch;
        margin-top: 18px;
        color: var(--muted);
      }
      .hero__grid {
        margin-top: 30px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 18px;
      }
      .hero__video {
        border-radius: 20px;
        overflow: hidden;
        border: 1px solid var(--line);
        min-height: 310px;
        background: rgba(0,0,0,0.24);
      }
      .hero__video video {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      .panel,
      .card,
      .quote {
        border-radius: 24px;
        border: 1px solid var(--line);
        background: rgba(8, 10, 16, 0.62);
        backdrop-filter: blur(14px);
      }
      .panel {
        min-height: 300px;
        padding: 26px;
        position: relative;
        overflow: hidden;
      }
      .panel::before {
        content: "";
        position: absolute;
        inset: -30% auto auto -20%;
        width: 240px;
        height: 240px;
        border-radius: 50%;
        background: rgba(255,255,255,0.06);
        filter: blur(16px);
      }
      .panel__screen {
        position: relative;
        z-index: 1;
        height: 100%;
        border-radius: 18px;
        border: 1px solid rgba(255,255,255,0.1);
        background: linear-gradient(180deg, rgba(255,255,255,0.09), rgba(255,255,255,0.02));
        padding: 18px;
        display: grid;
        grid-template-rows: auto auto 1fr;
        gap: 14px;
      }
      .dot-row {
        display: flex;
        gap: 8px;
      }
      .dot-row span {
        width: 10px;
        height: 10px;
        border-radius: 999px;
        background: rgba(255,255,255,0.26);
      }
      .screen-block {
        border-radius: 16px;
        padding: 18px;
        background: rgba(255,255,255,0.05);
      }
      .screen-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
      .chip {
        display: inline-flex;
        padding: 7px 12px;
        border-radius: 999px;
        background: rgba(255,255,255,0.08);
        font-size: 13px;
      }
      .metrics {
        display: grid;
        gap: 12px;
      }
      .metrics strong {
        display: block;
        font-size: 14px;
        margin-bottom: 4px;
      }
      .list {
        display: grid;
        gap: 12px;
        padding: 0;
        margin: 0;
      }
      .list li {
        list-style: none;
        padding: 16px 18px;
        border-radius: 16px;
        border: 1px solid var(--line);
        background: rgba(255,255,255,0.04);
      }
      .list li::before {
        content: "•";
        color: var(--accent);
        margin-right: 10px;
      }
      .section {
        padding: 24px 0 56px;
      }
      .section-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 18px;
      }
      .card {
        padding: 22px;
      }
      .card .eyebrow {
        font-size: 11px;
      }
      .card h2 {
        margin-top: 12px;
        font-size: 1.25rem;
      }
      .card p {
        margin-top: 10px;
        color: var(--muted);
      }
      .story-strip {
        display: grid;
        grid-template-columns: 1.1fr 0.9fr;
        gap: 18px;
        padding-bottom: 56px;
      }
      .gallery-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 14px;
        margin-top: 18px;
      }
      .gallery-grid img {
        width: 100%;
        aspect-ratio: 4 / 3;
        object-fit: cover;
        border-radius: 14px;
        border: 1px solid var(--line);
      }
      .quote {
        padding: 24px;
      }
      .quote p {
        font-size: 1.05rem;
      }
      .monetization-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 18px;
      }
      .ad-slot {
        min-height: 130px;
        border: 1px dashed var(--line);
        border-radius: 16px;
        padding: 16px;
        background: rgba(255,255,255,0.03);
      }
      .cta {
        padding: 18px 20px;
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: center;
        border-top: 1px solid var(--line);
        margin-top: 18px;
      }
      .cta strong {
        font-size: 1rem;
      }
      .button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 12px 18px;
        border-radius: 999px;
        color: #0d1117;
        text-decoration: none;
        font-weight: 700;
        background: var(--accent);
      }
      @media (max-width: 820px) {
        .hero {
          padding-top: 42px;
        }
        .hero__grid,
        .section-grid,
        .story-strip,
        .gallery-grid {
          grid-template-columns: 1fr;
        }
        .monetization-grid {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <div class="shell">
      <section class="hero">
        <div class="hero__inner">
          <span class="eyebrow">${escapeHtml(theme.accent)} • Preview Studio</span>
          <h1>${escapeHtml(title)}</h1>
          <p class="hero__lede">${escapeHtml(brief)}</p>
          <div class="hero__grid">
            <div>
              <div class="hero__video">
                <video autoplay muted loop playsinline preload="metadata" poster="${escapeHtml(mediaSet.gallery[0])}">
                  <source src="${escapeHtml(mediaSet.heroVideo)}" type="video/mp4" />
                </video>
              </div>
              <div class="gallery-grid">
                ${mediaSet.gallery.map((image) => `<img src="${escapeHtml(image)}" alt="${escapeHtml(title)} preview image" loading="lazy" decoding="async" />`).join('')}
              </div>
            </div>
            <div class="panel">
              <div class="panel__screen">
                <div class="dot-row"><span></span><span></span><span></span></div>
                <div class="screen-block">
                  <span class="chip">${escapeHtml(audience)}</span>
                  <span class="chip">${escapeHtml(primaryCta)}</span>
                </div>
                <div class="screen-grid">
                  <div class="screen-block"><strong>Offer direction</strong><p>${escapeHtml(title)} now reads like a sellable offer instead of a draft build note.</p></div>
                  <div class="screen-block"><strong>Mobile behavior</strong><p>Hero, CTA, and proof stack cleanly so buyers can scroll and inspect before purchase.</p></div>
                  <div class="screen-block"><strong>Story flow</strong><p>Media, trust, and conversion content are arranged to reduce drop-off in the first 20 seconds.</p></div>
                  <div class="screen-block"><strong>Monetization</strong><p>Checkout-ready placement leaves space for a direct source-code purchase path.</p></div>
                </div>
              </div>
            </div>
            <div class="metrics">
              <div class="card">
                <span class="eyebrow">Source bundle</span>
                <h2>Files included • Quality ${qualityScore}/100</h2>
                <ul class="list">${bulletPoints.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
              </div>
              <div class="quote">
                <p>"The scrollable preview lets buyers inspect the full page before they commit, while the source pack turns the preview into a product."</p>
                <div class="cta">
                  <div><strong>${escapeHtml(primaryCta)}</strong><div class="eyebrow">Ready for product page handoff</div></div>
                  <a class="button" href="#">Buy source</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section class="section">
        <div class="section-grid">
          ${sections
            .map(
              (section) => `<article class="card"><span class="eyebrow">${escapeHtml(section.eyebrow)}</span><h2>${escapeHtml(section.heading)}</h2><p>${escapeHtml(section.body)}</p></article>`,
            )
            .join('')}
        </div>
      </section>
      <section class="story-strip">
        <article class="card"><span class="eyebrow">Conversion lane</span><h2>Premium hero, social proof, and monetization flow</h2><p>This generated preview is structured as a real high-converting landing page: rich visual media, trust sections, offer narrative, and clear CTA hierarchy.</p></article>
        <article class="card"><span class="eyebrow">Delivery path</span><h2>Production-ready handoff for customer preview</h2><p>The generated files include a full landing page that your customer can scroll and inspect before purchase, with structure ready for final production adaptation.</p></article>
      </section>
      <section class="section">
        <div class="monetization-grid">
          <article class="card">
            <span class="eyebrow">Affiliate monetization</span>
            <h2>Partner CTA strip</h2>
            <p>Embed partner links with UTM parameters and a clear recommendation block to monetize intent that does not convert on first session.</p>
            <p><a class="button" href="https://voicetowebsite.com/pricing?utm_source=preview&utm_medium=affiliate&utm_campaign=${escapeHtml(slugify(title))}">See partner offer</a></p>
          </article>
          <article class="card ad-slot">
            <span class="eyebrow">Sponsor inventory</span>
            <h2>Ad placement placeholder</h2>
            <p>Reserved placement for ethical sponsorships or direct ad sales. Keep one premium slot above the fold and rotate by campaign.</p>
          </article>
        </div>
      </section>
      <section class="section">
        <div class="section-grid">
          ${faqEntries
            .map(
              (item) =>
                `<article class="card"><span class="eyebrow">FAQ</span><h2>${escapeHtml(item.question)}</h2><p>${escapeHtml(item.answer)}</p></article>`
            )
            .join('')}
        </div>
      </section>
    </div>
  </body>
</html>`

  const files = [
    { path: 'index.html', content: html },
    {
      path: 'content.json',
      content: JSON.stringify({ title, brief, audience, websiteType, styleTone, primaryCta, sections, seoKeywords, qualityScore, faqEntries }, null, 2)
    },
    {
      path: 'README.md',
      content: `# ${title}\n\nAudience: ${audience}\n\nPrimary CTA: ${primaryCta}\n\nThis source pack was generated from the Preview Studio flow and is ready for checkout-linked delivery.\n`
    }
  ]

  return {
    title,
    summary: `${title} preview created for ${audience}.`,
    html,
    files,
    qualityScore,
    seoKeywords
  }
}

async function readPreviewRequests() {
  return readSystemDocument('preview-requests.json', DEFAULT_PREVIEW_REQUESTS)
}

async function writePreviewRequests(payload) {
  await writeSystemDocument('preview-requests.json', {
    ...payload,
    updatedAt: nowIso()
  })
}

function summarizeRequest(request) {
  return {
    requestId: request.id,
    title: request.title,
    summary: request.summary,
    previewHtml: request.previewHtml,
    sourceFiles: request.sourceBundle.files.map((file) => file.path),
    qualityScore: request.qualityScore ?? null,
    seoKeywords: request.seoKeywords ?? [],
    recommendedOfferSlug: request.recommendedOfferSlug,
    email: request.email,
    status: request.status,
    delivery: request.delivery
  }
}

export async function createPreviewRequest(payload) {
  const websiteType = String(payload.websiteType ?? 'saas').trim().toLowerCase()
  const styleTone = String(payload.styleTone ?? 'cinematic').trim().toLowerCase()
  const audience = String(payload.audience ?? 'buyers who need a fast launch').trim() || 'buyers who need a fast launch'
  const primaryCta = String(payload.primaryCta ?? 'Buy now').trim() || 'Buy now'
  const brief = String(payload.brief ?? '').trim()
  const email = String(payload.email ?? '').trim().toLowerCase()
  const title = extractTitle(brief, websiteType)
  const preview = buildPreviewDocument({ title, brief, audience, websiteType, styleTone, primaryCta })
  const previewRequests = await readPreviewRequests()

  const request = {
    id: buildId('preview'),
    slug: slugify(title),
    title,
    email,
    websiteType,
    styleTone,
    audience,
    primaryCta,
    brief,
    summary: preview.summary,
    previewHtml: preview.html,
    sourceBundle: { files: preview.files },
    qualityScore: preview.qualityScore,
    seoKeywords: preview.seoKeywords,
    recommendedOfferSlug: 'voice-to-website-builder',
    status: 'preview_ready',
    delivery: {
      status: 'awaiting_purchase',
      emailStatus: 'idle',
      email
    },
    createdAt: nowIso()
  }

  previewRequests.requests = [request, ...(previewRequests.requests ?? [])].slice(0, 400)
  await writePreviewRequests(previewRequests)
  return summarizeRequest(request)
}

export async function recordPreviewCheckoutIntent({ requestId, offerSlug, email }) {
  const previewRequests = await readPreviewRequests()
  const index = (previewRequests.requests ?? []).findIndex((entry) => entry.id === requestId)

  if (index === -1) {
    return null
  }

  const request = previewRequests.requests[index]
  request.delivery = {
    ...(request.delivery ?? {}),
    status: 'checkout_started',
    checkoutStartedAt: nowIso(),
    reservedOfferSlug: offerSlug ?? request.recommendedOfferSlug,
    email: String(email ?? request.email ?? '').trim().toLowerCase()
  }
  previewRequests.requests[index] = request
  await writePreviewRequests(previewRequests)
  return summarizeRequest(request)
}

async function sendSourceDeliveryEmail(request) {
  if (!RESEND_API_KEY || !DELIVERY_FROM_EMAIL || !request.delivery?.downloadToken) {
    return { status: 'queued_email_provider', sent: false }
  }

  const downloadUrl = `${process.env.PUBLIC_SITE_URL ?? 'https://voicetowebsite.com'}/api/public/source/${request.delivery.downloadToken}`
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: DELIVERY_FROM_EMAIL,
      to: [request.delivery.email ?? request.email],
      subject: `${request.title} source pack`,
      html: `<p>Your source pack is ready.</p><p><a href="${downloadUrl}">Download the generated source files</a></p><p>Preview ID: ${request.id}</p>`
    })
  })

  if (!response.ok) {
    return { status: 'queued_email_provider', sent: false }
  }

  return { status: 'emailed', sent: true }
}

export async function fulfillPreviewSourceDelivery({ requestId, customerEmail, transactionId, provider, offerSlug }) {
  if (!requestId) {
    return null
  }

  const previewRequests = await readPreviewRequests()
  const index = (previewRequests.requests ?? []).findIndex((entry) => entry.id === requestId)

  if (index === -1) {
    return null
  }

  const request = previewRequests.requests[index]
  request.delivery = {
    ...(request.delivery ?? {}),
    status: 'source_ready',
    email: String(customerEmail ?? request.delivery?.email ?? request.email ?? '').trim().toLowerCase(),
    deliveredAt: nowIso(),
    provider: provider ?? 'stripe',
    offerSlug: offerSlug ?? request.delivery?.reservedOfferSlug ?? request.recommendedOfferSlug,
    transactionId: transactionId ?? null,
    downloadToken: request.delivery?.downloadToken ?? createSecureToken(),
    downloadIssuedAt: request.delivery?.downloadIssuedAt ?? nowIso(),
    downloadExpiresAt:
      request.delivery?.downloadExpiresAt ?? new Date(Date.now() + SOURCE_DOWNLOAD_TTL_MS).toISOString(),
    downloadCount: request.delivery?.downloadCount ?? 0
  }

  const emailResult = await sendSourceDeliveryEmail(request)
  request.delivery.emailStatus = emailResult.status
  previewRequests.requests[index] = request
  await writePreviewRequests(previewRequests)
  return summarizeRequest(request)
}

export async function getSourceBundleByToken(token) {
  const previewRequests = await readPreviewRequests()
  const index = (previewRequests.requests ?? []).findIndex(
    (entry) => entry.delivery?.downloadToken === token && entry.delivery?.status === 'source_ready'
  )

  if (index < 0) {
    throw new Error('Source bundle not found.')
  }

  const request = previewRequests.requests[index]
  const expiresAt = new Date(request.delivery?.downloadExpiresAt ?? 0).getTime()
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    throw new Error('Source bundle link expired.')
  }

  const downloadCount = Number(request.delivery?.downloadCount ?? 0)
  if (downloadCount >= SOURCE_DOWNLOAD_MAX_COUNT) {
    throw new Error('Source bundle download limit reached.')
  }

  request.delivery.downloadCount = downloadCount + 1
  request.delivery.lastDownloadedAt = nowIso()
  previewRequests.requests[index] = request
  await writePreviewRequests(previewRequests)

  return {
    fileName: `${request.slug || 'source-pack'}-source.json`,
    payload: {
      title: request.title,
      previewId: request.id,
      generatedAt: request.createdAt,
      files: request.sourceBundle.files
    }
  }
}
