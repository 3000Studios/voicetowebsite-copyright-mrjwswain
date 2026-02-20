const qs = (sel, root = document) => root.querySelector(sel);

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const loadRegistry = async () => {
  const res = await fetch("/config/registry.json", { cache: "no-store" });
  if (!res.ok) throw new Error("Registry unavailable.");
  const data = await res.json().catch(() => ({}));
  return Array.isArray(data?.pages) ? data.pages : [];
};

const scoreMatch = (query, page) => {
  const q = query.toLowerCase();
  const haystack = `${page.id} ${page.route} ${page.asset} ${page.zone}`.toLowerCase();
  if (haystack.includes(q)) return 2;
  if (q.split(/\s+/).some((part) => part && haystack.includes(part))) return 1;
  return 0;
};

const renderResults = (results, root) => {
  if (!root) return;
  if (!results.length) {
    root.innerHTML = "<div class='muted'>No results found.</div>";
    return;
  }
  root.innerHTML = results
    .map(
      (page) => `
      <a class="search-result" href="${escapeHtml(page.route)}">
        <div>
          <strong>${escapeHtml(page.id || page.route)}</strong>
          <div class="muted">${escapeHtml(page.route)}</div>
        </div>
        <span class="search-pill">${escapeHtml(page.zone || "public")}</span>
      </a>
    `
    )
    .join("");
};

const initSearch = async () => {
  const form = qs("#siteSearchForm");
  const input = qs("#siteSearchInput");
  const resultsEl = qs("#siteSearchResults");
  if (!form || !input || !resultsEl) return;

  const params = new URLSearchParams(location.search);
  const initialQuery = String(params.get("q") || "").trim();
  if (initialQuery) input.value = initialQuery;

  const pages = await loadRegistry().catch(() => []);

  const runSearch = () => {
    const query = String(input.value || "").trim();
    if (!query) {
      renderResults(pages.slice(0, 10), resultsEl);
      return;
    }
    const scored = pages
      .map((page) => ({ page, score: scoreMatch(query, page) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);
    renderResults(
      scored.map((item) => item.page),
      resultsEl
    );
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const q = String(input.value || "").trim();
    const url = new URL(location.href);
    if (q) url.searchParams.set("q", q);
    else url.searchParams.delete("q");
    history.replaceState({}, "", url.toString());
    runSearch();
  });

  runSearch();
};

void initSearch();
