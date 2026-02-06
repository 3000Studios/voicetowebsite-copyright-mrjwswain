(() => {
  const navLinks = [
    { href: "/index.html", label: "Home" },
    { href: "/store.html", label: "Store" },
    { href: "/admin", label: "Admin" },
    { href: "/appstore.html", label: "App Store" },
    { href: "/livestream.html", label: "Live" },
  ];
  const footerLinks = {
    platform: [
      { href: "/neural-engine.html", label: "Neural Engine" },
      { href: "/strata-design-system.html", label: "Strata Design System" },
      { href: "/api-documentation.html", label: "API Documentation" },
      { href: "/voice-to-json.html", label: "Voice-to-JSON" },
    ],
    company: [
      { href: "/blog.html", label: "The Monolith Blog" },
      { href: "/geological-studies.html", label: "Geological Studies" },
      { href: "/privacy.html", label: "Privacy Protocol" },
      { href: "/terms.html", label: "Terms of Service" },
    ],
  };
  const navVideoSrc =
    "https://res.cloudinary.com/dj92eb97f/video/upload/v1768888706/254781_small_vlfg5w.mp4";
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
    } catch (_) {}
  };
  const hasAdminAccess = () => {
    try {
      const unlocked = sessionStorage.getItem("yt-admin-unlocked") === "true";
      const cookie = document.cookie
        .split(";")
        .some((part) => part.trim().startsWith("vtw_admin=1"));
      return unlocked || cookie;
    } catch (_) {
      return false;
    }
  };
  const getNavLinks = () => {
    if (hasAdminAccess()) return navLinks;
    return navLinks.filter((link) => link.label !== "Admin");
  };
  const buildLinkHtml = () =>
    getNavLinks()
      .map(
        (link) =>
          `<a href="${link.href}" data-name="${link.label}">${link.label}</a>`,
      )
      .join("");
  const buildListHtml = () =>
    getNavLinks()
      .map((link) => `<li><a href="${link.href}">${link.label}</a></li>`)
      .join("");
  const clearExistingNav = () => {
    document
      .querySelectorAll(".glass-nav, .mobile-overlay, .site-header, .site-nav")
      .forEach((el) => el.remove());
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
    nav.innerHTML = `      <div class="nav-video-mask" aria-hidden="true">        <video autoplay muted loop playsinline>          <source src="${navVideoSrc}" type="video/mp4" />        </video>      </div>      <div class="brand">        <span class="brand-dot"></span>        <span class="brand-name">VoiceToWebsite</span>      </div>      <div class="nav-links">        ${buildLinkHtml()}      </div>      <label for="mobileNavToggle" class="nav-toggle" aria-label="Toggle navigation" aria-controls="mobileOverlay" role="button" tabindex="0">        <span></span>      </label>    `;
    const overlay = document.createElement("div");
    overlay.className = "mobile-overlay";
    overlay.id = "mobileOverlay";
    overlay.innerHTML = `      <ul>        ${buildListHtml()}      </ul>    `;
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
    interactiveLinks.forEach((link) =>
      link.addEventListener("mouseenter", beep),
    );
    overlay
      .querySelectorAll("a")
      .forEach((link) => link.addEventListener("mouseenter", beep));
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
    injectFooter();
    initFooterTimestamp();
    initFooterParallax();
    electrifyLinks();
    spectralizeCards();
    initScrollReveals();
    maybeInitAdminTerminalFix();
  };
  const maybeInitAdminTerminalFix = () => {
    try {
      if (!location.pathname.startsWith("/admin")) return;
      if (!document.getElementById("apply")) return;
      import("/admin/terminal-fix.js").catch(() => {});
    } catch (_) {}
  };
  const initScrollReveals = () => {
    if (!("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -12% 0px" },
    );

    document.querySelectorAll(".spectral-card").forEach((el) => {
      if (el.dataset.revealInit) return;
      el.dataset.revealInit = "1";
      el.classList.add("reveal");
      observer.observe(el);
    });
  };
  const injectFooter = () => {
    const existing = document.querySelector(".vt-footer");
    if (existing) return;
    const footer = document.createElement("footer");
    footer.className = "vt-footer";
    const platformLinks = footerLinks.platform
      .map((link) => `<li><a href="${link.href}">${link.label}</a></li>`)
      .join("");
    const companyLinks = footerLinks.company
      .map((link) => `<li><a href="${link.href}">${link.label}</a></li>`)
      .join("");
    footer.innerHTML = `      <div class="footer-container">        <div class="strata-cell">          <div class="etched-brand">VOICE<br>TO<br>WEBSITE</div>          <p class="vt-footer-tagline">            Erosion-resistant digital infrastructure for the vocal era.          </p>        </div>        <div class="strata-cell">          <h4 class="strata-heading">Platform</h4>          <ul class="footer-links">            ${platformLinks}          </ul>        </div>        <div class="strata-cell">          <h4 class="strata-heading">Company</h4>          <ul class="footer-links">            ${companyLinks}          </ul>        </div>        <div class="strata-cell">          <h4 class="strata-heading">Trending Now</h4>          <a href="/lexicon-pro.html" class="hot-product-card">            <div>              <div class="hot-tag">NEW RELEASE</div>              <div class="product-name">LEXICON PRO</div>              <p class="hot-product-desc">                Real-time site stratification from live audio feeds.              </p>            </div>            <div class="product-cta">ACQUIRE LICENSE</div>          </a>        </div>      </div>      <div class="status-bar">        <div class="live-indicator">          <div class="pulse-stack">            <div class="pulse" aria-hidden="true"></div>            <span>SYSTEMS NOMINAL</span>          </div>          <span>LATENCY: 14MS</span>          <span class="timestamp" id="vt-footer-timestamp"></span>        </div>        <div>          &copy; ${new Date().getFullYear()} VOICETOWEBSITE.COM

        </div>      </div>    `;
    document.body.appendChild(footer);
  };
  const initFooterTimestamp = () => {
    const stamp = document.getElementById("vt-footer-timestamp");
    if (!stamp) return;
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toISOString().replace("T", " ").substring(0, 19);
      stamp.textContent = `UTC: ${timeString}`;
    };
    updateTime();
    window.setInterval(updateTime, 1000);
  };
  const initFooterParallax = () => {
    const cells = document.querySelectorAll(".vt-footer .strata-cell");
    if (!cells.length) return;
    cells.forEach((cell) => {
      cell.addEventListener(
        "mousemove",
        (e) => {
          const rect = cell.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          cell.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(59, 130, 246, 0.05) 0%, var(--bg-obsidian) 80%)`;
        },
        { passive: true },
      );
      cell.addEventListener(
        "mouseleave",
        () => {
          cell.style.background = "var(--bg-obsidian)";
        },
        { passive: true },
      );
    });
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
