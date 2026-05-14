// functions/api/generate.js — Premium Website Generator (VoiceToWebsite.com)
// Calls Gemini 2.0 Flash with rich system prompt to produce full HTML/CSS previews

import { selectMedia } from './_media.js';

const SYSTEM_PROMPT = `You are an elite web designer. Given a business prompt plus media URLs, generate 3 distinct premium website variations as COMPLETE self-contained HTML documents.
Each HTML document MUST include:
- Sticky nav with logo + smooth-scroll links (positioned below the preview banner at top:40px)
- Full-viewport hero with the provided video background (autoplay loop muted), animated headline using CSS keyframes, and two CTA buttons
- Google Fonts import matching brand mood
- CSS custom properties for colors, fonts, spacing
- Features/Services section: 6 cards in responsive CSS grid (auto-fit minmax 260px)
- Gallery section using provided imageUrls in a grid
- Testimonials section with glassmorphism cards (backdrop-filter blur)
- Pricing section with 3 tiers
- Contact/booking form (name, email, phone, message)
- Footer with copyright
- Intersection Observer fade-in animations on all sections
- Hover glow effects on cards (box-shadow transition)
- Fully mobile responsive using CSS Grid + clamp() typography
- NO external JS libraries — vanilla JS only
- Real relevant copy for the specific business (NO lorem ipsum)
Return ONLY valid JSON (no markdown, no code fences):
{"variations":[{"id":"cinematic","name":"Cinematic Dark","mood":"Premium dark neon","fontPair":"Playfair Display / Inter","palette":["#06b6d4","#8b5cf6","#030712"],"qualityScore":97,"html":"<!DOCTYPE html>..."},{"id":"editorial","name":"Editorial Luxe","mood":"Light editorial gold","fontPair":"Cormorant Garamond / Lato","palette":["#f59e0b","#ef4444","#fafaf9"],"qualityScore":95,"html":"<!DOCTYPE html>..."},{"id":"neon","name":"Neon Studio","mood":"Bold vibrant gradient","fontPair":"Space Grotesk / DM Sans","palette":["#22c55e","#06b6d4","#0f172a"],"qualityScore":94,"html":"<!DOCTYPE html>..."}]}`;

export async function onRequestPost(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return new Response(null, { headers: corsH() });
  try {
    const body = await request.json();
    const { prompt, imageUrls = [], videoUrl = '' } = body;
    if (!prompt || prompt.trim().length < 3) return jsonR({ error: 'Prompt is required' }, 400);

    const geminiKey = env.GEMINI_API_KEY || '';

    // Subject-aware media. Every site gets a hero video + 4-8 photos
    // matched to the actual business. Free-first: Pexels -> Unsplash ->
    // Workers AI -> Coverr default. See functions/api/_media.js.
    let vid, imgs;
    if (videoUrl && imageUrls.length) {
      vid = videoUrl;
      imgs = imageUrls;
    } else {
      const origin = new URL(request.url).origin;
      const media = await selectMedia(prompt, env, origin);
      vid = videoUrl || media.videoUrl;
      imgs = imageUrls.length ? imageUrls : media.imageUrls;
    }
    const brief = analyzePrompt(prompt, extractName(prompt));

    const enriched = `Business prompt: "${prompt}"\nHero video URL: ${vid}\nGallery images: ${imgs.join(', ')}\nGenerate 3 complete premium website variations. Write real copy specific to this business.`;

    let parsed = null;
    if (geminiKey) {
      const gRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: [{ parts: [{ text: enriched }] }],
            generationConfig: { temperature: 0.85, maxOutputTokens: 8192, responseMimeType: 'application/json' },
          }),
        }
      );

      if (gRes.ok) {
        const gData = await gRes.json();
        const raw = gData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        try {
          parsed = JSON.parse(raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim());
        } catch {
          const m = raw.match(/\{[\s\S]*\}/);
          if (m) { try { parsed = JSON.parse(m[0]); } catch { parsed = null; } }
        }
      }
    }
    if (!parsed?.variations?.length) {
      parsed = buildFallback(prompt, vid, imgs);
    }

    parsed.variations = parsed.variations.map(v => {
      const candidateHtml = v.html || '';
      const match = validatePromptMatch(candidateHtml, brief);
      const html = match.passed ? candidateHtml : buildHtml(prompt, vid, imgs, v);
      return {
        ...v,
        html: injectWM(html),
        promptMatch: validatePromptMatch(html, brief),
      };
    });

    return jsonR({ brief: publicBrief(brief), variations: parsed.variations });
  } catch (err) {
    return jsonR({ error: 'Internal error', details: err.message }, 500);
  }
}

function injectWM(html) {
  const css = `<style id="vtw-wm">#vtw-top{position:fixed;top:0;left:0;right:0;z-index:99999;background:linear-gradient(90deg,rgba(6,182,212,.18),rgba(139,92,246,.18));border-bottom:1px solid rgba(6,182,212,.25);color:rgba(255,255,255,.9);font:700 11px/1 'Inter',system-ui,sans-serif;text-align:center;padding:8px;pointer-events:none;backdrop-filter:blur(6px);letter-spacing:.04em}#vtw-wm{position:fixed;bottom:16px;right:16px;z-index:99999;background:rgba(0,0,0,.75);color:#06b6d4;font:700 11px/1 'Inter',system-ui,sans-serif;padding:7px 14px;border-radius:8px;border:1px solid rgba(6,182,212,.4);pointer-events:none;backdrop-filter:blur(8px);box-shadow:0 0 20px rgba(6,182,212,.2);letter-spacing:.06em}</style>`;
  const els = `<div id="vtw-top">&#128274; PREVIEW ONLY &#8212; Purchase to unlock your site at VoiceToWebsite.com</div><div id="vtw-wm">&#169; VoiceToWebsite.com</div>`;
  if (html.includes('</head>')) html = html.replace('</head>', css + '</head>');
  if (html.includes('</body>')) html = html.replace('</body>', els + '</body>');
  else html += els;
  return html;
}

function buildFallback(prompt, vid, imgs) {
  return {
    variations: [
      { id: 'cinematic', name: 'Cinematic Dark', mood: 'Premium dark neon', fontPair: 'Playfair Display / Inter', palette: ['#06b6d4', '#8b5cf6', '#030712'], qualityScore: 96, html: buildHtml(prompt, vid, imgs, { palette: ['#06b6d4', '#8b5cf6', '#030712'], fontPair: 'Playfair Display / Inter' }) },
      { id: 'editorial', name: 'Editorial Luxe', mood: 'Rich editorial gold', fontPair: 'Cormorant Garamond / Lato', palette: ['#f59e0b', '#ef4444', '#111827'], qualityScore: 94, html: buildHtml(prompt, vid, imgs, { palette: ['#f59e0b', '#ef4444', '#111827'], fontPair: 'Cormorant Garamond / Lato' }) },
      { id: 'neon', name: 'Neon Studio', mood: 'Bold vibrant gradient', fontPair: 'Space Grotesk / DM Sans', palette: ['#22c55e', '#06b6d4', '#0f172a'], qualityScore: 93, html: buildHtml(prompt, vid, imgs, { palette: ['#22c55e', '#06b6d4', '#0f172a'], fontPair: 'Space Grotesk / DM Sans' }) },
    ],
  };
}

function buildHtml(prompt, vid, imgs, variant) {
  const name = extractName(prompt);
  const business = analyzePrompt(prompt, name);
  const [a, a2, bg] = variant.palette || ['#06b6d4', '#8b5cf6', '#030712'];
  const [hf, bf] = (variant.fontPair || 'Playfair Display / Inter').split('/').map(s => s.trim());
  const gallery = imgs.slice(0, 6).map((u, i) => `<div class="gi fade-in"><img src="${esc(u)}" alt="${business.galleryAlts[i % business.galleryAlts.length]}" loading="lazy"></div>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${business.pageTitle}</title>
<meta name="description" content="${business.metaDescription}">
<link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(hf)}:wght@400;700;900&family=${encodeURIComponent(bf)}:wght@400;500;600&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--a:${a};--a2:${a2};--bg:${bg};--hf:'${hf}',serif;--bf:'${bf}',system-ui,sans-serif}
html{scroll-behavior:smooth}
body{background:var(--bg);color:#fff;font-family:var(--bf);overflow-x:hidden}
nav{position:fixed;top:40px;left:0;right:0;z-index:100;display:flex;align-items:center;justify-content:space-between;padding:16px 5vw;background:rgba(0,0,0,.55);backdrop-filter:blur(14px);border-bottom:1px solid rgba(255,255,255,.08)}
.logo{font-family:var(--hf);font-size:1.4rem;font-weight:900;background:linear-gradient(90deg,var(--a),var(--a2));-webkit-background-clip:text;-webkit-text-fill-color:transparent}
nav ul{display:flex;gap:2rem;list-style:none}
nav a{color:rgba(255,255,255,.7);text-decoration:none;font-size:.85rem;letter-spacing:.06em;transition:color .2s}
nav a:hover{color:var(--a)}
.btn{display:inline-block;padding:.85rem 2.4rem;background:linear-gradient(135deg,var(--a),var(--a2));color:#fff;border-radius:50px;font-weight:700;text-decoration:none;font-size:.95rem;transition:transform .2s,box-shadow .2s;border:none;cursor:pointer}
.btn:hover{transform:translateY(-3px);box-shadow:0 14px 40px rgba(0,0,0,.45)}
.btn-g{background:transparent;border:2px solid var(--a);color:var(--a);margin-left:1rem}
.hero{position:relative;height:100vh;display:flex;align-items:center;justify-content:center;overflow:hidden}
.hero video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.4}
.hero-ov{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,.25),rgba(0,0,0,.75))}
.hc{position:relative;z-index:2;text-align:center;padding:0 5vw;max-width:960px}
.hc h1{font-family:var(--hf);font-size:clamp(2.8rem,7vw,6.5rem);font-weight:900;line-height:1.04;margin-bottom:1.5rem;animation:hIn 1s ease both}
.hc p{font-size:clamp(1rem,2vw,1.35rem);color:rgba(255,255,255,.8);max-width:620px;margin:0 auto 2.5rem;animation:hIn 1.2s ease both}
@keyframes hIn{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:none}}
section{padding:6rem 5vw}
.lbl{font-size:.72rem;letter-spacing:.22em;text-transform:uppercase;color:var(--a);margin-bottom:.75rem;font-weight:700}
h2{font-family:var(--hf);font-size:clamp(2rem,4vw,3.5rem);font-weight:900;margin-bottom:1.5rem;line-height:1.1}
.g3{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:2rem;margin-top:3rem}
.card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:18px;padding:2rem;transition:transform .3s,box-shadow .3s,border-color .3s}
.card:hover{transform:translateY(-7px);box-shadow:0 20px 60px rgba(0,0,0,.5),0 0 0 1px var(--a);border-color:var(--a)}
.ci{font-size:2.4rem;margin-bottom:1rem}
.card h3{font-family:var(--hf);font-size:1.25rem;margin-bottom:.6rem}
.card p{color:rgba(255,255,255,.6);line-height:1.75;font-size:.93rem}
.gg{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.5rem;margin-top:3rem}
.gi{border-radius:14px;overflow:hidden;aspect-ratio:16/9}
.gi img{width:100%;height:100%;object-fit:cover;transition:transform .4s}
.gi:hover img{transform:scale(1.07)}
.tg{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:2rem;margin-top:3rem}
.tc{background:rgba(255,255,255,.06);backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,.12);border-radius:18px;padding:2rem}
.tc p{font-size:1.02rem;line-height:1.8;color:rgba(255,255,255,.82);font-style:italic;margin-bottom:1.25rem}
.tc .au{font-weight:700;color:var(--a);font-size:.9rem}
.pg{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:2rem;margin-top:3rem}
.pc{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:2.5rem;text-align:center;transition:transform .3s,border-color .3s}
.pc.ft{border-color:var(--a);background:rgba(6,182,212,.07)}
.pc:hover{transform:translateY(-6px);border-color:var(--a)}
.pr{font-family:var(--hf);font-size:3rem;font-weight:900;color:var(--a)}
.pr span{font-size:1rem;color:rgba(255,255,255,.45)}
.pl{list-style:none;margin:1.5rem 0;text-align:left}
.pl li{padding:.45rem 0;border-bottom:1px solid rgba(255,255,255,.06);color:rgba(255,255,255,.72);font-size:.9rem}
.pl li::before{content:"- ";color:var(--a);font-weight:900}
.fw{max-width:620px;margin:3rem auto 0}
.fg{margin-bottom:1.5rem}
.fg label{display:block;margin-bottom:.45rem;color:rgba(255,255,255,.65);font-size:.88rem}
.fg input,.fg textarea{width:100%;padding:.9rem 1.2rem;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);border-radius:10px;color:#fff;font-family:var(--bf);font-size:.97rem;transition:border-color .2s}
.fg input:focus,.fg textarea:focus{outline:none;border-color:var(--a)}
.fg textarea{resize:vertical;min-height:130px}
footer{padding:3rem 5vw;border-top:1px solid rgba(255,255,255,.08);text-align:center;color:rgba(255,255,255,.38);font-size:.83rem}
.fade-in{opacity:0;transform:translateY(28px);transition:opacity .7s ease,transform .7s ease}
.fade-in.visible{opacity:1;transform:none}
@media(max-width:768px){nav ul{display:none}.btn-g{display:none}}
</style>
</head>
<body>
<nav>
  <div class="logo">${name}</div>
  <ul>
    <li><a href="#services">Services</a></li>
    <li><a href="#gallery">Gallery</a></li>
    <li><a href="#pricing">Pricing</a></li>
    <li><a href="#contact">Contact</a></li>
  </ul>
  <a href="#contact" class="btn" style="padding:.6rem 1.4rem;font-size:.82rem">Get Started</a>
</nav>
<section class="hero">
  <video src="${vid}" autoplay loop muted playsinline></video>
  <div class="hero-ov"></div>
  <div class="hc">
    <h1>${business.headline}</h1>
    <p>${business.subhead}</p>
    <a href="#contact" class="btn">${business.primaryCta}</a>
    <a href="#services" class="btn btn-g">Learn More</a>
  </div>
</section>
<section id="services">
  <div class="lbl">What We Offer</div>
  <h2>${business.serviceTitle}</h2>
  <p style="color:rgba(255,255,255,.6);max-width:580px;line-height:1.8">${business.serviceIntro}</p>
  <div class="g3">
    ${business.services.map((item) => `<div class="card fade-in"><div class="ci">${item.icon}</div><h3>${item.title}</h3><p>${item.copy}</p></div>`).join('')}
  </div>
</section>
<section id="gallery" style="background:rgba(255,255,255,.02)">
  <div class="lbl">${business.galleryLabel}</div>
  <h2>${business.galleryTitle}</h2>
  <div class="gg">${gallery}</div>
</section>
<section style="background:rgba(255,255,255,.03)">
  <div class="lbl">Client Love</div>
  <h2>${business.testimonialTitle}</h2>
  <div class="tg">
    ${business.testimonials.map((item) => `<div class="tc fade-in"><p>"${item.quote}"</p><div class="au">&#8212; ${item.author}</div></div>`).join('')}
  </div>
</section>
<section id="pricing">
  <div class="lbl">${business.pricingLabel}</div>
  <h2>${business.pricingTitle}</h2>
  <div class="pg">
    ${business.plans.map((plan, index) => `<div class="pc ${index === 1 ? 'ft' : ''} fade-in"><h3>${plan.name}</h3><div class="pr">${plan.price}<span>${plan.unit}</span></div><ul class="pl">${plan.features.map((feature) => `<li>${feature}</li>`).join('')}</ul><a href="#contact" class="btn" style="width:100%;text-align:center;display:block;margin-top:1.5rem">${plan.cta}</a></div>`).join('')}
  </div>
</section>
<section id="contact">
  <div class="lbl">Get In Touch</div>
  <h2>${business.contactTitle}</h2>
  <div class="fw fade-in">
    <div class="fg"><label>Full Name</label><input type="text" placeholder="Your full name"></div>
    <div class="fg"><label>Email Address</label><input type="email" placeholder="your@email.com"></div>
    <div class="fg"><label>Phone Number</label><input type="tel" placeholder="+1 (555) 000-0000"></div>
    <div class="fg"><label>${business.messageLabel}</label><textarea placeholder="${business.messagePlaceholder}"></textarea></div>
    <button class="btn" style="width:100%" type="button">${business.primaryCta}</button>
  </div>
</section>
<footer>
  <p style="font-family:var(--hf);font-size:1.1rem;color:var(--a);margin-bottom:.5rem">${name}</p>
  <p>&#169; ${new Date().getFullYear()} ${name}. All rights reserved. | Preview generated by VoiceToWebsite.com</p>
</footer>
<script>
const obs = new IntersectionObserver(entries => entries.forEach(e => { if(e.isIntersecting){ e.target.classList.add('visible'); obs.unobserve(e.target); } }), { threshold: 0.12 });
document.querySelectorAll('.fade-in').forEach(el => obs.observe(el));
</script>
</body>
</html>`;
}

function publicBrief(brief) {
  return {
    businessName: unesc(brief.businessName),
    pageTitle: unesc(brief.pageTitle),
    industry: brief.industryLabel,
    audience: unesc(brief.audience),
    tone: brief.toneLabel,
    primaryCta: unesc(brief.primaryCta),
    requestedSections: brief.requestedItems,
    requiredTerms: brief.requiredTerms,
  };
}

function validatePromptMatch(html, brief) {
  const text = stripHtml(html).toLowerCase();
  const required = brief.requiredTerms || [];
  const matched = required.filter((term) => text.includes(term.toLowerCase()));
  const missing = required.filter((term) => !text.includes(term.toLowerCase()));
  const score = required.length ? Math.round((matched.length / required.length) * 100) : 100;
  return { passed: score >= 80, score, matched, missing };
}

function stripHtml(value) {
  return String(value || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");
}

function analyzePrompt(prompt, name) {
  const raw = String(prompt || "").replace(/\s+/g, " ").trim();
  const p = raw.toLowerCase();
  const safeName = esc(name);
  const industry = detectIndustry(p);
  const requested = extractRequestedItems(raw, industry);
  const tone = extractTone(p);
  const audience = extractAudience(raw, industry);
  const cta = primaryCta(p, industry);
  const coreOffer = requested[0] || industry.offer;
  const pageTitle = `${safeName} | ${toTitle(coreOffer)} ${industry.titleSuffix}`;

  const services = requested.slice(0, 6).map((item, index) => serviceCard(item, index, industry, safeName));
  while (services.length < 6) {
    services.push(serviceCard(industry.defaults[services.length % industry.defaults.length], services.length, industry, safeName));
  }

  return {
    businessName: safeName,
    industryLabel: industry.label,
    audience,
    toneLabel: tone.replace(/^A\s+/i, ""),
    requestedItems: requested,
    requiredTerms: requiredTermsFor(name, requested, industry),
    pageTitle: esc(pageTitle),
    metaDescription: esc(`${safeName} ${industry.metaVerb} ${requested.slice(0, 4).join(", ")} for ${audience}.`),
    headline: esc(`${safeName} ${industry.headlineVerb} ${toTitle(coreOffer)}`),
    subhead: esc(`${tone} ${industry.label} website for ${audience}, built around ${joinHuman(requested.slice(0, 4))}.`),
    serviceTitle: esc(`${toTitle(industry.serviceNoun)} Built From Your Prompt`),
    serviceIntro: esc(`${safeName} needs pages that talk about ${joinHuman(requested.slice(0, 5))}. These cards are generated from that request, not a generic layout.`),
    galleryLabel: esc(`${toTitle(industry.label)} Visuals`),
    galleryTitle: esc(`${safeName} ${toTitle(coreOffer)} Gallery`),
    galleryAlts: requested.map((item) => esc(`${safeName} ${item} website visual`)),
    testimonialTitle: esc(`${toTitle(industry.proofNoun)} for ${safeName}`),
    pricingLabel: esc(`${toTitle(industry.packageNoun)} Options`),
    pricingTitle: esc(`${toTitle(coreOffer)} Packages`),
    contactTitle: esc(`${cta} With ${safeName}`),
    messageLabel: esc(industry.messageLabel),
    messagePlaceholder: esc(`${industry.messagePrompt} Mention ${requested.slice(0, 3).join(", ")} if that is what you need.`),
    primaryCta: esc(cta),
    services,
    testimonials: testimonialCards(safeName, requested, industry),
    plans: pricingCards(requested, industry, cta),
  };
}

function requiredTermsFor(name, requested, industry) {
  return unique([
    cleanName(name).toLowerCase(),
    ...requested.slice(0, 5).map((item) => item.toLowerCase()),
    industry.label.toLowerCase(),
  ]).filter((term) => term.length > 2);
}

const INDUSTRIES = {
  restaurant: {
    label: "restaurant",
    titleSuffix: "Restaurant",
    offer: "reservations",
    headlineVerb: "Makes Every Visit Start With",
    metaVerb: "promotes",
    serviceNoun: "menu and reservation sections",
    proofNoun: "guest trust",
    packageNoun: "dining",
    messageLabel: "Reservation or event details",
    messagePrompt: "Tell us your party size, preferred date, menu interest, event type, or catering request.",
    defaults: ["chef menu", "online reservations", "wine room", "private dining", "seasonal specials", "location and hours"],
  },
  beauty: {
    label: "beauty and wellness",
    titleSuffix: "Appointments",
    offer: "appointments",
    headlineVerb: "Turns Interest Into",
    metaVerb: "books",
    serviceNoun: "services and appointments",
    proofNoun: "client confidence",
    packageNoun: "treatment",
    messageLabel: "Service or appointment request",
    messagePrompt: "Tell us the service, date, provider preference, treatment goal, or event.",
    defaults: ["service menu", "online booking", "treatment benefits", "provider profiles", "before and after gallery", "client reviews"],
  },
  fitness: {
    label: "fitness",
    titleSuffix: "Training",
    offer: "training signups",
    headlineVerb: "Builds Momentum Through",
    metaVerb: "sells",
    serviceNoun: "programs and memberships",
    proofNoun: "member results",
    packageNoun: "training",
    messageLabel: "Training goal",
    messagePrompt: "Tell us your goal, experience level, preferred schedule, and program interest.",
    defaults: ["personal training", "group classes", "transformation plans", "membership options", "coach profiles", "progress tracking"],
  },
  law: {
    label: "legal",
    titleSuffix: "Consultations",
    offer: "consultations",
    headlineVerb: "Builds Trust Around",
    metaVerb: "explains",
    serviceNoun: "practice areas",
    proofNoun: "case confidence",
    packageNoun: "consultation",
    messageLabel: "Legal matter",
    messagePrompt: "Tell us the practice area, urgency, location, and consultation request.",
    defaults: ["practice areas", "attorney credentials", "case evaluations", "consultation booking", "client confidentiality", "local representation"],
  },
  realestate: {
    label: "real estate",
    titleSuffix: "Listings",
    offer: "qualified property leads",
    headlineVerb: "Converts Searches Into",
    metaVerb: "showcases",
    serviceNoun: "listings and lead capture",
    proofNoun: "buyer and seller confidence",
    packageNoun: "property",
    messageLabel: "Property goal",
    messagePrompt: "Tell us whether you are buying, selling, investing, or booking a showing.",
    defaults: ["featured listings", "home valuation", "buyer consultation", "seller strategy", "neighborhood guide", "showing requests"],
  },
  saas: {
    label: "software",
    titleSuffix: "Product Demo",
    offer: "product demos",
    headlineVerb: "Explains and Sells",
    metaVerb: "positions",
    serviceNoun: "features and demos",
    proofNoun: "product proof",
    packageNoun: "software",
    messageLabel: "Product interest",
    messagePrompt: "Tell us your team size, use case, integration needs, and demo timing.",
    defaults: ["product dashboard", "automation workflow", "integrations", "security", "pricing", "demo booking"],
  },
  store: {
    label: "commerce",
    titleSuffix: "Shop",
    offer: "featured products",
    headlineVerb: "Turns Browsers Into Buyers With",
    metaVerb: "sells",
    serviceNoun: "products and collections",
    proofNoun: "buyer trust",
    packageNoun: "shopping",
    messageLabel: "Product request",
    messagePrompt: "Tell us what product, collection, size, style, or delivery option you want.",
    defaults: ["featured products", "new arrivals", "best sellers", "customer reviews", "shipping details", "secure checkout"],
  },
  general: {
    label: "business",
    titleSuffix: "Website",
    offer: "customer inquiries",
    headlineVerb: "Turns Visitors Into",
    metaVerb: "presents",
    serviceNoun: "offers and conversion paths",
    proofNoun: "customer trust",
    packageNoun: "service",
    messageLabel: "Project details",
    messagePrompt: "Tell us what you need, who it is for, and what should happen next.",
    defaults: ["core offer", "service details", "customer proof", "booking flow", "media gallery", "contact form"],
  },
};

function detectIndustry(p) {
  if (/restaurant|bistro|cafe|coffee|food|bar|bakery|chef|menu|wine|reservation/.test(p)) return INDUSTRIES.restaurant;
  if (/spa|salon|beauty|hair|makeup|skin|wellness|massage|treatment|appointment/.test(p)) return INDUSTRIES.beauty;
  if (/fitness|gym|trainer|coach|yoga|workout|health|membership/.test(p)) return INDUSTRIES.fitness;
  if (/law|legal|attorney|lawyer|firm|consultation/.test(p)) return INDUSTRIES.law;
  if (/real estate|realtor|property|homes?|listing|showing/.test(p)) return INDUSTRIES.realestate;
  if (/saas|software|app|startup|platform|ai|tech|dashboard|demo/.test(p)) return INDUSTRIES.saas;
  if (/store|shop|ecommerce|e-commerce|product|boutique|checkout|collection/.test(p)) return INDUSTRIES.store;
  return INDUSTRIES.general;
}

function extractRequestedItems(prompt, industry) {
  const promptDetails = [];
  const detailMatch = prompt.match(/\b(?:with|including|include|needs?|has|featuring)\s+(.+)$/i);
  if (detailMatch?.[1]) {
    const detailText = detailMatch[1].replace(/before and after/gi, "before-after");
    promptDetails.push(
      ...detailText
        .split(/\s*(?:,|;|\+|\band\b)\s*/i)
        .map((item) => item.trim())
        .map((item) => item.replace(/before-after/gi, "before and after"))
        .filter((item) => item.length > 2)
    );
  }
  const cleaned = prompt
    .replace(/\b(build|create|make|design|generate|website|site|landing page|homepage|for|called|named|with|and|that|has|needs?|including|include|using|a|an|the)\b/gi, " ")
    .replace(/[^a-z0-9&$%.\-\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  const phrases = cleaned
    .split(/\s*(?:,|;|\+|\band\b|\bwith\b)\s*/i)
    .map((item) => item.trim())
    .filter((item) => item.length > 2 && !isMostlyBrand(item, prompt));

  const keywordMatches = industry.defaults.filter((item) => prompt.toLowerCase().includes(item.split(" ")[0]));
  return unique([...promptDetails, ...phrases, ...keywordMatches, ...industry.defaults]).slice(0, 8);
}

function isMostlyBrand(item, prompt) {
  const name = extractName(prompt).toLowerCase();
  return name && item.toLowerCase().includes(name);
}

function serviceCard(item, index, industry, safeName) {
  const title = esc(toTitle(item));
  const copy = esc(copyForItem(item, industry, safeName));
  return { icon: String(index + 1).padStart(2, "0"), title, copy };
}

function copyForItem(item, industry, safeName) {
  const lower = item.toLowerCase();
  if (/video|background|media|gallery|photo|image/.test(lower)) return `${safeName} uses this visual section to show atmosphere, quality, and proof before visitors decide.`;
  if (/book|reservation|appointment|schedule|demo|consultation|showing/.test(lower)) return `Visitors can move directly from interest to action with a clear ${item} flow.`;
  if (/menu|product|collection|listing|program|service|practice/.test(lower)) return `This section presents ${item} clearly so customers understand what is available and why it matters.`;
  if (/review|testimonial|proof|case|result/.test(lower)) return `Trust content supports ${item} with specific claims, outcomes, and reasons to take the next step.`;
  if (/price|pricing|package|membership|plan/.test(lower)) return `Package copy for ${item} helps visitors compare options without slowing down the sale.`;
  return `${safeName} gets a dedicated section for ${item}, written in the same language the customer asked for.`;
}

function testimonialCards(safeName, requested, industry) {
  const a = requested[0] || industry.offer;
  const b = requested[1] || industry.defaults[1];
  const c = requested[2] || industry.defaults[2];
  return [
    { quote: esc(`${safeName} made ${a} clear right away.`), author: "Verified Customer" },
    { quote: esc(`I found ${b} without searching through filler.`), author: "Local Client" },
    { quote: esc(`The page explained ${c} and gave me a reason to reach out.`), author: "New Lead" },
  ];
}

function pricingCards(requested, industry, cta) {
  const base = requested.slice(0, 5);
  return [
    { name: esc(`Essential ${toTitle(industry.packageNoun)}`), price: "$497", unit: "/start", features: base.slice(0, 3).map(toTitle), cta: esc(cta) },
    { name: esc(`Complete ${toTitle(industry.packageNoun)}`), price: "$997", unit: "/build", features: base.slice(0, 4).map(toTitle), cta: "Most Popular" },
    { name: esc(`Premium ${toTitle(industry.packageNoun)}`), price: "$2,497", unit: "/launch", features: base.slice(0, 5).map(toTitle), cta: "Contact Us" },
  ];
}

function extractTone(p) {
  if (/luxury|premium|elegant|upscale|high end/.test(p)) return "A premium";
  if (/dark|black|neon|cyber|bold/.test(p)) return "A bold";
  if (/minimal|clean|simple/.test(p)) return "A clean";
  if (/fun|colorful|playful/.test(p)) return "A lively";
  return "A custom";
}

function extractAudience(prompt, industry) {
  const m = prompt.match(/\b(?:for|serving|targeting|made for)\s+([^.,;]{4,80})/i);
  if (m?.[1] && !/called|named|brand|business/i.test(m[1])) return esc(m[1].trim());
  return esc(industry.label === "restaurant" ? "hungry local guests" : industry.label === "software" ? "teams comparing products" : `${industry.label} customers`);
}

function primaryCta(p, industry) {
  if (/reservation|reserve/.test(p)) return "Reserve a Table";
  if (/appointment|book|schedule/.test(p)) return "Book Now";
  if (/demo/.test(p)) return "Book a Demo";
  if (/shop|buy|product/.test(p)) return "Shop Now";
  if (/consult/.test(p)) return "Request Consultation";
  return industry.label === "restaurant" ? "Reserve a Table" : industry.label === "commerce" ? "Shop Now" : "Start Today";
}

function extractName(prompt) {
  const quoted = prompt.match(/["']([^"']{3,80})["']/);
  if (quoted?.[1]) return cleanName(quoted[1]);
  const m = prompt.match(/\b(?:for|called|named|brand|business)\s+([A-Za-z0-9&.\-\s]{3,70})/i);
  if (m?.[1]) return cleanName(m[1].replace(/\b(with|that|and|using|needs?|including|include|has)\b.*$/i, ""));
  return cleanName(prompt.split(/\s+/).slice(0, 4).join(' '));
}

function cleanName(value) {
  return String(value || "Generated Brand").trim().replace(/[.,;:!?]+$/, '').slice(0, 70) || "Generated Brand";
}

function toTitle(value) {
  return String(value || "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b[a-z]/gi, (char) => char.toUpperCase());
}

function joinHuman(items) {
  const clean = items.filter(Boolean).map((item) => item.toLowerCase());
  if (clean.length <= 1) return clean[0] || "the requested offer";
  return `${clean.slice(0, -1).join(", ")} and ${clean[clean.length - 1]}`;
}

function unique(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = item.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function esc(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function unesc(value) {
  return String(value || "")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&amp;/g, "&");
}

function corsH() {
  return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
}

function jsonR(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...corsH() } });
}
