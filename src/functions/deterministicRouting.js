export async function resolveRoute(request, env) {
  const url = new URL(request.url);
  let pathname = url.pathname;

  // 1) Normalize path
  if (pathname !== "/" && pathname.endsWith("/")) {
    pathname = pathname.slice(0, -1);
  }

  // Load registry and redirects from KV or Static Assets
  // For now, assume they are available in the public/config directory as static assets
  const registryResponse = await env.ASSETS.fetch(
    new URL("/config/registry.json", url.origin)
  );
  const redirectsResponse = await env.ASSETS.fetch(
    new URL("/config/redirects.json", url.origin)
  );

  if (!registryResponse.ok) {
    console.error("Failed to load registry.json");
    return null;
  }

  const registry = await registryResponse.json();
  const redirects = redirectsResponse.ok
    ? await redirectsResponse.json()
    : { redirects: [] };

  // 2) Apply redirects.json
  const redirect = redirects.redirects?.find((r) => r.from === pathname);
  if (redirect) {
    return { redirect: redirect.to, status: redirect.status || 302 };
  }

  // 3) Registry match
  const page = registry.pages?.find((p) => p.route === pathname);
  if (page) {
    return { assetPath: page.asset, zone: page.zone, pageId: page.id };
  }

  // 4) Fallback
  // If no extension: try <path>.html
  if (!pathname.includes(".")) {
    const potentialAsset =
      pathname === "/" ? "index.html" : `${pathname.slice(1)}.html`;

    // Fallback block for /admin or /labs
    if (pathname.startsWith("/admin") || pathname.startsWith("/labs")) {
      return null;
    }

    // Try apps/docs/labs prefix/index.html
    const prefixes = ["/apps", "/docs", "/labs"];
    for (const prefix of prefixes) {
      if (pathname.startsWith(prefix)) {
        return { assetPath: `${prefix.slice(1)}/index.html`, zone: "public" };
      }
    }

    return { assetPath: potentialAsset, zone: "public" };
  }

  return null;
}
