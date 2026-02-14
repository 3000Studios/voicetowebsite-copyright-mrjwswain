import siteConfig from "./src/site-config.json";

(() => {
  const THEME_KEY = "vtw-theme";
  const THEMES = [
    { id: "metallic", label: "Metallic" },
    { id: "midnight", label: "Midnight" },
    { id: "volt", label: "Volt" },
    { id: "ember", label: "Ember" },
    { id: "ocean", label: "Ocean" },
  ];
  const hexToRgb = (hex) => {
    const normalized = String(hex || "")
      .replace(/[^0-9a-f]/gi, "")
      .substring(0, 6);
    if (normalized.length !== 6) return { r: 125, g: 211, b: 252 };
    return {
      r: parseInt(normalized.substring(0, 2), 16),
      g: parseInt(normalized.substring(2, 4), 16),
      b: parseInt(normalized.substring(4, 6), 16),
    };
  };

  const WAVE_COLOR_PRESETS = [
    {
      id: "cobalt-ocean",
      layers: ["#142c54", "#1e3a8a", "#38bdf8", "#fdf7ef"],
    },
    {
      id: "ion-sky",
      layers: ["#0b233d", "#0ea5e9", "#7dd3fc", "#bae6fd"],
    },
    {
      id: "sunrise",
      layers: ["#1d1f2a", "#2563eb", "#3b82f6", "#f8fafc"],
    },
    {
      id: "ivory-wave",
      layers: ["#111827", "#1d4ed8", "#60a5fa", "#fff7e6"],
    },
  ];
  // Force cache-bust/version stamp so new nav bundle propagates
  document.documentElement.dataset.navVersion = "2026-02-12-01";

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
    { href: "/", label: "Home", icon: "🏠" },
    { href: "/features", label: "Features", icon: "⚡" },
    { href: "/pricing", label: "Pricing", icon: "💎" },
    { href: "/license", label: "License", icon: "🔐" },
    { href: "/demo", label: "Demo", icon: "🚀" },
    { href: "/store", label: "Store", icon: "🛒" },
    { href: "/blog", label: "Blog", icon: "📝" },
    { href: "/livestream", label: "Live", icon: "🎥" },
    { href: "/support", label: "Support", icon: "💬" },
    { href: "/admin", label: "Admin", icon: "⚙️" },
  ];

  const adminLinks = [
    { href: "/admin/", label: "Dashboard", icon: "📊" },
    { href: "/admin/store-manager.html", label: "Store Manager", icon: "🏪" },
    { href: "/admin/app-store-manager.html", label: "App Store Manager", icon: "📲" },
    { href: "/admin/analytics.html", label: "Analytics", icon: "📈" },
    { href: "/admin/live-stream.html", label: "Live Stream", icon: "🎬" },
    { href: "/admin/voice-commands.html", label: "Voice Commands", icon: "🎤" },
    { href: "/admin/bot-command-center.html", label: "Bot Command Center", icon: "🤖" },
  ];

  const footerLinks = {
    platform: [
      { href: "/features", label: "Features", icon: "⚡" },
      { href: "/how-it-works", label: "How it Works", icon: "🔧" },
      { href: "/templates", label: "Templates", icon: "📋" },
      { href: "/demo", label: "Interactive Demo", icon: "🚀" },
      { href: "/pricing", label: "Pricing", icon: "💎" },
      { href: "/license", label: "Licensing", icon: "🔐" },
      { href: "/store", label: "Store", icon: "🛒" },
      { href: "/store", label: "Apps", icon: "📱" },
    ],
    company: [
      { href: "/about", label: "About Us", icon: "🗿" },
      { href: "/partners", label: "Partners", icon: "🤝" },
      { href: "/trust", label: "Trust Center", icon: "🛡️" },
      { href: "/status", label: "Status", icon: "📡" },
      { href: "/privacy", label: "Privacy", icon: "🔒" },
      { href: "/terms", label: "Terms", icon: "📜" },
      { href: "/contact", label: "Contact", icon: "💬" },
      { href: "/admin", label: "Admin", icon: "⚙️" },
    ],
    affiliates: [
      { href: "https://www.cloudflare.com/", label: "Powered by Cloudflare", icon: "☁️" },
      { href: "https://openai.com/api/", label: "Build with OpenAI", icon: "🧠" },
      { href: "/referrals.html", label: "Refer a Friend (Get 10%)", icon: "🎁" },
    ],
  };
  // Avoid third-party/background video fetches for performance and copyright hygiene.

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
    applyTheme(stored || siteConfig?.theme?.default || "midnight");
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
  const ADMIN_UNLOCK_KEY = "yt-admin-unlocked";
  const ADMIN_UNLOCK_TS_KEY = "yt-admin-unlocked-ts";
  const ADMIN_SESSION_TTL_MS = 1000 * 60 * 60 * 2;
  const hasAdminCookie = () => {
    try {
      return document.cookie.split(";").some((part) => part.trim().startsWith("vtw_admin=1"));
    } catch (_) {
      return false;
    }
  };
  const isAdminSessionFresh = () => {
    try {
      const ts = Number(sessionStorage.getItem(ADMIN_UNLOCK_TS_KEY) || 0);
      if (!ts) return false;
      return Date.now() - ts < ADMIN_SESSION_TTL_MS;
    } catch (_) {
      return false;
    }
  };
  const hasAdminAccess = () => {
    try {
      // Session unlock (client-side UX guard) must be present.
      const unlocked = sessionStorage.getItem("adminAccessValidated") === "true";
      if (!unlocked) return false;
      // And the user must have an authenticated admin cookie OR a fresh unlock timer.
      return hasAdminCookie() || isAdminSessionFresh();
    } catch (_) {
      return false;
    }
  };
  const getNavLinks = () => navLinks;
  // Admin was getting clipped off on mid-sized viewports because the nav bar
  // had `overflow: hidden` and too many links in one row. Keep Admin pinned
  // in a right-side "actions" area so it's always reachable.
  const getPrimaryNavLinks = () => getNavLinks().filter((l) => l.label !== "Admin");
  const getAdminNavLink = () => getNavLinks().find((l) => l.label === "Admin") || null;

  const buildPrimaryLinksHtml = () =>
    getPrimaryNavLinks()
      .map(
        (link, idx) =>
          `<a href="${link.href}" data-name="${link.label}" data-vtw-scrollfx="label" style="--vtw-i:${idx}">${link.icon} ${link.label}</a>`
      )
      .join("");

  const buildActionsHtml = () => {
    let html = "";
    const admin = getAdminNavLink();
    if (admin)
      html += `<a class="nav-admin-link" href="${admin.href}" data-name="${admin.label}" data-vtw-scrollfx="label" style="--vtw-i:99">${admin.icon} ${admin.label}</a>`;
    return html;
  };

  const buildListHtml = () => {
    // Mobile overlay: include primary links + Admin.
    const items = [];
    let i = 0;
    getPrimaryNavLinks().forEach((link) => {
      items.push(`<li style="--vtw-i:${i}"><a href="${link.href}">${link.icon} ${link.label}</a></li>`);
      i += 1;
    });
    const admin = getAdminNavLink();
    if (admin) items.push(`<li style="--vtw-i:${i}"><a href="${admin.href}">${admin.icon} ${admin.label}</a></li>`);
    return items.join("");
  };

  const ensureAdminSubnavManagement = () => {
    try {
      if (!isAdminPage()) return;
      const subnav = document.querySelector(".admin-subnav");
      if (!subnav) return;
      if (document.getElementById("vtw-admin-management")) return;

      const wrap = document.createElement("div");
      wrap.id = "vtw-admin-management";
      wrap.className = "nav-dropdown admin-subnav-dropdown";
      wrap.hidden = true;
      wrap.innerHTML = `
        <button class="nav-dropdown-trigger" type="button" aria-expanded="false">Management ▾</button>
        <div class="nav-dropdown-menu">
          ${adminLinks.map((l) => `<a href="${l.href}">${l.icon} ${l.label}</a>`).join("")}
        </div>
      `;
      subnav.appendChild(wrap);

      const trigger = wrap.querySelector(".nav-dropdown-trigger");
      const close = () => {
        wrap.classList.remove("is-open");
        trigger?.setAttribute("aria-expanded", "false");
      };
      trigger?.addEventListener("click", (e) => {
        e.preventDefault();
        const open = !wrap.classList.contains("is-open");
        wrap.classList.toggle("is-open", open);
        trigger.setAttribute("aria-expanded", open ? "true" : "false");
      });
      document.addEventListener("click", (e) => {
        if (!wrap.classList.contains("is-open")) return;
        if (wrap.contains(e.target)) return;
        close();
      });
      window.addEventListener("keydown", (e) => {
        if (e.key !== "Escape") return;
        close();
      });

      // If the user unlocks after page load, reveal it.
      const update = () => {
        wrap.hidden = !hasAdminAccess();
      };
      update();
      if (wrap.hidden) {
        let tries = 0;
        const timer = window.setInterval(() => {
          tries += 1;
          update();
          if (!wrap.hidden || tries >= 60) window.clearInterval(timer);
        }, 500);
      }
    } catch (_) {}
  };
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
    // The React home app already renders its own video atmosphere.
    if (document.getElementById("root")) return;
    const wrap = document.createElement("div");
    wrap.className = "video-bg";
    wrap.setAttribute("aria-hidden", "true");
    wrap.innerHTML = `
      <video autoplay muted loop playsinline preload="metadata">
        <source src="/media/vtw-home-wallpaper.mp4" type="video/mp4" />
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
    const brandMark = prefersReducedMotion()
      ? `
        <span class="brand-video-wrap" aria-hidden="true">
          <img class="brand-fallback" src="/vtw-wallpaper.png" alt="" />
        </span>
      `
      : `
        <span class="brand-video-wrap" aria-hidden="true">
          <video class="brand-video" autoplay muted loop playsinline preload="metadata">
            <source src="/media/vtw-animated-logo.mp4" type="video/mp4" />
          </video>
        </span>
      `;
    nav.innerHTML = `
      <div class="nav-video-mask" aria-hidden="true"></div>
      <a class="brand" href="/" aria-label="VoiceToWebsite home">
        ${brandMark}
        <span class="brand-name" data-vtw-scrollfx="brand">VoiceToWebsite</span>
      </a>
      <div class="nav-links">
        ${buildPrimaryLinksHtml()}
      </div>
      <div class="nav-actions">
        ${buildActionsHtml()}
      </div>
      <label for="mobileNavToggle" class="nav-toggle" aria-label="Toggle navigation" aria-controls="mobileOverlay" role="button" tabindex="0">
        <span class="nav-toggle-bars" aria-hidden="true"></span>
        <span class="nav-toggle-waves" aria-hidden="true"><i></i><i></i><i></i></span>
      </label>
    `;
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
      document.documentElement.classList.toggle("vtw-mobile-nav-open", open);
      try {
        SoundEngine.play(open ? "success" : "click");
      } catch (_) {}
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

  const initTextFx = () => {
    try {
      if (prefersReducedMotion()) return;
      if (!("IntersectionObserver" in window)) return;

      const headlineSelector = "h1, h2, h3, h4, h5, h6, .vt-h1, .vt-h2, .strata-heading";
      const headlines = Array.from(document.querySelectorAll(headlineSelector));
      const variants = ["scan", "glitch", "float", "spark", "slice", "press"];

      headlines.forEach((el, idx) => {
        if (el.dataset.vtwHeadInit) return;
        el.dataset.vtwHeadInit = "1";
        el.classList.add("vtw-headline");
        const key = `${el.textContent || ""}:${idx}`;
        const v = variants[hashString(key) % variants.length];
        el.dataset.vtwHeadAnim = v;
      });

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("vtw-inview");
            observer.unobserve(entry.target);
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -15% 0px" }
      );

      headlines.forEach((el) => observer.observe(el));
    } catch (_) {}
  };

  const initScrollChromeFx = () => {
    try {
      if (prefersReducedMotion()) return;

      const nav = document.querySelector(".glass-nav");
      const fxEls = Array.from(document.querySelectorAll("[data-vtw-scrollfx]"));
      if (!nav || !fxEls.length) return;

      fxEls.forEach((el, idx) => {
        if (el.dataset.vtwScrollSeed) return;
        const key = `${el.getAttribute("data-vtw-scrollfx") || ""}:${el.textContent || ""}:${idx}`;
        const seed = (hashString(key) % 97) / 97;
        el.dataset.vtwScrollSeed = String(seed);
      });

      let raf = 0;
      const tick = () => {
        raf = 0;
        const y = Math.max(0, window.scrollY || 0);
        const p = Math.min(1, y / 900);

        nav.style.setProperty("--vtw-scroll-p", String(p));

        fxEls.forEach((el) => {
          const seed = Number(el.dataset.vtwScrollSeed || 0) || 0;
          const base = 6 + seed * 18;
          const lift = Math.min(base, y * (0.012 + seed * 0.01));
          const twist = (seed - 0.5) * 8 * p;
          el.style.setProperty("--vtw-scroll-y", `${lift.toFixed(2)}px`);
          el.style.setProperty("--vtw-scroll-r", `${twist.toFixed(2)}deg`);
          el.style.setProperty("--vtw-scroll-o", `${(0.75 + (1 - p) * 0.25).toFixed(3)}`);
        });
      };

      const onScroll = () => {
        if (raf) return;
        raf = window.requestAnimationFrame(tick);
      };

      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll, { passive: true });
      tick();
    } catch (_) {}
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

  const hslToRgb = (h, s, l) => {
    const hue = (((h % 360) + 360) % 360) / 360;
    const sat = Math.max(0, Math.min(1, s));
    const lit = Math.max(0, Math.min(1, l));

    if (sat === 0) {
      const v = Math.round(lit * 255);
      return { r: v, g: v, b: v };
    }

    const q = lit < 0.5 ? lit * (1 + sat) : lit + sat - lit * sat;
    const p = 2 * lit - q;
    const hueToChannel = (t) => {
      let x = t;
      if (x < 0) x += 1;
      if (x > 1) x -= 1;
      if (x < 1 / 6) return p + (q - p) * 6 * x;
      if (x < 1 / 2) return q;
      if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
      return p;
    };

    return {
      r: Math.round(hueToChannel(hue + 1 / 3) * 255),
      g: Math.round(hueToChannel(hue) * 255),
      b: Math.round(hueToChannel(hue - 1 / 3) * 255),
    };
  };

  const buildWavePalette = (pathKey) => {
    const seed = hashString(pathKey || "/");
    const hue = seed % 360;
    const sat = 0.62 + ((seed >>> 9) % 18) / 100;
    const lit = 0.58 + ((seed >>> 15) % 12) / 100;
    return [
      hslToRgb(hue, sat, lit),
      hslToRgb((hue + 28 + ((seed >>> 3) % 16)) % 360, Math.min(0.92, sat + 0.08), Math.min(0.82, lit + 0.09)),
      hslToRgb((hue + 330 + ((seed >>> 19) % 24)) % 360, Math.max(0.5, sat - 0.12), Math.max(0.48, lit - 0.12)),
    ];
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

      const [rgb1, rgb2, rgb3] = buildWavePalette(normalizePath());

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

    const esc = (s) => String(s || "").replace(/</g, "&lt;");

    let supportSessionId = "";
    let supportSessionReady = false;
    let supportPollTimer = 0;
    const seenSupportMessageIds = new Set();
    const seenSupportFingerprints = new Set();
    const ensureSupportSession = async () => {
      if (supportSessionReady) return true;
      try {
        const res = await fetch("/api/support/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        const data = await res.json().catch(() => ({}));
        supportSessionReady = res.ok;
        if (res.ok && data?.sessionId) supportSessionId = String(data.sessionId || "");
        return supportSessionReady;
      } catch (_) {
        supportSessionReady = false;
        return false;
      }
    };

    const mapSupportSender = (sender) => {
      const s = String(sender || "").toLowerCase();
      if (s === "customer") return "user";
      if (s === "admin") return "bot";
      if (s === "bot") return "bot";
      return "bot";
    };

    const fingerprintSupportMessage = (sender, message) =>
      `${String(sender || "").toLowerCase()}:${String(message || "")}`;

    const appendSupportMessages = (messages) => {
      (messages || []).forEach((m) => {
        const id = String(m?.id || "");
        const sender = String(m?.sender || "");
        const message = String(m?.message || "");
        const who = mapSupportSender(sender);
        const fp = fingerprintSupportMessage(sender, message);

        if (id && seenSupportMessageIds.has(id)) return;
        if (fp && seenSupportFingerprints.has(fp)) {
          if (id) seenSupportMessageIds.add(id);
          return;
        }

        if (id) seenSupportMessageIds.add(id);
        if (fp) seenSupportFingerprints.add(fp);
        addMsg(who, esc(message));
      });
    };

    const pollSupportMessages = async () => {
      if (!supportSessionReady) return;
      try {
        const qp = supportSessionId ? `?sessionId=${encodeURIComponent(supportSessionId)}` : "";
        const res = await fetch(`/api/support/messages${qp}`, { method: "GET" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return;
        appendSupportMessages(data?.messages || []);
      } catch (_) {}
    };

    const startSupportPolling = () => {
      if (supportPollTimer) return;
      supportPollTimer = window.setInterval(pollSupportMessages, 2500);
      pollSupportMessages();
    };

    const answerAsk = async (q) => {
      const value = String(q || "").trim();
      if (!value) return { reply: "", messageId: "", replyId: "" };
      try {
        await ensureSupportSession();
        const res = await fetch("/api/support/message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: value, sessionId: supportSessionId || undefined }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Chat failed");
        return {
          reply: esc(String(data?.reply || "")),
          messageId: String(data?.messageId || ""),
          replyId: String(data?.replyId || ""),
        };
      } catch (_) {
        const t = value.toLowerCase();
        if (t.includes("pricing") || t.includes("price")) {
          return `Pricing lives on <a href="/pricing">/pricing</a>. Want a fast win? Try <a href="/demo">the demo</a> first.`;
        }
        if (t.includes("demo") || t.includes("try")) {
          return `Open the interactive demo: <a href="/demo">/demo</a>. You'll get an outline preview in seconds.`;
        }
        if (t.includes("privacy") || t.includes("data") || t.includes("security")) {
          return `For data handling + security posture, visit <a href="/trust">Trust Center</a> and <a href="/privacy">Privacy</a>.`;
        }
        return `Try: <a href="/demo">/demo</a> to build instantly, or <a href="/pricing">/pricing</a> to compare tiers.`;
      }
    };

    const handleSend = async () => {
      const value = (text?.value || "").trim();
      if (!value) return;
      addMsg("user", esc(value));
      seenSupportFingerprints.add(fingerprintSupportMessage("customer", value));
      if (text) text.value = "";

      if (mode === "ask") {
        if (status) status.textContent = "Thinking...";
        const res = await answerAsk(value);
        if (status) status.textContent = "";
        const reply = typeof res === "string" ? res : res?.reply;
        if (typeof res === "object" && res) {
          if (res?.messageId) seenSupportMessageIds.add(res.messageId);
          if (res?.replyId) seenSupportMessageIds.add(res.replyId);
        }
        if (reply) {
          addMsg("bot", reply);
          // Fingerprint uses unescaped text. This helps prevent double-render when polling.
          try {
            const tmp = document.createElement("div");
            tmp.innerHTML = reply;
            const plain = tmp.textContent || tmp.innerText || "";
            seenSupportFingerprints.add(fingerprintSupportMessage("bot", plain));
          } catch (_) {}
        } else {
          addMsg("bot", "I couldn't generate a reply right now. Try again in a moment.");
        }
        startSupportPolling();
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
    addMsg("bot", `Need help? Ask here - or switch to Build to jump into <a href="/demo">/demo</a>.`);
    renderHints();
    ensureSupportSession().then((ok) => {
      if (ok) startSupportPolling();
    });
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
        initFooterLatency();
        initFooterParallax();
        electrifyLinks();
        spectralizeCards();
        initTextFx();
        initScrollChromeFx();
        if (!prefersReducedMotion()) initScrollReveals();
      }
    }

    if (!prefersReducedMotion()) injectBottomWaves();

    if (!adminPage) {
      maybeInjectAdsense();
    }

    ensureAdminSubnavManagement();
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
    footer.innerHTML = `      <div class="footer-container">        <div class="strata-cell">          <div class="etched-brand">VOICE<br>TO<br>WEBSITE</div>          <p class="vt-footer-tagline">            Erosion-resistant digital infrastructure for the vocal era.          </p>        </div>        <div class="strata-cell">          <h4 class="strata-heading">Platform</h4>          <ul class="footer-links">            ${platformLinks}          </ul>        </div>        <div class="strata-cell">          <h4 class="strata-heading">Company</h4>          <ul class="footer-links">            ${companyLinks}          </ul>        </div>        <div class="strata-cell">          <h4 class="strata-heading">Earn</h4>          <ul class="footer-links">            ${affiliateLinks}          </ul>        </div>        <div class="strata-cell">          <h4 class="strata-heading">Trending Now</h4>          <a href="/lexicon-pro.html" class="hot-product-card">            <div>              <div class="hot-tag">FEATURED</div>              <div class="product-name">LEXICON PRO</div>              <p class="hot-product-desc">                Real-time site stratification from live audio feeds.              </p>            </div>            <div class="product-cta">ACQUIRE LICENSE</div>          </a>        </div>      </div>      <div class="status-bar">        <div class="live-indicator">          <div class="pulse-stack">            <div class="pulse" aria-hidden="true"></div>            <span>SYSTEMS NOMINAL</span>          </div>          <span>LATENCY: <span id="vt-footer-latency">—</span></span>          <span class="timestamp" id="vt-footer-timestamp"></span>        </div>        <div>          &copy; ${new Date().getFullYear()} VOICETOWEBSITE.COM

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
  const initFooterLatency = () => {
    const el = document.getElementById("vt-footer-latency");
    if (!el) return;

    const ping = async () => {
      try {
        const t0 = performance.now();
        const res = await fetch("/api/health", { cache: "no-store" });
        if (!res.ok) throw new Error("bad status");
        const ms = Math.max(0, Math.round(performance.now() - t0));
        el.textContent = `${ms}ms`;
      } catch (_) {
        el.textContent = "—";
      }
    };

    ping();
    window.setInterval(ping, 30000);
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
  const supportsFinePointer = () => {
    try {
      return window.matchMedia && window.matchMedia("(pointer: fine)").matches;
    } catch (_) {
      return true;
    }
  };
  const glowState = new WeakMap();
  const spectralizeCards = () => {
    if (prefersReducedMotion()) return;
    if (!supportsFinePointer()) return;
    const seen = new Set();
    cardSelectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        el.classList.add("spectral-card");
        el.addEventListener("pointerenter", cacheGlowRect, { passive: true });
        el.addEventListener("pointermove", handleGlow, { passive: true });
        el.addEventListener("pointerleave", resetGlow, { passive: true });
      });
    });
  };
  const cacheGlowRect = (event) => {
    const el = event.currentTarget;
    const state = glowState.get(el) || { rect: null, raf: 0, lastClientX: 0, lastClientY: 0 };
    state.rect = el.getBoundingClientRect();
    glowState.set(el, state);
  };
  const handleGlow = (event) => {
    if (event.pointerType && event.pointerType !== "mouse") return;
    const el = event.currentTarget;
    const state = glowState.get(el) || { rect: null, raf: 0, lastClientX: 0, lastClientY: 0 };
    state.lastClientX = event.clientX;
    state.lastClientY = event.clientY;
    if (!state.rect) state.rect = el.getBoundingClientRect();
    if (state.raf) {
      glowState.set(el, state);
      return;
    }
    state.raf = window.requestAnimationFrame(() => {
      const next = glowState.get(el);
      if (!next || !next.rect) return;
      const rect = next.rect;
      const x = ((next.lastClientX - rect.left) / rect.width) * 100;
      const y = ((next.lastClientY - rect.top) / rect.height) * 100;
      el.style.setProperty("--glow-x", `${x}%`);
      el.style.setProperty("--glow-y", `${y}%`);
      next.raf = 0;
      glowState.set(el, next);
    });
    glowState.set(el, state);
  };
  const resetGlow = (event) => {
    const el = event.currentTarget;
    const state = glowState.get(el);
    if (state?.raf) {
      try {
        window.cancelAnimationFrame(state.raf);
      } catch (_) {}
    }
    glowState.delete(el);
    el.style.removeProperty("--glow-x");
    el.style.removeProperty("--glow-y");
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  /* Music Autoplay */
  const ensureMusic = () => {
    if (document.getElementById("vtw-bg-music")) return;
    // Home app owns its own music engine; avoid double-play.
    if (document.getElementById("root")) return;
    const audio = document.createElement("audio");
    audio.id = "vtw-bg-music";
    audio.loop = true;
    audio.volume = 0.65;
    audio.preload = "auto";
    audio.crossOrigin = "anonymous";
    audio.src = "https://media.voicetowebsite.com/Intro%20funk.mp3";
    document.body.appendChild(audio);

    const play = () => {
      audio.play().catch(() => {
        console.log("Autoplay blocked. Waiting for interaction.");
        const unlock = () => {
          audio.play().catch(() => {});
          document.removeEventListener("click", unlock);
          document.removeEventListener("keydown", unlock);
        };
        document.addEventListener("click", unlock);
        document.addEventListener("keydown", unlock);
      });
    };
    // Attempt immediate play
    play();
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ensureMusic);
  } else {
    ensureMusic();
  }
})();
