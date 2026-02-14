(() => {
  const sessionsEl = document.getElementById("sessions");
  const sessionsMeta = document.getElementById("sessionsMeta");
  const activeMeta = document.getElementById("activeMeta");
  const messagesEl = document.getElementById("messages");
  const refreshBtn = document.getElementById("refreshSessions");
  const replyEl = document.getElementById("reply");
  const sendBtn = document.getElementById("sendReply");
  const micBtn = document.getElementById("micBtn");
  const speakToggle = document.getElementById("speakToggle");

  let activeSessionId = "";
  let pollTimer = 0;
  let speakTimer = 0;
  let speakEnabled = false;
  let lastSpokenIdBySession = Object.create(null);

  const setSpeakEnabled = (next) => {
    speakEnabled = Boolean(next);
    if (speakToggle) {
      speakToggle.textContent = speakEnabled ? "Speak On" : "Speak Off";
      speakToggle.setAttribute("aria-pressed", speakEnabled ? "true" : "false");
    }
  };

  const speak = (text) => {
    if (!speakEnabled) return;
    if (!("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(String(text || ""));
      u.rate = 1.0;
      u.pitch = 1.0;
      u.volume = 1.0;
      window.speechSynthesis.speak(u);
    } catch (_) {}
  };

  const esc = (s) => String(s || "").replace(/</g, "&lt;");

  const renderSessions = (sessions) => {
    if (!sessionsEl) return;
    sessionsEl.innerHTML = (sessions || [])
      .map((s) => {
        const id = String(s.session_id || "");
        const isActive = id && id === activeSessionId;
        const last = String(s.last_message || "").slice(0, 140);
        const title = String(s.customer_email || s.customer_name || "Anonymous");
        return `
          <div class="session ${isActive ? "is-active" : ""}" data-session-id="${esc(id)}">
            <div class="session-top">
              <div style="font-weight:700;color:rgba(248,250,252,0.9);">${esc(title)}</div>
              <div class="session-id">${esc(id.slice(0, 8))}</div>
            </div>
            <div class="session-last">${esc(last || "No messages yet")}</div>
          </div>
        `;
      })
      .join("");
  };

  const renderMessages = (messages) => {
    if (!messagesEl) return;
    messagesEl.innerHTML = (messages || [])
      .map((m) => {
        const sender = String(m.sender || "customer");
        const msg = String(m.message || "");
        return `
          <div class="msg msg--${sender === "admin" || sender === "bot" ? "admin" : "customer"}">
            <div class="bubble">${esc(msg)}</div>
          </div>
        `;
      })
      .join("");
    messagesEl.scrollTop = messagesEl.scrollHeight;
  };

  const fetchJson = async (url, options = {}) => {
    const res = await fetch(url, options);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || "Request failed");
    return data;
  };

  const loadSessions = async () => {
    try {
      sessionsMeta && (sessionsMeta.textContent = "Loading...");
      const data = await fetchJson("/api/support/admin/sessions");
      const sessions = data.sessions || [];
      sessionsMeta && (sessionsMeta.textContent = `${sessions.length} sessions`);
      renderSessions(sessions);
    } catch (err) {
      sessionsMeta && (sessionsMeta.textContent = `Error: ${err.message}`);
    }
  };

  const loadMessages = async (sessionId) => {
    if (!sessionId) return;
    try {
      const data = await fetchJson(`/api/support/admin/messages?sessionId=${encodeURIComponent(sessionId)}`);
      renderMessages(data.messages || []);
    } catch (_) {}
  };

  const setActive = async (sessionId) => {
    activeSessionId = String(sessionId || "");
    activeMeta && (activeMeta.textContent = activeSessionId ? `Session ${activeSessionId}` : "Select a session");
    await loadSessions();
    await loadMessages(activeSessionId);
    if (pollTimer) window.clearInterval(pollTimer);
    pollTimer = window.setInterval(() => loadMessages(activeSessionId), 2500);

    // Reset speech cursor per-session to avoid reading stale messages on switch.
    if (!lastSpokenIdBySession[activeSessionId]) lastSpokenIdBySession[activeSessionId] = "";
  };

  const sendReply = async () => {
    const message = String(replyEl?.value || "").trim();
    if (!activeSessionId) return alert("Select a session first.");
    if (!message) return;
    try {
      sendBtn && (sendBtn.disabled = true);
      await fetchJson("/api/support/admin/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: activeSessionId, message }),
      });
      if (replyEl) replyEl.value = "";
      await loadMessages(activeSessionId);
    } catch (err) {
      alert(err.message);
    } finally {
      sendBtn && (sendBtn.disabled = false);
    }
  };

  const initMic = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition || !micBtn) {
      micBtn && (micBtn.disabled = true);
      return;
    }
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
      if (replyEl) replyEl.value = transcript;
    };
    recognition.onend = () => {
      listening = false;
      micBtn.textContent = "Mic";
    };
    recognition.onerror = () => {
      listening = false;
      micBtn.textContent = "Mic";
    };

    micBtn.addEventListener("click", () => {
      if (!listening) {
        listening = true;
        micBtn.textContent = "Stop";
        recognition.start();
        return;
      }
      recognition.stop();
    });
  };

  const wire = () => {
    refreshBtn?.addEventListener("click", loadSessions);
    sessionsEl?.addEventListener("click", (e) => {
      const node = e.target.closest("[data-session-id]");
      if (!node) return;
      setActive(node.getAttribute("data-session-id"));
    });
    sendBtn?.addEventListener("click", sendReply);
    replyEl?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendReply();
      }
    });
    speakToggle?.addEventListener("click", () => setSpeakEnabled(!speakEnabled));
    initMic();
  };

  const boot = async () => {
    setSpeakEnabled(false);
    wire();
    await loadSessions();

    // Speak the most recent customer message when a new one arrives.
    if (speakTimer) window.clearInterval(speakTimer);
    speakTimer = window.setInterval(async () => {
      if (!activeSessionId || !speakEnabled) return;
      try {
        const data = await fetchJson(`/api/support/admin/messages?sessionId=${encodeURIComponent(activeSessionId)}`);
        const msgs = data.messages || [];
        const last = msgs[msgs.length - 1];
        if (!last) return;
        const id = String(last.id || "");
        const lastSpokenId = lastSpokenIdBySession[activeSessionId] || "";
        if (id && id === lastSpokenId) return;
        lastSpokenIdBySession[activeSessionId] = id;
        if (String(last.sender) === "customer") speak(last.message);
        renderMessages(msgs);
      } catch (_) {}
    }, 3000);

    const cleanup = () => {
      if (pollTimer) window.clearInterval(pollTimer);
      if (speakTimer) window.clearInterval(speakTimer);
      try {
        window.speechSynthesis?.cancel?.();
      } catch (_) {}
    };
    window.addEventListener("beforeunload", cleanup);
  };

  boot().catch(() => {});
})();
