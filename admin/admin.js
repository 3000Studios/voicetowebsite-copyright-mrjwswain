const statusEl = document.getElementById("status");
const micStateEl = document.getElementById("mic-state");
const commandEl = document.getElementById("command");
const responseEl = document.getElementById("response");
const startBtn = document.getElementById("start");
const stopBtn = document.getElementById("stop");
const planBtn = document.getElementById("plan");
const applyBtn = document.getElementById("apply");
const targetModeEl = document.getElementById("target-mode");
const lockScreen = document.getElementById("lock-screen");
const lockInput = document.getElementById("lock-input");
const lockButton = document.getElementById("lock-button");
const lockError = document.getElementById("lock-error");
const lockForm = document.getElementById("auth-form");
const adminShell = document.querySelector(".admin-shell");
const previewReset = document.getElementById("preview-reset");
const previewSpeak = document.getElementById("preview-speak");
const previewExtras = document.getElementById("preview-extras");
const previewFrame = document.getElementById("preview-frame");
const activityList = document.getElementById("activity-list");
const activityStatus = document.getElementById("activity-status");
const refreshLogs = document.getElementById("refresh-logs");

let recognition;
let listening = false;
let inactivityTimer = null;
let lastPlan = null;

const getTargetMode = () =>
  targetModeEl && targetModeEl.value === "site" ? "site" : "sandbox";

const UNLOCK_KEY = "yt-admin-unlocked";
const UNLOCK_TS_KEY = "yt-admin-unlocked-ts";
const SESSION_TTL_MS = 1000 * 60 * 60 * 2;
const positiveWords = [
  "apply now",
  "ship it",
  "go ahead",
  "do it",
  "yes",
  "confirm",
  "send it",
  "ok",
  "okay",
  "looks good",
  "sounds good",
  "go for it",
  "approved",
];

const setStatus = (text) => {
  if (statusEl) statusEl.textContent = text;
};

const setResponse = (payload) => {
  if (responseEl) responseEl.textContent = JSON.stringify(payload, null, 2);
};

const speak = (text) => {
  if (!("speechSynthesis" in window)) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 1;
  speechSynthesis.cancel();
  speechSynthesis.speak(utter);
};

const clickSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 520;
    gain.gain.value = 0.06;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.06);
  } catch (_) {
    // ignore
  }
};

const getFrameDoc = () =>
  previewFrame?.contentDocument || previewFrame?.contentWindow?.document;

const setFrameText = (selector, value) => {
  if (!value) return;
  const doc = getFrameDoc();
  if (!doc) return;
  const el = doc.querySelector(selector);
  if (el) el.textContent = value;
};

const setFrameStyle = (selector, styles) => {
  const doc = getFrameDoc();
  if (!doc) return;
  const el = doc.querySelector(selector);
  if (!el) return;
  Object.entries(styles).forEach(([key, value]) => {
    if (value !== undefined && value !== null) el.style[key] = value;
  });
};

const setFrameTheme = (theme) => {
  const doc = getFrameDoc();
  if (!doc) return;
  if (!theme || theme === "ember") {
    doc.documentElement.removeAttribute("data-theme");
    return;
  }
  doc.documentElement.dataset.theme = theme;
};

const resetPreview = () => {
  if (previewExtras) previewExtras.innerHTML = "";
  const doc = getFrameDoc();
  if (doc && doc.body) {
    doc.body.style.backgroundImage = "";
    doc.documentElement.removeAttribute("data-theme");
  }
};

const applyLocalPreview = (command) => {
  if (!command) return;
  const doc = getFrameDoc();
  if (!doc) return;
  const text = command.toLowerCase();
  const urlMatch = command.match(/https?:\/\/\S+/);
  const hexMatch = command.match(/#([0-9a-fA-F]{3,6})/);
  const sayMatch = command.match(/say\s+(.+)/i);
  const fontMatch = command.match(/font\s+(to|is|=)?\s*([a-zA-Z0-9\s-]+)/i);

  if (sayMatch) setFrameText("#headline", sayMatch[1].trim());
  if (text.includes("eyebrow")) setFrameText("#eyebrow", command);
  if (text.includes("headline")) setFrameText("#headline", command);
  if (text.includes("subhead")) setFrameText("#subhead", command);
  if (text.includes("cta")) setFrameText("#cta", command);
  if (text.includes("price")) setFrameText("#price", command);

  if (hexMatch) setFrameStyle("#headline", { color: `#${hexMatch[1]}` });
  if (fontMatch) {
    setFrameStyle("#headline", {
      fontFamily: `'${fontMatch[2].trim()}', "Playfair Display", serif`,
    });
  }

  if (text.includes("blue")) {
    doc.body.style.backgroundImage =
      "linear-gradient(135deg, rgba(80,120,255,0.15), rgba(20,30,60,0.6))";
  }

  if (previewExtras) previewExtras.innerHTML = "";
  if (previewExtras && urlMatch) {
    const block = document.createElement("div");
    block.className = "preview-extra-card";
    block.innerHTML = `<h4>Media</h4><p>${command}</p>`;
    previewExtras.appendChild(block);
  }
};

const clearExtras = () => {
  if (previewExtras) previewExtras.innerHTML = "";
};

const applyActionsPreview = (actions = []) => {
  clearExtras();
  const doc = getFrameDoc();
  actions.forEach((action) => {
    if (action.type === "update_copy") {
      if (action.field) setFrameText(`#${action.field}`, action.value);
    }
    if (action.type === "update_meta" && action.title && doc) {
      doc.title = action.title;
    }
    if (action.type === "update_theme") {
      setFrameTheme(action.theme);
    }
    if (action.type === "update_background_video") {
      const video = doc?.querySelector(".video-bg video");
      if (video) {
        video.src = action.src;
        video.load?.();
      }
    }
    if (action.type === "update_wallpaper") {
      if (doc?.body) {
        doc.body.style.backgroundImage = `url('${action.src}')`;
        doc.body.style.backgroundSize = "cover";
        doc.body.style.backgroundRepeat = "no-repeat";
      }
    }
    if (action.type === "update_avatar") {
      const avatarImg = doc?.querySelector(".avatar img");
      if (avatarImg) avatarImg.src = action.src;
    }
    if (action.type === "insert_section" && previewExtras) {
      const block = document.createElement("div");
      block.className = "preview-extra-card";
      block.innerHTML = `<h4>${action.title || action.id || "Section"}</h4><p>${action.body || ""}</p>`;
      previewExtras.appendChild(block);
    }
    if (action.type === "insert_video" && previewExtras) {
      const block = document.createElement("div");
      block.className = "preview-extra-card";
      block.innerHTML = `<h4>${action.title || "Video"}</h4><video controls muted playsinline style="width:100%;border-radius:12px;"><source src="${action.src}" type="video/mp4"></video>`;
      previewExtras.appendChild(block);
    }
    if (action.type === "insert_stream" && previewExtras) {
      const block = document.createElement("div");
      block.className = "preview-extra-card";
      block.innerHTML = `<h4>${action.title || "Livestream"}</h4><div class="embed"><iframe src="${action.url}" style="width:100%;height:200px;border:0;border-radius:12px;" allowfullscreen></iframe></div>`;
      previewExtras.appendChild(block);
    }
    if (action.type === "add_product" && previewExtras) {
      const block = document.createElement("div");
      block.className = "preview-extra-card";
      block.innerHTML = `<h4>${action.name || "Product"}</h4><p>${action.description || ""}</p><strong>${action.price || ""}</strong>`;
      previewExtras.appendChild(block);
    }
    if (action.type === "insert_monetization" && previewExtras) {
      const block = document.createElement("div");
      block.className = "preview-extra-card";
      block.innerHTML = `<h4>${action.headline || "Monetize"}</h4><p>${action.description || ""}</p><button class="primary">${action.cta || "Get the offer"}</button>`;
      previewExtras.appendChild(block);
    }
  });
  speak("Preview updated");
};

const logActivity = async () => {
  if (!activityStatus) return;
  activityStatus.textContent = "Loading history...";
  try {
    const res = await fetch("/admin/logs");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const logs = data.logs || [];
    if (activityList) activityList.innerHTML = "";
    if (!logs.length) {
      activityStatus.textContent = "No history yet.";
      return;
    }
    logs.forEach((row) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <div class="cmd">${row.command || "(no command)"}</div>
        <div class="meta">Actions: ${row.actions || "[]"} | Files: ${row.files || "[]"} | Commit: ${row.commit || ""} | ${row.ts || ""}</div>
      `;
      if (activityList) activityList.appendChild(li);
    });
    activityStatus.textContent = `Loaded ${logs.length} entries.`;
  } catch (err) {
    activityStatus.textContent = `History unavailable (${err.message}).`;
  }
};

const callOrchestrator = async (payload) => {
  const target = getTargetMode();
  const res = await fetch("/api/orchestrator", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...payload, target }),
  });
  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch (_) {
    data = { error: text || "Request failed" };
  }
  if (!res.ok) {
    throw new Error(data.error || text || "Request failed");
  }
  return data;
};

const isSessionFresh = () => {
  const ts = Number(sessionStorage.getItem(UNLOCK_TS_KEY) || 0);
  if (!ts) return false;
  return Date.now() - ts < SESSION_TTL_MS;
};

const clearSession = () => {
  sessionStorage.removeItem(UNLOCK_KEY);
  sessionStorage.removeItem(UNLOCK_TS_KEY);
  document.cookie = "vtw_admin=; Path=/; Max-Age=0; SameSite=Lax";
};

const touchSession = () => {
  if (sessionStorage.getItem("adminAccessValidated") === "true") {
    sessionStorage.setItem(UNLOCK_TS_KEY, String(Date.now()));
  }
};

const isUnlocked = () => {
  try {
    if (sessionStorage.getItem("adminAccessValidated") !== "true") return false;
    // Best-effort TTL to reduce risk if someone walks away with an unlocked browser tab.
    if (!isSessionFresh()) {
      sessionStorage.setItem(UNLOCK_TS_KEY, String(Date.now()));
    }
    return true;
  } catch (_) {
    return false;
  }
};

const setLockedUI = (locked) => {
  lockScreen.style.display = locked ? "grid" : "none";
  adminShell.style.filter = locked ? "blur(8px)" : "none";
  [startBtn, stopBtn, planBtn, applyBtn, commandEl].forEach((el) => {
    if (el) el.disabled = locked;
  });
  setStatus(locked ? "Locked" : "Unlocked");
};

const initPasscodeGate = () => {
  // Server endpoints enforce authentication. This is just a client-side UX gate.
  touchSession();
  setLockedUI(false);
};

const initSpeech = () => {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    micStateEl.textContent =
      "Speech recognition not supported in this browser.";
    return;
  }

  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.lang = "en-US";
  recognition.interimResults = false;

  const scheduleInactivity = () => {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      stopBtn.click();
    }, 5000);
  };

  recognition.onresult = (event) => {
    if (!event.results || event.results.length === 0) return;
    const last = event.results[event.results.length - 1];
    if (!last || !last.isFinal || !last[0]) return;
    const transcript = last[0].transcript.trim();
    commandEl.value = transcript;
    micStateEl.textContent = `Captured: "${transcript}"`;
    applyLocalPreview(transcript);
    if (listening) scheduleInactivity();

    const lower = transcript.toLowerCase();
    const autoMode = document.getElementById("autonomous-mode");
    if (autoMode && autoMode.checked) {
      planBtn.click();
      return;
    }
    if (positiveWords.some((p) => lower.includes(p)) && lastPlan) {
      applyBtn.click();
    }
  };

  recognition.onerror = (event) => {
    micStateEl.textContent = `Mic error: ${event.error}`;
  };

  recognition.onend = () => {
    if (listening) {
      recognition.start();
    }
  };

  return { scheduleInactivity };
};

const speechController = initSpeech();

startBtn.addEventListener("click", () => {
  if (!recognition) return;
  listening = true;
  recognition.start();
  if (speechController?.scheduleInactivity)
    speechController.scheduleInactivity();
  micStateEl.textContent = "Listening...";
});

stopBtn.addEventListener("click", () => {
  if (!recognition) return;
  listening = false;
  recognition.stop();
  micStateEl.textContent = "Microphone idle.";
  if (inactivityTimer) clearTimeout(inactivityTimer);
});

commandEl.addEventListener("input", () => {
  const command = commandEl.value.trim();
  if (!command) return;
  applyLocalPreview(command);
});

planBtn.addEventListener("click", async () => {
  try {
    if (!isUnlocked()) {
      setResponse({
        error: "Unlock with the access code before generating a plan.",
      });
      speak("Unlock required");
      return;
    }
    touchSession();
    const command = commandEl.value.trim();
    if (!command) return;
    setResponse({ status: "Planning..." });
    applyLocalPreview(command);
    const data = await callOrchestrator({ mode: "plan", command });
    lastPlan = data;
    setResponse(data);
    if (data.plan?.actions) {
      applyActionsPreview(data.plan.actions);
    }
    speak("Plan ready. Say apply now to ship it.");
  } catch (err) {
    setResponse({ error: err.message });
    speak("Planning failed");
  }
});

applyBtn.addEventListener("click", async () => {
  try {
    speak("Hell ya Boss man, I'm making those changes for you right now");
    if (!isUnlocked()) {
      setResponse({
        error: "Unlock with the access code before applying changes.",
      });
      speak("Unlock required");
      return;
    }
    touchSession();
    if (!lastPlan) {
      const fallbackCommand = commandEl.value.trim();
      if (!fallbackCommand) {
        setResponse({ error: "Provide a command first." });
        return;
      }
      const data = await callOrchestrator({
        mode: "plan",
        command: fallbackCommand,
      });
      lastPlan = data;
    }
    setResponse({ status: `Applying to ${getTargetMode()}...` });
    const data = await callOrchestrator({
      mode: "apply",
      plan: lastPlan.plan,
      command: lastPlan.command,
    });
    setResponse(data);
    logActivity();
  } catch (err) {
    setResponse({ error: err.message });
    speak("Apply failed");
  }
});

if (targetModeEl && previewFrame) {
  targetModeEl.addEventListener("change", () => {
    lastPlan = null;
    resetPreview();
    previewFrame.src = getTargetMode() === "site" ? "/" : "/sandbox.html";
    setStatus(`Target: ${getTargetMode()}`);
  });
}

if (previewReset) {
  previewReset.addEventListener("click", () => resetPreview());
}

if (previewSpeak) {
  previewSpeak.addEventListener("click", () => {
    const summary = commandEl.value ? commandEl.value : "No command yet.";
    speak(summary);
  });
}

if (previewFrame) {
  previewFrame.addEventListener("load", () => {
    if (lastPlan?.plan?.actions) {
      applyActionsPreview(lastPlan.plan.actions);
    }
  });
}

if (refreshLogs) {
  refreshLogs.addEventListener("click", () => logActivity());
}

document.addEventListener("click", (event) => {
  if (event.target.closest("button, a")) {
    clickSound();
  }
});

initPasscodeGate();
