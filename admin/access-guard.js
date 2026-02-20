// Admin access guard (UX). Server-side routes still enforce auth.
(function () {
  try {
    document.documentElement.classList.add("admin-auth-pending");
  } catch (_) {}

  const redirectToAccess = () => {
    window.location.replace("/admin/access.html");
  };

  const maybeRedirectToDashboard = () => {
    const path = window.location.pathname;
    if (path === "/admin/" || path.endsWith("/admin/index.html")) {
      window.location.replace("/admin/integrated-dashboard.html");
      return true;
    }
    return false;
  };

  const buildSidebar = () => {
    const shell = document.querySelector(".admin-shell");
    if (!shell || shell.querySelector(".admin-sidebar")) return;

    shell.classList.add("admin-layout");

    const existing = Array.from(shell.childNodes);
    const main = document.createElement("div");
    main.className = "admin-main";
    existing.forEach((node) => main.appendChild(node));

    const subnav = document.createElement("nav");
    subnav.className = "admin-subnav-bar";
    subnav.innerHTML = `
      <a class="admin-subnav-link" data-path="/admin/integrated-dashboard.html" href="/admin/integrated-dashboard.html">Mission</a>
      <a class="admin-subnav-link" data-path="/admin/voice-commands.html" href="/admin/voice-commands.html">Voice Control</a>
      <a class="admin-subnav-link" data-path="/admin/index.html" href="/admin/index.html">Command Center</a>
      <a class="admin-subnav-link" data-path="/admin/test-lab-1.html" href="/admin/test-lab-1.html">Agent Control</a>
      <a class="admin-subnav-link" data-path="/admin/analytics.html" href="/admin/analytics.html">Analytics</a>
      <a class="admin-subnav-link" data-path="/admin/store-manager.html" href="/admin/store-manager.html">Store</a>
      <a class="admin-subnav-link" data-path="/admin/app-store-manager.html" href="/admin/app-store-manager.html">Apps</a>
      <a class="admin-subnav-link" data-path="/admin/customer-chat.html" href="/admin/customer-chat.html">Chat</a>
    `;
    main.prepend(subnav);

    const sidebar = document.createElement("aside");
    sidebar.className = "admin-sidebar";
    sidebar.innerHTML = `
      <div class="admin-sidebar__brand">
        <div class="admin-sidebar__mark">J</div>
        <div>
          <strong>JULES</strong>
          <span>Voice Control</span>
        </div>
      </div>
      <div class="admin-sidebar__section">
        <p class="admin-sidebar__label">Primary</p>
        <a class="admin-sidebar__link" data-path="/admin/integrated-dashboard.html" href="/admin/integrated-dashboard.html">Mission Control</a>
        <a class="admin-sidebar__link" data-path="/admin/index.html" href="/admin/index.html">Command Center</a>
        <a class="admin-sidebar__link" data-path="/admin/voice-commands.html" href="/admin/voice-commands.html">Voice Control</a>
        <a class="admin-sidebar__link" data-path="/admin/test-lab-1.html" href="/admin/test-lab-1.html">Agent Control</a>
      </div>
      <div class="admin-sidebar__section">
        <p class="admin-sidebar__label">Operations</p>
        <a class="admin-sidebar__link" data-path="/admin/bot-command-center.html" href="/admin/bot-command-center.html">Boss Bot</a>
        <a class="admin-sidebar__link" data-path="/admin/customer-chat.html" href="/admin/customer-chat.html">Customer Chat</a>
        <a class="admin-sidebar__link" data-path="/admin/live-stream.html" href="/admin/live-stream.html">Live Stream</a>
      </div>
      <div class="admin-sidebar__section">
        <p class="admin-sidebar__label">Commerce</p>
        <a class="admin-sidebar__link" data-path="/admin/store-manager.html" href="/admin/store-manager.html">Store Manager</a>
        <a class="admin-sidebar__link" data-path="/admin/app-store-manager.html" href="/admin/app-store-manager.html">App Store</a>
      </div>
      <div class="admin-sidebar__section">
        <p class="admin-sidebar__label">Data</p>
        <a class="admin-sidebar__link" data-path="/admin/analytics.html" href="/admin/analytics.html">Analytics</a>
        <a class="admin-sidebar__link" data-path="/admin/progress.html" href="/admin/progress.html">Progress</a>
        <a class="admin-sidebar__link" data-path="/admin/nexus.html" href="/admin/nexus.html">Nexus</a>
      </div>
      <div class="admin-sidebar__section">
        <p class="admin-sidebar__label">Labs</p>
        <a class="admin-sidebar__link" data-path="/admin/test-lab-1.html" href="/admin/test-lab-1.html">Lab 1</a>
        <a class="admin-sidebar__link" data-path="/admin/test-lab-2.html" href="/admin/test-lab-2.html">Lab 2</a>
        <a class="admin-sidebar__link" data-path="/admin/test-lab-3.html" href="/admin/test-lab-3.html">Lab 3</a>
      </div>
      <div class="admin-sidebar__section">
        <p class="admin-sidebar__label">Quick</p>
        <a class="admin-sidebar__link" href="/">Open Site</a>
      </div>
      <div class="admin-sidebar__section admin-sidebar__status">
        <p class="admin-sidebar__label">Voice Status</p>
        <div class="admin-sidebar__status-row">
          <span>Mic</span>
          <strong id="admin-voice-mic">Checking…</strong>
        </div>
        <div class="admin-sidebar__status-row">
          <span>Last Cmd</span>
          <strong id="admin-voice-last">—</strong>
        </div>
        <div class="admin-sidebar__status-row">
          <span>Deploy</span>
          <strong id="admin-voice-deploy">—</strong>
        </div>
        <div class="admin-sidebar__status-row">
          <span>Orchestrator</span>
          <strong id="admin-voice-orch">—</strong>
        </div>
      </div>
    `;

    shell.innerHTML = "";
    shell.appendChild(sidebar);
    shell.appendChild(main);

    const currentPath = window.location.pathname;
    shell.querySelectorAll(".admin-sidebar__link").forEach((link) => {
      const path = link.getAttribute("data-path");
      if (path && currentPath.endsWith(path)) {
        link.classList.add("is-active");
      }
    });

    shell.querySelectorAll(".admin-subnav-link").forEach((link) => {
      const path = link.getAttribute("data-path");
      if (path && currentPath.endsWith(path)) {
        link.classList.add("is-active");
      }
    });

    const setText = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    };

    const loadStatus = async () => {
      const micSupported =
        "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
      setText("admin-voice-mic", micSupported ? "Ready" : "Unavailable");

      try {
        const res = await fetch("/admin/logs", { cache: "no-store" });
        if (!res.ok) throw new Error("logs");
        const data = await res.json().catch(() => ({}));
        const last = Array.isArray(data?.logs) ? data.logs[0] : null;
        setText(
          "admin-voice-last",
          last?.command ? last.command.slice(0, 24) : "—"
        );
      } catch (_) {
        setText("admin-voice-last", "—");
      }

      try {
        const res = await fetch("/api/bots/status", { cache: "no-store" });
        if (!res.ok) throw new Error("status");
        const data = await res.json().catch(() => ({}));
        const lastBuild = Array.isArray(data?.builds) ? data.builds[0] : null;
        setText("admin-voice-deploy", lastBuild?.status || "Idle");
      } catch (_) {
        setText("admin-voice-deploy", "—");
      }

      try {
        const res = await fetch("/api/health", { cache: "no-store" });
        if (!res.ok) throw new Error("health");
        const data = await res.json().catch(() => ({}));
        setText("admin-voice-orch", data?.orchestrator || "Unknown");
      } catch (_) {
        setText("admin-voice-orch", "—");
      }
    };

    loadStatus();
    window.setInterval(loadStatus, 20000);
  };

  fetch("/api/config/status", { credentials: "include", cache: "no-store" })
    .then((res) => {
      if (!res.ok) throw new Error("unauthorized");
      try {
        document.documentElement.classList.remove("admin-auth-pending");
      } catch (_) {}
      if (maybeRedirectToDashboard()) return;
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", buildSidebar, {
          once: true,
        });
      } else {
        buildSidebar();
      }
    })
    .catch(() => redirectToAccess());
})();
