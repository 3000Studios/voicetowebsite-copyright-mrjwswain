const TERMINAL_STATE = {
  IDLE: "idle",
  LISTENING: "listening",
  PLANNING: "planning",
  AWAITING_CONFIRMATION: "confirm",
  EXECUTING: "executing",
  COMPLETE: "complete",
  ERROR: "error",
  OFFLINE: "offline",
};

let terminalState = TERMINAL_STATE.IDLE;
let isOffline = false;

const getEl = (id) => document.getElementById(id);

const appendExecutionLog = (entry) => {
  try {
    // Session-only to avoid persisting potentially sensitive admin commands on disk.
    const logs = JSON.parse(sessionStorage.getItem("vtw-exec-log") || "[]");
    logs.unshift({
      ...entry,
      ts: new Date().toISOString(),
      state: terminalState,
    });
    sessionStorage.setItem("vtw-exec-log", JSON.stringify(logs.slice(0, 100)));
  } catch (_) {}
};

const setTerminalState = (state, detail = "") => {
  terminalState = state;
  const statusEl = getEl("status");
  if (!statusEl) return;
  const label = `[${String(state).toUpperCase()}]${detail ? ` ${detail}` : ""}`;
  statusEl.textContent = label;
};

const syncApplyGate = () => {
  const applyBtn = getEl("apply");
  if (!applyBtn) return;
  if (isOffline) {
    applyBtn.disabled = true;
    return;
  }
  const phrase = (getEl("plan-confirm")?.value || "").trim().toLowerCase();
  applyBtn.disabled = phrase !== "ship it";
};

const markOffline = (reason = "Cloud unreachable — preview only") => {
  if (!isOffline) appendExecutionLog({ type: "offline", reason });
  isOffline = true;
  setTerminalState(TERMINAL_STATE.OFFLINE, reason);
  syncApplyGate();
};

const markOnline = () => {
  if (!isOffline) return;
  isOffline = false;
  appendExecutionLog({ type: "online" });
  syncApplyGate();
};

const wrapFetch = () => {
  if (window.__vtw_terminal_fetch_wrapped) return;
  window.__vtw_terminal_fetch_wrapped = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input, init) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof Request
          ? input.url
          : "";

    const isOrchestrator = url.includes("/api/orchestrator");
    let mode = "";

    if (isOrchestrator) {
      try {
        const body = init?.body ? JSON.parse(String(init.body)) : {};
        mode = String(body?.mode || "");
        appendExecutionLog({ type: "orchestrator_request", mode });
        if (mode === "plan")
          setTerminalState(TERMINAL_STATE.PLANNING, "Planning…");
        if (mode === "apply")
          setTerminalState(TERMINAL_STATE.EXECUTING, "Applying…");
      } catch (_) {}
    }

    try {
      const res = await originalFetch(input, init);
      if (isOrchestrator) {
        markOnline();
        try {
          const text = await res.clone().text();
          const data = text ? JSON.parse(text) : {};
          appendExecutionLog({
            type: "orchestrator_response",
            mode,
            ok: res.ok,
            local: Boolean(data?.local),
          });
          if (mode === "plan" && res.ok) {
            setTerminalState(
              TERMINAL_STATE.AWAITING_CONFIRMATION,
              data?.local ? "Offline preview" : "Plan ready"
            );
          }
          if (mode === "apply" && res.ok) {
            setTerminalState(
              TERMINAL_STATE.COMPLETE,
              data?.local ? "Simulated" : "Complete"
            );
          }
          if (!res.ok) {
            setTerminalState(TERMINAL_STATE.ERROR, "Request failed");
          }
        } catch (_) {}
      }
      return res;
    } catch (err) {
      if (isOrchestrator) {
        markOffline(err?.message || "Network error");
        appendExecutionLog({
          type: "orchestrator_error",
          mode,
          error: err?.message || String(err),
        });
      }
      throw err;
    }
  };
};

const installGuards = () => {
  const startBtn = getEl("start");
  const stopBtn = getEl("stop");
  const planBtn = getEl("plan");
  const applyBtn = getEl("apply");
  const planConfirm = getEl("plan-confirm");

  if (planConfirm) {
    planConfirm.addEventListener("input", syncApplyGate, { passive: true });
  }

  startBtn?.addEventListener(
    "click",
    () => {
      setTerminalState(TERMINAL_STATE.LISTENING, "Mic live");
      appendExecutionLog({ type: "mic_start" });
    },
    { capture: true }
  );

  stopBtn?.addEventListener(
    "click",
    () => {
      setTerminalState(TERMINAL_STATE.IDLE, "Mic idle");
      appendExecutionLog({ type: "mic_stop" });
    },
    { capture: true }
  );

  planBtn?.addEventListener(
    "click",
    () => {
      setTerminalState(TERMINAL_STATE.PLANNING, "Planning…");
      appendExecutionLog({ type: "plan_click" });
    },
    { capture: true }
  );

  applyBtn?.addEventListener(
    "click",
    (e) => {
      if (isOffline) {
        e.preventDefault();
        e.stopImmediatePropagation();
        setTerminalState(TERMINAL_STATE.OFFLINE, "Preview only");
        appendExecutionLog({ type: "apply_blocked", reason: "offline" });
        return;
      }

      const phrase = (planConfirm?.value || "").trim().toLowerCase();
      if (phrase !== "ship it") {
        e.preventDefault();
        e.stopImmediatePropagation();
        setTerminalState(
          TERMINAL_STATE.AWAITING_CONFIRMATION,
          'Type "ship it"'
        );
        appendExecutionLog({
          type: "apply_blocked",
          reason: "no_confirmation",
        });
        return;
      }

      setTerminalState(TERMINAL_STATE.EXECUTING, "Applying…");
      appendExecutionLog({ type: "apply_click" });
    },
    { capture: true }
  );

  syncApplyGate();
};

wrapFetch();
installGuards();
