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

  const normalizeAdminPath = (input) => {
    let path = String(input || "").trim();
    if (!path) return "/";
    if (!path.startsWith("/")) path = `/${path}`;
    path = path.replace(/\/+$/, "");
    if (path.endsWith(".html")) path = path.slice(0, -5);
    if (path === "/admin/index") return "/admin";
    return path || "/";
  };

  const adminPageLinks = [
    { href: "/admin/integrated-dashboard", label: "Mission Control" },
    { href: "/admin/mission", label: "Mission Route" },
    { href: "/admin/cc", label: "Command Center" },
    { href: "/admin/vcc", label: "Voice Command Center" },
    { href: "/admin/monetization", label: "Monetization" },
    { href: "/admin/analytics", label: "Analytics" },
    { href: "/admin/live", label: "Live Manager" },
    { href: "/admin/store", label: "Store Manager" },
    { href: "/admin/media", label: "Media Library" },
    { href: "/admin/audio", label: "Audio Library" },
    { href: "/admin/settings", label: "Settings" },
    { href: "/admin/voice-commands", label: "Legacy Voice Commands" },
    { href: "/admin/analytics-enhanced", label: "Legacy Analytics Enhanced" },
    { href: "/admin/live-stream", label: "Legacy Live Stream" },
    { href: "/admin/live-stream-enhanced", label: "Legacy Live Enhanced" },
    { href: "/admin/customer-chat", label: "Customer Chat" },
    { href: "/admin/bot-command-center", label: "Bot Command Center" },
    { href: "/admin/store-manager", label: "Legacy Store Manager" },
    { href: "/admin/app-store-manager", label: "Legacy App Store" },
    { href: "/admin/progress", label: "Progress" },
    { href: "/admin/nexus", label: "Nexus" },
    { href: "/admin/test-lab-1", label: "Test Lab 1" },
    { href: "/admin/test-lab-2", label: "Test Lab 2" },
    { href: "/admin/test-lab-3", label: "Test Lab 3" },
  ];

  const sidebarGroups = [
    {
      label: "Core Modules",
      links: [
        { href: "/admin/integrated-dashboard", label: "Mission Control" },
        { href: "/admin/cc", label: "Command Center" },
        { href: "/admin/vcc", label: "Voice Command Center" },
        { href: "/admin/monetization", label: "Monetization" },
        { href: "/admin/settings", label: "Settings" },
      ],
    },
    {
      label: "Operations",
      links: [
        { href: "/admin/analytics", label: "Analytics" },
        { href: "/admin/live", label: "Live Manager" },
        { href: "/admin/customer-chat", label: "Customer Chat" },
        { href: "/admin/bot-command-center", label: "Bot Command Center" },
      ],
    },
    {
      label: "Commerce + Media",
      links: [
        { href: "/admin/store", label: "Store Manager" },
        { href: "/admin/app-store-manager", label: "App Store Manager" },
        { href: "/admin/media", label: "Media Library" },
        { href: "/admin/audio", label: "Audio Library" },
      ],
    },
    {
      label: "Legacy + Labs",
      links: [
        { href: "/admin/voice-commands", label: "Legacy Voice Commands" },
        { href: "/admin/analytics-enhanced", label: "Legacy Analytics" },
        { href: "/admin/live-stream-enhanced", label: "Legacy Live Enhanced" },
        { href: "/admin/progress", label: "Progress" },
        { href: "/admin/nexus", label: "Nexus" },
        { href: "/admin/test-lab-1", label: "Test Lab 1" },
        { href: "/admin/test-lab-2", label: "Test Lab 2" },
        { href: "/admin/test-lab-3", label: "Test Lab 3" },
      ],
    },
  ];

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
    subnav.innerHTML = adminPageLinks
      .map(
        (link) =>
          `<a class="admin-subnav-link" data-path="${link.href}" href="${link.href}">${link.label}</a>`
      )
      .join("");
    main.prepend(subnav);

    const sidebar = document.createElement("aside");
    sidebar.className = "admin-sidebar";
    const sectionsHtml = sidebarGroups
      .map(
        (group) => `
      <div class="admin-sidebar__section">
        <p class="admin-sidebar__label">${group.label}</p>
        ${group.links
          .map(
            (link) =>
              `<a class="admin-sidebar__link" data-path="${link.href}" href="${link.href}">${link.label}</a>`
          )
          .join("")}
      </div>
    `
      )
      .join("");
    sidebar.innerHTML = `
      <div class="admin-sidebar__brand">
        <div class="admin-sidebar__mark">J</div>
        <div>
          <strong>JULES</strong>
          <span>Voice Control</span>
        </div>
      </div>
      ${sectionsHtml}
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

    const currentPath = normalizeAdminPath(window.location.pathname);
    shell
      .querySelectorAll(".admin-sidebar__link, .admin-subnav-link")
      .forEach((link) => {
      const path = link.getAttribute("data-path");
      if (path && normalizeAdminPath(path) === currentPath) {
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
