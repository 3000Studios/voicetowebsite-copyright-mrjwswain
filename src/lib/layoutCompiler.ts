export type LayoutSectionType =
  | "hero"
  | "features"
  | "services"
  | "pricing"
  | "faq"
  | "contact"
  | "testimonials"
  | "dashboard"
  | "sidebar"
  | "content";

export interface BrandAsset {
  name: string;
  domain?: string;
  logoUrl?: string;
  colors: string[];
}

export interface LayoutBlok {
  component: LayoutSectionType;
  order: number;
  grid_span: number;
  col_start?: number;
  title: string;
  body?: string;
  items?: string[];
  cta?: string;
  html?: string;
  typography?: {
    heading: string;
    body: string;
    prose?: boolean;
    clamp?: number;
    scale: "major-second" | "major-third";
  };
  motion?: {
    intent: "entrance" | "emphasis" | "stagger" | "sidebar" | "hero";
    direction: "left" | "right" | "up" | "down" | "none";
    layout: boolean;
  };
}

export interface LayoutTree {
  name: string;
  prompt: string;
  intent: string[];
  brand: BrandAsset;
  bloks: LayoutBlok[];
}

const FLOWBITE_CSS = "https://cdn.jsdelivr.net/npm/flowbite@4.0.1/dist/flowbite.min.css";
const FLOWBITE_JS = "https://cdn.jsdelivr.net/npm/flowbite@4.0.1/dist/flowbite.min.js";

const fallbackBrand: BrandAsset = {
  name: "Generated Brand",
  colors: ["#2563eb", "#111827", "#06b6d4"],
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
  return value
    .replace(/https?:\/\//g, "")
    .replace(/\.[a-z]{2,}.*$/i, "")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase()) || "Generated Brand";
}

function extractBrandName(prompt: string) {
  const quoted = prompt.match(/["']([^"']{3,80})["']/);
  if (quoted?.[1]) return quoted[1];
  const forMatch = prompt.match(/\b(?:for|called|named)\s+([a-z0-9&.\-\s]{3,60})/i);
  if (forMatch?.[1]) return forMatch[1].replace(/\b(with|that|and|using|where|who)\b.*$/i, "").trim();
  return prompt.split(/\s+/).slice(0, 4).join(" ");
}

function inferSections(prompt: string): LayoutSectionType[] {
  const p = prompt.toLowerCase();
  const sections: LayoutSectionType[] = ["hero"];
  if (/dashboard|app feel|admin|portal|sidebar/.test(p)) sections.push("sidebar", "dashboard");
  if (/feature|features|service|services|offer|offers|three/.test(p)) sections.push(p.includes("service") ? "services" : "features");
  if (/price|pricing|plan|subscription|package/.test(p)) sections.push("pricing");
  if (/testimonial|review|proof|trust/.test(p)) sections.push("testimonials");
  if (/faq|question|answers/.test(p)) sections.push("faq");
  if (/contact|book|lead|form|quote|call/.test(p)) sections.push("contact");
  if (sections.length === 1) sections.push("features", "pricing", "faq", "contact");
  return [...new Set(sections)];
}

function countFromPrompt(prompt: string, fallback = 3) {
  const p = prompt.toLowerCase();
  if (/\bthree\b|\b3\b/.test(p)) return 3;
  if (/\bfour\b|\b4\b/.test(p)) return 4;
  if (/\bsix\b|\b6\b/.test(p)) return 6;
  if (/\btwo\b|\b2\b/.test(p)) return 2;
  return fallback;
}

function detectMood(prompt: string) {
  const p = prompt.toLowerCase();
  if (/professional|corporate|law|consulting|enterprise/.test(p)) return "professional";
  if (/luxury|premium|high-end|elegant/.test(p)) return "luxury";
  if (/bold|energetic|launch|sales|marketing/.test(p)) return "bold";
  if (/minimal|clean|simple|quiet/.test(p)) return "minimal";
  return "modern";
}

function selectFonts(mood: string) {
  switch (mood) {
    case "professional":
      return { heading: "Roboto", body: "Inter" };
    case "luxury":
      return { heading: "Playfair Display", body: "Source Sans 3" };
    case "bold":
      return { heading: "Montserrat", body: "Inter" };
    case "minimal":
      return { heading: "Manrope", body: "Inter" };
    default:
      return { heading: "Space Grotesk", body: "Inter" };
  }
}

function typographyForSlot(gridSpan: number, type: LayoutSectionType, prompt: string) {
  const mood = detectMood(prompt);
  const fonts = selectFonts(mood);
  const marketing = /hero|pricing|services|features|testimonials/.test(type);
  const scale: "major-second" | "major-third" = marketing ? "major-third" : "major-second";
  const clamp = gridSpan <= 3 ? 3 : gridSpan <= 6 ? 2 : 0;
  const prose = type === "faq" || type === "contact" || type === "content";
  const heading =
    gridSpan <= 3
      ? "text-lg md:text-xl font-semibold leading-snug"
      : gridSpan <= 6
        ? "text-2xl md:text-3xl font-semibold leading-tight"
        : marketing
          ? "text-4xl md:text-5xl font-bold leading-[1.05]"
          : "text-3xl md:text-4xl font-semibold leading-tight";
  const body =
    gridSpan <= 3
      ? "text-sm leading-5"
      : "text-base leading-relaxed";
  return {
    fonts,
    heading,
    body,
    prose,
    clamp,
    scale,
    mood,
  };
}

function motionForSection(type: LayoutSectionType): LayoutBlok["motion"] {
  if (type === "sidebar") return { intent: "sidebar", direction: "left", layout: true };
  if (type === "dashboard") return { intent: "entrance", direction: "up", layout: true };
  if (type === "hero") return { intent: "hero", direction: "up", layout: true };
  if (type === "features" || type === "services" || type === "testimonials") return { intent: "stagger", direction: "up", layout: true };
  if (type === "pricing" || type === "contact" || type === "faq") return { intent: "emphasis", direction: "up", layout: true };
  return { intent: "entrance", direction: "up", layout: true };
}

function iconSvg(name: "spark" | "grid" | "chart" | "check" | "mail") {
  const paths = {
    spark: '<path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z"/>',
    grid: '<path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"/>',
    chart: '<path d="M4 19V5m0 14h16M8 16v-5m5 5V8m5 8v-9"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    mail: '<path d="M4 6h16v12H4z"/><path d="m4 7 8 6 8-6"/>',
  };
  return `<svg class="w-6 h-6" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">${paths[name]}</svg>`;
}

function sectionCopy(type: LayoutSectionType, brandName: string) {
  const safe = escapeHtml(brandName);
  switch (type) {
    case "hero":
      return { title: `${safe} built for immediate action`, body: `A polished site structure generated from your request, aligned to a 12-column responsive grid instead of a generic template.`, cta: "Start now" };
    case "features":
      return { title: "Features placed with intent", body: "Each benefit is mapped into balanced Flowbite-style cards with responsive grid placement.", cta: "Explore features" };
    case "services":
      return { title: "Services presented clearly", body: "Service blocks are organized for scanning, trust, and lead conversion.", cta: "View services" };
    case "pricing":
      return { title: "Simple pricing", body: "Conversion-focused plan cards with clear next steps.", cta: "Choose plan" };
    case "faq":
      return { title: "Questions answered", body: "Accordion-ready FAQ content for faster decisions.", cta: "Read answers" };
    case "contact":
      return { title: "Ready to connect", body: "A clean contact path for calls, quotes, bookings, or lead capture.", cta: "Contact us" };
    case "testimonials":
      return { title: "Proof that builds trust", body: "Review cards and trust signals are placed near conversion moments.", cta: "See results" };
    case "dashboard":
      return { title: "Main app workspace", body: "A col-span-9 content area for product controls, analytics, and workflow cards.", cta: "Open workspace" };
    case "sidebar":
      return { title: "App navigation", body: "A col-span-3 sidebar for dashboard-style experiences.", cta: "Navigate" };
    default:
      return { title: "Content section", body: "Structured content placed on the grid.", cta: "Learn more" };
  }
}

function buildBloks(prompt: string, brand: BrandAsset): LayoutBlok[] {
  const sections = inferSections(prompt);
  const itemCount = countFromPrompt(prompt);
  const appFeel = sections.includes("sidebar") || sections.includes("dashboard");
  let order = 1;
  const bloks: LayoutBlok[] = [];

  for (const type of sections) {
    const copy = sectionCopy(type, brand.name);
    const typography = typographyForSlot(type === "sidebar" ? 3 : type === "dashboard" ? 9 : type === "hero" ? 12 : type === "features" || type === "services" ? 12 : type === "pricing" ? 12 : type === "faq" ? 12 : type === "contact" ? 12 : 12, type, prompt);
    if (type === "sidebar") {
      bloks.push({ component: "sidebar", order: order++, grid_span: 3, col_start: 1, ...copy, typography, motion: motionForSection(type), items: ["Overview", "Pages", "Leads", "Settings"] });
    } else if (type === "dashboard") {
      bloks.push({ component: "dashboard", order: order++, grid_span: 9, col_start: 4, ...copy, typography, motion: motionForSection(type), items: ["Live Preview", "Conversion Score", "Pending Tasks"] });
    } else {
      bloks.push({
        component: type,
        order: order++,
        grid_span: type === "hero" ? 12 : 12,
        ...copy,
        typography,
        motion: motionForSection(type),
        items: Array.from({ length: type === "features" || type === "services" ? itemCount : 3 }, (_, index) => {
          const labels = type === "pricing" ? ["Starter", "Growth", "Scale"] : type === "faq" ? ["How fast is launch?", "Can I edit it?", "Is it responsive?"] : ["Fast setup", "Brand-aware design", "Conversion-ready layout", "Mobile polish", "SEO structure", "Lead capture"];
          return labels[index % labels.length];
        }),
      });
    }
  }

  if (appFeel && !bloks.some((blok) => blok.component === "contact")) {
    // App-like layouts still need one full-width conversion/next-step band.
    bloks.push({ component: "contact", order: order++, grid_span: 12, ...sectionCopy("contact", brand.name), items: ["Email", "Phone", "Project details"] });
  }

  return bloks.sort((a, b) => a.order - b.order);
}

function renderLogo(brand: BrandAsset) {
  if (brand.logoUrl) {
    return `<img src="${escapeHtml(brand.logoUrl)}" alt="${escapeHtml(brand.name)} logo" class="h-10 w-auto rounded-lg bg-white p-1" />`;
  }
  return `<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-sm font-black text-white">${escapeHtml(brand.name.slice(0, 1).toUpperCase())}</div>`;
}

function renderBlok(blok: LayoutBlok, brand: BrandAsset) {
  const span = blok.grid_span === 3 ? "lg:col-span-3" : blok.grid_span === 9 ? "lg:col-span-9" : "col-span-12";
  const base = `col-span-12 ${span}`;
  const title = escapeHtml(blok.title);
  const body = escapeHtml(blok.body || "");
  const items = blok.items || [];
  const headingClass = blok.typography?.heading || "text-3xl md:text-4xl font-semibold leading-tight";
  const bodyClass = blok.typography?.body || "text-base leading-relaxed";
  const clampClass = blok.typography?.clamp ? `line-clamp-${blok.typography.clamp}` : "";
  const proseClass = blok.typography?.prose ? "prose prose-lg max-w-none prose-headings:text-gray-950 prose-p:text-gray-600" : "";
  const motionAttrs = blok.motion ? `data-motion-intent="${blok.motion.intent}" data-motion-direction="${blok.motion.direction}" data-motion-layout="${String(blok.motion.layout)}"` : "";

  if (blok.component === "hero") {
    return `<section class="${base}" ${motionAttrs}>
      <div class="rounded-3xl border border-gray-200 bg-white p-8 shadow-xl lg:p-14">
        <div class="mb-8 flex items-center gap-3">${renderLogo(brand)}<span class="text-sm font-semibold text-gray-600">${escapeHtml(brand.name)}</span></div>
        <div class="grid items-center gap-10 lg:grid-cols-12">
          <div class="lg:col-span-7">
            <h1 class="mb-6 max-w-4xl ${headingClass} tracking-tight text-gray-950">${title}</h1>
            <p class="mb-8 ${bodyClass} ${clampClass} text-gray-600">${body}</p>
            <a href="#contact" class="inline-flex items-center rounded-lg bg-blue-700 px-6 py-3 text-center text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300">${escapeHtml(blok.cta || "Start now")}</a>
          </div>
          <div class="lg:col-span-5">
            <div class="rounded-2xl bg-gray-900 p-5 text-white shadow-2xl">
              <div class="mb-5 flex gap-2"><span class="h-3 w-3 rounded-full bg-red-400"></span><span class="h-3 w-3 rounded-full bg-yellow-300"></span><span class="h-3 w-3 rounded-full bg-green-400"></span></div>
              <div class="grid grid-cols-12 gap-3"><div class="col-span-12 h-16 rounded-xl bg-blue-500/40"></div><div class="col-span-4 h-24 rounded-xl bg-white/10"></div><div class="col-span-8 h-24 rounded-xl bg-white/10"></div><div class="col-span-6 h-16 rounded-xl bg-white/10"></div><div class="col-span-6 h-16 rounded-xl bg-white/10"></div></div>
            </div>
          </div>
        </div>
      </div>
    </section>`;
  }

  if (blok.component === "sidebar") {
    return `<aside class="${base}" ${motionAttrs}><div class="h-full rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><h2 class="mb-4 ${headingClass} text-gray-950">${title}</h2><nav class="space-y-2">${items.map((item) => `<a href="#" class="flex items-center gap-3 rounded-lg px-3 py-2 ${bodyClass} font-medium text-gray-700 hover:bg-gray-100">${iconSvg("grid")}<span>${escapeHtml(item)}</span></a>`).join("")}</nav></div></aside>`;
  }

  if (blok.component === "dashboard") {
    return `<section class="${base}" ${motionAttrs}><div class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"><div class="mb-6"><h2 class="${headingClass} text-gray-950">${title}</h2><p class="mt-2 ${bodyClass} text-gray-600">${body}</p></div><div class="grid grid-cols-1 gap-4 md:grid-cols-3">${items.map((item, i) => `<article class="rounded-xl border border-gray-200 p-5"><div class="mb-3 text-blue-700">${iconSvg(i === 1 ? "chart" : "grid")}</div><h3 class="${blok.typography?.clamp ? "line-clamp-2" : ""} font-bold text-gray-950">${escapeHtml(item)}</h3><p class="mt-2 text-sm text-gray-600">Grid-aware app module placed inside the main col-span-9 workspace.</p></article>`).join("")}</div></div></section>`;
  }

  if (blok.component === "features" || blok.component === "services") {
    return `<section class="${base}" ${motionAttrs}><div class="py-10"><div class="mx-auto mb-8 max-w-3xl text-center"><h2 class="mb-4 ${headingClass} tracking-tight text-gray-950">${title}</h2><p class="${bodyClass} text-gray-600">${body}</p></div><div class="grid grid-cols-1 gap-8 md:grid-cols-3">${items.map((item, i) => `<article class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"><div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700">${iconSvg(i % 2 ? "spark" : "check")}</div><h3 class="mb-2 ${blok.typography?.clamp ? "line-clamp-2" : ""} ${headingClass} text-gray-950">${escapeHtml(item)}</h3><p class="${bodyClass} text-gray-600">A non-default component populated from the request and locked to responsive grid placement.</p></article>`).join("")}</div></div></section>`;
  }

  if (blok.component === "pricing") {
    return `<section class="${base}" ${motionAttrs}><div class="py-10"><div class="mx-auto mb-8 max-w-3xl text-center"><h2 class="mb-4 ${headingClass} text-gray-950">${title}</h2><p class="${bodyClass} text-gray-600">${body}</p></div><div class="grid grid-cols-1 gap-6 md:grid-cols-3">${items.map((item, i) => `<div class="rounded-2xl border ${i === 1 ? "border-blue-600 ring-4 ring-blue-100" : "border-gray-200"} bg-white p-6 shadow-sm"><h3 class="${headingClass} text-gray-950">${escapeHtml(item)}</h3><div class="my-5 text-4xl font-extrabold text-gray-950">${i === 0 ? "$19" : i === 1 ? "$49" : "$99"}</div><ul class="mb-6 space-y-3 text-sm text-gray-600"><li>Grid compiled layout</li><li>Flowbite-ready UI</li><li>Responsive sections</li></ul><a class="block rounded-lg bg-blue-700 px-5 py-3 text-center text-sm font-medium text-white hover:bg-blue-800" href="#contact">${escapeHtml(blok.cta || "Choose plan")}</a></div>`).join("")}</div></div></section>`;
  }

  if (blok.component === "faq") {
    return `<section class="${base}" ${motionAttrs}><div class="py-10"><h2 class="mb-6 ${headingClass} text-gray-950">${title}</h2><div id="accordion-flush" data-accordion="collapse" class="rounded-2xl border border-gray-200 bg-white p-4">${items.map((item, i) => `<h3 id="accordion-heading-${i}"><button type="button" class="flex w-full items-center justify-between border-b border-gray-200 py-5 text-left ${bodyClass} font-medium text-gray-700" data-accordion-target="#accordion-body-${i}" aria-expanded="${i === 0}" aria-controls="accordion-body-${i}"><span>${escapeHtml(item)}</span><svg data-accordion-icon class="h-3 w-3 shrink-0 rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5 5 1 1 5"/></svg></button></h3><div id="accordion-body-${i}" class="${i === 0 ? "" : "hidden"}" aria-labelledby="accordion-heading-${i}"><div class="border-b border-gray-200 py-5 text-gray-600 ${proseClass}">${body}</div></div>`).join("")}</div></div></section>`;
  }

  if (blok.component === "contact") {
    return `<section id="contact" class="${base}" ${motionAttrs}><div class="rounded-3xl bg-gray-950 p-8 text-white md:p-10"><div class="grid gap-8 md:grid-cols-2"><div><h2 class="mb-4 ${headingClass}">${title}</h2><p class="${bodyClass} text-gray-300">${body}</p></div><form class="grid gap-4"><input class="rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-white" placeholder="Name"/><input class="rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-white" placeholder="Email"/><button class="rounded-lg bg-blue-600 px-5 py-3 font-medium hover:bg-blue-700" type="button">${iconSvg("mail")} ${escapeHtml(blok.cta || "Contact us")}</button></form></div></div></section>`;
  }

  return `<section class="${base}" ${motionAttrs}><div class="rounded-2xl border border-gray-200 bg-white p-6"><h2 class="${headingClass} text-gray-950">${title}</h2><p class="mt-2 ${bodyClass} text-gray-600">${body}</p></div></section>`;
}

export function compileLayoutDocument(tree: LayoutTree) {
  const primary = tree.brand.colors[0] || fallbackBrand.colors[0];
  const secondary = tree.brand.colors[1] || fallbackBrand.colors[1];
  const title = escapeHtml(`${tree.name} | VoiceToWebsite`);
  const description = escapeHtml(`Generated 12-column grid website for ${tree.name}.`);
  const schema = escapeHtml(JSON.stringify(tree));

  const tailwindConfig = buildTailwindConfig(tree);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="${FLOWBITE_CSS}" rel="stylesheet" />
  <script type="text/javascript">${tailwindConfig}</script>
  <style>:root{--brand-primary:${escapeHtml(primary)};--brand-secondary:${escapeHtml(secondary)}} html{scroll-behavior:smooth} body{font-family:Inter,ui-sans-serif,system-ui,sans-serif}</style>
</head>
<body class="bg-gray-50 text-gray-900">
  <script type="application/json" id="vtw-storyblok-blok-tree">${schema}</script>
  <main class="max-w-screen-xl mx-auto px-4 py-8">
    <div class="grid grid-cols-12 gap-8">
      ${tree.bloks.map((blok) => renderBlok(blok, tree.brand)).join("\n")}
    </div>
  </main>
  <footer class="max-w-screen-xl mx-auto px-4 pb-10 text-sm text-gray-500">Generated by VoiceToWebsite Layout Compiler. Every section includes grid_span and order metadata.</footer>
  <script src="${FLOWBITE_JS}"></script>
</body>
</html>`;
}

export function compileLayoutFromPrompt(prompt: string, brandInput?: Partial<BrandAsset>) {
  const brandName = brandInput?.name || toTitle(extractBrandName(prompt));
  const brand: BrandAsset = {
    ...fallbackBrand,
    ...brandInput,
    name: brandName,
    colors: brandInput?.colors?.length ? brandInput.colors : fallbackBrand.colors,
  };
  const tree: LayoutTree = {
    name: brand.name,
    prompt,
    intent: inferSections(prompt),
    brand,
    bloks: buildBloks(prompt, brand),
  };
  return { tree, html: compileLayoutDocument(tree) };
}

export function buildTailwindConfig(tree: LayoutTree) {
  const fonts = tree.bloks[0]?.typography ? selectFonts(tree.bloks[0].typography.scale === "major-third" ? "professional" : "modern") : selectFonts("modern");
  return `tailwind = window.tailwind || {}; tailwind.config = { theme: { extend: { fontFamily: { sans: ['${fonts.body}', 'ui-sans-serif', 'system-ui'], display: ['${fonts.heading}', '${fonts.body}', 'ui-sans-serif', 'system-ui'] } } } };`;
}

export const layoutCompiler = {
  compileFromPrompt: compileLayoutFromPrompt,
  compileDocument: compileLayoutDocument,
  buildTailwindConfig,
};
