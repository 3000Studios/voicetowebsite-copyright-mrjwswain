(() => {
  const THEME_KEY = "vtw-theme";
  const THEMES = [
    { id: "metallic", label: "Metallic" },
    { id: "midnight", label: "Midnight" },
    { id: "volt", label: "Volt" },
    { id: "ember", label: "Ember" },
    { id: "ocean", label: "Ocean" },
  ];

  const isShellDisabled = () => {
    try {
      const meta = document.querySelector('meta[name="vtw-shell"]');
      if (meta && String(meta.getAttribute("content") || "").toLowerCase() === "off") return true;
      if (document.documentElement?.dataset?.vtwShell === "off") return true;
      if (document.body?.dataset?.vtwShell === "off") return true;
    } catch (_) {}
    return false;
  };

  const isAdminPage = () => {
    try {
      return location.pathname.startsWith("/admin");
    } catch (_) {
      return false;
    }
  };
  const prefersReducedMotion = () => {
    try {
      return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (_) {
      return false;
    }
  };
  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/features", label: "Features" },
    { href: "/pricing", label: "Pricing" },
    { href: "/license", label: "License" },
    { href: "/demo", label: "Demo" },
    { href: "/store", label: "Store" },
    { href: "/appstore", label: "App Store" },
    { href: "/blog", label: "Blog" },
    { href: "/livestream", label: "Live" },
    { href: "/support", label: "Support" },
  ];

  const adminLinks = [
    { href: "/admin/index", label: "Dashboard" },
    { href: "/admin/store-manager", label: "Store Manager" },
    { href: "/admin/app-store-manager", label: "App Store" },
    { href: "/admin/analytics", label: "Analytics" },
    { href: "/admin/live-stream", label: "Live Stream" },
    { href: "/admin/voice-commands", label: "Voice Commands" },
    { href: "/admin/bot-command-center", label: "Bot Command Center" },
  ];

  const footerLinks = {
    platform: [
      { href: "/features", label: "Features" },
      { href: "/how-it-works", label: "How it Works" },
      { href: "/templates", label: "Templates" },
      { href: "/demo", label: "Interactive Demo" },
      { href: "/pricing", label: "Pricing" },
      { href: "/license", label: "Licensing" },
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
    affiliates: [
      { href: "https://www.cloudflare.com/r/YOUR_ID", label: "Powered by Cloudflare ($20 Credit)" },
      { href: "https://openai.com/api/", label: "Build with OpenAI" },
      { href: "/referrals.html", label: "Refer a Friend (Get 10%)" },
    ],
  };
  const navVideoSrc = "https://res.cloudinary.com/dj92eb97f/video/upload/v1768888706/254781_small_vlfg5w.mp4";
  const globalVideoSrc = "https://cdn.coverr.co/videos/coverr-abstract-liquid-gold-8020/1080p.mp4";

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
  const enforceAdminTheme = () => {
    try {
      if (!isAdminPage()) return;
      // Admin is locked to Metallic for a unified control-room feel.
      applyTheme("metallic");
    } catch (_) {}
  };

  const wireThemeSwitcher = () => {
    document.querySelectorAll("[data-vtw-theme-btn]").forEach((btn) => {
      if (btn.dataset.vtwWired) return;
      btn.dataset.vtwWired = "1";
      btn.addEventListener("click", () => applyTheme(btn.dataset.theme));
    });
    applyTheme(document.documentElement.dataset.theme);
  };

  const SoundEngine = {
    ctx: null,
    init: () => {
      if (!SoundEngine.ctx) {
        SoundEngine.ctx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (SoundEngine.ctx.state === "suspended") {
        SoundEngine.ctx.resume();
      }
      return SoundEngine.ctx;
    },
    play: (type = "hover") => {
      try {
        const ctx = SoundEngine.init();
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        if (type === "hover") {
          // Subtle tech chirp
          osc.type = "sine";
          osc.frequency.setValueAtTime(440, t);
          osc.frequency.exponentialRampToValueAtTime(880, t + 0.05);
          gain.gain.setValueAtTime(0.02, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
          osc.start(t);
          osc.stop(t + 0.05);
        } else if (type === "click") {
          // Percussive blip
          osc.type = "triangle";
          osc.frequency.setValueAtTime(800, t);
          osc.frequency.exponentialRampToValueAtTime(100, t + 0.1);
          gain.gain.setValueAtTime(0.05, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
          osc.start(t);
          osc.stop(t + 0.1);
        } else if (type === "success") {
          // Ascending chime
          osc.type = "sine";
          osc.frequency.setValueAtTime(500, t);
          osc.frequency.exponentialRampToValueAtTime(1200, t + 0.2);
          gain.gain.setValueAtTime(0.03, t);
          gain.gain.linearRampToValueAtTime(0, t + 0.3);
          osc.start(t);
          osc.stop(t + 0.3);

          // Harmonics
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.type = "square";
          osc2.frequency.setValueAtTime(250, t);
          osc2.frequency.exponentialRampToValueAtTime(600, t + 0.2);
          gain2.gain.setValueAtTime(0.01, t);
          gain2.gain.linearRampToValueAtTime(0, t + 0.3);
          osc2.start(t);
          osc2.stop(t + 0.3);
        }
      } catch (_) {}
    },
  };

  const playHover = () => SoundEngine.play("hover");
  const playClick = () => SoundEngine.play("click");
  const hasAdminAccess = () => {
    try {
      const unlocked = sessionStorage.getItem("yt-admin-unlocked") === "true";
      const cookie = document.cookie.split(";").some((part) => part.trim().startsWith("vtw_admin=1"));
      return unlocked || cookie;
    } catch (_) {
      return false;
    }
  };
  const getNavLinks = () => {
    if (hasAdminAccess()) return navLinks;
    return navLinks.filter((link) => link.label !== "Admin");
  };
  const buildLinkHtml = () => {
    let links = getNavLinks()
      .map((link) => `<a href="${link.href}" data-name="${link.label}">${link.label}</a>`)
      .join("");

    if (hasAdminAccess()) {
      const dropdownHtml = `
        <div class="nav-dropdown" aria-haspopup="true" aria-expanded="false">
          <button class="nav-dropdown-trigger">Management ▾</button>
          <div class="nav-dropdown-menu">
            ${adminLinks.map((l) => `<a href="${l.href}">${l.label}</a>`).join("")}
          </div>
        </div>
      `;
      links += dropdownHtml;
    }
    return links;
  };
  const buildListHtml = () =>
    getNavLinks()
      .map((link) => `<li><a href="${link.href}">${link.label}</a></li>`)
      .join("");
  const clearExistingNav = () => {
    document.querySelectorAll(".glass-nav, .mobile-overlay, .site-header, .site-nav").forEach((el) => el.remove());
    const skip = document.querySelector(".vtw-skip-link");
    if (skip) skip.remove();
    const toggle = document.getElementById("mobileNavToggle");
    if (toggle) toggle.remove();
  };
  const ensureMainAnchor = () => {
    try {
      if (document.getElementById("main")) return;
      const main = document.querySelector("main");
      if (main && !main.id) {
        main.id = "main";
        return;
      }
      const root = document.getElementById("root");
      if (root && !root.id) root.id = "main";
    } catch (_) {}
  };
  const ensureVideoBg = () => {
    if (prefersReducedMotion()) return;
    if (document.querySelector(".video-bg")) return;
    const wrap = document.createElement("div");
    wrap.className = "video-bg";
    wrap.setAttribute("aria-hidden", "true");
    wrap.innerHTML = `
      <video autoplay muted loop playsinline>
        <source src="${globalVideoSrc}" type="video/mp4" />
      </video>
    `;
    document.body.prepend(wrap);
  };
  const injectNav = () => {
    clearExistingNav();
    ensureMainAnchor();
    ensureVideoBg();
    const body = document.body;
    const fragment = document.createDocumentFragment();
    const skip = document.createElement("a");
    skip.className = "vtw-skip-link";
    skip.href = "#main";
    skip.textContent = "Skip to content";
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
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML = `      <ul>        ${buildListHtml()}      </ul>    `;
    fragment.append(skip, toggle, nav, overlay);
    body.prepend(fragment);
    body.classList.add("nav-ready");
    const closeOnNavigate = () => {
      toggle.checked = false;
    };
    overlay.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeOnNavigate);
    });
    const interactiveLinks = nav.querySelectorAll("a, .brand");
    interactiveLinks.forEach((link) => {
      link.addEventListener("mouseenter", playHover);
      link.addEventListener("mousedown", playClick);
    });
    overlay.querySelectorAll("a").forEach((link) => {
      link.addEventListener("mouseenter", playHover);
      link.addEventListener("click", playClick);
    });
    const toggleButton = nav.querySelector(".nav-toggle");
    toggleButton?.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggle.checked = !toggle.checked;
      }
    });

    const syncOverlayA11y = () => {
      const open = Boolean(toggle.checked);
      overlay.setAttribute("aria-hidden", open ? "false" : "true");
      toggleButton?.setAttribute("aria-expanded", open ? "true" : "false");
    };
    toggle.addEventListener("change", syncOverlayA11y);
    syncOverlayA11y();

    window.addEventListener(
      "keydown",
      (event) => {
        if (event.key !== "Escape") return;
        if (!toggle.checked) return;
        toggle.checked = false;
        syncOverlayA11y();
      },
      { passive: true }
    );
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
            <textarea id="vtw-widget-text" rows="2" placeholder="Ask a question..."></textarea>
            <button class="vt-widget-mic" id="vtw-widget-mic" type="button" aria-label="Voice input">Mic</button>
            <button class="vt-widget-send" id="vtw-widget-send" type="button">Send</button>
          </div>
          <div class="vt-widget-status muted" id="vtw-widget-status" aria-live="polite"></div>
        </div>
      </section>
    `;
    document.body.appendChild(wrap);
  };

  const hashString = (value) => {
    const str = String(value || "");
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  };

  const injectBottomWaves = () => {
    try {
      if (document.getElementById("vtw-bottom-waves")) return;

      const canvas = document.createElement("canvas");
      canvas.id = "vtw-bottom-waves";
      canvas.className = "vtw-bottom-waves";
      canvas.setAttribute("aria-hidden", "true");
      document.body.appendChild(canvas);

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const palettes = [
        ["#ffffff", "#d1d5db", "#fbbf24"],
        ["#fbbf24", "#ffffff", "#cbd5e1"],
        ["#e5e7eb", "#fef3c7", "#ffffff"],
        ["#ffffff", "#fef3c7", "#d1d5db"],
        ["#d1d5db", "#ffffff", "#f59e0b"],
      ];
      const idx = hashString(normalizePath()) % palettes.length;
      const [c1, c2, c3] = palettes[idx];

      const hexToRgb = (hex) => {
        const h = String(hex || "")
          .replace("#", "")
          .trim();
        if (h.length === 3) {
          const r = parseInt(h[0] + h[0], 16);
          const g = parseInt(h[1] + h[1], 16);
          const b = parseInt(h[2] + h[2], 16);
          return { r, g, b };
        }
        if (h.length === 6) {
          const r = parseInt(h.slice(0, 2), 16);
          const g = parseInt(h.slice(2, 4), 16);
          const b = parseInt(h.slice(4, 6), 16);
          return { r, g, b };
        }
        return { r: 255, g: 255, b: 255 };
      };

      const rgb1 = hexToRgb(c1);
      const rgb2 = hexToRgb(c2);
      const rgb3 = hexToRgb(c3);

      let w = 0;
      let h = 0;
      let dpr = 1;
      const resize = () => {
        dpr = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));
        w = Math.max(1, Math.floor(window.innerWidth));
        h = Math.max(1, Math.floor(canvas.getBoundingClientRect().height || 140));
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };
      resize();
      window.addEventListener("resize", resize, { passive: true });

      let t = 0;
      const draw = () => {
        t += 0.016;
        ctx.clearRect(0, 0, w, h);
        ctx.globalCompositeOperation = "lighter";

        const maxBar = Math.floor(h * 0.85);
        const step = 12;
        const base = h - 1;

        for (let x = 0; x < w + step; x += step) {
          const n1 = (Math.sin(t * 1.7 + x * 0.035) + 1) * 0.5;
          const n2 = (Math.sin(t * 2.3 + x * 0.021 + 1.1) + 1) * 0.5;
          const n3 = (Math.sin(t * 3.1 + x * 0.015 + 2.6) + 1) * 0.5;
          const amp = 0.35 * n1 + 0.4 * n2 + 0.25 * n3;
          const barH = Math.max(6, Math.floor(maxBar * amp));

          const mix = x / Math.max(1, w);
          const leftMix = 1 - Math.min(1, mix * 2);
          const rightMix = Math.max(0, (mix - 0.5) * 2);
          const midMix = 1 - leftMix - rightMix;

          const r = Math.floor(rgb1.r * leftMix + rgb2.r * midMix + rgb3.r * rightMix);
          const g = Math.floor(rgb1.g * leftMix + rgb2.g * midMix + rgb3.g * rightMix);
          const b = Math.floor(rgb1.b * leftMix + rgb2.b * midMix + rgb3.b * rightMix);

          const glow = 0.22 + amp * 0.68;
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${Math.min(0.92, glow)})`;
          ctx.shadowBlur = 18;
          ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${Math.min(0.55, glow)})`;

          const bw = step - 3;
          const x0 = x + 1;
          const y0 = base - barH;
          const radius = Math.max(3, Math.min(14, Math.floor(bw * 0.55)));

          ctx.beginPath();
          ctx.moveTo(x0 + radius, y0);
          ctx.arcTo(x0 + bw, y0, x0 + bw, y0 + barH, radius);
          ctx.arcTo(x0 + bw, y0 + barH, x0, y0 + barH, radius);
          ctx.arcTo(x0, y0 + barH, x0, y0, radius);
          ctx.arcTo(x0, y0, x0 + bw, y0, radius);
          ctx.fill();
        }

        requestAnimationFrame(draw);
      };
      draw();
    } catch (_) {}
  };

  const normalizePath = () => {
    try {
      let p = String(location.pathname || "/");
      if (!p.startsWith("/")) p = `/${p}`;
      p = p.replace(/\/$/, "");
      if (!p) p = "/";
      if (p.endsWith(".html")) p = p.slice(0, -5);
      return p || "/";
    } catch (_) {
      return "/";
    }
  };

  const normalizeAdsMode = (raw) => {
    const v = String(raw || "auto")
      .trim()
      .toLowerCase();
    if (!v) return "auto";
    if (["off", "disabled", "false", "0", "none"].includes(v)) return "off";
    if (["auto", "autoads", "page"].includes(v)) return "auto";
    if (["slots", "manual"].includes(v)) return "slots";
    if (["hybrid", "both"].includes(v)) return "hybrid";
    return "auto";
  };

  const detectPublisherFromDom = () => {
    try {
      const script = document.querySelector(
        'script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client="]'
      );
      if (!script) return "";
      const src = String(script.getAttribute("src") || "");
      const match = src.match(/[?&]client=([^&]+)/i);
      return match ? decodeURIComponent(match[1]) : "";
    } catch (_) {
      return "";
    }
  };

  const isAdsAllowed = () => {
    try {
      const p = normalizePath();
      if (p.startsWith("/admin") || p.startsWith("/the3000")) return false;

      const meta = document.querySelector('meta[name="vtw-ads"]');
      const setting = String(meta?.getAttribute("content") || "")
        .trim()
        .toLowerCase();
      if (setting === "off" || setting === "false" || setting === "0") return false;
      if (setting === "on" || setting === "true" || setting === "1") return true;

      // Maximize by default: show ads everywhere except admin/secret or pages that explicitly opt out.
      return true;
    } catch (_) {
      return false;
    }
  };

  const ensureAdsenseLoader = (publisher) => {
    try {
      if (!publisher) return Promise.resolve(false);
      if (document.getElementById("vtw-adsense-loader")) return Promise.resolve(true);
      const existing = document.querySelector('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]');
      if (existing) return Promise.resolve(true);

      const script = document.createElement("script");
      script.id = "vtw-adsense-loader";
      script.async = true;
      script.crossOrigin = "anonymous";
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(
        publisher
      )}`;
      document.head.appendChild(script);
      return new Promise((resolve) => {
        script.addEventListener("load", () => resolve(true), { once: true });
        script.addEventListener("error", () => resolve(false), { once: true });
      });
    } catch (_) {
      return Promise.resolve(false);
    }
  };

  const pushAdsense = () => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (_) {}
  };

  const createAdsenseSlot = ({ publisher, slot, placement }) => {
    const wrap = document.createElement("div");
    wrap.className = `vtw-adsense-slot vtw-adsense-${placement}`;
    wrap.dataset.vtwPlacement = placement;
    wrap.innerHTML = `
      <div class="vtw-ad-label">Advertisement</div>
      <ins class="adsbygoogle"
           style="display:block"
           data-ad-client="${publisher}"
           data-ad-slot="${slot}"
           data-ad-format="auto"
           data-full-width-responsive="true"></ins>
    `;
    return wrap;
  };

  const insertSlot = (wrap, placement) => {
    const footer = document.querySelector(".vt-footer");
    const main = document.querySelector("main.page") || document.querySelector("main") || document.body;
    const sections = main ? Array.from(main.querySelectorAll("section.section")) : [];

    if (placement === "top") {
      const anchor = sections[0] || main.firstElementChild;
      if (anchor) anchor.insertAdjacentElement("beforebegin", wrap);
      else main.prepend(wrap);
      return;
    }

    if (placement === "mid") {
      const idx = sections.length ? Math.min(sections.length - 1, Math.max(0, Math.floor(sections.length / 2))) : -1;
      const anchor = idx >= 0 ? sections[idx] : main.firstElementChild;
      if (anchor) anchor.insertAdjacentElement("afterend", wrap);
      else main.appendChild(wrap);
      return;
    }

    // bottom
    if (footer) footer.insertAdjacentElement("beforebegin", wrap);
    else main.appendChild(wrap);
  };

  const maybeInjectAdsense = () => {
    try {
      if (!isAdsAllowed()) return;
      const env = window.__ENV || {};
      const mode = normalizeAdsMode(env.ADSENSE_MODE);
      if (mode === "off") return;

      const publisher = String(env.ADSENSE_PUBLISHER || detectPublisherFromDom() || "").trim();
      if (!publisher) return;

      const slotFallback = String(env.ADSENSE_SLOT || "").trim();
      const slotTopRaw = String(env.ADSENSE_SLOT_TOP || "").trim();
      const slotMidRaw = String(env.ADSENSE_SLOT_MID || "").trim();
      const slotBottomRaw = String(env.ADSENSE_SLOT_BOTTOM || "").trim();
      const maxSlots = Math.max(0, Math.min(6, Number.parseInt(String(env.ADSENSE_MAX_SLOTS || "3"), 10) || 3));

      // Auto ads: just ensure the loader is present. Google will place units based on account settings.
      if (mode === "auto") {
        ensureAdsenseLoader(publisher);
        return;
      }

      const providedSlots = [slotTopRaw, slotMidRaw, slotBottomRaw].filter(Boolean);
      const candidateSlots = providedSlots.length ? providedSlots : slotFallback ? [slotFallback] : [];
      const distinctSlots = [...new Set(candidateSlots)];

      // Avoid reusing the same slot ID in multiple placements unless explicitly provided.
      let placements = [];
      if (distinctSlots.length === 1) {
        placements = [{ placement: "mid", slot: distinctSlots[0] }];
      } else {
        placements = [
          { placement: "top", slot: slotTopRaw || slotFallback },
          { placement: "mid", slot: slotMidRaw || slotFallback },
          { placement: "bottom", slot: slotBottomRaw || slotFallback },
        ]
          .filter((p) => p.slot)
          .filter((p, idx, arr) => arr.findIndex((x) => x.slot === p.slot) === idx);
      }

      if (!placements.length) {
        if (mode === "hybrid") ensureAdsenseLoader(publisher);
        return;
      }

      const existing = document.querySelectorAll("ins.adsbygoogle").length;
      let remaining = Math.max(0, maxSlots - existing);
      if (!remaining) return;

      const loader = ensureAdsenseLoader(publisher);

      const inserts = [];
      for (const p of placements) {
        if (!remaining) break;
        if (document.querySelector(`.vtw-adsense-slot[data-vtw-placement="${p.placement}"]`)) continue;
        const wrap = createAdsenseSlot({ publisher, slot: p.slot, placement: p.placement });
        insertSlot(wrap, p.placement);
        inserts.push(wrap);
        remaining--;
      }

      if (!inserts.length) return;

      loader.then((ok) => {
        if (!ok) return;
        // Push only the slots we created (avoids double-push on pages that already do it manually).
        inserts.forEach(() => pushAdsense());
      });
    } catch (_) {}
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
        placeholder: "Ask a question...",
        chips: [
          "What is VoiceToWebsite?",
          "How does Plan -> Apply work?",
          "Show pricing",
          "Open the demo",
          "Where do ads appear?",
        ],
      },
      build: {
        placeholder: "Describe what you want to build...",
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
        return `Plan -> Apply -> Rollback is the safety gate. See <a href="/features">Features</a>, or run it in <a href="/admin/">Admin</a> (requires unlock).`;
      }
      if (t.includes("ads")) {
        return `Ads are controlled by AdSense mode (auto/slots) and can be disabled per page with <code>&lt;meta name="vtw-ads" content="off"&gt;</code>.`;
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
        localStorage.setItem("vtw-demo-prefill", JSON.stringify({ prompt: value, ts: Date.now() }));
      } catch (_) {}
      addMsg("bot", `Opening <a href="/demo">/demo</a> with your prompt...`);
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

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
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
          if (status) status.textContent = "Listening...";
          recognition.start();
          return;
        }
        recognition.stop();
      });
    }

    setMode("ask");
    addMsg("bot", `Need help? Ask here — or switch to Build to jump into <a href="/demo">/demo</a>.`);
    renderHints();
  };
  const init = () => {
    initTheme();
    enforceAdminTheme();

    const adminPage = isAdminPage();
    if (!isShellDisabled()) {
      injectNav();
      wireThemeSwitcher();
      if (!adminPage) {
        injectWidget();
        injectFooter();
        wireWidget();
        initFooterTimestamp();
        initFooterParallax();
        electrifyLinks();
        spectralizeCards();
        if (!prefersReducedMotion()) initScrollReveals();
      }
    }

    if (!prefersReducedMotion()) injectBottomWaves();

    if (!adminPage) {
      maybeInjectAdsense();
    }

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
      { threshold: 0.12, rootMargin: "0px 0px -12% 0px" }
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
    const affiliateLinks = footerLinks.affiliates
      .map((link) => `<li><a href="${link.href}" target="_blank" rel="noopener">${link.label}</a></li>`)
      .join("");
    const themeButtons = THEMES.map(
      (t) => `<button type="button" class="theme-btn" data-theme="${t.id}" data-vtw-theme-btn>${t.label}</button>`
    ).join("");
    footer.innerHTML = `      <div class="footer-container">        <div class="strata-cell">          <div class="etched-brand">VOICE<br>TO<br>WEBSITE</div>          <p class="vt-footer-tagline">            Erosion-resistant digital infrastructure for the vocal era.          </p>        </div>        <div class="strata-cell">          <h4 class="strata-heading">Platform</h4>          <ul class="footer-links">            ${platformLinks}          </ul>        </div>        <div class="strata-cell">          <h4 class="strata-heading">Company</h4>          <ul class="footer-links">            ${companyLinks}          </ul>        </div>        <div class="strata-cell">          <h4 class="strata-heading">Earn</h4>          <ul class="footer-links">            ${affiliateLinks}          </ul>        </div>        <div class="strata-cell">          <h4 class="strata-heading">Trending Now</h4>          <a href="/lexicon-pro.html" class="hot-product-card">            <div>              <div class="hot-tag">NEW RELEASE</div>              <div class="product-name">LEXICON PRO</div>              <p class="hot-product-desc">                Real-time site stratification from live audio feeds.              </p>            </div>            <div class="product-cta">ACQUIRE LICENSE</div>          </a>        </div>      </div>      <div class="status-bar">        <div class="live-indicator">          <div class="pulse-stack">            <div class="pulse" aria-hidden="true"></div>            <span>SYSTEMS NOMINAL</span>          </div>          <span>LATENCY: 14MS</span>          <span class="timestamp" id="vt-footer-timestamp"></span>        </div>        <div>          &copy; ${new Date().getFullYear()} VOICETOWEBSITE.COM

        </div>      </div>    `;

    footer
      .querySelector(".strata-cell")
      ?.insertAdjacentHTML(
        "beforeend",
        `<div class="footer-theme"><div class="theme-label">Theme</div><div class="theme-switch" role="group" aria-label="Theme switcher">${themeButtons}</div></div>`
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
        { passive: true }
      );
      cell.addEventListener(
        "mouseleave",
        () => {
          cell.style.background = "";
        },
        { passive: true }
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
