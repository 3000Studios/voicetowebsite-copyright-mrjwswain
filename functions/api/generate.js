// functions/api/generate.js — Premium Website Generator (VoiceToWebsite.com)
// Calls Gemini 2.0 Flash with rich system prompt to produce full HTML/CSS previews

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
    const vid = videoUrl || 'https://cdn.coverr.co/videos/coverr-working-in-a-modern-office-1565/1080p.mp4';
    const imgs = imageUrls.length ? imageUrls : ['https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1600&q=80'];

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

    parsed.variations = parsed.variations.map(v => ({
      ...v,
      html: injectWM(v.html || buildHtml(prompt, vid, imgs, v)),
    }));

    return jsonR({ variations: parsed.variations });
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
  const gallery = imgs.slice(0, 6).map((u, i) => `<div class="gi fade-in"><img src="${u}" alt="Project ${i + 1}" loading="lazy"></div>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${name}</title>
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
.pl li::before{content:"✓ ";color:var(--a);font-weight:900}
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

function analyzePrompt(prompt, name) {
  const p = prompt.toLowerCase();
  const safeName = esc(name);
  const isRestaurant = /restaurant|bistro|cafe|coffee|food|bar|bakery|chef|menu/.test(p);
  const isBeauty = /spa|salon|beauty|hair|makeup|skin|wellness|massage/.test(p);
  const isFitness = /fitness|gym|trainer|coach|yoga|workout|health/.test(p);
  const isLaw = /law|legal|attorney|lawyer|firm/.test(p);
  const isRealEstate = /real estate|realtor|property|homes?|listing/.test(p);
  const isSaas = /saas|software|app|startup|platform|ai|tech/.test(p);
  const isStore = /store|shop|ecommerce|e-commerce|product|boutique/.test(p);
  const wantsBooking = /book|booking|appointment|reservation|schedule/.test(p);
  const wantsDark = /dark|black|neon|cyber|night/.test(p);
  const wantsLuxury = /luxury|premium|elegant|high end|upscale/.test(p);

  const tone = wantsLuxury ? "premium" : wantsDark ? "bold" : "conversion-ready";
  const cta = wantsBooking || isRestaurant || isBeauty || isFitness ? "Book Now" : isStore ? "Shop Now" : isSaas ? "Request Demo" : "Start Today";

  let profile = {
    headline: `${safeName} Built Around Your Customer's Next Click`,
    subhead: `A ${tone} website preview shaped directly from your request: ${esc(prompt.slice(0, 130))}${prompt.length > 130 ? "..." : ""}`,
    serviceTitle: `What ${safeName} Can Offer`,
    serviceIntro: "This preview turns your prompt into real business sections, useful copy, visual media, and a clear conversion path.",
    galleryLabel: "Visual Direction",
    galleryTitle: `${safeName} Media Preview`,
    testimonialTitle: `Why Customers Choose ${safeName}`,
    pricingLabel: "Packages",
    pricingTitle: "Choose the Right Starting Point",
    contactTitle: `Talk With ${safeName}`,
    messageLabel: "What do you need?",
    messagePlaceholder: "Tell us what you want to build, buy, book, or improve...",
    primaryCta: cta,
    services: [
      { icon: "⚡", title: "Fast Response", copy: "Give visitors a clear next step with direct calls to action and fast-loading sections." },
      { icon: "🎯", title: "Focused Offers", copy: "Turn your core services into easy-to-scan cards, benefits, and proof points." },
      { icon: "📈", title: "Conversion Flow", copy: "Guide customers from the hero section into trust, pricing, and contact without friction." },
      { icon: "🎬", title: "Video-Led Story", copy: "Use motion and media to make the brand feel active, credible, and premium." },
      { icon: "🔎", title: "SEO Structure", copy: "Ship with semantic sections, keyword-rich headings, and crawlable content." },
      { icon: "💎", title: "Polished Brand", copy: "Give the business a finished visual system instead of a generic template." },
    ],
    testimonials: [
      { quote: `${safeName} made the decision easy from the first visit.`, author: "Avery R., Customer" },
      { quote: "The page answered my questions quickly and gave me a reason to reach out.", author: "Morgan T., Client" },
      { quote: "The design felt custom, trustworthy, and ready for business.", author: "Jordan K., Buyer" },
    ],
    plans: [
      { name: "Starter", price: "$497", unit: "/project", features: ["Homepage", "Mobile responsive", "Lead form", "SEO-ready copy", "Fast launch"], cta: cta },
      { name: "Professional", price: "$997", unit: "/project", features: ["Expanded pages", "Video hero", "Gallery", "Testimonials", "Analytics-ready"], cta: "Most Popular" },
      { name: "Premium", price: "$2,497", unit: "/project", features: ["Custom sections", "Advanced conversion flow", "Media library", "Priority launch", "Growth support"], cta: "Contact Us" },
    ],
  };

  if (isRestaurant) {
    profile = {
      ...profile,
      headline: `${safeName} Serves an Experience Worth Reserving`,
      subhead: "A restaurant-ready website with atmosphere, menu highlights, reservations, social proof, and food-forward media.",
      serviceTitle: "Menu, Reservations, and Hospitality Flow",
      serviceIntro: "Show signature dishes, location, hours, private events, and reservation actions in one premium path.",
      messageLabel: "Reservation or event details",
      messagePlaceholder: "Tell us your party size, date, event type, or catering request...",
      services: [
        { icon: "🍽️", title: "Signature Menu", copy: "Highlight best-selling dishes, drinks, chef specials, and seasonal offers." },
        { icon: "📅", title: "Reservations", copy: "Move guests from interest to booking with clear date, party, and contact fields." },
        { icon: "📍", title: "Location and Hours", copy: "Make hours, parking, directions, and service windows easy to find." },
        { icon: "🎉", title: "Private Events", copy: "Promote catering, private dining, birthdays, and group reservations." },
        { icon: "⭐", title: "Guest Reviews", copy: "Use social proof to build trust before guests arrive." },
        { icon: "📸", title: "Food Gallery", copy: "Let strong visuals sell the atmosphere and menu before the first click." },
      ],
    };
  } else if (isBeauty) {
    profile = {
      ...profile,
      headline: `${safeName} Turns Self-Care Into a Premium Booking`,
      subhead: "A beauty and wellness preview built around services, appointments, treatment trust, and visual polish.",
      serviceTitle: "Appointments, Treatments, and Client Confidence",
      serviceIntro: "Show service menus, stylist or provider expertise, before-and-after visuals, and appointment CTAs.",
      messageLabel: "Service or appointment request",
      messagePlaceholder: "Tell us the service, date, provider preference, or treatment goal...",
      services: [
        { icon: "✨", title: "Signature Services", copy: "Present treatments, packages, pricing cues, and appointment-ready details." },
        { icon: "📅", title: "Online Booking", copy: "Push visitors toward scheduling with frictionless calls to action." },
        { icon: "🧴", title: "Treatment Trust", copy: "Explain benefits, safety, process, and expected outcomes clearly." },
        { icon: "👩‍🎨", title: "Provider Profiles", copy: "Show expertise, style, and personality to build confidence." },
        { icon: "📷", title: "Before and After", copy: "Use visual proof to show transformation and quality." },
        { icon: "💬", title: "Client Reviews", copy: "Put testimonials near service CTAs to lift booking intent." },
      ],
    };
  } else if (isFitness) {
    profile = {
      ...profile,
      headline: `${safeName} Builds Momentum Before the First Session`,
      subhead: "A fitness-focused preview with programs, coaching proof, memberships, transformation stories, and signup CTAs.",
      serviceTitle: "Training, Programs, and Membership Growth",
      serviceIntro: "Turn classes, coaching, plans, and testimonials into a high-energy funnel for leads and signups.",
    };
  } else if (isLaw) {
    profile = {
      ...profile,
      headline: `${safeName} Makes Legal Help Clear and Trustworthy`,
      subhead: "A professional legal website preview with practice areas, attorney credibility, consultation CTAs, and trust signals.",
      serviceTitle: "Practice Areas and Consultation Flow",
      serviceIntro: "Help visitors understand services, urgency, credentials, and the safest next step.",
      primaryCta: "Request Consultation",
    };
  } else if (isRealEstate) {
    profile = {
      ...profile,
      headline: `${safeName} Converts Property Interest Into Qualified Leads`,
      subhead: "A real-estate preview with featured listings, neighborhood story, buyer/seller CTAs, and lead capture.",
      serviceTitle: "Listings, Neighborhoods, and Lead Capture",
      serviceIntro: "Showcase properties and guide buyers or sellers into a confident conversation.",
    };
  } else if (isSaas) {
    profile = {
      ...profile,
      headline: `${safeName} Explains the Product and Wins the Demo`,
      subhead: "A SaaS-ready preview with product clarity, benefits, feature cards, pricing, proof, and demo CTAs.",
      serviceTitle: "Product Clarity and Demo Conversion",
      serviceIntro: "Explain what the product does, who it helps, why it is different, and how to start.",
      primaryCta: "Book a Demo",
    };
  } else if (isStore) {
    profile = {
      ...profile,
      headline: `${safeName} Turns Browsers Into Buyers`,
      subhead: "A commerce-ready preview with product story, featured collections, trust badges, and purchase CTAs.",
      serviceTitle: "Products, Collections, and Sales Flow",
      serviceIntro: "Feature what customers can buy, why it matters, and how to complete the purchase.",
      primaryCta: "Shop Now",
    };
  }

  return profile;
}

function extractName(prompt) {
  const m = prompt.match(/\b(?:for|called|named|brand|business)\s+([A-Za-z0-9&.\-\s]{3,50})/i);
  if (m && m[1]) return m[1].trim().replace(/[.,;:!?]+$/, '');
  return prompt.split(/\s+/).slice(0, 4).join(' ');
}

function esc(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function corsH() {
  return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
}

function jsonR(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...corsH() } });
}
