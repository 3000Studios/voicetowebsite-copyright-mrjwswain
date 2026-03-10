import { isAdminRequest } from "./adminAuth.js";

const json = (status, payload, headers = {}) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });

const sanitizeContent = (content) => {
  if (typeof content !== "string") return content;

  // Remove dangerous HTML tags and attributes
  return (
    content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, "")
      .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, "")
      .replace(/<input\b[^>]*>/gi, "")
      .replace(/<textarea\b[^>]*>/gi, "")
      .replace(/<button\b[^>]*>/gi, "")
      // Remove dangerous event handlers
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
      .replace(/on\w+\s*=\s*[^>\s]*/gi, "")
      // Remove javascript: URLs
      .replace(/javascript:\s*[^\s"']*/gi, "")
      // Remove data: URLs that could execute scripts
      .replace(/data:\s*(?:text\/html|application\/javascript)[^;]*/gi, "")
      // Limit dangerous CSS
      .replace(/expression\s*\(/gi, "")
      .replace(/javascript\s*:/gi, "")
      .replace(/behavior\s*:\s*url\(/gi, "")
  );
};

const extractJsonObject = (text) => {
  const raw = String(text || "").trim();
  if (!raw) throw new Error("AI response was empty.");

  // Sanitize the raw text before parsing
  const sanitized = sanitizeContent(raw);

  if (sanitized.startsWith("{") && sanitized.endsWith("}"))
    return JSON.parse(sanitized);
  const fenced = sanitized.match(/```json\s*([\s\S]*?)\s*```/i);
  if (fenced) return JSON.parse(fenced[1]);
  const first = sanitized.indexOf("{");
  const last = sanitized.lastIndexOf("}");
  if (first >= 0 && last > first)
    return JSON.parse(sanitized.slice(first, last + 1));
  throw new Error("Failed to parse JSON response.");
};

const pickAiText = (result) => {
  if (!result) return "";
  if (typeof result === "string") return result;
  if (typeof result.response === "string") return result.response;
  if (typeof result.text === "string") return result.text;
  if (typeof result.output_text === "string") return result.output_text;
  if (Array.isArray(result?.choices) && result.choices[0]?.message?.content)
    return String(result.choices[0].message.content);
  return JSON.stringify(result);
};

const ensureSiteTables = async (env) => {
  if (!env.D1) return;
  await env.D1.prepare(
    `CREATE TABLE IF NOT EXISTS sites (
      id TEXT PRIMARY KEY,
      ts DATETIME DEFAULT CURRENT_TIMESTAMP,
      prompt TEXT,
      transcript TEXT,
      layout_json TEXT,
      html TEXT,
      css TEXT,
      status TEXT DEFAULT 'draft'
    );`
  ).run();
  await env.D1.prepare(
    `CREATE TABLE IF NOT EXISTS site_assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      site_id TEXT NOT NULL,
      ts DATETIME DEFAULT CURRENT_TIMESTAMP,
      kind TEXT NOT NULL,
      r2_key TEXT NOT NULL,
      content_type TEXT,
      size_bytes INTEGER
    );`
  ).run();
};

const STYLE_PACK_LIBRARY = [
  {
    id: "glass-ui",
    name: "Glass UI",
    category: "surface",
    description: "Frosted cards, soft borders, and subtle blur.",
    css: `.vtw-section{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:18px;backdrop-filter:blur(8px);}`,
  },
  {
    id: "neon-edges",
    name: "Neon Edges",
    category: "surface",
    description: "Neon borders and glow accents.",
    css: `.vtw-section{box-shadow:0 0 0 1px rgba(56,189,248,.45),0 0 24px rgba(56,189,248,.2);} h1,h2{color:#7dd3fc;}`,
  },
  {
    id: "rounded-xl",
    name: "Rounded XL",
    category: "layout",
    description: "Larger corner radii and softer geometry.",
    css: `.vtw-section,.vtw-page{border-radius:22px;} .vtw-page{padding:20px;}`,
  },
  {
    id: "compact-density",
    name: "Compact Density",
    category: "layout",
    description: "Reduced spacing for denser dashboards.",
    css: `.vtw-wrap{max-width:980px;padding:18px 14px;} .vtw-page{padding:10px 0;} .vtw-section{padding:8px 0;}`,
  },
  {
    id: "spacious-density",
    name: "Spacious Density",
    category: "layout",
    description: "More breathing room and larger spacing.",
    css: `.vtw-wrap{max-width:1180px;padding:36px 24px;} .vtw-page{padding:26px 0;} .vtw-section{padding:16px 0;}`,
  },
  {
    id: "bold-headings",
    name: "Bold Headings",
    category: "typography",
    description: "Heavier headline weight and tighter tracking.",
    css: `h1,h2,h3{font-weight:900;letter-spacing:-.02em;}`,
  },
  {
    id: "editorial-serif",
    name: "Editorial Serif",
    category: "typography",
    description: "Serif forward look for premium landing pages.",
    css: `h1,h2,h3{font-family:Georgia,'Times New Roman',serif;} p{font-family:system-ui,sans-serif;}`,
  },
  {
    id: "mono-tech",
    name: "Mono Tech",
    category: "typography",
    description: "Monospace technical aesthetic.",
    css: `body{font-family:'IBM Plex Mono','SFMono-Regular',Consolas,monospace;} h1,h2,h3{letter-spacing:.01em;}`,
  },
  {
    id: "ocean-gradient",
    name: "Ocean Gradient",
    category: "color",
    description: "Cool blue/cyan gradient background.",
    css: `body{background:radial-gradient(circle at 20% 10%,#0c4a6e 0%,#020617 45%,#020617 100%);}`,
  },
  {
    id: "sunset-gradient",
    name: "Sunset Gradient",
    category: "color",
    description: "Orange/pink cinematic gradient.",
    css: `body{background:radial-gradient(circle at 15% 10%,#7c2d12 0%,#3f0f46 38%,#09090b 100%);}`,
  },
  {
    id: "mint-gradient",
    name: "Mint Gradient",
    category: "color",
    description: "Mint/teal clean startup palette.",
    css: `body{background:radial-gradient(circle at 30% 12%,#064e3b 0%,#052e2b 35%,#020617 100%);} a{color:#6ee7b7;}`,
  },
  {
    id: "high-contrast",
    name: "High Contrast",
    category: "accessibility",
    description: "Increased text contrast for readability.",
    css: `body{color:#ffffff;} .vtw-meta{opacity:.92;} a{color:#93c5fd;} .vtw-section{border-color:rgba(255,255,255,.24);}`,
  },
  {
    id: "subtle-motion",
    name: "Subtle Motion",
    category: "animation",
    description: "Gentle lift animation on section load.",
    css: `.vtw-section{animation:vtwLift .42s ease both;} @keyframes vtwLift{from{opacity:.2;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}`,
  },
  {
    id: "hover-lift",
    name: "Hover Lift",
    category: "animation",
    description: "Card lift on hover for interactivity.",
    css: `.vtw-section{transition:transform .18s ease,box-shadow .18s ease;} .vtw-section:hover{transform:translateY(-3px);box-shadow:0 10px 26px rgba(2,132,199,.22);}`,
  },
  {
    id: "no-motion",
    name: "No Motion",
    category: "accessibility",
    description: "Disables movement-heavy transitions.",
    css: `*{animation:none!important;transition:none!important;scroll-behavior:auto!important;}`,
  },
  {
    id: "soft-shadow",
    name: "Soft Shadow",
    category: "surface",
    description: "Ambient depth with soft shadows.",
    css: `.vtw-section,.vtw-page{box-shadow:0 12px 28px rgba(0,0,0,.24);}`,
  },
  {
    id: "hard-shadow",
    name: "Hard Shadow",
    category: "surface",
    description: "Sharper graphic shadows for cards.",
    css: `.vtw-section,.vtw-page{box-shadow:8px 8px 0 rgba(30,41,59,.75);}`,
  },
  {
    id: "outline-focus",
    name: "Outline Focus",
    category: "accessibility",
    description: "Strong keyboard focus outlines.",
    css: `a:focus-visible,button:focus-visible,input:focus-visible,textarea:focus-visible{outline:3px solid #f59e0b;outline-offset:2px;border-radius:8px;}`,
  },
  {
    id: "rich-links",
    name: "Rich Links",
    category: "interaction",
    description: "Animated underlines and stronger link affordance.",
    css: `a{position:relative;text-decoration:none;} a::after{content:'';position:absolute;left:0;bottom:-2px;width:0;height:2px;background:currentColor;transition:width .2s ease;} a:hover::after{width:100%;}`,
  },
  {
    id: "large-type",
    name: "Large Type",
    category: "typography",
    description: "Bigger text scale for hero-forward pages.",
    css: `h1{font-size:clamp(2rem,4vw,3.3rem);} h2{font-size:clamp(1.4rem,2.6vw,2.2rem);} p{font-size:1.04rem;}`,
  },
  {
    id: "small-type",
    name: "Small Type",
    category: "typography",
    description: "Tighter text scale for data-dense pages.",
    css: `h1{font-size:clamp(1.6rem,3vw,2.4rem);} h2{font-size:clamp(1.2rem,2vw,1.8rem);} p{font-size:.96rem;}`,
  },
];

const STYLE_PACK_IDS = new Set(STYLE_PACK_LIBRARY.map((pack) => pack.id));
const DEFAULT_STYLE_PACKS = [
  "subtle-motion",
  "rich-links",
  "bold-headings",
  "ocean-gradient",
];
const normalizeStylePackIds = (value) => {
  if (!Array.isArray(value)) return [];
  const unique = [];
  value.forEach((item) => {
    const id = String(item || "").trim();
    if (id && STYLE_PACK_IDS.has(id) && !unique.includes(id)) unique.push(id);
  });
  return unique.slice(0, 24);
};

const getStylePacksByIds = (ids) => {
  const set = new Set(normalizeStylePackIds(ids));
  return STYLE_PACK_LIBRARY.filter((pack) => set.has(pack.id));
};

const escapeAttr = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .trim();

const sanitizeText = (text) => {
  if (typeof text !== "string") return "";
  return text
    .replace(/[<>]/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+=/gi, "")
    .trim()
    .substring(0, 500);
};

const sanitizeUrl = (url) => {
  if (typeof url !== "string") return "";
  try {
    const parsed = new URL(url);
    // Only allow http/https protocols
    if (!["http:", "https:"].includes(parsed.protocol)) return "";
    return parsed.toString();
  } catch {
    // Invalid URL, return empty string
    return "";
  }
};

const slugify = (value, fallback = "section") => {
  const normalized = String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || fallback;
};

const sanitizeItems = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => sanitizeText(item))
    .filter(Boolean)
    .slice(0, 6);
};

const normalizeSection = (section, index = 0) => {
  const title = sanitizeText(section?.title) || `Section ${index + 1}`;
  const body = sanitizeText(section?.body) || "Generated content section.";
  const items = sanitizeItems(section?.items);
  const imageUrl = sanitizeUrl(section?.imageUrl);
  const imageAlt =
    sanitizeText(section?.imageAlt) || sanitizeText(section?.title) || title;
  const ctaLabel = sanitizeText(section?.ctaLabel);
  const ctaHref = sanitizeUrl(section?.ctaHref);
  const variant =
    items.length >= 3
      ? "list"
      : imageUrl
        ? "media"
        : /(testimonial|proof|result|review|quote)/i.test(title)
          ? "quote"
          : /(pricing|plan|package|tier)/i.test(title)
            ? "pricing"
            : "copy";

  return {
    title,
    body,
    items,
    imageUrl,
    imageAlt,
    ctaLabel,
    ctaHref,
    variant,
  };
};

const normalizePage = (page, index = 0) => {
  const title = sanitizeText(page?.title) || `Page ${index + 1}`;
  const slug = slugify(page?.slug || title, index === 0 ? "home" : "page");
  const sections = Array.isArray(page?.sections)
    ? page.sections
        .filter((section) => section && typeof section === "object")
        .map((section, sectionIndex) => normalizeSection(section, sectionIndex))
    : [];

  return {
    slug,
    title,
    sections: sections.length
      ? sections
      : [normalizeSection({ title: "Overview", body: "Generated preview." })],
  };
};

const resolveThemeCss = (theme, layoutType) => {
  const themes = {
    midnight: `
      --vtw-bg:#07111f;
      --vtw-panel:#0e1a2b;
      --vtw-panel-strong:#13233a;
      --vtw-text:#eff6ff;
      --vtw-muted:#bfd3ea;
      --vtw-accent:#67e8f9;
      --vtw-accent-2:#38bdf8;
      --vtw-border:rgba(148,163,184,.22);
      --vtw-glow:rgba(56,189,248,.22);
    `,
    volt: `
      --vtw-bg:#0b1020;
      --vtw-panel:#131a2e;
      --vtw-panel-strong:#192543;
      --vtw-text:#f8fafc;
      --vtw-muted:#c9d4e7;
      --vtw-accent:#facc15;
      --vtw-accent-2:#22c55e;
      --vtw-border:rgba(250,204,21,.24);
      --vtw-glow:rgba(250,204,21,.18);
    `,
    ember: `
      --vtw-bg:#1a0f12;
      --vtw-panel:#27161a;
      --vtw-panel-strong:#321d22;
      --vtw-text:#fff7ed;
      --vtw-muted:#fed7aa;
      --vtw-accent:#fb923c;
      --vtw-accent-2:#f43f5e;
      --vtw-border:rgba(251,146,60,.24);
      --vtw-glow:rgba(244,63,94,.18);
    `,
    ocean: `
      --vtw-bg:#041b23;
      --vtw-panel:#0a2832;
      --vtw-panel-strong:#0e3340;
      --vtw-text:#ecfeff;
      --vtw-muted:#bae6fd;
      --vtw-accent:#2dd4bf;
      --vtw-accent-2:#0ea5e9;
      --vtw-border:rgba(45,212,191,.22);
      --vtw-glow:rgba(14,165,233,.18);
    `,
  };
  const layoutDensity =
    layoutType === "editorial"
      ? "letter-spacing:-0.02em;"
      : layoutType === "tech"
        ? "text-transform:none;"
        : "";

  return `${themes[theme] || themes.midnight} ${layoutDensity}`;
};

const renderPreviewHtml = ({ siteId, layout, css }) => {
  // Validate inputs
  if (!siteId || typeof siteId !== "string") {
    throw new Error("Invalid siteId provided");
  }

  if (!layout || typeof layout !== "object") {
    layout = {};
  }

  const title = sanitizeText(layout?.title) || "Preview";
  const headline = sanitizeText(layout?.headline) || title;
  const description = sanitizeText(layout?.description) || "Generated preview";
  const heroCaption = sanitizeText(layout?.heroCaption) || description;
  const theme = sanitizeText(layout?.theme) || "midnight";
  const pages = Array.isArray(layout?.pages) ? layout.pages : [];
  const layoutType = sanitizeText(layout?.layoutType) || "default";

  // Validate theme
  const validThemes = ["midnight", "volt", "ember", "ocean"];
  const selectedTheme = validThemes.includes(theme) ? theme : "midnight";
  const seenSlugs = new Set();
  const normalizedPages = pages
    .filter((p) => p && typeof p === "object")
    .map((p, index) => {
      const page = normalizePage(p, index);
      let slug = page.slug;
      let suffix = 2;
      while (seenSlugs.has(slug)) {
        slug = `${page.slug}-${suffix}`;
        suffix += 1;
      }
      seenSlugs.add(slug);
      return { ...page, slug };
    });

  const nav = normalizedPages
    .map((p) => {
      return `<a href="#${escapeAttr(p.slug)}">${escapeAttr(p.title)}</a>`;
    })
    .join("");

  const sections = normalizedPages
    .map((page, index) => {
      const rendered = page.sections
        .map((section, sectionIndex) => {
          const img = section.imageUrl
            ? `<div class="vtw-section-img"><img src="${escapeAttr(section.imageUrl)}" alt="${escapeAttr(section.imageAlt)}" loading="lazy" /></div>`
            : "";
          const items = section.items.length
            ? `<ul class="vtw-list">${section.items.map((item) => `<li>${escapeAttr(item)}</li>`).join("")}</ul>`
            : "";
          const cta =
            section.ctaLabel && section.ctaHref
              ? `<a class="vtw-inline-cta" href="${escapeAttr(section.ctaHref)}" target="_blank" rel="noreferrer">${escapeAttr(section.ctaLabel)}</a>`
              : "";
          return `<section class="vtw-section vtw-section-${escapeAttr(section.variant)}">${img}<div class="vtw-section-copy"><div class="vtw-section-kicker">Block ${sectionIndex + 1}</div><h3>${escapeAttr(section.title)}</h3><p>${escapeAttr(section.body)}</p>${items}${cta}</div></section>`;
        })
        .join("");
      return `<article id="${escapeAttr(page.slug)}" class="vtw-page"><div class="vtw-page-head"><div class="vtw-meta">Page ${index + 1}</div><h2>${escapeAttr(page.title)}</h2></div><div class="vtw-page-grid">${rendered}</div></article>`;
    })
    .join("");

  const heroVideoUrl = sanitizeUrl(layout?.heroVideoUrl) || "";
  const heroImageUrl = sanitizeUrl(layout?.heroImageUrl) || "";

  const primaryTarget = normalizedPages[0]?.slug || "home";
  const contactTarget =
    normalizedPages.find((page) =>
      /contact|get-started|book|pricing/i.test(page.slug)
    )?.slug ||
    normalizedPages[normalizedPages.length - 1]?.slug ||
    primaryTarget;

  const heroMedia = heroVideoUrl
    ? `<video autoplay muted loop playsinline><source src="${escapeAttr(heroVideoUrl)}" type="video/mp4" /></video>`
    : heroImageUrl
      ? `<img src="${escapeAttr(heroImageUrl)}" alt="${escapeAttr(headline)}" />`
      : `<video autoplay muted loop playsinline poster="/vtw-wallpaper.png"><source src="/media/vtw-home-wallpaper.mp4" type="video/mp4" /></video>`;

  const baseCss = `
    :root{color-scheme:dark;${resolveThemeCss(selectedTheme, layoutType)}}
    *{box-sizing:border-box}
    html{scroll-behavior:smooth}
    body{margin:0;background:
      radial-gradient(circle at top left,var(--vtw-glow),transparent 32%),
      radial-gradient(circle at top right,rgba(255,255,255,.06),transparent 20%),
      var(--vtw-bg);
      color:var(--vtw-text);
      font-family:'Manrope',Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif}
    .vtw-wrap{max-width:1180px;margin:0 auto;padding:28px 18px 48px}
    .vtw-nav-bar{position:sticky;top:0;z-index:10;display:flex;gap:14px;align-items:center;justify-content:space-between;flex-wrap:wrap;padding:16px 0 18px;margin-bottom:24px;background:linear-gradient(180deg,var(--vtw-bg),rgba(7,17,31,.7));backdrop-filter:blur(12px);border-bottom:1px solid var(--vtw-border)}
    .vtw-nav-bar .vtw-logo{font-weight:800;font-size:1.15rem;color:var(--vtw-text)}
    nav{display:flex;gap:12px;flex-wrap:wrap}
    nav a{color:var(--vtw-accent);text-decoration:none;font-weight:700}
    nav a:hover{color:var(--vtw-text)}
    .vtw-meta{opacity:.82;font-size:14px;color:var(--vtw-muted)}
    .vtw-page{padding:28px 0;border-top:1px solid var(--vtw-border)}
    .vtw-page-head{display:grid;gap:8px;margin-bottom:18px}
    .vtw-page-head h2{margin:0;font-size:clamp(1.6rem,3vw,2.4rem)}
    .vtw-page-grid{display:grid;gap:16px}
    .vtw-section{display:grid;grid-template-columns:minmax(0,1fr);gap:16px;padding:18px;border-radius:22px;background:linear-gradient(180deg,var(--vtw-panel),var(--vtw-panel-strong));border:1px solid var(--vtw-border);box-shadow:0 18px 48px rgba(2,8,23,.24)}
    .vtw-section-media,.vtw-section-copy{min-width:0}
    .vtw-section-copy{display:grid;gap:12px}
    .vtw-section-kicker{font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--vtw-accent)}
    .vtw-section h3{margin:0;font-size:clamp(1.15rem,2vw,1.5rem)}
    .vtw-section p{margin:0;color:var(--vtw-muted);line-height:1.7}
    .vtw-section-img{border-radius:16px;overflow:hidden;max-height:320px;background:#020617}
    .vtw-section-img img{width:100%;height:100%;object-fit:cover;display:block}
    .vtw-list{display:grid;gap:8px;margin:0;padding-left:18px;color:var(--vtw-text)}
    .vtw-list li::marker{color:var(--vtw-accent)}
    .vtw-inline-cta{display:inline-flex;justify-content:center;align-items:center;width:fit-content;padding:11px 16px;border-radius:999px;background:rgba(255,255,255,.06);border:1px solid var(--vtw-border);color:var(--vtw-text);text-decoration:none;font-weight:700}
    .vtw-hero{display:grid;gap:24px;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));align-items:center;margin:0 0 24px;padding:22px;border-radius:28px;border:1px solid var(--vtw-border);background:
      linear-gradient(135deg,rgba(255,255,255,.06),transparent 55%),
      linear-gradient(180deg,var(--vtw-panel),var(--vtw-panel-strong))}
    .vtw-hero-media{position:relative;border-radius:24px;overflow:hidden;min-height:260px;box-shadow:0 24px 64px rgba(2,8,23,.3)}
    .vtw-hero-media video,.vtw-hero-media img{width:100%;height:100%;object-fit:cover;display:block}
    .vtw-hero-card{display:grid;gap:14px}
    .vtw-hero-card h1{margin:0;font-size:clamp(2.2rem,5vw,4.6rem);line-height:.95}
    .vtw-hero-card p{margin:0;color:var(--vtw-muted);font-size:1.02rem;line-height:1.7}
    .vtw-hero-actions{display:flex;flex-wrap:wrap;gap:10px}
    .vtw-hero-actions a{padding:11px 16px;border-radius:999px;border:1px solid var(--vtw-border);text-decoration:none;color:var(--vtw-text);font-weight:700}
    .vtw-hero-actions a.primary{background:linear-gradient(135deg,var(--vtw-accent),var(--vtw-accent-2));color:#03111f;border-color:transparent}
    .vtw-float{animation:vtwFloat 5s ease-in-out infinite}
    @keyframes vtwFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
    @media (min-width: 860px){.vtw-page-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.vtw-section-list,.vtw-section-pricing{grid-column:span 2}.vtw-section-media{grid-template-columns:1.1fr .9fr}.vtw-section:has(.vtw-section-img){grid-template-columns:minmax(240px,.95fr) minmax(0,1.05fr)}}
    @media (max-width: 720px){.vtw-wrap{padding:20px 14px 36px}.vtw-hero-card h1{font-size:clamp(2rem,12vw,3rem)}.vtw-nav-bar{position:static}.vtw-page{padding:22px 0}}
    @media (prefers-reduced-motion:reduce){.vtw-float{animation:none}}
  `;

  const hero = `
    <section class="vtw-hero">
      <div class="vtw-hero-media">
        ${heroMedia}
      </div>
      <div class="vtw-hero-card vtw-float">
        <div class="vtw-meta">Generated preview</div>
        <h1 style="margin:0">${escapeAttr(headline)}</h1>
        <p>${escapeAttr(heroCaption)}</p>
        <div class="vtw-hero-actions">
          <a class="primary" href="#${escapeAttr(primaryTarget)}">Explore</a>
          <a href="#${escapeAttr(contactTarget)}">Next step</a>
        </div>
      </div>
    </section>
  `;

  return `<!doctype html>
<html lang="en" data-theme="${escapeAttr(selectedTheme)}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeAttr(title)}</title>
    <meta name="description" content="${escapeAttr(description)}" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;800&display=swap" rel="stylesheet" />
    <style>${baseCss}${css}</style>
  </head>
  <body>
    <div class="vtw-wrap">
      ${hero}
      <header class="vtw-nav-bar">
        <div class="vtw-logo">${escapeAttr(title)}</div>
        <nav>${nav}</nav>
      </header>
      <div class="vtw-meta" style="margin-bottom:8px">Preview ID: ${escapeAttr(siteId)}</div>
      ${sections || `<p class="vtw-meta">No pages were generated.</p>`}
    </div>
  </body>
</html>`;
};

const resolveStylePackIds = ({ requestedIds = [], layoutType = "" }) => {
  const layoutTypeStylePacks =
    {
      restaurant: ["sunset-gradient", "rounded-xl", "bold-headings"],
      tech: ["neon-edges", "mono-tech", "hover-lift"],
      portfolio: ["glass-ui", "spacious-density", "subtle-motion"],
      editorial: ["editorial-serif", "large-type", "high-contrast"],
      business: ["mint-gradient", "compact-density", "rich-links"],
    }[
      String(layoutType || "")
        .trim()
        .toLowerCase()
    ] || [];

  return normalizeStylePackIds([
    ...DEFAULT_STYLE_PACKS,
    ...layoutTypeStylePacks,
    ...normalizeStylePackIds(requestedIds),
  ]);
};

export async function handleGenerateRequest({ request, env }) {
  const allowPublic = String(env.PUBLIC_GENERATE || "") === "1";
  if (!allowPublic) {
    const isAdmin = await isAdminRequest(request, env);
    if (!isAdmin) return json(401, { error: "Admin required." });
  }

  if (!env.D1) return json(503, { error: "D1 database not available." });
  await ensureSiteTables(env);

  let prompt = "";
  let transcript = "";
  let tone = "";
  let stylePackIds = [];

  const contentType = request.headers.get("content-type") || "";
  try {
    if (contentType.includes("application/json")) {
      const body = await request.clone().json();
      prompt = String(body?.prompt || "");
      transcript = String(body?.transcript || "");
      tone = String(body?.tone || "");
      stylePackIds = normalizeStylePackIds(body?.stylePackIds || []);
    } else if (contentType.includes("multipart/form-data")) {
      const form = await request.clone().formData();
      prompt = String(form.get("prompt") || "");
      tone = String(form.get("tone") || "");
      const rawStylePacks = String(form.get("stylePackIds") || "")
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
      stylePackIds = normalizeStylePackIds(rawStylePacks);
      const audio = form.get("audio");
      if (audio && typeof audio.arrayBuffer === "function") {
        if (!env.AI)
          return json(501, { error: "Workers AI binding missing (AI)." });
        const buf = await audio.arrayBuffer();
        const bytes = [...new Uint8Array(buf)];
        const whisper = await env.AI.run("@cf/openai/whisper", {
          audio: bytes,
        });
        transcript = String(
          whisper?.text || whisper?.result?.text || whisper?.transcription || ""
        );
      }
    } else {
      prompt = String(await request.clone().text());
    }
  } catch (err) {
    return json(400, { error: `Invalid request body: ${err.message}` });
  }

  if (!stylePackIds.length) {
    stylePackIds = DEFAULT_STYLE_PACKS.slice();
  }

  const siteId = crypto.randomUUID();
  const mergedPrompt = [prompt, transcript].filter(Boolean).join("\n\n").trim();
  if (!mergedPrompt)
    return json(400, { error: "Missing prompt and transcript." });

  if (!env.AI) return json(501, { error: "Workers AI binding missing (AI)." });

  const system = `
You are an expert product designer and web IA planner. Generate content STRICTLY relevant to the user's topic and request. Every title, description, headline, and section body MUST reflect what the user asked for—do not use generic or off-topic copy.

Return ONLY valid JSON with this schema:
{
  "title": "Site title (topic-specific)",
  "headline": "Hero headline (compelling, topic-specific, can match or expand on title)",
  "description": "One sentence description (topic-specific)",
  "theme": "midnight|volt|ember|ocean",
  "layoutType": "business|portfolio|restaurant|tech|editorial|default",
  "heroCaption": "Short hero tagline or subhead (optional)",
  "heroVideoUrl": "Optional: URL to a free stock video (e.g. Pexels/Mixkit) that fits the topic, or empty string",
  "heroImageUrl": "Optional: URL to an image that fits the topic (e.g. https://placehold.co/1200x600?text=TOPIC), or empty string",
  "pages": [
    {"slug":"home","title":"Home","sections":[{"title":"...","body":"...","items":["optional bullet"],"imageUrl":"optional image URL","imageAlt":"optional alt text","ctaLabel":"optional CTA","ctaHref":"optional https URL"}]}
  ]
}
Rules:
- 3-6 pages max. Every page title and section content must be about the user's topic.
- Each page: 2-5 sections. Sections may include "imageUrl" and "imageAlt" for topic-relevant images.
- Prefer at least one visually rich hero asset and at least one section with 3-5 bullets in "items".
- Include a conversion path: pricing, booking, contact, or CTA section when relevant to the request.
- Slugs: lowercase, hyphenated, unique (e.g. home, about, services, contact).
- Always provide "headline" and "nav" is built from pages. Suggest "heroVideoUrl" or "heroImageUrl" when they fit the topic.
- layoutType: pick the best fit for the topic (e.g. restaurant for food, tech for software, editorial for content).
- Keep copy tight, conversion-oriented, and 100% relevant to the user's request.
`.trim();

  const user = `
Tone: ${tone || "default"}
User request (generate all content to match this topic):
${mergedPrompt}
`.trim();

  let layout;
  try {
    const result = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.3,
      max_tokens: 1400,
    });
    layout = extractJsonObject(pickAiText(result));

    // Validate layout structure
    if (!layout || typeof layout !== "object") {
      throw new Error("Invalid layout structure returned");
    }

    // Validate required fields
    if (!layout.title || typeof layout.title !== "string") {
      layout.title = "Generated Site";
    }

    if (!Array.isArray(layout.pages)) {
      layout.pages = [];
    }

    // Validate pages structure
    layout.pages = layout.pages.filter((page) => {
      if (!page || typeof page !== "object") return false;
      if (!page.title || typeof page.title !== "string") return false;
      if (!Array.isArray(page.sections)) return false;
      return true;
    });

    if (layout.pages.length === 0) {
      layout.pages = [
        {
          slug: "home",
          title: "Home",
          sections: [
            {
              title: "Welcome",
              body: "Welcome to your generated site.",
            },
          ],
        },
      ];
    }
  } catch (err) {
    return json(502, { error: `Layout generation failed: ${err.message}` });
  }

  const layoutType = (layout?.layoutType || "").trim().toLowerCase();
  const mergedStylePackIds = resolveStylePackIds({
    requestedIds: stylePackIds,
    layoutType,
  });
  const selectedStylePacks = getStylePacksByIds(mergedStylePackIds);
  const generatedCss = layout?.theme
    ? `:root{--vtw-theme:'${layout.theme}';}`
    : "";
  const css =
    [
      generatedCss,
      ...selectedStylePacks.map(
        (pack) => `/* style-pack:${pack.id} */\n${pack.css}`
      ),
    ]
      .filter(Boolean)
      .join("\n\n") || "";
  const html = renderPreviewHtml({ siteId, layout, css });

  await env.D1.prepare(
    "INSERT INTO sites (id, prompt, transcript, layout_json, html, css, status) VALUES (?,?,?,?,?,?,?)"
  )
    .bind(
      siteId,
      prompt,
      transcript,
      JSON.stringify(layout),
      html,
      css,
      "draft"
    )
    .run();

  return json(200, {
    ok: true,
    siteId,
    transcript,
    layout,
    stylePackIds: selectedStylePacks.map((pack) => pack.id),
    stylePacks: selectedStylePacks.map(
      ({ id, name, category, description }) => ({
        id,
        name,
        category,
        description,
      })
    ),
    previewUrl: `/preview/${siteId}`,
  });
}

export async function handlePreviewApiRequest({ request, env }) {
  if (!env.D1) return json(503, { error: "D1 database not available." });
  await ensureSiteTables(env);
  const url = new URL(request.url);
  const id = url.searchParams.get("id") || "";
  if (!id) return json(400, { error: "Missing id query param." });
  const row = await env.D1.prepare(
    "SELECT id, ts, prompt, transcript, layout_json, status FROM sites WHERE id = ?"
  )
    .bind(id)
    .first();
  if (!row) return json(404, { error: "Not found." });
  return json(200, {
    site: {
      ...row,
      layout: row.layout_json ? JSON.parse(row.layout_json) : null,
    },
  });
}

export async function handlePreviewPageRequest({ request, env }) {
  if (!env.D1) return new Response("D1 not available", { status: 503 });
  await ensureSiteTables(env);
  const url = new URL(request.url);
  const siteId = url.pathname.split("/").pop() || "";
  if (!siteId) return new Response("Missing site id", { status: 400 });
  const row = await env.D1.prepare("SELECT html FROM sites WHERE id = ?")
    .bind(siteId)
    .first();
  if (!row?.html) return new Response("Not found", { status: 404 });
  return new Response(row.html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function handleStylePacksRequest() {
  return json(200, {
    stylePacks: STYLE_PACK_LIBRARY.map(
      ({ id, name, category, description }) => ({
        id,
        name,
        category,
        description,
      })
    ),
    total: STYLE_PACK_LIBRARY.length,
  });
}

export async function handlePublishRequest({ request, env }) {
  const isAdmin = await isAdminRequest(request, env);
  if (!isAdmin) return json(401, { error: "Admin required." });
  if (!env.D1) return json(503, { error: "D1 database not available." });
  if (!env.R2) return json(503, { error: "R2 bucket binding missing (R2)." });

  await ensureSiteTables(env);
  let body;
  try {
    body = await request.clone().json();
  } catch {
    body = {};
  }
  const siteId = String(body?.siteId || "");
  if (!siteId) return json(400, { error: "Missing siteId." });

  const row = await env.D1.prepare(
    "SELECT id, html, css, layout_json FROM sites WHERE id = ?"
  )
    .bind(siteId)
    .first();
  if (!row) return json(404, { error: "Not found." });

  const base = `sites/${siteId}`;
  const assets = [
    {
      kind: "html",
      key: `${base}/index.html`,
      contentType: "text/html; charset=utf-8",
      body: row.html || "",
    },
    {
      kind: "css",
      key: `${base}/styles.css`,
      contentType: "text/css; charset=utf-8",
      body: row.css || "",
    },
    {
      kind: "layout",
      key: `${base}/layout.json`,
      contentType: "application/json",
      body: row.layout_json || "{}",
    },
  ];

  const encoder = new TextEncoder();
  const uploadResults = await Promise.all(
    assets.map(async (asset) => {
      const buf = encoder.encode(String(asset.body));
      await env.R2.put(asset.key, buf, {
        httpMetadata: { contentType: asset.contentType },
      });
      return { asset, sizeBytes: buf.byteLength };
    })
  );

  const statements = uploadResults.map(({ asset, sizeBytes }) =>
    env.D1.prepare(
      "INSERT INTO site_assets (site_id, kind, r2_key, content_type, size_bytes) VALUES (?,?,?,?,?)"
    ).bind(siteId, asset.kind, asset.key, asset.contentType, sizeBytes)
  );

  statements.push(
    env.D1.prepare("UPDATE sites SET status = ? WHERE id = ?").bind(
      "published",
      siteId
    )
  );

  await env.D1.batch(statements);

  return json(200, { ok: true, siteId, r2Prefix: base });
}

export { renderPreviewHtml, resolveStylePackIds };
