const state = {
  eyebrow: "",
  headline: "Hi Tiger",
  subhead: "",
  cta: "Start Now",
  price: "",
  metric1: "",
  metric2: "",
  metric3: "",
  theme: "ember",
  testimonialsVisible: true,
};
// Bump the storage key to flush stale cached values (CTA was blank for some users).
const storageKey = "youtuneai-state-v2";
const controlKey = "youtuneai-control-unlocked";
const controlPassword =
  window.__ENV && window.__ENV.CONTROL_PASSWORD
    ? window.__ENV.CONTROL_PASSWORD
    : null;

// ============================================
// UNIFIED COMMAND HANDLER
// ============================================
// This handler processes commands from: voice, chat, custom GPT, and API
const commandHandler = {
  apiEndpoint: "/api/ui-command",
  isProcessing: false,
  processingQueue: [],

  async execute(action, args = {}, source = "app") {
    // Atomic check-and-set using a simple queue mechanism
    if (this.isProcessing) {
      return new Promise((resolve, reject) => {
        this.processingQueue.push({ action, args, source, resolve, reject });
      });
    }

    this.isProcessing = true;

    try {
      const response = await fetch(this.apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, args, source, timestamp: Date.now() }),
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const result = await response.json();
      addCommandLog(`[${source}] ${action}: ✓`);

      // Process next queued command if any
      this.processNextInQueue();

      return result;
    } catch (err) {
      console.error("Command execution failed:", err);
      addCommandLog(`[${source}] ${action}: ✗ ${err.message}`);

      // Process next queued command even if current failed
      this.processNextInQueue();

      return { error: err.message };
    }
  },

  processNextInQueue() {
    if (this.processingQueue.length > 0) {
      const next = this.processingQueue.shift();
      this.execute(next.action, next.args, next.source)
        .then(next.resolve)
        .catch(next.reject);
    } else {
      this.isProcessing = false;
    }
  },

  parseVoiceCommand(transcript) {
    const text = transcript.toLowerCase();

    // Pattern: "set headline to [value]"
    const headlineMatch = text.match(/set\s+headline\s+(?:to\s+)?(.+)/i);
    if (headlineMatch)
      return {
        action: "set-headline",
        args: { value: headlineMatch[1].trim() },
      };

    // Pattern: "update cta to [value]"
    const ctaMatch = text.match(/(?:update|set)\s+cta\s+(?:to\s+)?(.+)/i);
    if (ctaMatch)
      return { action: "set-cta", args: { value: ctaMatch[1].trim() } };

    // Pattern: "apply theme [theme]"
    const themeMatch = text.match(
      /apply\s+theme\s+(ember|ocean|volt|midnight)/i
    );
    if (themeMatch)
      return { action: "apply-theme", args: { theme: themeMatch[1] } };

    // Pattern: "toggle testimonials"
    if (text.includes("toggle testimonials"))
      return { action: "toggle-testimonials", args: {} };

    // Pattern: "show modal [name]"
    const showMatch = text.match(/show\s+modal\s+(\w+)/i);
    if (showMatch)
      return { action: "show-modal", args: { modalName: showMatch[1] } };

    return null;
  },
};

// Admin Authentication System
const AdminAuth = {
  // Use environment variable for admin password hash
  ADMIN_PASSWORD_HASH: import.meta.env?.VITE_ADMIN_PASSWORD_HASH || "",

  init() {
    this.setupEventListeners();
    this.checkAuthStatus();
  },

  setupEventListeners() {
    const unlockBtn = document.getElementById("unlock-control");
    const passwordInput = document.getElementById("control-password");

    if (unlockBtn && passwordInput) {
      unlockBtn.addEventListener("click", () => this.handleLogin());
      passwordInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") this.handleLogin();
      });
    }
  },

  async hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  },

  async handleLogin() {
    const passwordInput = document.getElementById("control-password");
    const lockNote = document.getElementById("control-lock-note");

    if (!passwordInput || !lockNote) return;

    const password = passwordInput.value.trim();
    if (!password) {
      lockNote.textContent = "Please enter a password";
      lockNote.style.color = "#ef4444";
      return;
    }

    try {
      const hashedPassword = await this.hashPassword(password);

      if (hashedPassword === this.ADMIN_PASSWORD_HASH) {
        this.setAuthState(true);
        this.showAdminPanel();
        lockNote.textContent = "Access granted";
        lockNote.style.color = "#22c55e";
        passwordInput.value = "";
      } else {
        lockNote.textContent = "Invalid password";
        lockNote.style.color = "#ef4444";
        passwordInput.value = "";
        // Add delay to prevent brute force
        setTimeout(() => {
          lockNote.textContent = "";
        }, 3000);
      }
    } catch (error) {
      console.error("Authentication error:", error);
      lockNote.textContent = "Authentication error";
      lockNote.style.color = "#ef4444";
    }
  },

  setAuthState(isAuthenticated) {
    sessionStorage.setItem("adminAuth", isAuthenticated ? "true" : "false");
    sessionStorage.setItem("adminAuthTime", Date.now().toString());
  },

  clearAuthState() {
    sessionStorage.setItem("adminAuth", "false");
    sessionStorage.removeItem("adminAuthTime");
  },

  checkAuthStatus() {
    const isAuthenticated = sessionStorage.getItem("adminAuth") === "true";
    const authTime = parseInt(sessionStorage.getItem("adminAuthTime") || "0");
    const now = Date.now();

    // Session expires after 1 hour
    if (isAuthenticated && now - authTime < 3600000) {
      this.showAdminPanel();
    } else {
      this.hideAdminPanel();
      this.setAuthState(false);
    }
  },

  showAdminPanel() {
    const controlLock = document.getElementById("control-lock");
    const controlGrid = document.getElementById("control-grid");

    if (controlLock) controlLock.style.display = "none";
    if (controlGrid) {
      controlGrid.style.display = "block";
      this.populateAdminControls(controlGrid);
    }
  },

  hideAdminPanel() {
    const controlLock = document.getElementById("control-lock");
    const controlGrid = document.getElementById("control-grid");

    if (controlLock) controlLock.style.display = "none";
    if (controlGrid) controlGrid.style.display = "none";
  },

  populateAdminControls(container) {
    // Sanitize container before adding content
    container.innerHTML = "";

    const controls = [
      { label: "Clear Market Data", action: () => this.clearMarketData() },
      { label: "Stop Audio", action: () => this.stopAudio() },
      { label: "Restart Ticker", action: () => this.restartTicker() },
      { label: "Logout", action: () => this.logout() },
    ];

    controls.forEach((control) => {
      const button = document.createElement("button");
      button.textContent = control.label;
      button.className = "admin-control-btn";
      button.style.cssText = `
        margin: 5px;
        padding: 8px 16px;
        background: #3b82f6;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      `;
      button.addEventListener("click", control.action);
      container.appendChild(button);
    });
  },

  clearMarketData() {
    if (window.cleanupMarketData) {
      window.cleanupMarketData();
      console.warn("Market data cleared");
    }
  },

  stopAudio() {
    const cleanupFunctions = window.__cleanupFunctions || [];
    cleanupFunctions.forEach((fn) => {
      if (fn && typeof fn === "function") {
        try {
          fn();
        } catch (e) {
          console.warn("Cleanup function failed:", e);
        }
      }
    });
    console.warn("Audio and other resources stopped");
  },

  restartTicker() {
    if (typeof setupTicker === "function") {
      setupTicker();
      console.warn("Ticker restarted");
    }
  },

  logout() {
    this.clearAuthState();
    this.hideAdminPanel();
    const controlLock = document.getElementById("control-lock");
    if (controlLock) {
      controlLock.style.display = "block";
    }
  },
};

// Initialize admin auth when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => AdminAuth.init());
} else {
  AdminAuth.init();
}
const sanitizeText = (text) => {
  if (typeof text !== "string") return "";
  return text
    .replace(/[<>]/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+=/gi, "")
    .trim()
    .substring(0, 200); // Limit length
};

// Listen for voice commands from window events (from voice.js or speech recognition)
window.addEventListener("command-executed", (e) => {
  const { action, args, source } = e.detail;
  commandHandler.execute(action, args, source).catch((err) => {
    console.error("Command execution failed:", err);
    // Add user-friendly error handling with sanitization
    if (elements.commandLog) {
      const errorEntry = document.createElement("div");
      errorEntry.className = "command-error";
      const safeMessage = sanitizeText(
        err?.message || "Unknown error occurred"
      );
      errorEntry.textContent = `Error: ${safeMessage}`;
      elements.commandLog.appendChild(errorEntry);
    }
  });
});

// Listen for window message commands (from custom GPT or Continue.dev iframe)
window.addEventListener("message", (e) => {
  if (e.data?.type === "ui-command") {
    const { action, args } = e.data;
    commandHandler.execute(action, args, "message").catch((err) => {
      console.error("Message command failed:", err);
      // Add user-friendly error handling with sanitization
      if (elements.commandLog) {
        const errorEntry = document.createElement("div");
        errorEntry.className = "command-error";
        const safeMessage = sanitizeText(
          err?.message || "Unknown error occurred"
        );
        errorEntry.textContent = `Error: ${safeMessage}`;
        elements.commandLog.appendChild(errorEntry);
      }
    });
  }
});

const audioTracks = [
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
];
const mediaQueue = [];
const commandHistory = [];
const textEffects = {
  glow: "cmd-glow",
  neon: "cmd-glow",
  pulse: "cmd-pulse",
  float: "cmd-float",
  wave: "cmd-float",
  type: "cmd-type",
  typewriter: "cmd-type",
  slide: "cmd-slide",
  gradient: "cmd-slide",
};
const defaultPlacement = "command-canvas";
let lastSearchResults = [];
const elements = {
  eyebrow: document.getElementById("eyebrow"),
  headline: document.getElementById("headline"),
  subhead: document.getElementById("subhead"),
  cta: document.getElementById("cta"),
  price: document.getElementById("price"),
  metric1: document.getElementById("metric1"),
  metric2: document.getElementById("metric2"),
  metric3: document.getElementById("metric3"),
  testimonials: document.getElementById("testimonials"),
  transcript: document.getElementById("transcript"),
  contactModal: document.getElementById("contact-modal"),
  contactClose: document.getElementById("contact-close"),
  contactLink: document.getElementById("contact-link"),
  contactFooter: document.getElementById("contact-footer"),
  contactLinkMobile: document.getElementById("contact-link-mobile"),
  cursorDot: document.getElementById("cursor-dot"),
  ticker: document.getElementById("ticker"),
  tickerData: document.getElementById("ticker-data"),
  avatar: document.getElementById("avatar"),
  menuToggle: document.getElementById("menu-toggle"),
  mobileDrawer: document.getElementById("mobile-drawer"),
  mobileLinks: document.querySelectorAll(".mobile-drawer a"),
  controlLock: document.getElementById("control-lock"),
  controlGrid: document.getElementById("control-grid"),
  controlPassword: document.getElementById("control-password"),
  controlUnlock: document.getElementById("unlock-control"),
  controlNote: document.getElementById("control-lock-note"),
  commandInput: document.getElementById("command-input"),
  runCommand: document.getElementById("run-command"),
  searchResults: document.getElementById("search-results"),
  mediaStage: document.getElementById("media-stage"),
  mediaQueue: document.getElementById("media-queue"),
  placementTarget: document.getElementById("placement-target"),
  placementCustom: document.getElementById("placement-custom"),
  commandCanvas: document.getElementById("command-canvas"),
  commandLog: document.getElementById("command-log"),
  inputs: {
    headline: document.getElementById("headline-input"),
    subhead: document.getElementById("subhead-input"),
    cta: document.getElementById("cta-input"),
    price: document.getElementById("price-input"),
    theme: document.getElementById("theme-input"),
    metric1: document.getElementById("metric1-input"),
    metric2: document.getElementById("metric2-input"),
    metric3: document.getElementById("metric3-input"),
  },
};
const setText = (el, value) => {
  if (el) el.textContent = value;
};
const setInputValue = (el, value) => {
  if (el) el.value = value;
};
const applyTheme = (theme) => {
  document.documentElement.dataset.theme = theme === "ember" ? "" : theme;
};
const isControlUnlocked = () => sessionStorage.getItem(controlKey) === "true";
const setControlVisibility = () => {
  const unlocked = isControlUnlocked();
  if (elements.controlLock)
    elements.controlLock.style.display = unlocked ? "none" : "block";
  if (elements.controlGrid)
    elements.controlGrid.style.display = unlocked ? "grid" : "none";
};
const applyState = () => {
  setText(elements.eyebrow, state.eyebrow);
  setText(elements.headline, state.headline);
  setText(elements.subhead, state.subhead);
  setText(elements.cta, state.cta);
  setText(elements.price, state.price);
  setText(elements.metric1, state.metric1);
  setText(elements.metric2, state.metric2);
  setText(elements.metric3, state.metric3);
  if (elements.testimonials) {
    elements.testimonials.style.display = state.testimonialsVisible
      ? "grid"
      : "none";
  }
  applyTheme(state.theme);
  setInputValue(elements.inputs.headline, state.headline);
  setInputValue(elements.inputs.subhead, state.subhead);
  setInputValue(elements.inputs.cta, state.cta);
  setInputValue(elements.inputs.price, state.price);
  setInputValue(elements.inputs.theme, state.theme);
  setInputValue(elements.inputs.metric1, state.metric1);
  setInputValue(elements.inputs.metric2, state.metric2);
  setInputValue(elements.inputs.metric3, state.metric3);
};
const persistState = () => {
  localStorage.setItem(storageKey, JSON.stringify(state));
};
const loadState = () => {
  const saved = localStorage.getItem(storageKey);
  if (!saved) return;
  try {
    const parsed = JSON.parse(saved);
    Object.assign(state, parsed);
  } catch (err) {
    console.warn("Failed to parse saved state", err);
  }
};
const setValue = (key, value) => {
  if (!value) return;
  state[key] = value.trim();
  applyState();
  persistState();
};
const logTranscript = (text) => {
  if (elements.transcript) {
    elements.transcript.textContent = text;
  }
};
const updateFromInputs = () => {
  const read = (input, fallback) =>
    input ? input.value.trim() || fallback : fallback;
  state.headline = read(elements.inputs.headline, state.headline);
  state.subhead = read(elements.inputs.subhead, state.subhead);
  state.cta = read(elements.inputs.cta, state.cta);
  state.price = read(elements.inputs.price, state.price);
  state.theme = elements.inputs.theme?.value || state.theme;
  state.metric1 = read(elements.inputs.metric1, state.metric1);
  state.metric2 = read(elements.inputs.metric2, state.metric2);
  state.metric3 = read(elements.inputs.metric3, state.metric3);
  applyState();
  persistState();
};
const parseCommand = (command) => {
  const text = command.toLowerCase();
  if (text.includes("hide testimonials")) {
    state.testimonialsVisible = false;
    applyState();
    persistState();
    return;
  }
  if (text.includes("show testimonials")) {
    state.testimonialsVisible = true;
    applyState();
    persistState();
    return;
  }
  const mappings = [
    { regex: /headline to (.*)/, key: "headline" },
    { regex: /subhead to (.*)/, key: "subhead" },
    { regex: /cta to (.*)/, key: "cta" },
    { regex: /price to (.*)/, key: "price" },
    { regex: /metric one to (.*)/, key: "metric1" },
    { regex: /metric two to (.*)/, key: "metric2" },
    { regex: /metric three to (.*)/, key: "metric3" },
    { regex: /theme to (ember|ocean|volt|midnight)/, key: "theme" },
  ];
  for (const mapping of mappings) {
    const match = command.match(mapping.regex);
    if (match && match[1]) {
      setValue(mapping.key, match[1]);
      return;
    }
  }
};
const addCommandLog = (entry) => {
  const timestamp = new Date().toLocaleTimeString();
  const message = `${timestamp} — ${entry}`;
  commandHistory.unshift(message);
  if (commandHistory.length > 15) commandHistory.pop();
  if (elements.commandLog) {
    const li = document.createElement("li");
    li.textContent = message;
    elements.commandLog.prepend(li);
    while (elements.commandLog.children.length > 12)
      elements.commandLog.removeChild(elements.commandLog.lastChild);
  }
};
const resolvePlacementTarget = (hint) => {
  const custom = elements.placementCustom?.value?.trim();
  const selectValue = elements.placementTarget?.value;
  const preferred = custom || hint || selectValue || defaultPlacement;
  const normalized = (preferred || "").trim().replace(/^#/, "");
  const selectors = [
    custom && (custom.startsWith("#") || custom.startsWith("."))
      ? custom
      : null,
    preferred && (preferred.startsWith("#") || preferred.startsWith("."))
      ? preferred
      : null,
    `#${normalized}`,
    `.${normalized}`,
  ].filter(Boolean);
  for (const selector of selectors) {
    const match = document.querySelector(selector);
    if (match) return match;
  }
  const map = {
    main: document.querySelector("main.page"),
    hero: document.querySelector(".hero"),
    footer: document.querySelector(".footer"),
    [defaultPlacement]: elements.commandCanvas,
    canvas: elements.commandCanvas,
    control: elements.commandCanvas,
  };
  if (map[normalized]) return map[normalized];
  const main = document.querySelector("main.page");
  if (!main) return elements.commandCanvas || document.body;
  let section = document.getElementById(normalized);
  if (!section) {
    section = document.createElement("section");
    section.id = normalized || defaultPlacement;
    section.className = "section custom-block";
    const h2 = document.createElement("h2");
    h2.textContent = (normalized || "Command canvas").replace(/[-_]/g, " ");
    section.appendChild(h2);
    main.appendChild(section);
  }
  return section;
};
const createCanvasCard = ({ title, description, link, badge, thumbnail }) => {
  const card = document.createElement("article");
  card.className = "canvas-card";
  if (badge) {
    const tag = document.createElement("span");
    tag.className = "badge";
    tag.textContent = badge;
    card.appendChild(tag);
  }
  if (thumbnail) {
    const thumb = document.createElement("div");
    thumb.style.backgroundImage = `url('${thumbnail}')`;
    thumb.style.backgroundSize = "cover";
    thumb.style.backgroundPosition = "center";
    thumb.style.minHeight = "120px";
    thumb.style.borderRadius = "10px";
    thumb.style.border = "1px solid rgba(255, 255, 255, 0.08)";
    card.appendChild(thumb);
  }
  if (title) {
    const h4 = document.createElement("h4");
    h4.textContent = title;
    card.appendChild(h4);
  }
  if (description) {
    const p = document.createElement("p");
    p.textContent = description;
    card.appendChild(p);
  }
  if (link) {
    const a = document.createElement("a");
    a.href = link;
    a.target = "_blank";
    a.rel = "noreferrer";
    a.textContent = "Open source";
    a.className = "ghost-button";
    card.appendChild(a);
  }
  return card;
};
const addCardToPlacement = (payload, placementHint) => {
  const target = resolvePlacementTarget(placementHint);
  if (!target) return;
  const card = createCanvasCard(payload);
  target.appendChild(card);
};
const detectMediaType = (url, hint = "") => {
  const lowered = hint.toLowerCase();
  if (
    lowered.includes("audio") ||
    lowered.includes("song") ||
    lowered.includes("music") ||
    lowered.includes("podcast")
  )
    return "audio";
  if (lowered.includes("video")) return "video";
  const cleanUrl = url?.toLowerCase() || "";
  if (
    cleanUrl.includes("youtube.com") ||
    cleanUrl.includes("youtu.be") ||
    cleanUrl.includes("vimeo.com") ||
    cleanUrl.includes("spotify.com")
  )
    return "embed";
  const ext = cleanUrl.split(".").pop();
  if (["mp3", "wav", "ogg", "aac"].includes(ext)) return "audio";
  if (["mp4", "webm", "mov", "m4v", "ogv"].includes(ext)) return "video";
  return "embed";
};
const renderMediaQueue = () => {
  if (!elements.mediaQueue) return;
  // Clear safely
  while (elements.mediaQueue.firstChild) {
    elements.mediaQueue.removeChild(elements.mediaQueue.firstChild);
  }
  if (!mediaQueue.length) {
    const chip = document.createElement("span");
    chip.className = "media-chip";
    chip.textContent = "Queue empty";
    elements.mediaQueue.appendChild(chip);
    return;
  }
  mediaQueue.forEach((item) => {
    const chip = document.createElement("button");
    chip.className = "media-chip";
    chip.type = "button";
    chip.textContent = item.title || item.url;
    chip.addEventListener("click", () => playMedia(item));
    elements.mediaQueue.appendChild(chip);
  });
};
const enqueueMedia = (item) => {
  mediaQueue.unshift(item);
  if (mediaQueue.length > 8) mediaQueue.pop();
  renderMediaQueue();
};
const playMedia = (item) => {
  if (!elements.mediaStage || !item?.url) return;
  // Clear safely
  while (elements.mediaStage.firstChild) {
    elements.mediaStage.removeChild(elements.mediaStage.firstChild);
  }
  const type = detectMediaType(item.url, item.type);
  let node = null;
  if (type === "audio") {
    node = document.createElement("audio");
    node.controls = true;
    node.autoplay = true;
    node.src = item.url;
  } else if (type === "video") {
    node = document.createElement("video");
    node.controls = true;
    node.autoplay = true;
    node.playsInline = true;
    node.muted = false;
    node.src = item.url;
  } else {
    node = document.createElement("iframe");
    node.src = item.url;
    node.allow = "autoplay; encrypted-media";
    node.allowFullscreen = true;
    node.title = item.title || "Embedded media";
  }
  elements.mediaStage.appendChild(node);
  if (item.title) {
    const caption = document.createElement("p");
    caption.className = "muted";
    caption.textContent = item.title;
    elements.mediaStage.appendChild(caption);
  }
};
const fetchSearchResults = async (query) => {
  const url = `https://en.wikipedia.org/w/rest.php/v1/search/page?q=${encodeURIComponent(query)}&limit=5`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Search unavailable right now.");
  const data = await res.json();
  const pages = data.pages || [];
  return pages.map((page) => ({
    title: page.title,
    description: page.description || page.excerpt || "No description provided.",
    url: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.key || page.title)}`,
    thumbnail: page?.thumbnail?.url,
  }));
};
const renderSearchResults = (results, placementHint) => {
  lastSearchResults = results || [];
  if (!elements.searchResults) return;
  // Clear safely
  while (elements.searchResults.firstChild) {
    elements.searchResults.removeChild(elements.searchResults.firstChild);
  }
  if (!results || !results.length) {
    const p = document.createElement("p");
    p.className = "muted";
    p.textContent = "No results yet. Try a different phrase.";
    elements.searchResults.appendChild(p);
    return;
  }
  results.forEach((result) => {
    const card = document.createElement("div");
    card.className = "search-card";
    const h4 = document.createElement("h4");
    h4.textContent = result.title;
    const desc = document.createElement("p");
    desc.textContent = result.description;
    const meta = document.createElement("div");
    meta.className = "result-meta";
    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = "Search";
    meta.appendChild(badge);
    const actions = document.createElement("div");
    actions.className = "result-actions";
    const addBtn = document.createElement("button");
    addBtn.className = "secondary";
    addBtn.textContent = "Add to page";
    addBtn.addEventListener("click", () =>
      addCardToPlacement({ ...result, badge: "Search" }, placementHint)
    );
    const playBtn = document.createElement("button");
    playBtn.className = "ghost";
    playBtn.textContent = "Play";
    playBtn.addEventListener("click", () =>
      handleMediaRequest(result.title, "video", placementHint)
    );
    actions.appendChild(addBtn);
    actions.appendChild(playBtn);
    card.appendChild(h4);
    card.appendChild(desc);
    card.appendChild(meta);
    card.appendChild(actions);
    elements.searchResults.appendChild(card);
  });
};
const fetchAudioPreview = async (query) => {
  const url = `https://itunes.apple.com/search?media=music&limit=1&term=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Audio search unavailable");
  const data = await res.json();
  if (data.results && data.results.length) return data.results[0];
  return null;
};
const handleMediaRequest = async (query, typeHint = "", placementHint) => {
  if (!query) return;
  addCommandLog(`Media: ${query}`);
  const urlMatch = query.match(/https?:\/\/\S+/);
  if (urlMatch) {
    const url = urlMatch[0];
    const type = detectMediaType(url, typeHint);
    const title = query.replace(url, "").trim() || "Media from command";
    const item = { title, url, type };
    enqueueMedia(item);
    playMedia(item);
    addCardToPlacement(
      {
        title,
        description: url,
        link: url,
        badge: type === "audio" ? "Audio" : "Media",
      },
      placementHint
    );
    return;
  }
  const wantsAudio =
    /audio|song|music|podcast/i.test(typeHint) ||
    /audio|song|music|podcast/i.test(query);
  if (wantsAudio) {
    try {
      const preview = await fetchAudioPreview(query);
      if (preview?.previewUrl) {
        const item = {
          title: preview.trackName || query,
          url: preview.previewUrl,
          type: "audio",
        };
        enqueueMedia(item);
        playMedia(item);
        addCardToPlacement(
          {
            title: preview.trackName || query,
            description: preview.artistName || "Audio preview loaded.",
            link: preview.trackViewUrl || preview.previewUrl,
            badge: "Audio",
          },
          placementHint
        );
        return;
      }
    } catch (err) {
      // fall through to video
    }
  }
  const embedUrl = `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(query)}`;
  const item = { title: `Video: ${query}`, url: embedUrl, type: "embed" };
  enqueueMedia(item);
  playMedia(item);
  addCardToPlacement(
    {
      title: query,
      description: "Video search playlist",
      link: embedUrl,
      badge: "Video",
    },
    placementHint
  );
};
const handleSearch = async (query, placementHint) => {
  if (!query) return;
  addCommandLog(`Search: ${query}`);
  if (elements.searchResults) {
    // Clear safely
    while (elements.searchResults.firstChild) {
      elements.searchResults.removeChild(elements.searchResults.firstChild);
    }
    const status = document.createElement("p");
    status.className = "muted";
    status.textContent = `Searching for "${query}"...`;
    elements.searchResults.appendChild(status);
  }
  try {
    const results = await fetchSearchResults(query);
    renderSearchResults(results, placementHint);
    if (results[0]) {
      addCardToPlacement({ ...results[0], badge: "Search" }, placementHint);
    }
  } catch (err) {
    if (elements.searchResults) {
      // Clear safely
      while (elements.searchResults.firstChild) {
        elements.searchResults.removeChild(elements.searchResults.firstChild);
      }
      const status = document.createElement("p");
      status.className = "muted";
      status.textContent = `Search failed: ${err.message}`;
      elements.searchResults.appendChild(status);
    }
  }
};
const applyTextEffect = (targetKey, effectString = "") => {
  const targets = [];
  const key = targetKey.toLowerCase();
  if (key === "headline" && elements.headline) targets.push(elements.headline);
  if (key === "subhead" && elements.subhead) targets.push(elements.subhead);
  if (key === "cta" && elements.cta) targets.push(elements.cta);
  if (key === "text") {
    if (elements.headline) targets.push(elements.headline);
    if (elements.subhead) targets.push(elements.subhead);
  }
  const selectorMatch = targetKey.match(/[#.][\w-]+/);
  if (!targets.length && selectorMatch) {
    document
      .querySelectorAll(selectorMatch[0])
      .forEach((el) => targets.push(el));
  }
  if (!targets.length && elements.headline) targets.push(elements.headline);
  const effectEntry = Object.entries(textEffects).find(([keyword]) =>
    effectString.toLowerCase().includes(keyword)
  );
  const className = effectEntry ? effectEntry[1] : textEffects.glow;
  targets.forEach((el) => {
    Object.values(textEffects).forEach((cls) => el.classList.remove(cls));
    if (className) el.classList.add(className);
    const colorMatch = effectString.match(/#([0-9a-f]{3,6})/i);
    if (colorMatch) {
      el.style.color = `#${colorMatch[1]}`;
    }
  });
};
const extractPlacementHint = (command) => {
  const lower = command.toLowerCase();
  if (lower.includes("hero")) return "hero";
  if (lower.includes("footer")) return "footer";
  const idMatch = command.match(/#([\w-]+)/);
  if (idMatch) return `#${idMatch[1]}`;
  const pageMatch = command.match(/on\s+([\w-]+)\s+(page|section)/i);
  if (pageMatch) return pageMatch[1];
  const customMatch = command.match(/into\s+([\w-]+)/i);
  if (customMatch) return customMatch[1];
  return elements.placementTarget?.value || defaultPlacement;
};
const handleAdvancedCommand = async (command) => {
  if (!command) return;
  const placementHint = extractPlacementHint(command);
  const searchMatch = command.match(/(?:search for|find)\s+(.+)/i);
  if (searchMatch) {
    await handleSearch(searchMatch[1], placementHint);
    return;
  }
  const mediaMatch = command.match(
    /play\s+(?:a\s+)?(video|song|audio|music|podcast)?\s*(?:about|for)?\s*(.+)/i
  );
  if (mediaMatch && mediaMatch[2]) {
    await handleMediaRequest(mediaMatch[2], mediaMatch[1] || "", placementHint);
    return;
  }
  const styleMatch = command.match(
    /(?:style|animate|make)\s+(headline|subhead|cta|text|title)\s+(.*)/i
  );
  if (styleMatch) {
    const targetKey = styleMatch[1] === "title" ? "headline" : styleMatch[1];
    applyTextEffect(targetKey, styleMatch[2]);
    return;
  }
  const addSectionMatch = command.match(
    /(?:add|create|drop|place)\s+(?:a\s+)?(?:section|block|card)\s+(.*)/i
  );
  if (addSectionMatch) {
    addCardToPlacement(
      {
        title: addSectionMatch[1] || "New section",
        description: command,
        badge: "Section",
      },
      placementHint
    );
    return;
  }
  if (
    (command.toLowerCase().includes("place it") ||
      command.toLowerCase().includes("add it")) &&
    lastSearchResults.length
  ) {
    addCardToPlacement(
      { ...lastSearchResults[0], badge: "Search" },
      placementHint
    );
  }
};
const handleCommandInput = async (command) => {
  if (!command) return;
  logTranscript(command);
  addCommandLog(command);
  parseCommand(command);
  await handleAdvancedCommand(command);
  if (elements.commandInput) elements.commandInput.value = command;
};
const setupVoice = (onCommand) => {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    logTranscript("Speech recognition not supported in this browser.");
    return null;
  }
  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.onresult = async (event) => {
    const last = event.results[event.results.length - 1];
    if (!last.isFinal) return;
    const transcript = last[0].transcript.trim();
    logTranscript(transcript);

    // Try to parse as UI command
    const voiceCmd = commandHandler.parseVoiceCommand(transcript);
    if (voiceCmd) {
      await commandHandler.execute(voiceCmd.action, voiceCmd.args, "voice");
    } else {
      // Fallback to existing command handler if no UI command matched
      parseCommand(transcript);
      if (onCommand) {
        try {
          await onCommand(transcript);
        } catch (err) {
          logTranscript(`Command error: ${err.message}`);
        }
      }
    }
  };
  recognition.onerror = (event) => {
    logTranscript(`Voice error: ${event.error}`);
  };
  return recognition;
};
const setupReveal = () => {
  const sections = document.querySelectorAll(".reveal");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    },
    { threshold: 0.2 }
  );
  sections.forEach((section) => observer.observe(section));
};
const setupCursor = () => {
  if (!elements.cursorDot) return;
  window.addEventListener("pointermove", (e) => {
    elements.cursorDot.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
  });
};
const setupContactModal = () => {
  const open = () => elements.contactModal?.classList.add("show");
  const close = () => elements.contactModal?.classList.remove("show");
  elements.contactLink?.addEventListener("click", (e) => {
    e.preventDefault();
    open();
  });
  elements.contactFooter?.addEventListener("click", (e) => {
    e.preventDefault();
    open();
  });
  elements.contactLinkMobile?.addEventListener("click", (e) => {
    e.preventDefault();
    open();
  });
  elements.contactClose?.addEventListener("click", close);
  elements.contactModal?.addEventListener("click", (e) => {
    if (e.target === elements.contactModal) close();
  });
};
const setupAudio = () => {
  if (!audioTracks.length) return;

  let audio = null;
  let isDestroyed = false;
  let cleanupIndex = -1;
  let isCreating = false;

  const createAudio = () => {
    if (isDestroyed || isCreating) return null;

    isCreating = true;

    try {
      audio = new Audio();
      const pick = () =>
        audioTracks[Math.floor(Math.random() * audioTracks.length)];

      audio.src = pick();
      audio.loop = true;
      audio.volume = 0.15;
      audio.preload = "auto";

      const handleEnded = () => {
        if (!isDestroyed && audio) {
          audio.src = pick();
          audio.play().catch(() => {});
        }
      };

      audio.addEventListener("ended", handleEnded);

      audio._cleanup = () => {
        audio.removeEventListener("ended", handleEnded);
        audio.pause();
        audio.src = "";
      };

      return audio;
    } catch (error) {
      console.warn("Failed to create audio:", error);
      return null;
    } finally {
      isCreating = false;
    }
  };

  const cleanupAudio = () => {
    isDestroyed = true;
    if (audio && audio._cleanup) {
      audio._cleanup();
      audio = null;
    }

    if (cleanupIndex >= 0 && window.__cleanupFunctions) {
      window.__cleanupFunctions.splice(cleanupIndex, 1);
      cleanupIndex = -1;
    }
  };

  audio = createAudio();
  if (audio) {
    audio.play().catch(() => {});
  }

  if (!window.__cleanupFunctions) {
    window.__cleanupFunctions = [];
  }
  cleanupIndex = window.__cleanupFunctions.length;
  window.__cleanupFunctions.push(cleanupAudio);

  const handleUnload = () => {
    cleanupAudio();
    window.removeEventListener("unload", handleUnload);
  };
  window.addEventListener("unload", handleUnload);

  return cleanupAudio;
};
const setupTicker = () => {
  if (!elements.ticker || !elements.tickerData) return;

  const config = {
    apiUrl:
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd",
    updateInterval: 45000,
    fallbackText: "Live market data unavailable",
  };

  let marketDataInterval = null;
  let isDestroyed = false;

  const update = async () => {
    if (isDestroyed) return;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(config.apiUrl, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });

      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const items = Object.entries(data).map(
        ([k, v]) => `${k.toUpperCase()}: $${(v?.usd || 0).toLocaleString()}`
      );

      if (!isDestroyed && elements.tickerData) {
        elements.tickerData.textContent = items.join("   |   ");
      }
    } catch (e) {
      if (!isDestroyed && elements.tickerData) {
        elements.tickerData.textContent = config.fallbackText;
      }
    }
  };

  const cleanupMarketData = () => {
    isDestroyed = true;
    if (marketDataInterval) {
      clearInterval(marketDataInterval);
      marketDataInterval = null;
    }
  };

  update();
  marketDataInterval = setInterval(update, config.updateInterval);

  const cleanupFunctions = window.__cleanupFunctions || [];
  cleanupFunctions.push(cleanupMarketData);
  window.__cleanupFunctions = cleanupFunctions;
  window.cleanupMarketData = cleanupMarketData;

  const handleUnload = () => {
    cleanupMarketData();
    window.removeEventListener("unload", handleUnload);
  };
  window.addEventListener("unload", handleUnload);

  return cleanupMarketData;
};
const setupAvatar = () => {
  const avatar = elements.avatar;
  if (!avatar) return;
  let dragging = false;
  let offsetX = 0;
  let offsetY = 0;
  const start = (e) => {
    dragging = true;
    avatar.style.cursor = "grabbing";
    offsetX = e.clientX - avatar.offsetLeft;
    offsetY = e.clientY - avatar.offsetTop;
  };
  const move = (e) => {
    if (!dragging) return;
    avatar.style.left = `${e.clientX - offsetX}px`;
    avatar.style.top = `${e.clientY - offsetY}px`;
  };
  const end = () => {
    dragging = false;
    avatar.style.cursor = "grab";
  };
  avatar.addEventListener("pointerdown", start);
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", end);
  window.addEventListener("deviceorientation", (e) => {
    const tiltX = e.gamma || 0;
    const tiltY = e.beta || 0;
    avatar.style.transform = `rotateX(${tiltY * 0.02}deg) rotateY(${tiltX * 0.02}deg)`;
  });
};
const setupMobileNav = () => {
  if (!elements.menuToggle || !elements.mobileDrawer) return;
  const toggle = () => elements.mobileDrawer.classList.toggle("show");
  const close = () => elements.mobileDrawer.classList.remove("show");
  elements.menuToggle.addEventListener("click", toggle);
  elements.mobileDrawer.addEventListener("click", (e) => {
    if (e.target.tagName === "A") close();
  });
  elements.mobileLinks.forEach((link) => link.addEventListener("click", close));
};
const init = () => {
  loadState();
  applyState();
  setupReveal();
  setControlVisibility();
  setupCursor();
  setupContactModal();
  setupAudio();
  setupTicker();
  setupAvatar();
  setupMobileNav();
  renderMediaQueue();
  const recognition = setupVoice(handleCommandInput);
  const startButton = document.getElementById("start-voice");
  const stopButton = document.getElementById("stop-voice");
  const applyButton = document.getElementById("apply");
  const runButton = elements.runCommand;
  const commandInput = elements.commandInput;
  const runTextCommand = async () => {
    const command = commandInput?.value?.trim();
    if (!command) return;
    await handleCommandInput(command);
  };
  if (startButton && recognition) {
    startButton.addEventListener("click", () => {
      recognition.start();
      logTranscript("Listening...");
    });
  }
  if (stopButton && recognition) {
    stopButton.addEventListener("click", () => {
      recognition.stop();
      logTranscript("Stopped.");
    });
  }
  if (applyButton) {
    applyButton.addEventListener("click", updateFromInputs);
  }
  if (runButton) {
    runButton.addEventListener("click", () => {
      runTextCommand().catch((err) =>
        logTranscript(`Command error: ${err.message}`)
      );
    });
  }
  if (commandInput) {
    commandInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        runTextCommand().catch((err) =>
          logTranscript(`Command error: ${err.message}`)
        );
      }
    });
  }
  if (
    elements.controlUnlock &&
    elements.controlPassword &&
    elements.controlNote
  ) {
    elements.controlUnlock.addEventListener("click", () => {
      const value = elements.controlPassword.value.trim();
      if (!controlPassword) {
        elements.controlNote.textContent =
          "Admin access disabled - no password configured.";
        return;
      }
      if (value === controlPassword) {
        sessionStorage.setItem(controlKey, "true");
        elements.controlPassword.value = "";
        elements.controlNote.textContent = "";
        setControlVisibility();
        return;
      }
      elements.controlNote.textContent = "Incorrect access code.";
    });
  }
};
init();
