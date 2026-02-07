const statusEl = document.getElementById("status");
const micStateEl = document.getElementById("mic-state");
const commandEl = document.getElementById("command");
const responseEl = document.getElementById("response");
const startBtn = document.getElementById("start");
const stopBtn = document.getElementById("stop");
const planBtn = document.getElementById("plan");
const applyBtn = document.getElementById("apply");
const undoBtn = document.getElementById("undo");
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
const transcriptList = document.getElementById("transcript-list");
const transcriptStatus = document.getElementById("transcript-status");
const refreshLogs = document.getElementById("refresh-logs");
const planSummary = document.getElementById("plan-summary");
const planConfirm = document.getElementById("plan-confirm");
const sessionStateEl = document.getElementById("session-state");
const orchestratorStateEl = document.getElementById("orchestrator-state");
const previewModeEl = document.getElementById("preview-mode");
const responseSourceEl = document.getElementById("response-source");
const quickCommandsEl = document.getElementById("quick-commands");
const adminLivePlayer = document.getElementById("admin-live-player");
const adminLiveUrl = document.getElementById("admin-live-url");
const adminLiveLoad = document.getElementById("admin-live-load");
const adminLiveSave = document.getElementById("admin-live-save");
const adminLiveClips = document.getElementById("admin-live-clips");
const appTableBody = document.getElementById("app-table-body");
const appForm = document.getElementById("app-form");
const appClear = document.getElementById("app-clear");
const appsReset = document.getElementById("apps-reset");
const appsCount = document.getElementById("apps-count");
const appsSales = document.getElementById("apps-sales");
const kpiApps = document.getElementById("kpi-apps");
const kpiMrr = document.getElementById("kpi-mrr");
const kpiNew = document.getElementById("kpi-new"); // Store manager (products)const productTableBody = document.getElementById("product-table-body");const productForm = document.getElementById("product-form");const productClear = document.getElementById("product-clear");const productsReset = document.getElementById("products-reset");const productsCount = document.getElementById("products-count");let recognition;let listening = false;let lastPlan = null;let orchestratorHealthy = true;const PASSCODE = (window.__ENV && window.__ENV.CONTROL_PASSWORD) || "5555";const UNLOCK_KEY = "yt-admin-unlocked";const UNLOCK_TS_KEY = "yt-admin-unlocked-ts";const SESSION_TTL_MS = 1000 * 60 * 60 * 2;const positiveWords = [  "apply now",  "ship it",  "go ahead",  "do it",  "yes",  "confirm",  "send it",  "ok",  "okay",  "looks good",  "sounds good",  "go for it",  "approved",];const setStatus = (text) => {  if (statusEl) statusEl.textContent = text;};const setResponse = (payload) => {  if (responseEl) responseEl.textContent = JSON.stringify(payload, null, 2);};const setStatusChip = (el, text, tone = "ok") => {  if (!el) return;  el.textContent = text;  el.classList.remove("ok", "warn", "alert");  if (tone) el.classList.add(tone);};const setPreviewMode = (mode = "Idle", tone = "warn") => {  setStatusChip(previewModeEl, mode, tone);};const markResponseSource = (data) => {  const local = Boolean(data?.local);  if (local) {    setStatusChip(responseSourceEl, "Local preview (offline)", "warn");    setPreviewMode("Local preview", "warn");    setStatusChip(orchestratorStateEl, "Offline (fallback)", "warn");  } else {    setStatusChip(responseSourceEl, "Cloud orchestrator", "ok");    setPreviewMode("Cloud preview", "ok");    setStatusChip(orchestratorStateEl, "Online", "ok");  }};const speak = (text) => {  if (!("speechSynthesis" in window)) return;  const utter = new SpeechSynthesisUtterance(text);  utter.rate = 1;  speechSynthesis.cancel();  speechSynthesis.speak(utter);};const clickSound = () => {  try {    const ctx = new (window.AudioContext || window.webkitAudioContext)();    const osc = ctx.createOscillator();    const gain = ctx.createGain();    osc.frequency.value = 520;    gain.gain.value = 0.06;    osc.connect(gain);    gain.connect(ctx.destination);    osc.start();    osc.stop(ctx.currentTime + 0.06);  } catch (_) {    // ignore  }};const getFrameDoc = () => previewFrame?.contentDocument || previewFrame?.contentWindow?.document;const setFrameText = (selector, value) => {  if (!value) return;  const doc = getFrameDoc();  if (!doc) return;  const el = doc.querySelector(selector);  if (el) el.textContent = value;};const setFrameStyle = (selector, styles) => {  const doc = getFrameDoc();  if (!doc) return;  const el = doc.querySelector(selector);  if (!el) return;  Object.entries(styles).forEach(([key, value]) => {    if (value !== undefined && value !== null) el.style[key] = value;  });};const setFrameTheme = (theme) => {  const doc = getFrameDoc();  if (!doc) return;  if (!theme || theme === "ember") {    doc.documentElement.removeAttribute("data-theme");    return;  }  doc.documentElement.dataset.theme = theme;};const resetPreview = () => {  if (previewExtras) previewExtras.innerHTML = "";  const doc = getFrameDoc();  if (doc && doc.body) {    doc.body.style.backgroundImage = "";    doc.documentElement.removeAttribute("data-theme");  }};const applyLocalPreview = (command) => {  if (!command) return;  const actions = buildLocalActions(command);  applyActionsPreview(actions);};const clearExtras = () => {  if (previewExtras) previewExtras.innerHTML = "";};const applyActionsPreview = (actions = []) => {  clearExtras();  const doc = getFrameDoc();  actions.forEach((action) => {    if (action.type === "update_copy") {      if (action.field === "headline") setFrameText("#headline", action.value);      if (action.field === "subhead") setFrameText("#subhead", action.value);      if (action.field === "cta") setFrameText("#cta", action.value);    }    if (action.type === "update_meta" && action.title && doc) {      doc.title = action.title;    }    if (action.type === "update_theme") {      setFrameTheme(action.theme);    }    if (action.type === "update_background_video") {      const video = doc?.querySelector(".video-bg video");      if (video) {        video.src = action.src;        video.load?.();      }    }    if (action.type === "update_wallpaper") {      if (doc?.body) {        doc.body.style.backgroundImage = `url('${action.src}')`;        doc.body.style.backgroundSize = "cover";        doc.body.style.backgroundRepeat = "no-repeat";      }    }    if (action.type === "update_avatar") {      const avatarImg = doc?.querySelector(".avatar img");      if (avatarImg) avatarImg.src = action.src;    }    if (action.type === "insert_section" && previewExtras) {      const block = document.createElement("div");      block.className = "preview-extra-card";      block.innerHTML = `<h4>${action.title || action.id || "Section"}</h4><p>${action.body || ""}</p>`;      previewExtras.appendChild(block);    }    if (action.type === "insert_video" && previewExtras) {      const block = document.createElement("div");      block.className = "preview-extra-card";      block.innerHTML = `<h4>${action.title || "Video"}</h4><video controls muted playsinline style="width:100%;border-radius:12px;"><source src="${action.src}" type="video/mp4"></video>`;      previewExtras.appendChild(block);    }    if (action.type === "insert_stream" && previewExtras) {      const block = document.createElement("div");      block.className = "preview-extra-card";      block.innerHTML = `<h4>${action.title || "Livestream"}</h4><div class="embed"><iframe src="${action.url}" style="width:100%;height:200px;border:0;border-radius:12px;" allowfullscreen></iframe></div>`;      previewExtras.appendChild(block);    }    if (action.type === "update_font") {      setFrameStyle("#headline", { fontFamily: `'${action.family}', "Playfair Display", serif` });    }    if (action.type === "add_product" && previewExtras) {      const block = document.createElement("div");      block.className = "preview-extra-card";      block.innerHTML = `<h4>${action.name || "Product"}</h4><p>${action.description || ""}</p><strong>${action.price || ""}</strong>`;      previewExtras.appendChild(block);    }    if (action.type === "insert_monetization" && previewExtras) {      const block = document.createElement("div");      block.className = "preview-extra-card";      block.innerHTML = `<h4>${action.headline || "Monetize"}</h4><p>${action.description || ""}</p><button class="primary">${action.cta || "Get the offer"}</button>`;      previewExtras.appendChild(block);    }  });  speak("Preview updated");};const TRANSCRIPT_KEY = "vtw-transcripts";const loadTranscripts = () => JSON.parse(localStorage.getItem(TRANSCRIPT_KEY) || "[]");const saveTranscripts = (entries) => localStorage.setItem(TRANSCRIPT_KEY, JSON.stringify(entries.slice(0, 40)));const renderTranscripts = () => {  if (!transcriptList || !transcriptStatus) return;  const transcripts = loadTranscripts();  transcriptList.innerHTML = "";  if (!transcripts.length) {    transcriptStatus.textContent = "No transcripts yet.";    return;  }  transcripts.forEach((entry) => {    const li = document.createElement("li");    li.innerHTML = `      <div class="cmd">${entry.text}</div>      <div class="meta">${entry.source || "voice"} | ${new Date(entry.ts).toLocaleString()}</div>    `;    transcriptList.appendChild(li);  });  transcriptStatus.textContent = `Loaded ${transcripts.length} transcripts.`;};const logTranscript = (text, source = "voice") => {  if (!text) return;  touchSession();  const transcripts = loadTranscripts();  transcripts.unshift({ text, source, ts: new Date().toISOString() });  saveTranscripts(transcripts);  renderTranscripts();};const logActivity = async () => {  if (!activityStatus) return;  activityStatus.textContent = "Loading history...";  try {    const res = await fetch("/admin/logs");    if (!res.ok) throw new Error(`HTTP ${res.status}`);    const data = await res.json();    const logs = data.logs || [];    if (activityList) activityList.innerHTML = "";    if (!logs.length) {      activityStatus.textContent = "No history yet.";      return;    }    logs.forEach((row) => {      let safetyLabel = "";      try {        const intentPreview = row.intent_json ? JSON.parse(row.intent_json) : null;        if (intentPreview?.safety?.level) safetyLabel = ` | Safety: ${intentPreview.safety.level}`;      } catch (_) {        // ignore parse issues      }      const deploymentStatus = row.deployment_status ? `${row.deployment_status}` : "";      const deploymentId = row.deployment_id ? ` ${row.deployment_id}` : "";      const deployment = deploymentStatus || deploymentId        ? ` | Deploy: ${deploymentStatus}${deploymentId}`.trim()        : "";      const detail = row.deployment_message ? ` (${row.deployment_message})` : "";      const li = document.createElement("li");      li.innerHTML = `        <div class="cmd">${row.command || "(no command)"}</div>        <div class="meta">Actions: ${row.actions || "[]"} | Files: ${row.files || "[]"} | Commit: ${row.commit_sha || ""}${deployment}${detail}${safetyLabel} | ${row.ts || ""}</div>      `;      if (activityList) activityList.appendChild(li);    });    activityStatus.textContent = `Loaded ${logs.length} entries.`;  } catch (err) {    activityStatus.textContent = `History unavailable (${err.message}).`;  }};const buildLocalActions = (command = "") => {  const actions = [];  const text = command.toLowerCase();  const urlMatch = command.match(/https?:\/\/\S+/);  const url = urlMatch ? urlMatch[0] : "";  const hexMatch = command.match(/#([0-9a-fA-F]{3,6})/);  const sayMatch = command.match(/say\s+(.+)/i);  const headlineMatch = command.match(/headline(?:\s+to|\s+is)?\s+(.+)/i);  const subheadMatch = command.match(/subhead(?:\s+to|\s+is)?\s+(.+)/i);  const ctaMatch = command.match(/(cta|button)(?:\s+to|\s+is)?\s+(.+)/i);  const titleMatch = command.match(/title(?:\s+to|\s+is)?\s+(.+)/i);  const descMatch = command.match(/description(?:\s+to|\s+is)?\s+(.+)/i);  const themeMatch = command.match(/theme(?:\s+to|\s+is)?\s+(ember|ocean|volt|midnight)/i);  const fontMatch = command.match(/font(?:\s+to|\s+is)?\s+([a-zA-Z0-9\s-]+)/i);  if (sayMatch) actions.push({ type: "update_copy", field: "headline", value: sayMatch[1].trim() });  else if (headlineMatch) actions.push({ type: "update_copy", field: "headline", value: headlineMatch[1].trim() });  if (subheadMatch) actions.push({ type: "update_copy", field: "subhead", value: subheadMatch[1].trim() });  if (ctaMatch) actions.push({ type: "update_copy", field: "cta", value: ctaMatch[2].trim() });  if (titleMatch || descMatch) {    actions.push({ type: "update_meta", title: titleMatch?.[1]?.trim(), description: descMatch?.[1]?.trim() });  }  if (themeMatch) actions.push({ type: "update_theme", theme: themeMatch[1] });  if (fontMatch) actions.push({ type: "update_font", family: fontMatch[1].trim() });  if (hexMatch) actions.push({ type: "update_header_color", color: `#${hexMatch[1]}` });  if (text.includes("blue")) actions.push({ type: "update_blue_theme" });  if (text.includes("background video") && url) actions.push({ type: "update_background_video", src: url });  if ((text.includes("wallpaper") || text.includes("background image")) && url) {    actions.push({ type: "update_wallpaper", src: url });  }  if (text.includes("avatar") && url) actions.push({ type: "update_avatar", src: url });  if ((text.includes("video") || text.includes("music video")) && url) {    actions.push({ type: "insert_video", src: url, title: "Featured Video" });  }  if ((text.includes("livestream") || text.includes("stream")) && url) {    actions.push({ type: "insert_stream", url, title: "Live Stream" });  }  return actions;};const buildLocalPlan = (payload) => {  if (!payload) return { error: "No payload" };  if (payload.mode === "plan") {    return {      local: true,      command: payload.command,      plan: {        summary: "Local preview plan (offline or API unavailable)",        actions: buildLocalActions(payload.command || ""),      },    };  }  if (payload.mode === "apply") {    return {      local: true,      status: "Local apply simulated",      plan: payload.plan || { actions: buildLocalActions(payload.command || "") },      command: payload.command,    };  }  if (payload.mode === "rollback_last") {    return { local: true, status: "Local rollback simulated" };  }  return { local: true, error: "Unsupported mode" };};const callOrchestrator = async (payload) => {  try {    const res = await fetch("/api/orchestrator", {      method: "POST",      headers: {        "Content-Type": "application/json",      },      body: JSON.stringify(payload),    });    const text = await res.text();    let data = {};    try {      data = text ? JSON.parse(text) : {};    } catch (_) {      data = { error: text || "Request failed" };    }    if (!res.ok) {      throw new Error(data.error || text || "Request failed");    }    orchestratorHealthy = true;    setStatusChip(orchestratorStateEl, "Online", "ok");    return data;  } catch (err) {    orchestratorHealthy = false;    console.warn("Orchestrator unavailable, using local plan:", err.message);    setStatusChip(orchestratorStateEl, "Offline (fallback)", "warn");    const fallback = buildLocalPlan(payload);    setPreviewMode("Local preview", "warn");    setResponse({ error: err.message, fallback });    console.error("Orchestrator failed:", err);    return fallback;  }};const isSessionFresh = () => {  const ts = Number(sessionStorage.getItem(UNLOCK_TS_KEY) || 0);  if (!ts) return false;  return Date.now() - ts < SESSION_TTL_MS;};const clearSession = () => {  sessionStorage.removeItem(UNLOCK_KEY);  sessionStorage.removeItem(UNLOCK_TS_KEY);  document.cookie = "vtw_admin=; Path=/admin; Max-Age=0; SameSite=Lax";  fetch("/api/admin/logout", { method: "POST" }).catch(() => {});};const touchSession = () => {  if (sessionStorage.getItem(UNLOCK_KEY) === "true") {    sessionStorage.setItem(UNLOCK_TS_KEY, String(Date.now()));  }};const isUnlocked = () =>  sessionStorage.getItem(UNLOCK_KEY) === "true" && isSessionFresh();const updateApplyGate = () => {  const ok = (planConfirm?.value || "").trim().toLowerCase() === "ship it";  if (applyBtn) applyBtn.disabled = !ok;};const setLockedUI = (locked) => {  if (lockScreen) {    lockScreen.toggleAttribute("hidden", !locked);    if (!locked) lockScreen.style.display = "none";    else lockScreen.style.removeProperty("display");  }  if (adminShell) adminShell.style.filter = locked ? "blur(8px)" : "none";  [startBtn, stopBtn, planBtn, applyBtn, commandEl].forEach((el) => {    if (el) el.disabled = locked;  });  if (locked) {    if (applyBtn) applyBtn.disabled = true;    setStatusChip(sessionStateEl, "Locked", "warn");  } else {    updateApplyGate();    setStatusChip(sessionStateEl, "Unlocked", "ok");  }  setStatus(locked ? "Locked" : "Unlocked");};const initPasscodeGate = () => {  const unlocked = isUnlocked();  setLockedUI(!unlocked);  const unlock = async (event) => {    if (event) event.preventDefault();    const code = (lockInput?.value || "").trim();    if (!code) {      if (lockError) lockError.textContent = "Enter passcode.";      speak("Enter passcode");      return;    }    try {      const res = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: code }) });      if (!res.ok) {        if (lockError) lockError.textContent = "Incorrect code.";        speak("Incorrect code");        return;      }      sessionStorage.setItem(UNLOCK_KEY, "true");      sessionStorage.setItem(UNLOCK_TS_KEY, String(Date.now()));      document.cookie = "vtw_admin=1; Path=/admin; SameSite=Lax";      if (lockError) lockError.textContent = "";      setLockedUI(false);      speak("Controls unlocked");      logActivity();      return;    } catch (err) {      if (lockError) lockError.textContent = "Login failed.";      speak("Login failed");    }  };  if (lockButton) lockButton.addEventListener("click", unlock);  if (lockForm) lockForm.addEventListener("submit", unlock);  if (lockInput) {    lockInput.addEventListener("keydown", (e) => {      if (e.key === "Enter") unlock(e);    });  }};const initSpeech = () => {  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;  if (!micStateEl || !commandEl) {    return null;  }  if (!SpeechRecognition) {    micStateEl.textContent = "Speech recognition not supported in this browser.";    return;  }  recognition = new SpeechRecognition();  recognition.continuous = true;  recognition.lang = "en-US";  recognition.interimResults = false;  recognition.onresult = (event) => {    if (!event.results || event.results.length === 0) return;    const last = event.results[event.results.length - 1];    if (!last || !last.isFinal || !last[0]) return;    const transcript = last[0].transcript.trim();    commandEl.value = transcript;    micStateEl.textContent = `Captured: "${transcript}"`;    // applyLocalPreview(transcript);    logTranscript(transcript, "voice");    const lower = transcript.toLowerCase();    if (lower.includes("ship it") && planConfirm) {      planConfirm.value = "ship it";      updateApplyGate();    }    if (positiveWords.some((p) => lower.includes(p)) && lastPlan) {      applyBtn.click();    }  };  recognition.onerror = (event) => {    micStateEl.textContent = `Mic error: ${event.error}`;  };  recognition.onend = () => {    if (listening) {      recognition.start();    }  };  return {};};const speechController = initSpeech();if (startBtn) {  startBtn.addEventListener("click", () => {    if (!recognition) return;    listening = true;    recognition.start();    if (micStateEl) micStateEl.textContent = "Listening...";  });}if (stopBtn) {  stopBtn.addEventListener("click", () => {    if (!recognition) return;    listening = false;    recognition.stop();    if (micStateEl) micStateEl.textContent = "Microphone idle.";  });}if (commandEl) {  commandEl.addEventListener("input", () => {    const command = commandEl.value.trim();    if (!command) return;    // applyLocalPreview(command);  });}if (planBtn) planBtn.addEventListener("click", async () => {  try {    if (!isUnlocked()) {      setResponse({ error: "Unlock with the access code before generating a plan." });      speak("Unlock required");      return;    }    const command = commandEl.value.trim();    if (!command) return;    setResponse({ status: "Planning..." });    logTranscript(command, "text");    applyLocalPreview(command);    const data = await callOrchestrator({ mode: "plan", command });    markResponseSource(data);    lastPlan = data;    setResponse(data);    if (planSummary) planSummary.textContent = data?.plan?.summary || "No summary";    if (data.plan?.actions) {      applyActionsPreview(data.plan.actions);    }    speak("Plan ready. Say apply now to ship it.");  } catch (err) {    setResponse({ error: err.message });    speak("Planning failed");  }});if (applyBtn) applyBtn.addEventListener("click", async () => {  try {    speak("Hell ya Boss man, I'm making those changes for you right now");    if (!isUnlocked()) {      setResponse({ error: "Unlock with the access code before applying changes." });      speak("Unlock required");      return;    }    if (!lastPlan) {      const fallbackCommand = commandEl.value.trim();      if (!fallbackCommand) {        setResponse({ error: "Provide a command first." });        return;      }      const data = await callOrchestrator({ mode: "plan", command: fallbackCommand });      markResponseSource(data);      lastPlan = data;    }    if ((planConfirm?.value || "").trim().toLowerCase() !== "ship it") {      setResponse({ error: 'Type "ship it" to enable Apply.' });      speak("Type ship it to enable apply");      return;    }    setResponse({ status: "Applying live to production..." });    const confirmation = (planConfirm?.value || "").trim().toLowerCase();    const data = await callOrchestrator({      mode: "apply",      plan: lastPlan.plan,      command: lastPlan.command,      confirmation,    });    markResponseSource(data);    setResponse(data);    if (lastPlan?.plan?.actions) {      applyActionsPreview(lastPlan.plan.actions);    }    logActivity();  } catch (err) {    setResponse({ error: err.message });    speak("Apply failed");  }});if (previewReset) {  previewReset.addEventListener("click", () => resetPreview());}if (previewSpeak) {  previewSpeak.addEventListener("click", () => {    const summary = commandEl.value ? commandEl.value : "No command yet.";    speak(summary);  });}if (previewFrame) {  previewFrame.addEventListener("load", () => {    if (lastPlan?.plan?.actions) {      applyActionsPreview(lastPlan.plan.actions);
    }
  });
}if (refreshLogs) {
  refreshLogs.addEventListener("click", () => logActivity());
}// Admin live clips: store in localStorage (or future DB)
const loadClips = () => JSON.parse(localStorage.getItem("vtw-live-clips") || "[]");
const saveClips = (clips) => localStorage.setItem("vtw-live-clips", JSON.stringify(clips));
const renderClips = () => {
  if (!adminLiveClips) return;
  const clips = loadClips();
  adminLiveClips.innerHTML = "";
  clips.forEach((c, idx) => {
    const li = document.createElement("li");
    li.innerHTML = `<span>${c.title || "Clip"} — ${new Date(c.ts).toLocaleString()}</span><a href="${c.url}" target="_blank" rel="noreferrer">Open</a>`;
    adminLiveClips.appendChild(li);
  });
  if (!clips.length) adminLiveClips.innerHTML = "<li>No clips yet.</li>";
};adminLiveLoad?.addEventListener("click", () => {
  if (!adminLiveUrl?.value) return;
  if (adminLivePlayer) {
    adminLivePlayer.src = adminLiveUrl.value;
    adminLivePlayer.load();
  }
});adminLiveSave?.addEventListener("click", async () => {
  if (!adminLiveUrl?.value) return;
  const clips = loadClips();
  const entry = { url: adminLiveUrl.value, title: adminLiveUrl.value.slice(0, 40), ts: new Date().toISOString() };
  clips.unshift(entry);
  saveClips(clips.slice(0, 20));
  renderClips();
});document.addEventListener("click", (event) => {
  if (event.target.closest("button, a")) {
    clickSound();
  }
});// mobile nav toggle (admin)
(() => {
  const toggle = document.getElementById("admin-nav-toggle");
  if (!toggle) return;
  document.querySelectorAll(".nav a").forEach((link) => {
    link.addEventListener("click", () => {
      if (toggle.checked) toggle.checked = false;
    });
  });
})();if (quickCommandsEl) {
  quickCommandsEl.querySelectorAll("[data-command]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const cmd = btn.getAttribute("data-command") || "";
      commandEl.value = cmd;
      commandEl.focus();
      applyLocalPreview(cmd);
      setStatusChip(responseSourceEl, "Template loaded", "ok");
    });
  });
}setStatusChip(orchestratorStateEl, "Checking...", "warn");
setPreviewMode("Idle", "warn");
setStatusChip(responseSourceEl, "Awaiting command", "warn");
initPasscodeGate();
updateApplyGate();if (planConfirm) {
  planConfirm.addEventListener("input", updateApplyGate);
}renderClips();
renderTranscripts();(() => {
  const createLogoutButton = () => {
    if (document.getElementById("admin-logout")) return;
    const button = document.createElement("button");
    button.id = "admin-logout";
    button.type = "button";
    button.className = "admin-logout";
    button.textContent = "Logout";
    button.addEventListener("click", () => {
      clearSession();
      window.location.href = "/admin/";
    });
    document.body.appendChild(button);
  };
  if (adminShell) createLogoutButton();
  const enforceSession = () => {
    if (!isSessionFresh()) {
      clearSession();
      if (lockScreen) {
        setLockedUI(true);
      } else if (window.location.pathname.startsWith("/admin/")) {
        window.location.href = "/admin/";
      }
    }
  };
  enforceSession();
  window.setInterval(enforceSession, 60000);
})();if (undoBtn) {
  undoBtn.addEventListener("click", async () => {
    try {
      if (!isUnlocked()) {
        setResponse({ error: "Unlock with the access code before undo." });
        speak("Unlock required");
        return;
      }
      setResponse({ status: "Reverting last deploy..." });
      const data = await callOrchestrator({ mode: "rollback_last" });
      setResponse(data);
      speak("Revert complete");
    } catch (err) {
      setResponse({ error: err.message });
      speak("Revert failed");
    }
  });
}// App Store manager (local storage placeholders)
const loadApps = () => JSON.parse(localStorage.getItem("vtw-apps") || "[]");
const saveApps = (apps) => localStorage.setItem("vtw-apps", JSON.stringify(apps.slice(0, 50)));
const seedApps = () => ([  { title: "Platinum Voice Site", price: 199, tag: "Voice", sales: 128, desc: "Full voice-first website with admin console.", link: "store.html#platinum", ts: new Date().toISOString() },  { title: "Automation Kit", price: 149, tag: "Automation", sales: 96, desc: "Lead capture and CRM sync automations.", link: "store.html#automation", ts: new Date().toISOString() },  { title: "Livestream Pack", price: 89, tag: "Media", sales: 62, desc: "Streaming embeds, promo blocks, and scheduling.", link: "store.html#livestream", ts: new Date().toISOString() },]);
const renderApps = () => {
  if (!appTableBody) return;
  const apps = loadApps();
  appTableBody.innerHTML = "";
  apps.forEach((app, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `      <td>        <div class="app-title">${app.title}</div>        <div class="muted small">${app.desc || ""}</div>      </td>      <td>$${Number(app.price || 0).toFixed(0)}</td>      <td>${app.tag || "—"}</td>      <td>${app.sales || 0}</td>      <td><button class="ghost small" data-remove="${idx}">Remove</button></td>    `;
    appTableBody.appendChild(tr);
  });
  if (!apps.length) {
    appTableBody.innerHTML = `<tr><td colspan="5" class="muted">No apps yet.</td></tr>`;
  }
  updateAppKpis(apps);
};
const updateAppKpis = (apps = loadApps()) => {
  const count = apps.length;
  const mrr = apps.reduce((sum, app) => sum + Number(app.price || 0), 0);
  const sales = apps.reduce((sum, app) => sum + Number(app.sales || 0), 0);
  if (appsCount) appsCount.textContent = `${count} apps`;
  if (appsSales) appsSales.textContent = `$${sales} sales`;
  if (kpiApps) kpiApps.textContent = count;
  if (kpiMrr) kpiMrr.textContent = `$${mrr}`;
  if (kpiNew) kpiNew.textContent = Math.max(0, Math.min(count, 3));
};appTableBody?.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-remove]");
  if (!btn) return;
  const idx = Number(btn.getAttribute("data-remove"));
  const apps = loadApps().filter((_, i) => i !== idx);
  saveApps(apps);
  renderApps();
});appForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  const formData = new FormData(appForm);
  const app = {
    title: formData.get("title")?.toString() || "",
    price: Number(formData.get("price") || 0),
    tag: formData.get("tag")?.toString() || "",
    sales: Number(formData.get("sales") || 0),
    desc: formData.get("desc")?.toString() || "",
    link: formData.get("link")?.toString() || "",
    ts: new Date().toISOString(),
  };
  const apps = loadApps();
  apps.unshift(app);
  saveApps(apps);
  renderApps();
  appForm.reset();
  updateAppKpis(apps);
});appClear?.addEventListener("click", () => {
  appForm?.reset();
});appsReset?.addEventListener("click", () => {
  saveApps(seedApps());
  renderApps();
});// init app manager defaults
if (!loadApps().length) {
  saveApps(seedApps());
}
renderApps();// Store products manager (D1 backend)
const loadProductsV2 = async () => {
  try {
    const res = await fetch("/api/products");
    if (!res.ok) throw new Error("Failed to load products");
    return await res.json();
  } catch (err) {
    console.warn("Product loader:", err);
    return [];
  }
};

const updateProductKpisV2 = (products = []) => {
  if (!productsCount) return;
  productsCount.textContent = `${products.length} products`;
};

const renderProductsV2 = async () => {
  if (!productTableBody) return;

  const products = await loadProductsV2();
  productTableBody.innerHTML = "";

  if (!products.length) {
    productTableBody.innerHTML = `<tr><td colspan="5" class="muted">No products yet. Add one to seed.</td></tr>`;
    updateProductKpisV2([]);
    return;
  }

  products.forEach((product) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>
        <div class="app-title">${product.title}</div>
        <div class="muted small">${product.desc || ""}</div>
      </td>
      <td>${product.label || "—"}</td>
      <td>$${Number(product.price || 0).toFixed(2)}</td>
      <td>${product.tag || "—"}</td>
      <td><button class="ghost small" data-product-remove="${product.id}">Remove</button></td>
    `;
    productTableBody.appendChild(tr);
  });
  updateProductKpisV2(products);
};

productTableBody?.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-product-remove]");
  if (!btn) return;
  const id = btn.getAttribute("data-product-remove");
  if (!confirm("Delete this product?")) return;

  try {
    const res = await fetch(`/api/products?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Delete failed");
    await renderProductsV2();
  } catch (err) {
    alert(err.message);
  }
});

productForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData(productForm);
  const title = formData.get("title")?.toString() || "";

  const product = {
    id:
      formData.get("id")?.toString() ||
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") ||
      `product-${Date.now()}`,
    label: formData.get("label")?.toString() || "",
    title,
    desc: formData.get("desc")?.toString() || "",
    price: Number(formData.get("price") || 0),
    tag: formData.get("tag")?.toString() || "",
    link: "", // Default to empty, can be edited later or assumed from convention
  };

  try {
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product),
    });
    if (!res.ok) throw new Error("Save failed");

    productForm.reset();
    await renderProductsV2();
  } catch (err) {
    alert(err.message);
  }
});

productClear?.addEventListener("click", () => {
  productForm?.reset();
});

productsReset?.addEventListener("click", async () => {
  // Re-trigger GET to potentially seed if empty (handled by backend)
  await renderProductsV2();
  alert("Products refreshed (auto-seeded if empty).");
});

// Initial render
renderProductsV2();
