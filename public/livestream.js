(() => {
  const livePlayer = document.getElementById("live-player");
  const liveEmbed = document.getElementById("live-embed");
  const liveStatus = document.getElementById("live-status");
  const liveSessionStatus = document.getElementById("live-session-status");
  const liveUrlInput = document.getElementById("live-url");
  const liveLoadBtn = document.getElementById("live-load");
  const liveSaveBtn = document.getElementById("live-save");
  const liveClips = document.getElementById("live-clips");
  const liveClearBtn = document.getElementById("live-clear");
  const liveStoryGrid = document.getElementById("live-story-grid");

  const MAX_CLIPS = 20;
  const CLIP_KEY = "vtw-live-clips";
  const FALLBACK_STORY_IMG =
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=80";
  const RTC_CONFIG = {
    iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }],
  };

  let liveSessionPollId = 0;
  let viewerWs = null;
  let viewerPc = null;
  let viewerSessionId = "";
  let hostSessionId = "";
  let remoteStream = null;
  let currentViewerToken = "";

  const setLiveStatus = (msg) => {
    if (liveStatus) liveStatus.textContent = String(msg || "");
  };

  const setLiveSessionText = (msg) => {
    if (liveSessionStatus) liveSessionStatus.textContent = String(msg || "");
  };

  const setPlaybackMode = (mode) => {
    const showVideo = mode === "webrtc";
    if (livePlayer) livePlayer.style.display = showVideo ? "block" : "none";
    if (liveEmbed) liveEmbed.style.display = showVideo ? "none" : "block";
  };

  const closePeerConnection = () => {
    if (viewerPc) {
      try {
        viewerPc.close();
      } catch (_) {}
    }
    viewerPc = null;
    hostSessionId = "";
    if (remoteStream) {
      remoteStream.getTracks().forEach((track) => track.stop());
    }
    remoteStream = null;
    if (livePlayer) livePlayer.srcObject = null;
  };

  const closeViewerSocket = () => {
    if (viewerWs) {
      try {
        viewerWs.close();
      } catch (_) {}
    }
    viewerWs = null;
    viewerSessionId = "";
    currentViewerToken = "";
    closePeerConnection();
  };

  const sendViewerSignal = (payload) => {
    if (!viewerWs || viewerWs.readyState !== WebSocket.OPEN) return;
    viewerWs.send(JSON.stringify(payload));
  };

  const ensureViewerPeerConnection = () => {
    if (viewerPc) return viewerPc;
    const pc = new RTCPeerConnection(RTC_CONFIG);
    pc.ontrack = (event) => {
      remoteStream = event.streams?.[0] || null;
      if (!livePlayer || !remoteStream) return;
      livePlayer.srcObject = remoteStream;
      livePlayer.muted = true;
      setPlaybackMode("webrtc");
      livePlayer.play().catch(() => {});
      setLiveSessionText("Live now. Tap the player controls to unmute.");
    };
    pc.onicecandidate = (event) => {
      if (!event.candidate || !hostSessionId) return;
      sendViewerSignal({
        type: "signal-ice-candidate",
        targetSessionId: hostSessionId,
        candidate: event.candidate,
      });
    };
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState || "new";
      if (state === "failed" || state === "disconnected" || state === "closed") {
        setLiveSessionText("Stream connection interrupted. Reconnecting…");
      }
    };
    viewerPc = pc;
    return pc;
  };

  const handleViewerSignal = async (message) => {
    const type = String(message?.type || "");
    const payload = message?.payload || {};
    if (type === "system") {
      viewerSessionId = String(payload.sessionId || "");
      sendViewerSignal({
        type: "viewer_ready",
        wantsPlayback: true,
      });
      return;
    }
    if (type === "host_ready") {
      sendViewerSignal({
        type: "viewer_ready",
        wantsPlayback: true,
      });
      return;
    }
    if (type === "peer_left" && payload.role === "host") {
      setLiveSessionText("Host went offline. Waiting for stream to resume…");
      closePeerConnection();
      return;
    }
    if (
      type === "signal-offer" &&
      String(payload.targetSessionId || "") === viewerSessionId
    ) {
      hostSessionId = String(payload.sessionId || "");
      const pc = ensureViewerPeerConnection();
      await pc.setRemoteDescription(payload.description);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      sendViewerSignal({
        type: "signal-answer",
        targetSessionId: hostSessionId,
        description: pc.localDescription,
      });
      return;
    }
    if (
      type === "signal-ice-candidate" &&
      String(payload.targetSessionId || "") === viewerSessionId &&
      payload.candidate
    ) {
      const pc = ensureViewerPeerConnection();
      try {
        await pc.addIceCandidate(payload.candidate);
      } catch (_) {}
    }
  };

  const connectViewerSocket = ({ wsUrl, viewerToken }) => {
    if (!wsUrl || !viewerToken) return;
    if (
      viewerWs &&
      viewerWs.readyState <= WebSocket.OPEN &&
      currentViewerToken === viewerToken
    ) {
      return;
    }
    closeViewerSocket();
    currentViewerToken = viewerToken;
    const runtimeWsUrl = (() => {
      try {
        const next = new URL(wsUrl);
        if (
          window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1"
        ) {
          next.protocol = "ws:";
          next.host = "127.0.0.1:8787";
        }
        return next.toString();
      } catch (_) {
        return wsUrl;
      }
    })();
    const socketUrl = `${runtimeWsUrl}${runtimeWsUrl.includes("?") ? "&" : "?"}token=${encodeURIComponent(viewerToken)}`;
    viewerWs = new WebSocket(socketUrl);
    viewerWs.addEventListener("open", () => {
      setLiveSessionText("Connecting to live stream…");
    });
    viewerWs.addEventListener("message", (event) => {
      try {
        handleViewerSignal(JSON.parse(String(event.data || "{}")));
      } catch (_) {}
    });
    viewerWs.addEventListener("close", () => {
      setLiveSessionText("Viewer channel closed. Retrying…");
    });
    viewerWs.addEventListener("error", () => {
      setLiveSessionText("Unable to connect to live stream right now.");
    });
  };

  const safeParseUrl = (value) => {
    try {
      const u = new URL(String(value || ""));
      return u;
    } catch (_) {
      return null;
    }
  };

  const isAllowedEmbedUrl = (u) => {
    if (!u) return false;
    if (u.protocol !== "https:") return false;

    // YouTube embeds only (keeps iframe surface small).
    if (u.hostname === "www.youtube.com" && u.pathname.startsWith("/embed/")) return true;
    return false;
  };

  const normalizeEmbedUrl = (raw) => {
    const u = safeParseUrl(raw);
    if (!isAllowedEmbedUrl(u)) return null;
    // Strip fragments for stability.
    u.hash = "";
    return u.toString();
  };

  const setEmbed = (url) => {
    if (!url || !liveEmbed) return;
    setPlaybackMode("embed");
    liveEmbed.src = url;
    setLiveStatus("Stream loaded.");
  };

  const loadLiveSession = async () => {
    try {
      const res = await fetch("/api/live/session", { cache: "no-store" });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || !payload?.ok) {
        throw new Error(payload?.error || "Live session unavailable");
      }
      const sessionState = payload.state || {};
      const isLive =
        sessionState.streamState === "live" &&
        sessionState.publicPlaybackEnabled &&
        sessionState.playbackMode === "webrtc";
      if (!isLive) {
        closeViewerSocket();
        setPlaybackMode("embed");
        setLiveSessionText("No live broadcast is active right now.");
        return;
      }
      setLiveSessionText(
        `${sessionState.streamTitle || "Live now"} • ${Number(sessionState.viewerCount || 0).toLocaleString()} viewers`
      );
      connectViewerSocket(payload);
    } catch (_) {
      setLiveSessionText("Live session check failed. Manual embeds are still available.");
    }
  };

  const loadSavedClips = () => {
    try {
      const parsed = JSON.parse(localStorage.getItem(CLIP_KEY) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  };

  const persistClips = (clips) => {
    try {
      localStorage.setItem(CLIP_KEY, JSON.stringify((clips || []).slice(0, MAX_CLIPS)));
    } catch (_) {}
  };

  const clipTitleFromUrl = (url) => {
    const u = safeParseUrl(url);
    if (!u) return "Clip";
    return `${u.hostname}${u.pathname}`.slice(0, 80);
  };

  const clearEl = (el) => {
    while (el && el.firstChild) el.removeChild(el.firstChild);
  };

  const renderClips = () => {
    if (!liveClips) return;
    const clips = loadSavedClips();
    clearEl(liveClips);

    if (!clips.length) {
      const li = document.createElement("li");
      li.className = "muted";
      li.textContent = "No clips yet.";
      liveClips.appendChild(li);
      return;
    }

    clips.forEach((clip) => {
      const li = document.createElement("li");

      const left = document.createElement("span");
      const strong = document.createElement("strong");
      strong.textContent = clip?.title || "Clip";
      const ts = document.createElement("span");
      ts.className = "muted small";
      ts.textContent = ` — ${new Date(clip?.ts || Date.now()).toLocaleString()}`;
      left.append(strong, ts);

      const actions = document.createElement("div");
      actions.className = "clip-actions";

      const btn = document.createElement("button");
      btn.className = "ghost small";
      btn.type = "button";
      btn.dataset.url = clip?.url || "";
      btn.textContent = "Load";

      const a = document.createElement("a");
      a.target = "_blank";
      a.rel = "noreferrer";
      a.textContent = "Open";

      const normalized = normalizeEmbedUrl(clip?.url || "");
      a.href = normalized || "about:blank";

      actions.append(btn, a);
      li.append(left, actions);
      liveClips.appendChild(li);
    });
  };

  const isSafeCssUrl = (value) => {
    // Keep this intentionally strict: no quotes/parens/whitespace.
    return /^https:\/\/[A-Za-z0-9._~:/?#\[\]@!$&'*+,;=%-]+$/.test(String(value || ""));
  };

  const isSafeHttpUrl = (value) => {
    const u = safeParseUrl(value);
    if (!u) return false;
    return u.protocol === "https:" || u.protocol === "http:";
  };

  const renderLiveStories = (posts = []) => {
    if (!liveStoryGrid) return;
    clearEl(liveStoryGrid);

    posts.slice(0, 3).forEach((post) => {
      const card = document.createElement("article");
      card.className = "story-card";

      const bg = document.createElement("div");
      bg.className = "story-bg";

      const bgUrl = isSafeCssUrl(post?.image) ? post.image : FALLBACK_STORY_IMG;
      bg.style.backgroundImage = `url(\"${bgUrl}\")`;

      const copy = document.createElement("div");
      copy.className = "story-copy";

      const eyebrow = document.createElement("p");
      eyebrow.className = "eyebrow";
      eyebrow.textContent = post?.tag || "Web";

      const h3 = document.createElement("h3");
      h3.textContent = post?.title || "Update";

      const desc = document.createElement("p");
      desc.className = "muted";
      desc.textContent = post?.desc || "SEO-rich web dev insights for your next build.";

      const link = document.createElement("a");
      link.className = "pill-link";
      link.target = "_blank";
      link.rel = "noreferrer";
      link.textContent = "Read →";
      link.href = isSafeHttpUrl(post?.url) ? post.url : "https://developer.mozilla.org/";

      copy.append(eyebrow, h3, desc, link);
      card.append(bg, copy);
      liveStoryGrid.appendChild(card);
    });
  };

  const loadLiveBlog = async () => {
    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 4000);
      const res = await fetch("https://dev.to/api/articles?tag=webdev&per_page=3", { signal: controller.signal });
      window.clearTimeout(timeout);
      if (!res.ok) throw new Error("bad status");
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("bad json");

      const posts = data.map((p) => ({
        title: String(p?.title || "").slice(0, 140),
        desc: String(p?.description || "SEO-rich web dev insights for your next build.").slice(0, 220),
        url: String(p?.url || ""),
        tag: (Array.isArray(p?.tag_list) && p.tag_list[0] && String(p.tag_list[0]).slice(0, 24)) || "webdev",
        image: String(p?.cover_image || p?.social_image || ""),
      }));

      renderLiveStories(posts);
    } catch (_) {
      renderLiveStories([
        {
          title: "Hands-free site builds",
          desc: "How voice-first flows ship accessible sites for everyone.",
          url: "https://developer.mozilla.org/",
          tag: "accessibility",
          image: FALLBACK_STORY_IMG,
        },
        {
          title: "Speed to launch",
          desc: "From appointment to live deploy in under a day.",
          url: "https://vercel.com/blog",
          tag: "shipping",
          image: FALLBACK_STORY_IMG,
        },
        {
          title: "Voice SEO wins",
          desc: "Structured content that ranks while you talk.",
          url: "https://ai.googleblog.com/",
          tag: "seo",
          image: FALLBACK_STORY_IMG,
        },
      ]);
    }
  };

  liveLoadBtn?.addEventListener("click", () => {
    const normalized = normalizeEmbedUrl(liveUrlInput?.value?.trim());
    if (!normalized) {
      setLiveStatus("Please enter a valid YouTube embed URL (https://www.youtube.com/embed/...).");
      return;
    }
    setEmbed(normalized);
  });

  liveUrlInput?.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    liveLoadBtn?.click();
  });

  liveSaveBtn?.addEventListener("click", () => {
    const normalized = normalizeEmbedUrl(liveUrlInput?.value?.trim());
    if (!normalized) {
      setLiveStatus("Nothing to save yet. Load a valid YouTube embed first.");
      return;
    }
    const clips = loadSavedClips();
    clips.unshift({ url: normalized, title: clipTitleFromUrl(normalized), ts: new Date().toISOString() });
    persistClips(clips);
    renderClips();
    setLiveStatus("Clip saved.");
  });

  liveClearBtn?.addEventListener("click", () => {
    persistClips([]);
    renderClips();
    setLiveStatus("Clips cleared.");
  });

  liveClips?.addEventListener("click", (e) => {
    const btn = e.target?.closest?.("button[data-url]");
    if (!btn) return;
    const normalized = normalizeEmbedUrl(btn.getAttribute("data-url") || "");
    if (!normalized) {
      setLiveStatus("That saved clip URL is no longer valid.");
      return;
    }
    if (liveUrlInput) liveUrlInput.value = normalized;
    setEmbed(normalized);
  });

  renderClips();
  loadLiveBlog();
  loadLiveSession();
  liveSessionPollId = window.setInterval(loadLiveSession, 10000);
  window.addEventListener("beforeunload", () => {
    if (liveSessionPollId) window.clearInterval(liveSessionPollId);
    closeViewerSocket();
  });
})();
