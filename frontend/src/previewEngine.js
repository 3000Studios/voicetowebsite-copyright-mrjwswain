const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'your', 'from', 'into',
  'have', 'will', 'are', 'you', 'our', 'about', 'site', 'website'
])

const THEME_PRESETS = {
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

const EDITORIAL_THEME = {
  palette: ['#120f14', '#201721', '#f2a8ff', '#fff6ef'],
  accent: 'Tell a stronger story',
  texture:
    'radial-gradient(circle at 15% 15%, rgba(242,168,255,0.22), transparent 36%), radial-gradient(circle at 85% 10%, rgba(255,220,180,0.18), transparent 30%)'
}

const TYPE_LABELS = {
  saas: 'Software product',
  local_service: 'Local service business',
  creator: 'Creator offer',
  ecommerce: 'Ecommerce launch'
}

const FONT_LIBRARY = [
  { name: 'Inter', family: '"Inter", "Segoe UI", sans-serif', query: 'family=Inter:wght@400;500;700;800' },
  { name: 'Poppins', family: '"Poppins", "Segoe UI", sans-serif', query: 'family=Poppins:wght@400;500;700;800' },
  { name: 'Montserrat', family: '"Montserrat", "Segoe UI", sans-serif', query: 'family=Montserrat:wght@400;500;700;800' },
  { name: 'Playfair Display', family: '"Playfair Display", Georgia, serif', query: 'family=Playfair+Display:wght@500;700;800' },
  { name: 'Space Grotesk', family: '"Space Grotesk", "Segoe UI", sans-serif', query: 'family=Space+Grotesk:wght@400;500;700' }
]

const MEDIA_LIBRARY = {
  defaultVideo: 'https://cdn.coverr.co/videos/coverr-man-working-on-a-laptop-1579/1080p.mp4',
  byKeyword: [
    { test: /(gym|fitness|workout|health)/i, video: 'https://cdn.coverr.co/videos/coverr-woman-doing-yoga-at-home-1577/1080p.mp4' },
    { test: /(restaurant|food|chef|cafe)/i, video: 'https://cdn.coverr.co/videos/coverr-pouring-fresh-coffee-1574/1080p.mp4' },
    { test: /(real estate|home|property)/i, video: 'https://cdn.coverr.co/videos/coverr-modern-living-room-5142/1080p.mp4' },
    { test: /(fashion|beauty|salon)/i, video: 'https://cdn.coverr.co/videos/coverr-a-young-woman-standing-in-the-city-1576/1080p.mp4' }
  ]
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function pickFont(brief) {
  const lower = String(brief ?? '').toLowerCase()
  const requested = FONT_LIBRARY.find((font) => lower.includes(font.name.toLowerCase()))
  if (requested) return requested
  if (/luxury|elegant|premium|editorial/i.test(lower)) return FONT_LIBRARY.find((font) => font.name === 'Playfair Display')
  if (/modern|minimal|tech|saas/i.test(lower)) return FONT_LIBRARY.find((font) => font.name === 'Inter')
  if (/bold|energetic|startup/i.test(lower)) return FONT_LIBRARY.find((font) => font.name === 'Montserrat')
  return FONT_LIBRARY[0]
}

function extractDirective(brief, label) {
  const expression = new RegExp(`${label}\\s*[:=]\\s*([^\\n.,;]+)`, 'i')
  const match = String(brief ?? '').match(expression)
  return match?.[1]?.trim() ?? ''
}

function resolveMediaPlan(brief, websiteType) {
  const prompt = String(brief ?? '')
  const explicitVideo = extractDirective(prompt, 'video') || extractDirective(prompt, 'hero video')
  const imageDirective = extractDirective(prompt, 'image') || extractDirective(prompt, 'hero image')
  const keywordVideo =
    MEDIA_LIBRARY.byKeyword.find((entry) => entry.test.test(prompt))?.video ??
    (websiteType === 'ecommerce'
      ? 'https://cdn.coverr.co/videos/coverr-online-shopping-1572/1080p.mp4'
      : MEDIA_LIBRARY.defaultVideo)

  const slug = slugify(prompt || websiteType || 'preview')
  return {
    heroVideo: /^https?:\/\//i.test(explicitVideo) ? explicitVideo : keywordVideo,
    heroImage: /^https?:\/\//i.test(imageDirective)
      ? imageDirective
      : `https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=80&sig=${slug}`,
    gallery: ['a', 'b', 'c'].map(
      (suffix) => `https://picsum.photos/seed/${slug}-${suffix}/1200/800`
    )
  }
}

function slugify(value) {
  return String(value ?? 'preview')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
}

function randomId(prefix) {
  const suffix =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10)
  return `${prefix}-${Date.now()}-${suffix}`
}

function getThemePreset(websiteType, styleTone) {
  if (styleTone === 'editorial') {
    return EDITORIAL_THEME
  }
  return THEME_PRESETS[websiteType] ?? THEME_PRESETS.saas
}

function extractTitle(brief, websiteType) {
  const fragments = String(brief ?? '')
    .split(/[.!?]/)
    .map((entry) => entry.trim())
    .filter(Boolean)

  const first = fragments[0] ?? `${websiteType} launch site`
  const words = first.split(/\s+/).slice(0, 6)
  return words
    .map((word, index) => (index === 0 ? (word[0] ?? '').toUpperCase() + word.slice(1) : word))
    .join(' ')
    .trim() || 'Generated launch site'
}

function extractKeywords(brief, websiteType, audience) {
  const normalized = `${brief} ${websiteType} ${audience}`
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
  const ranked = new Map()

  for (const token of normalized.split(/\s+/)) {
    if (!token || token.length < 4 || STOP_WORDS.has(token)) {
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
  const typeLabel = String(websiteType ?? 'launch').replace('_', ' ')
  return [
    {
      question: 'How fast can this go live?',
      answer:
        'Most teams can ship a production-ready first version in one to two days because the preview already maps hero, proof, offer, and conversion flow.'
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
      question: `Is this suitable for a ${typeLabel} launch?`,
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
  const siteTypeLabel = TYPE_LABELS[websiteType] ?? 'Digital offer'
  const audienceText = String(audience ?? '').toLowerCase() || 'your audience'

  return [
    {
      eyebrow: 'Positioning',
      heading: `${siteTypeLabel} with a cleaner pitch`,
      body: `This preview turns "${brief}" into a concrete homepage structure that is easier to scan, easier to trust, and easier to buy from on mobile.`
    },
    {
      eyebrow: 'Audience',
      heading: `Built for ${audience}`,
      body: `The sections, calls to action, and benefit framing are tuned for ${audienceText} so the page reads like a live offer instead of a draft concept.`
    },
    {
      eyebrow: 'Conversion',
      heading: `Primary CTA: ${primaryCta}`,
      body:
        'The preview includes a visible offer stack, proof sections, and a direct next step so the site can sell instead of just explain.'
    }
  ]
}

function buildHtml({ title, brief, audience, websiteType, styleTone, primaryCta }) {
  const theme = getThemePreset(websiteType, styleTone)
  const font = pickFont(brief)
  const media = resolveMediaPlan(brief, websiteType)
  const [canvas, surface, accent, ink] = theme.palette
  const sections = buildSectionData({ brief, audience, websiteType, primaryCta })
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
      acceptedAnswer: { '@type': 'Answer', text: entry.answer }
    }))
  }

  return `<!doctype html>
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
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?${font.query}&display=swap" rel="stylesheet" />
    <script type="application/ld+json">${JSON.stringify(faqSchema)}</script>
    <script>
      document.addEventListener('contextmenu', (event) => event.preventDefault());
      document.addEventListener('keydown', (event) => {
        if (event.key === 'F12' || (event.ctrlKey && event.shiftKey && ['I','J','C'].includes(event.key.toUpperCase()))) {
          event.preventDefault();
        }
      });
    </script>
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
        font-family: ${font.family};
        background: var(--canvas);
        color: var(--ink);
        line-height: 1.6;
      }
      .shell { min-height: 100vh; background-image: ${theme.texture}; }
      .hero { padding: 72px 24px 56px; border-bottom: 1px solid var(--line); }
      .hero__inner, .section, .story-strip {
        width: min(1040px, calc(100% - 32px));
        margin: 0 auto;
      }
      .eyebrow {
        display: inline-flex; align-items: center; gap: 8px;
        text-transform: uppercase; letter-spacing: 0.18em;
        font-size: 12px; color: var(--accent);
      }
      h1, h2, h3, p { margin: 0; }
      h1 { font-size: clamp(2.3rem, 7vw, 4.8rem); line-height: 0.95; margin-top: 18px; max-width: 10ch; }
      .hero__lede { max-width: 58ch; margin-top: 18px; color: var(--muted); }
      .hero__grid { margin-top: 30px; display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 18px; }
      .hero__media { border-radius: 24px; overflow: hidden; border: 1px solid var(--line); background: rgba(0,0,0,.35); }
      .hero__media video, .hero__media img { width: 100%; height: 100%; min-height: 380px; object-fit: cover; display: block; }
      .panel, .card, .quote {
        border-radius: 24px;
        border: 1px solid var(--line);
        background: rgba(8, 10, 16, 0.62);
        backdrop-filter: blur(14px);
      }
      .panel { min-height: 420px; padding: 26px; position: relative; overflow: hidden; }
      .panel::before {
        content: ""; position: absolute; inset: -30% auto auto -20%;
        width: 240px; height: 240px; border-radius: 50%;
        background: rgba(255,255,255,0.06); filter: blur(16px);
      }
      .panel__screen {
        position: relative; z-index: 1; height: 100%;
        border-radius: 18px; border: 1px solid rgba(255,255,255,0.1);
        background: linear-gradient(180deg, rgba(255,255,255,0.09), rgba(255,255,255,0.02));
        padding: 18px; display: grid; grid-template-rows: auto auto 1fr; gap: 14px;
      }
      .dot-row { display: flex; gap: 8px; }
      .dot-row span { width: 10px; height: 10px; border-radius: 999px; background: rgba(255,255,255,0.26); }
      .screen-block { border-radius: 16px; padding: 18px; background: rgba(255,255,255,0.05); }
      .screen-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
      .chip { display: inline-flex; padding: 7px 12px; border-radius: 999px; background: rgba(255,255,255,0.08); font-size: 13px; margin-right: 6px; }
      .metrics { display: grid; gap: 12px; }
      .list { display: grid; gap: 12px; padding: 0; margin: 0; }
      .list li {
        list-style: none; padding: 16px 18px;
        border-radius: 16px; border: 1px solid var(--line);
        background: rgba(255,255,255,0.04);
      }
      .list li::before { content: "•"; color: var(--accent); margin-right: 10px; }
      .section { padding: 24px 0 56px; }
      .section-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; }
      .card { padding: 22px; }
      .card .eyebrow { font-size: 11px; }
      .card h2 { margin-top: 12px; font-size: 1.25rem; }
      .card p { margin-top: 10px; color: var(--muted); }
      .story-strip { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 18px; padding-bottom: 56px; }
      .quote { padding: 24px; }
      .quote p { font-size: 1.05rem; }
      .monetization-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
      .ad-slot {
        min-height: 130px; border: 1px dashed var(--line);
        border-radius: 16px; padding: 16px; background: rgba(255,255,255,0.03);
      }
      .cta {
        padding: 18px 20px; display: flex; justify-content: space-between;
        gap: 12px; align-items: center;
        border-top: 1px solid var(--line); margin-top: 18px;
      }
      .button {
        display: inline-flex; align-items: center; justify-content: center;
        padding: 12px 18px; border-radius: 999px; color: #0d1117;
        text-decoration: none; font-weight: 700; background: var(--accent);
      }
      @media (max-width: 820px) {
        .hero { padding-top: 42px; }
        .hero__grid, .section-grid, .story-strip, .monetization-grid { grid-template-columns: 1fr; }
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
            <div class="hero__media">
              <video autoplay muted loop playsinline poster="${escapeHtml(media.heroImage)}">
                <source src="${escapeHtml(media.heroVideo)}" type="video/mp4" />
              </video>
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
                  <div><strong>${escapeHtml(primaryCta)}</strong><div class="eyebrow">Ready for product handoff</div></div>
                  <a class="button" href="#">Buy source</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section class="section">
        <div class="section-grid">
          ${media.gallery
            .map((image, index) => `<article class="card"><img src="${escapeHtml(image)}" alt="${escapeHtml(title)} image ${index + 1}" style="width:100%;height:220px;object-fit:cover;border-radius:14px;border:1px solid var(--line)" loading="lazy" decoding="async" /><p style="margin-top:14px">Prompt-driven image slot ${index + 1} ready for final asset replacement.</p></article>`)
            .join('')}
        </div>
      </section>
      <section class="section">
        <div class="section-grid">
          ${sections
            .map(
              (section) =>
                `<article class="card"><span class="eyebrow">${escapeHtml(section.eyebrow)}</span><h2>${escapeHtml(section.heading)}</h2><p>${escapeHtml(section.body)}</p></article>`
            )
            .join('')}
        </div>
      </section>
      <section class="story-strip">
        <article class="card"><span class="eyebrow">Conversion lane</span><h2>Video, proof, offer, source delivery</h2><p>The generated build is arranged so the user can watch, inspect, and then buy the underlying source code from a productized checkout step.</p></article>
        <article class="card"><span class="eyebrow">Delivery path</span><h2>Reserved to the checkout email</h2><p>Each preview is linked to an email address so the generated package can be assigned to the correct buyer after checkout.</p></article>
      </section>
      <section class="section">
        <div class="monetization-grid">
          <article class="card">
            <span class="eyebrow">Affiliate monetization</span>
            <h2>Partner CTA strip</h2>
            <p>Embed partner links with UTM parameters and a clear recommendation block to monetize intent that does not convert on first session.</p>
            <p><a class="button" href="https://voicetowebsite.com/pricing?utm_source=preview&amp;utm_medium=affiliate&amp;utm_campaign=${escapeHtml(slugify(title))}">See partner offer</a></p>
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
}

export function generatePreview(input) {
  const websiteType = String(input.websiteType ?? 'saas').trim().toLowerCase()
  const styleTone = String(input.styleTone ?? 'cinematic').trim().toLowerCase()
  const audience = String(input.audience ?? 'buyers who need a fast launch').trim() || 'buyers who need a fast launch'
  const primaryCta = String(input.primaryCta ?? 'Buy now').trim() || 'Buy now'
  const brief = String(input.brief ?? '').trim()
  const email = String(input.email ?? '').trim().toLowerCase()

  const title = extractTitle(brief, websiteType)
  const previewHtml = buildHtml({ title, brief, audience, websiteType, styleTone, primaryCta })

  const seoKeywords = extractKeywords(brief, websiteType, audience)
  const qualityScore = estimateQualityScore({ brief, audience, primaryCta })

  return {
    requestId: randomId('preview'),
    title,
    summary: `${title} preview created for ${audience}.`,
    previewHtml,
    sourceFiles: ['index.html', 'content.json', 'README.md'],
    seoKeywords,
    qualityScore,
    recommendedOfferSlug: 'voice-to-website-builder',
    email,
    websiteType,
    styleTone,
    audience,
    primaryCta,
    brief
  }
}
