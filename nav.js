(() => {
  const THEME_KEY = "vtw-theme";
  const THEMES = [
    { id: "midnight", label: "Midnight" },
    { id: "volt", label: "Volt" },
    { id: "ember", label: "Ember" },
    { id: "ocean", label: "Ocean" },
  ];
  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/features", label: "Features" },
    { href: "/pricing", label: "Pricing" },
    { href: "/demo", label: "Demo" },
    { href: "/store", label: "Store" },
    { href: "/appstore", label: "App Store" },
    { href: "/blog", label: "Blog" },
    { href: "/livestream", label: "Live" },
    { href: "/support", label: "Support" },
    { href: "/admin", label: "Admin" },
  ];
  const footerLinks = {
    platform: [
      { href: "/features", label: "Features" },
      { href: "/demo", label: "Interactive Demo" },
      { href: "/pricing", label: "Pricing" },
      { href: "/store", label: "Store" },
      { href: "/appstore", label: "App Store" },
    ],
    company: [
      { href: "/partners", label: "Partners" },
      { href: "/trust", label: "Trust Center" },
      { href: "/status", label: "Status" },
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  };
  const navVideoSrc =
    "https://res.cloudinary.com/dj92eb97f/video/upload/v1768888706/254781_small_vlfg5w.mp4";

  const normalizeTheme = (value) => {
    const found = THEMES.some((t) => t.id === value);
    return found ? value : "midnight";
  };

  const applyTheme = (theme) => {
    const next = normalizeTheme(theme);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch (_) {}

    document.querySelectorAll("[data-vtw-theme-btn]").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.theme === next);
      btn.setAttribute("aria-pressed", btn.dataset.theme === next ? "true" : "false");
    });
  };

  const initTheme = () => {
    let stored = null;
    try {
      stored = localStorage.getItem(THEME_KEY);
    } catch (_) {}
    applyTheme(stored || "midnight");
  };

  const wireThemeSwitcher = () => {
    document.querySelectorAll("[data-vtw-theme-btn]").forEach((btn) => {
      if (btn.dataset.vtwWired) return;
      btn.dataset.vtwWired = "1";
      btn.addEventListener("click", () => applyTheme(btn.dataset.theme));
    });
    applyTheme(document.documentElement.dataset.theme);
  };

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

  const injectWidget = () => {
    if (document.getElementById("vtw-widget")) return;
    const wrap = document.createElement("div");
    wrap.className = "vt-widget";
    wrap.id = "vtw-widget";
    wrap.innerHTML = `
      <button class="vt-widget-fab" id="vtw-widget-toggle" type="button" aria-expanded="false" aria-controls="vtw-widget-panel" aria-label="Open chat and mic widget">
        <span class="vt-widget-fab-dot" aria-hidden="true"></span>
        <span class="vt-widget-fab-label">Ask / Build</span>
      </button>
      <section class="vt-widget-panel" id="vtw-widget-panel" aria-hidden="true">
        <header class="vt-widget-head">
          <div class="vt-widget-title">
            <span class="vt-widget-title-mark" aria-hidden="true"></span>
            <span>VoiceToWebsite</span>
          </div>
          <div class="vt-widget-tabs" role="tablist" aria-label="Widget mode">
            <button class="vt-widget-tab is-active" type="button" role="tab" data-mode="ask" aria-selected="true">Ask</button>
            <button class="vt-widget-tab" type="button" role="tab" data-mode="build" aria-selected="false">Build</button>
          </div>
          <button class="vt-widget-close" id="vtw-widget-close" type="button" aria-label="Close widget">×</button>
        </header>
        <div class="vt-widget-body">
          <div class="vt-widget-log" id="vtw-widget-log" aria-live="polite"></div>
          <div class="vt-widget-hints" id="vtw-widget-hints"></div>
          <div class="vt-widget-input">
            <label class="sr-only" for="vtw-widget-text">Message</label>
            <textarea id="vtw-widget-text" rows="2" placeholder="Ask a question…"></textarea>
            <button class="vt-widget-mic" id="vtw-widget-mic" type="button" aria-label="Voice input">🎙️</button>
            <button class="vt-widget-send" id="vtw-widget-send" type="button">Send</button>
          </div>
          <div class="vt-widget-status muted" id="vtw-widget-status" aria-live="polite"></div>
        </div>
      </section>
    `;
    document.body.appendChild(wrap);
  };

  const wireWidget = () => {
    const root = document.getElementById("vtw-widget");
    if (!root || root.dataset.vtwWired) return;
    root.dataset.vtwWired = "1";

    const panel = document.getElementById("vtw-widget-panel");
    const toggle = document.getElementById("vtw-widget-toggle");
    const closeBtn = document.getElementById("vtw-widget-close");
    const log = document.getElementById("vtw-widget-log");
    const text = document.getElementById("vtw-widget-text");
    const send = document.getElementById("vtw-widget-send");
    const micBtn = document.getElementById("vtw-widget-mic");
    const hints = document.getElementById("vtw-widget-hints");
    const status = document.getElementById("vtw-widget-status");

    const modes = {
      ask: {
        placeholder: "Ask a question…",
        chips: [
          "What is VoiceToWebsite?",
          "How does Plan → Apply work?",
          "Show pricing",
          "Open the demo",
          "Where do ads appear?",
        ],
      },
      build: {
        placeholder: "Describe what you want to build…",
        chips: [
          "Build a creator portfolio site",
          "Make a barber shop landing page with booking",
          "Create an agency homepage with case studies",
          "Design an ecommerce storefront with bundles",
          "Generate a blog cluster for voice website builder",
        ],
      },
    };

    let mode = "ask";

    const setExpanded = (expanded) => {
      toggle?.setAttribute("aria-expanded", expanded ? "true" : "false");
      panel?.setAttribute("aria-hidden", expanded ? "false" : "true");
      root.classList.toggle("is-open", expanded);
      if (expanded) text?.focus();
    };

    const renderHints = () => {
      if (!hints) return;
      hints.innerHTML = "";
      modes[mode].chips.forEach((chip) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "vt-chip";
        btn.textContent = chip;
        btn.addEventListener("click", () => {
          if (text) text.value = chip;
          text?.focus();
        });
        hints.appendChild(btn);
      });
    };

    const addMsg = (who, content) => {
      if (!log) return;
      const row = document.createElement("div");
      row.className = `vt-widget-msg vt-widget-msg--${who}`;
      row.innerHTML = `<div class="vt-widget-bubble">${content}</div>`;
      log.appendChild(row);
      log.scrollTop = log.scrollHeight;
    };

    const answerAsk = (q) => {
      const t = (q || "").toLowerCase();
      if (t.includes("pricing") || t.includes("price")) {
        return `Pricing lives on <a href="/pricing">/pricing</a>. Want a fast win? Try <a href="/demo">the demo</a> first.`;
      }
      if (t.includes("demo") || t.includes("try")) {
        return `Open the interactive demo: <a href="/demo">/demo</a>. You’ll get an outline preview in seconds.`;
      }
      if (t.includes("plan") || t.includes("rollback") || t.includes("apply")) {
        return `Plan → Apply → Rollback is the safety gate. See <a href="/features">Features</a>, or run it in <a href="/admin/">Admin</a> (requires unlock).`;
      }
      if (t.includes("ads")) {
        return `Ads are only intended for blog/resources pages — never the core funnel. See <a href="/blog">Blog</a>.`;
      }
      if (t.includes("privacy") || t.includes("data") || t.includes("security")) {
        return `For data handling + security posture, visit <a href="/trust">Trust Center</a> and <a href="/privacy">Privacy</a>.`;
      }
      return `Try: <a href="/demo">/demo</a> to build instantly, or <a href="/pricing">/pricing</a> to compare tiers. Want to “Build” instead of “Ask”? Switch modes.`;
    };

    const handleSend = () => {
      const value = (text?.value || "").trim();
      if (!value) return;
      addMsg("user", value.replace(/</g, "&lt;"));
      if (text) text.value = "";

      if (mode === "ask") {
        addMsg("bot", answerAsk(value));
        return;
      }

      try {
        localStorage.setItem(
          "vtw-demo-prefill",
          JSON.stringify({ prompt: value, ts: Date.now() }),
        );
      } catch (_) {}
      addMsg("bot", `Opening <a href="/demo">/demo</a> with your prompt…`);
      setTimeout(() => {
        window.location.href = "/demo";
      }, 350);
    };

    const setMode = (nextMode) => {
      mode = nextMode === "build" ? "build" : "ask";
      root.dataset.mode = mode;
      root.querySelectorAll(".vt-widget-tab").forEach((tab) => {
        const active = tab.dataset.mode === mode;
        tab.classList.toggle("is-active", active);
        tab.setAttribute("aria-selected", active ? "true" : "false");
      });
      if (text) text.placeholder = modes[mode].placeholder;
      renderHints();
      if (status) status.textContent = "";
    };

    toggle?.addEventListener("click", () => setExpanded(!root.classList.contains("is-open")));
    closeBtn?.addEventListener("click", () => setExpanded(false));
    send?.addEventListener("click", handleSend);

    text?.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        handleSend();
      }
    });

    root.addEventListener("click", (event) => {
      const tab = event.target.closest(".vt-widget-tab");
      if (!tab) return;
      setMode(tab.dataset.mode);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setExpanded(false);
    });

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      micBtn?.setAttribute("disabled", "true");
      micBtn && (micBtn.title = "Voice input not supported in this browser.");
    } else {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      let listening = false;
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((r) => r[0])
          .map((r) => r.transcript)
          .join("");
        if (text) text.value = transcript;
      };
      recognition.onend = () => {
        listening = false;
        root.classList.remove("is-listening");
        if (status) status.textContent = "Voice input stopped.";
      };
      recognition.onerror = () => {
        listening = false;
        root.classList.remove("is-listening");
        if (status) status.textContent = "Voice input failed.";
      };

      micBtn?.addEventListener("click", () => {
        if (!listening) {
          listening = true;
          root.classList.add("is-listening");
          if (status) status.textContent = "Listening…";
          recognition.start();
          return;
        }
        recognition.stop();
      });
    }

    setMode("ask");
    addMsg(
      "bot",
      `Need help? Ask here — or switch to Build to jump into <a href="/demo">/demo</a>.`,
    );
    renderHints();
  };
  const init = () => {
    initTheme();
    injectNav();
    injectWidget();
    injectFooter();
    wireThemeSwitcher();
    wireWidget();
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
    const themeButtons = THEMES.map(
      (t) =>
        `<button type="button" class="theme-btn" data-theme="${t.id}" data-vtw-theme-btn>${t.label}</button>`,
    ).join("");
    footer.innerHTML = `      <div class="footer-container">        <div class="strata-cell">          <div class="etched-brand">VOICE<br>TO<br>WEBSITE</div>          <p class="vt-footer-tagline">            Erosion-resistant digital infrastructure for the vocal era.          </p>        </div>        <div class="strata-cell">          <h4 class="strata-heading">Platform</h4>          <ul class="footer-links">            ${platformLinks}          </ul>        </div>        <div class="strata-cell">          <h4 class="strata-heading">Company</h4>          <ul class="footer-links">            ${companyLinks}          </ul>        </div>        <div class="strata-cell">          <h4 class="strata-heading">Trending Now</h4>          <a href="/lexicon-pro.html" class="hot-product-card">            <div>              <div class="hot-tag">NEW RELEASE</div>              <div class="product-name">LEXICON PRO</div>              <p class="hot-product-desc">                Real-time site stratification from live audio feeds.              </p>            </div>            <div class="product-cta">ACQUIRE LICENSE</div>          </a>        </div>      </div>      <div class="status-bar">        <div class="live-indicator">          <div class="pulse-stack">            <div class="pulse" aria-hidden="true"></div>            <span>SYSTEMS NOMINAL</span>          </div>          <span>LATENCY: 14MS</span>          <span class="timestamp" id="vt-footer-timestamp"></span>        </div>        <div>          &copy; ${new Date().getFullYear()} VOICETOWEBSITE.COM

        </div>      </div>    `;

    footer
      .querySelector(".strata-cell")
      ?.insertAdjacentHTML(
        "beforeend",
        `<div class="footer-theme"><div class="theme-label">Theme</div><div class="theme-switch" role="group" aria-label="Theme switcher">${themeButtons}</div></div>`,
      );
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
          cell.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(var(--accent-rgb), 0.08) 0%, rgba(255, 255, 255, 0.03) 42%, rgba(255, 255, 255, 0.03) 100%)`;
        },
        { passive: true },
      );
      cell.addEventListener(
        "mouseleave",
        () => {
          cell.style.background = "";
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
