function json(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init.headers || {}),
    },
  });
}

export const onRequestGet: PagesFunction = async ({ request }) => {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").toLowerCase();

  const style = {
    headingFont: "Poppins",
    bodyFont: "Inter",
    accentA: "#6366f1",
    accentB: "#d946ef",
    headlineEffect: "fade-up",
  };

  if (q.includes("luxury") || q.includes("salon")) {
    style.headingFont = "Playfair Display";
    style.accentA = "#ec4899";
    style.accentB = "#a855f7";
    style.headlineEffect = "slide-in";
  } else if (q.includes("gym") || q.includes("fitness")) {
    style.headingFont = "Oswald";
    style.accentA = "#22d3ee";
    style.accentB = "#6366f1";
    style.headlineEffect = "fade-up";
  } else if (q.includes("coffee") || q.includes("restaurant")) {
    style.headingFont = "Montserrat";
    style.accentA = "#f59e0b";
    style.accentB = "#ef4444";
  }

  return json(style);
};

