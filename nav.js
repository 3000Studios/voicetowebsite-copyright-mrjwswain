(() => {
  const navLinks = [
    { href: "index.html", label: "Home" },
    { href: "store.html", label: "Store" },
    { href: "/admin", label: "Admin" },
    { href: "appstore.html", label: "App Store" },
    { href: "livestream.html", label: "Live" },
  ];

  const navVideoSrc = "https://res.cloudinary.com/dj92eb97f/video/upload/v1768888706/254781_small_vlfg5w.mp4";

  const beep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 880;
      gain.gain.value = 0.08;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (_) {
      // ignore
    }
  };

  const buildLinkHtml = () => navLinks.map((link) => `<a href="${link.href}" data-name="${link.label}">${link.label}</a>`).join("");
  const buildListHtml = () => navLinks.map((link) => `<li><a href="${link.href}">${link.label}</a></li>`).join("");

  const clearExistingNav = () => {
    document.querySelectorAll(".glass-nav, .mobile-overlay, .site-header, .site-nav").forEach((el) => el.remove());
    const toggle = document.getElementById("mobileNavToggle");
    if (toggle) toggle.remove();
  };

  const injectNav = () => {
    clearExistingNav();

    const body = document.body;
    const fragment = document.createDocumentFragment();

    const toggle = document.createElement("input");
    toggle.type = "checkbox";
    toggle.id = "mobileNavToggle";
    toggle.className = "mobile-toggle";
    toggle.setAttribute("aria-hidden", "true");

    const nav = document.createElement("nav");
    nav.className = "glass-nav";
    nav.innerHTML = `
      <div class="nav-video-mask" aria-hidden="true">
        <video autoplay muted loop playsinline>
          <source src="${navVideoSrc}" type="video/mp4" />
        </video>
      </div>
      <div class="brand">
        <span class="brand-dot"></span>
        <span class="brand-name">VoiceToWebsite</span>
      </div>
      <div class="nav-links">
        ${buildLinkHtml()}
      </div>
      <label for="mobileNavToggle" class="nav-toggle" aria-label="Toggle navigation" aria-controls="mobileOverlay" role="button" tabindex="0">
        <span></span>
      </label>
    `;

    const overlay = document.createElement("div");
    overlay.className = "mobile-overlay";
    overlay.id = "mobileOverlay";
    overlay.innerHTML = `
      <ul>
        ${buildListHtml()}
      </ul>
    `;

    fragment.append(toggle, nav, overlay);
    body.prepend(fragment);
    body.classList.add("nav-ready");

    const closeOnNavigate = () => {
      toggle.checked = false;
    };
    overlay.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeOnNavigate);
    });

    const interactiveLinks = nav.querySelectorAll("a");
    interactiveLinks.forEach((link) => link.addEventListener("mouseenter", beep));
    overlay.querySelectorAll("a").forEach((link) => link.addEventListener("mouseenter", beep));

    const toggleButton = nav.querySelector(".nav-toggle");
    toggleButton?.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggle.checked = !toggle.checked;
      }
    });
  };

  const init = () => {
    injectNav();
    electrifyLinks();
    spectralizeCards();
  };

  const electrifyLinks = () => {
    const links = () => document.querySelectorAll(".nav-links a");
    const tick = () => {
      const nodes = links();
      if (!nodes.length) return;
      const pick = nodes[Math.floor(Math.random() * nodes.length)];
      pick.classList.add("electrify");
      setTimeout(() => pick.classList.remove("electrify"), 1200);
      setTimeout(tick, 2400 + Math.random() * 1200);
    };
    setTimeout(tick, 1800);
  };

  const cardSelectors = [
    ".feature-card",
    ".step-card",
    ".lineup-card",
    ".lineup-grid article",
    ".blog-card",
    ".story-card",
    ".price-card",
    ".card.luxe",
    ".card-3000",
    ".cards-3000 .card-3000",
    ".race-card",
    ".kpi-card",
    ".search-card",
    ".secret-card",
    ".help-card",
    ".appstore .product-card",
    ".admin-grid .card",
    ".lock-card",
    ".crystal-card",
  ];

  const spectralizeCards = () => {
    const seen = new Set();
    cardSelectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        el.classList.add("spectral-card");
        el.addEventListener("mousemove", handleGlow, { passive: true });
        el.addEventListener("mouseleave", resetGlow, { passive: true });
      });
    });
  };

  const handleGlow = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    event.currentTarget.style.setProperty("--glow-x", `${x}%`);
    event.currentTarget.style.setProperty("--glow-y", `${y}%`);
  };

  const resetGlow = (event) => {
    event.currentTarget.style.removeProperty("--glow-x");
    event.currentTarget.style.removeProperty("--glow-y");
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
