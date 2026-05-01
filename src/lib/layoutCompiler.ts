export interface BrandAsset {
  name: string;
  domain?: string;
  logoUrl?: string;
  colors: string[];
}

export interface LayoutTree {
  name: string;
  prompt: string;
  intent: string[];
  brand: BrandAsset;
  variants: SiteVariant[];
  bloks: Array<{ component: string; order: number; grid_span: number; title: string }>;
}

export interface SiteVariant {
  id: string;
  name: string;
  mood: string;
  fontPair: string;
  palette: string[];
  html: string;
}

const fallbackBrand: BrandAsset = {
  name: "Generated Brand",
  colors: ["#35e2ff", "#7c7cff", "#111827"],
};

const videoByIndustry: Record<string, string> = {
  food: "https://cdn.coverr.co/videos/coverr-serving-coffee-9978/1080p.mp4",
  fitness: "https://cdn.coverr.co/videos/coverr-woman-training-with-battle-ropes-7809/1080p.mp4",
  realestate: "https://cdn.coverr.co/videos/coverr-modern-house-exterior-3132/1080p.mp4",
  beauty: "https://cdn.coverr.co/videos/coverr-applying-makeup-5349/1080p.mp4",
  tech: "https://cdn.coverr.co/videos/coverr-typing-on-computer-keyboard-2836/1080p.mp4",
  default: "https://cdn.coverr.co/videos/coverr-working-in-a-modern-office-1565/1080p.mp4",
};

const imageByIndustry: Record<string, string> = {
  food: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1600&q=80",
  fitness: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1600&q=80",
  realestate: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80",
  beauty: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1600&q=80",
  law: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1600&q=80",
  tech: "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1600&q=80",
  default: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1600&q=80",
};

function escapeHtml(value = "") {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function toTitle(value: string) {
  return (
    value
      .replace(/https?:\/\//g, "")
      .replace(/\.[a-z]{2,}.*$/i, "")
      .replace(/[^a-z0-9]+/gi, " ")
      .trim()
      .replace(/\b\w/g, (char) => char.toUpperCase()) || "Generated Brand"
  );
}

function extractBrandName(prompt: string) {
  const quoted = prompt.match(/["']([^"']{3,80})["']/);
  if (quoted?.[1]) return quoted[1];
  const named = prompt.match(/\b(?:for|called|named|brand|business)\s+([a-z0-9&.\-\s]{3,60})/i);
  if (named?.[1]) return named[1].replace(/\b(with|that|and|using|where|who|needs?)\b.*$/i, "").trim();
  return prompt.split(/\s+/).slice(0, 4).join(" ");
}

function detectIndustry(prompt: string) {
  const p = prompt.toLowerCase();
  if (/restaurant|food|coffee|cafe|bar|bakery|chef/.test(p)) return "food";
  if (/fitness|gym|coach|trainer|wellness|yoga/.test(p)) return "fitness";
  if (/real estate|realtor|property|home|listing/.test(p)) return "realestate";
  if (/beauty|salon|spa|makeup|skin|hair/.test(p)) return "beauty";
  if (/law|attorney|legal/.test(p)) return "law";
  if (/software|saas|ai|app|tech|startup/.test(p)) return "tech";
  return "default";
}

function inferSections(prompt: string) {
  const p = prompt.toLowerCase();
  const sections = ["hero", "proof", "services"];
  if (/portfolio|gallery|work|case stud/.test(p)) sections.push("gallery");
  if (/price|pricing|plan|package|subscription/.test(p) || sections.length < 5) sections.push("pricing");
  if (/testimonial|review|client|proof/.test(p) || sections.length < 6) sections.push("testimonials");
  if (/faq|question/.test(p) || sections.length < 7) sections.push("faq");
  sections.push("contact");
  return [...new Set(sections)];
}

function requestedTone(prompt: string) {
  const p = prompt.toLowerCase();
  if (/luxury|premium|elegant|high end/.test(p)) return "premium";
  if (/bold|loud|street|creative|artist/.test(p)) return "bold";
  if (/minimal|clean|simple/.test(p)) return "minimal";
  return "custom";
}

function copyFor(brand: string, prompt: string, industry: string) {
  const subject =
    industry === "food"
      ? "memorable dining and hospitality"
      : industry === "fitness"
        ? "stronger coaching, bookings, and client momentum"
        : industry === "realestate"
          ? "premium property discovery and qualified buyer leads"
          : industry === "beauty"
            ? "elevated appointments, treatments, and client trust"
            : industry === "law"
              ? "clear legal guidance and high-intent consultations"
              : industry === "tech"
                ? "product clarity, demos, and conversion-ready growth"
                : "a sharper web presence that turns visitors into customers";

  return {
    headline: `${brand} turns attention into action`,
    subhead: `A complete homepage generated from your request for ${subject}.`,
    intro: `Built from the prompt: "${prompt.slice(0, 150)}${prompt.length > 150 ? "..." : ""}"`,
    services: ["Signature offer", "Fast consultation", "Premium delivery", "Ongoing support"],
    proof: ["Mobile-first design", "SEO-ready structure", "Conversion copy", "Media-rich sections"],
    testimonials: [
      `${brand} made the offer feel obvious and premium from the first screen.`,
      "The page explains the business clearly and gives visitors a reason to act.",
      "The visual direction feels custom instead of template-built.",
    ],
    faqs: [
      ["Can this page be edited?", "Yes. The generated homepage is structured into clear sections so copy, media, and offers can be refined."],
      ["Is it responsive?", "Yes. The layout is built to adapt from mobile to desktop with readable spacing and stable media frames."],
      ["Does it include content?", "Yes. Headlines, service copy, proof points, pricing language, FAQ text, and contact copy are written into the output."],
    ],
  };
}

function cssForVariant(variant: SiteVariant, industry: string) {
  const [a, b, c] = variant.palette;
  const media = imageByIndustry[industry] || imageByIndustry.default;
  return `
    :root{--a:${a};--b:${b};--c:${c};--ink:#f8fbff;--muted:rgba(232,240,255,.76)}
    *{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#05070b;color:var(--ink);font-family:${variant.fontPair};overflow-x:hidden}
    body:before{content:"";position:fixed;inset:0;z-index:-3;background:radial-gradient(circle at 18% 10%, color-mix(in srgb,var(--a) 35%, transparent), transparent 32%),radial-gradient(circle at 82% 16%, color-mix(in srgb,var(--b) 30%, transparent), transparent 34%),linear-gradient(135deg,#05070b,#0b1020 52%,#03040a)}
    body:after{content:"";position:fixed;inset:0;z-index:-2;background-image:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);background-size:42px 42px;mask-image:linear-gradient(to bottom,black,transparent 88%)}
    .shell{width:min(1180px,calc(100vw - 32px));margin:auto}.nav{position:sticky;top:0;z-index:10;backdrop-filter:blur(20px);background:rgba(5,7,11,.72);border-bottom:1px solid rgba(255,255,255,.1)}
    .nav-inner{height:76px;display:flex;align-items:center;justify-content:space-between}.brand{display:flex;align-items:center;gap:12px;font-weight:900;letter-spacing:-.03em}.mark{width:42px;height:42px;border-radius:14px;background:linear-gradient(135deg,var(--a),var(--b));box-shadow:0 0 42px color-mix(in srgb,var(--a) 45%, transparent);display:grid;place-items:center}
    .nav a{color:rgba(255,255,255,.76);text-decoration:none;margin-left:24px;font-size:14px}.btn{display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:999px;padding:14px 20px;color:white;background:linear-gradient(120deg,var(--a),var(--b));font-weight:800;text-decoration:none;box-shadow:0 18px 60px color-mix(in srgb,var(--a) 32%, transparent);transition:.25s}.btn:hover{transform:translateY(-2px);filter:saturate(1.2)}
    .hero{min-height:calc(100vh - 76px);display:grid;grid-template-columns:1.04fr .96fr;gap:44px;align-items:center;padding:74px 0}.hero h1{font-size:clamp(48px,8vw,96px);line-height:.88;letter-spacing:-.065em;margin:0}.hero p{font-size:20px;line-height:1.55;color:var(--muted)}.intro{margin:22px 0;padding:16px 18px;border:1px solid rgba(255,255,255,.12);border-radius:18px;background:rgba(255,255,255,.055);color:rgba(255,255,255,.68)}
    .media{position:relative;min-height:560px;border:1px solid rgba(255,255,255,.14);border-radius:34px;overflow:hidden;background:#111;box-shadow:0 34px 120px rgba(0,0,0,.42)}.media img,.media video{width:100%;height:100%;object-fit:cover;position:absolute;inset:0}.media:after{content:"";position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.72),transparent 56%)}.media-card{position:absolute;left:22px;right:22px;bottom:22px;z-index:2;padding:22px;border:1px solid rgba(255,255,255,.16);border-radius:24px;background:rgba(5,7,11,.62);backdrop-filter:blur(16px)}
    section{padding:92px 0}.section-head{display:flex;align-items:end;justify-content:space-between;gap:24px;margin-bottom:30px}.section-head h2{font-size:clamp(34px,5vw,62px);line-height:.95;letter-spacing:-.05em;margin:0}.section-head p{max-width:520px;color:var(--muted);line-height:1.6}.grid{display:grid;grid-template-columns:repeat(12,1fr);gap:18px}.card{position:relative;border:1px solid rgba(255,255,255,.12);background:linear-gradient(145deg,rgba(255,255,255,.1),rgba(255,255,255,.035));border-radius:24px;padding:26px;box-shadow:0 24px 80px rgba(0,0,0,.26);transition:.3s;overflow:hidden}.card:hover{transform:translateY(-5px);border-color:color-mix(in srgb,var(--a) 42%, white 10%);box-shadow:0 0 60px color-mix(in srgb,var(--a) 20%, transparent)}
    .span-3{grid-column:span 3}.span-4{grid-column:span 4}.span-6{grid-column:span 6}.span-8{grid-column:span 8}.span-12{grid-column:span 12}.kpi{font-size:42px;font-weight:950;letter-spacing:-.05em}.muted{color:var(--muted)}.price{font-size:48px;font-weight:950;margin:14px 0}.gallery-img{height:330px;background:url("${media}") center/cover;border-radius:24px}.faq details{border-bottom:1px solid rgba(255,255,255,.12);padding:20px 0}.faq summary{cursor:pointer;font-weight:850;font-size:18px}.faq p{color:var(--muted);line-height:1.65}.contact{background:linear-gradient(135deg,color-mix(in srgb,var(--a) 18%, transparent),rgba(255,255,255,.04));border-radius:34px;padding:36px}.input{width:100%;margin-bottom:12px;border:1px solid rgba(255,255,255,.14);background:rgba(0,0,0,.24);border-radius:16px;padding:16px;color:white}
    .reveal{animation:rise .8s both}@keyframes rise{from{opacity:0;transform:translateY(26px)}to{opacity:1;transform:none}}.float{animation:float 7s ease-in-out infinite}@keyframes float{50%{transform:translateY(-16px) rotate(1deg)}}.marquee{display:flex;gap:18px;animation:mar 28s linear infinite}.marquee-wrap{overflow:hidden}.marquee .card{min-width:310px}@keyframes mar{to{transform:translateX(-50%)}}
    @media(max-width:860px){.hero{grid-template-columns:1fr;padding:46px 0}.media{min-height:420px}.nav nav{display:none}.span-3,.span-4,.span-6,.span-8{grid-column:span 12}.section-head{display:block}.hero h1{font-size:52px}}
  `;
}

function variantMarkup(variant: SiteVariant, brand: BrandAsset, prompt: string, industry: string) {
  const copy = copyFor(escapeHtml(brand.name), escapeHtml(prompt), industry);
  const image = imageByIndustry[industry] || imageByIndustry.default;
  const video = videoByIndustry[industry] || videoByIndustry.default;
  const mediaTag =
    variant.id === "editorial"
      ? `<img src="${image}" alt="${escapeHtml(brand.name)} visual direction" />`
      : `<video src="${video}" autoplay muted loop playsinline aria-label="${escapeHtml(brand.name)} background video"></video>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${escapeHtml(brand.name)} | ${escapeHtml(variant.name)}</title><meta name="description" content="${escapeHtml(copy.subhead)}"/><style>${cssForVariant(variant, industry)}.sound-toggle{position:fixed;right:18px;bottom:18px;z-index:20;border:1px solid rgba(255,255,255,.18);background:rgba(5,7,11,.72);color:white;border-radius:999px;padding:13px 16px;font-weight:850;backdrop-filter:blur(14px);box-shadow:0 18px 60px rgba(0,0,0,.34);cursor:pointer}.sound-toggle:hover{border-color:var(--a);transform:translateY(-2px)}</style></head><body>
    <header class="nav"><div class="shell nav-inner"><div class="brand"><div class="mark">✦</div><span>${escapeHtml(brand.name)}</span></div><nav><a href="#services">Services</a><a href="#pricing">Pricing</a><a href="#faq">FAQ</a><a class="btn" href="#contact">Start</a></nav></div></header>
    <main>
      <section class="shell hero"><div class="reveal"><h1>${copy.headline}</h1><p>${copy.subhead}</p><div class="intro">${copy.intro}</div><a class="btn" href="#contact">Book the first step</a></div><div class="media float">${mediaTag}<div class="media-card"><strong>Live media direction</strong><p class="muted">Visuals are selected from copyright-safe open media sources and matched to the page subject.</p></div></div></section>
      <section class="shell"><div class="grid"><div class="card span-3"><div class="kpi">01</div><p class="muted">Custom page voice and copy.</p></div><div class="card span-3"><div class="kpi">02</div><p class="muted">Responsive sections with motion.</p></div><div class="card span-3"><div class="kpi">03</div><p class="muted">Relevant image and video system.</p></div><div class="card span-3"><div class="kpi">04</div><p class="muted">Lead-ready contact flow.</p></div></div></section>
      <section class="shell" id="services"><div class="section-head"><h2>What ${escapeHtml(brand.name)} offers</h2><p>Clear service content, benefit-led structure, and premium visual rhythm are written directly into the generated homepage.</p></div><div class="grid">${copy.services.map((item, i) => `<article class="card span-3 reveal" style="animation-delay:${i * 90}ms"><h3>${escapeHtml(item)}</h3><p class="muted">A focused section that explains the value, reduces friction, and gives visitors a next step.</p></article>`).join("")}</div></section>
      <section class="shell"><div class="section-head"><h2>Built to feel finished</h2><p>Every generated version includes wallpaper layers, hover lighting, typography choices, motion cues, and real section copy when the prompt does not specify them.</p></div><div class="grid"><div class="span-8 gallery-img"></div><div class="card span-4"><h3>Premium content system</h3>${copy.proof.map((item) => `<p class="muted">✓ ${escapeHtml(item)}</p>`).join("")}</div></div></section>
      <section class="shell" id="pricing"><div class="section-head"><h2>Simple ways to start</h2><p>Pricing copy is generated as part of the page so the offer is not left unfinished.</p></div><div class="grid">${["Starter", "Growth", "Premium"].map((plan, i) => `<article class="card span-4"><h3>${plan}</h3><div class="price">${i === 0 ? "$99" : i === 1 ? "$299" : "$799"}</div><p class="muted">${i === 0 ? "Launch copy and landing structure." : i === 1 ? "Expanded sections and stronger conversion flow." : "Full premium homepage polish and growth-ready content."}</p><a class="btn" href="#contact">Choose ${plan}</a></article>`).join("")}</div></section>
      <section class="shell"><div class="section-head"><h2>Client confidence</h2><p>Social proof is generated in a brand-safe voice and can be replaced with verified testimonials when available.</p></div><div class="marquee-wrap"><div class="marquee">${[...copy.testimonials, ...copy.testimonials].map((quote) => `<article class="card"><p>${escapeHtml(quote)}</p><p class="muted">Verified-ready proof block</p></article>`).join("")}</div></div></section>
      <section class="shell faq" id="faq"><div class="section-head"><h2>Questions answered</h2><p>The generator writes practical FAQ content so the homepage can stand on its own.</p></div>${copy.faqs.map(([q, a], i) => `<details ${i === 0 ? "open" : ""}><summary>${escapeHtml(q)}</summary><p>${escapeHtml(a)}</p></details>`).join("")}</section>
      <section class="shell" id="contact"><div class="contact"><div class="section-head"><h2>Ready for the next customer</h2><p>Use this form section for bookings, quotes, calls, or project inquiries.</p></div><form><input class="input" placeholder="Name"/><input class="input" placeholder="Email"/><textarea class="input" rows="4" placeholder="Tell us what you need"></textarea><button class="btn" type="button">Send request</button></form></div></section>
    </main><button class="sound-toggle" type="button" id="soundToggle">Play ambient music</button><footer class="shell" style="padding:36px 0;color:rgba(255,255,255,.56)">Generated by VoiceToWebsite. Media from free-to-use open web sources; replace with final licensed assets before regulated ad campaigns.</footer>
    <script>
      (()=>{let ctx,osc,gain,lfo,on=false;const btn=document.getElementById('soundToggle');btn?.addEventListener('click',async()=>{if(!ctx){ctx=new AudioContext();osc=ctx.createOscillator();gain=ctx.createGain();lfo=ctx.createOscillator();const lfoGain=ctx.createGain();osc.type='sine';osc.frequency.value=146.83;lfo.frequency.value=.08;lfoGain.gain.value=24;lfo.connect(gain);lfo.connect(lfoGain);lfoGain.connect(osc.frequency);gain.gain.value=0;gain.connect(ctx.destination);osc.start();lfo.start()} if(ctx.state==='suspended') await ctx.resume();on=!on;gain.gain.setTargetAtTime(on ? .045 : 0,ctx.currentTime,.08);btn.textContent=on?'Pause ambient music':'Play ambient music';});})();
    </script>
  </body></html>`;
}

export function compileLayoutDocument(tree: LayoutTree, variantId?: string) {
  return (tree.variants.find((variant) => variant.id === variantId) || tree.variants[0]).html;
}

export function compileLayoutFromPrompt(prompt: string, brandInput?: Partial<BrandAsset>) {
  const brandName = brandInput?.name || toTitle(extractBrandName(prompt));
  const brand: BrandAsset = {
    ...fallbackBrand,
    ...brandInput,
    name: brandName,
    colors: brandInput?.colors?.length ? brandInput.colors : fallbackBrand.colors,
  };
  const industry = detectIndustry(prompt);
  const tone = requestedTone(prompt);
  const variants: SiteVariant[] = [
    { id: "cinematic", name: "Cinematic Glass", mood: `${tone} dark motion`, fontPair: "Inter, ui-sans-serif, system-ui, sans-serif", palette: [brand.colors[0] || "#35e2ff", brand.colors[1] || "#7c7cff", "#03040a"], html: "" },
    { id: "editorial", name: "Editorial Luxe", mood: "image-led premium", fontPair: "Georgia, 'Times New Roman', serif", palette: ["#f59e0b", "#ef4444", "#111827"], html: "" },
    { id: "studio", name: "Studio Neon", mood: "bold animated launch", fontPair: "'Trebuchet MS', Inter, ui-sans-serif, sans-serif", palette: ["#22c55e", "#06b6d4", "#0f172a"], html: "" },
  ].map((variant) => ({
    ...variant,
    html: variantMarkup(variant, brand, prompt || "Build a premium business homepage", industry),
  }));
  const tree: LayoutTree = {
    name: brand.name,
    prompt,
    intent: inferSections(prompt),
    brand,
    variants,
    bloks: inferSections(prompt).map((section, index) => ({ component: section, order: index + 1, grid_span: 12, title: section })),
  };
  return { tree, html: variants[0].html, variants };
}

export function buildTailwindConfig() {
  return "tailwind = window.tailwind || {}; tailwind.config = { theme: { extend: {} } };";
}

export const layoutCompiler = {
  compileFromPrompt: compileLayoutFromPrompt,
  compileDocument: compileLayoutDocument,
  buildTailwindConfig,
};
