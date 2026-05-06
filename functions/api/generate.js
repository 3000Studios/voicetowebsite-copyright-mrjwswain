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

    const geminiKey = env.GEMINI_API_KEY || 'AIzaSyCBGfV7VjEKmuYkKvzuALs20GFJVUTiIwk';
    const vid = videoUrl || 'https://cdn.coverr.co/videos/coverr-working-in-a-modern-office-1565/1080p.mp4';
    const imgs = imageUrls.length ? imageUrls : ['https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1600&q=80'];

    const enriched = `Business prompt: "${prompt}"\nHero video URL: ${vid}\nGallery images: ${imgs.join(', ')}\nGenerate 3 complete premium website variations. Write real copy specific to this business.`;

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

    let parsed = null;
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
.pl li::before{content:"checkmark ";color:var(--a)}
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
    <h1>Premium ${name} Experience</h1>
    <p>We deliver exceptional results with a commitment to quality, innovation, and your complete satisfaction.</p>
    <a href="#contact" class="btn">Start Your Project</a>
    <a href="#services" class="btn btn-g">Learn More</a>
  </div>
</section>
<section id="services">
  <div class="lbl">What We Offer</div>
  <h2>Our Premium Services</h2>
  <p style="color:rgba(255,255,255,.6);max-width:580px;line-height:1.8">Everything you need to succeed, delivered with precision and care by our expert team.</p>
  <div class="g3">
    <div class="card fade-in"><div class="ci">&#9889;</div><h3>Fast Delivery</h3><p>We work efficiently without compromising quality, ensuring your project launches on time every time.</p></div>
    <div class="card fade-in"><div class="ci">&#127919;</div><h3>Precision Results</h3><p>Every detail is crafted with intention. We focus on what matters most to your business and customers.</p></div>
    <div class="card fade-in"><div class="ci">&#128274;</div><h3>Trusted and Secure</h3><p>Your data and projects are protected with enterprise-grade security and complete confidentiality.</p></div>
    <div class="card fade-in"><div class="ci">&#128200;</div><h3>Growth Focused</h3><p>We build with conversion and growth in mind, turning visitors into loyal, paying customers.</p></div>
    <div class="card fade-in"><div class="ci">&#127760;</div><h3>Global Reach</h3><p>Reach customers anywhere in the world with our globally optimized infrastructure and strategy.</p></div>
    <div class="card fade-in"><div class="ci">&#128142;</div><h3>Premium Quality</h3><p>Top-tier craftsmanship in every deliverable. We never cut corners on quality or customer experience.</p></div>
  </div>
</section>
<section id="gallery" style="background:rgba(255,255,255,.02)">
  <div class="lbl">Our Work</div>
  <h2>Featured Projects</h2>
  <div class="gg">${gallery}</div>
</section>
<section style="background:rgba(255,255,255,.03)">
  <div class="lbl">Client Love</div>
  <h2>What Our Clients Say</h2>
  <div class="tg">
    <div class="tc fade-in"><p>"Working with ${name} was the best business decision we made this year. The results exceeded every expectation."</p><div class="au">&#8212; Sarah M., CEO</div></div>
    <div class="tc fade-in"><p>"Professional, fast, and incredibly talented. Our revenue increased 40% within the first month of launch."</p><div class="au">&#8212; James K., Founder</div></div>
    <div class="tc fade-in"><p>"The attention to detail is unmatched. Every element was crafted perfectly for our brand and audience."</p><div class="au">&#8212; Priya L., Director</div></div>
  </div>
</section>
<section id="pricing">
  <div class="lbl">Transparent Pricing</div>
  <h2>Choose Your Plan</h2>
  <div class="pg">
    <div class="pc fade-in"><h3>Starter</h3><div class="pr">$497<span>/project</span></div><ul class="pl"><li>5-page website</li><li>Mobile responsive</li><li>SEO optimized</li><li>Contact form</li><li>1 revision round</li></ul><a href="#contact" class="btn" style="width:100%;text-align:center;display:block;margin-top:1.5rem">Get Started</a></div>
    <div class="pc ft fade-in"><h3>Professional</h3><div class="pr">$997<span>/project</span></div><ul class="pl"><li>10-page website</li><li>Custom animations</li><li>CMS integration</li><li>Analytics setup</li><li>3 revision rounds</li></ul><a href="#contact" class="btn" style="width:100%;text-align:center;display:block;margin-top:1.5rem">Most Popular</a></div>
    <div class="pc fade-in"><h3>Enterprise</h3><div class="pr">$2,497<span>/project</span></div><ul class="pl"><li>Unlimited pages</li><li>E-commerce ready</li><li>Custom integrations</li><li>Priority support</li><li>Unlimited revisions</li></ul><a href="#contact" class="btn" style="width:100%;text-align:center;display:block;margin-top:1.5rem">Contact Us</a></div>
  </div>
</section>
<section id="contact">
  <div class="lbl">Get In Touch</div>
  <h2>Start Your Project Today</h2>
  <div class="fw fade-in">
    <div class="fg"><label>Full Name</label><input type="text" placeholder="Your full name"></div>
    <div class="fg"><label>Email Address</label><input type="email" placeholder="your@email.com"></div>
    <div class="fg"><label>Phone Number</label><input type="tel" placeholder="+1 (555) 000-0000"></div>
    <div class="fg"><label>Project Details</label><textarea placeholder="Tell us about your project..."></textarea></div>
    <button class="btn" style="width:100%" type="button">Send Message</button>
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

function extractName(prompt) {
  const m = prompt.match(/\b(?:for|called|named|brand|business)\s+([A-Za-z0-9&.\-\s]{3,50})/i);
  if (m && m[1]) return m[1].trim().replace(/[.,;:!?]+$/, '');
  return prompt.split(/\s+/).slice(0, 4).join(' ');
}

function corsH() {
  return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
}

function jsonR(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...corsH() } });
}
