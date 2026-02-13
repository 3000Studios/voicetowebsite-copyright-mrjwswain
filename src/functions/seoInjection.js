export async function injectSEO(response, pageConfig, env) {
  const contentType = response.headers.get("Content-Type");
  if (!contentType || !contentType.includes("text/html")) {
    return response;
  }

  let html = await response.text();
  const config = pageConfig || {};
  const defaults = config.defaults || {};
  const content = config.content || {};

  const title = content.title || config.title || defaults.title || "Material Vault";
  const description = content.description || config.description || defaults.description || "";

  // Simple SEO injection (replaces existing tags or adds new ones in head)
  // In a real production app, we'd use a proper HTMLRewriter

  const seoTags = `
    <title>${title}</title>
    <meta name="description" content="${description}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="robots" content="${config.robots || defaults.robots || "index,follow"}">
    <link rel="canonical" href="${config.canonical || ""}">
  `;

  html = html.replace("</head>", `${seoTags}\n</head>`);

  return new Response(html, {
    ...response,
    headers: response.headers,
  });
}

// Using HTMLRewriter is more robust for Cloudflare Workers
export class SEORewriter {
  constructor(config) {
    this.config = config;
  }

  element(element) {
    // Handle title
    if (element.tagName === "title") {
      element.setInnerContent(this.config.title);
    }
    // Handle meta tags
    if (element.tagName === "meta") {
      const name = element.getAttribute("name");
      const property = element.getAttribute("property");
      if (name === "description") element.setAttribute("content", this.config.description);
      if (property === "og:title") element.setAttribute("content", this.config.title);
      if (property === "og:description") element.setAttribute("content", this.config.description);
      if (name === "twitter:title") element.setAttribute("content", this.config.title);
      if (name === "twitter:description") element.setAttribute("content", this.config.description);
      if (name === "robots") element.setAttribute("content", this.config.robots);
    }
  }
}
