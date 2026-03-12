import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AiWosPanel from "./AiWosPanel";

const manifestPayload = {
  generatedAt: "2026-03-12T12:00:00.000Z",
  product: {
    name: "AI Website Operating System",
    shortName: "AI-WOS",
    version: "1.0.0",
    runtime: "Cloudflare Worker + React/Vite control surface",
    deploymentModel: "main-only Wrangler deployment",
    commandEndpoint: "/api/execute",
    dashboardRoute: "/admin/mission",
    actionSchemaPath: "ops/contracts/openapi.execute.json",
  },
  summary: {
    totalItems: 4,
    liveItems: 2,
    foundationItems: 1,
    plannedItems: 1,
    commandCount: 8,
    blueprintCount: 1,
    themeCount: 1,
    automationCount: 1,
    recommendations: [
      "Route most customer-editable copy through runtime JSON sources.",
    ],
  },
  sections: [
    {
      id: "modules",
      title: "Runtime Modules",
      description: "Core engines.",
      itemCount: 1,
    },
    {
      id: "themes",
      title: "Theme Packs",
      description: "Theme directions.",
      itemCount: 1,
    },
    {
      id: "automation",
      title: "Autopilot",
      description: "Scheduled tasks.",
      itemCount: 1,
    },
    {
      id: "docs",
      title: "Docs And Contracts",
      description: "Operational docs.",
      itemCount: 1,
    },
  ],
  items: [
    {
      id: "module-command-router",
      kind: "module",
      section: "modules",
      title: "AI Command Router",
      subtitle: "Canonical execution surface.",
      status: "live",
      description: "Routes AI commands through /api/execute.",
      badges: ["/api/execute"],
      files: ["functions/execute.js"],
      commands: ["Change homepage hero headline"],
      details: ["Primary auth: x-orch-token header or signed admin cookie."],
      links: [{ label: "Execute API", href: "/api/execute" }],
    },
    {
      id: "theme-neon",
      kind: "theme",
      section: "themes",
      title: "Neon",
      subtitle: "Future theme pack.",
      status: "planned",
      description: "Reserved for future glow-heavy styling.",
      badges: ["future"],
      files: ["AI_WOS_ARCHITECTURE.md"],
      commands: ["Change theme to neon"],
      details: ["Documented as future work."],
      links: [],
    },
    {
      id: "automation-blog",
      kind: "automation",
      section: "automation",
      title: "Blog Feed Autopilot",
      subtitle: "Every 3 hours.",
      status: "live",
      description: "Scheduled blog generation.",
      badges: ["cron"],
      files: ["functions/blogAutomation.js"],
      commands: ["Generate blog content"],
      details: ["Current schedule: `0 */3 * * *`."],
      links: [],
    },
    {
      id: "docs-ai-wos",
      kind: "doc",
      section: "docs",
      title: "AI-WOS Architecture Blueprint",
      subtitle: "Cloudflare mapping.",
      status: "foundation",
      description: "Maps AI-WOS to the current stack.",
      badges: ["architecture"],
      files: ["AI_WOS_ARCHITECTURE.md"],
      commands: ["Review AI-WOS architecture"],
      details: ["Honest capability map."],
      links: [],
    },
  ],
};

describe("AiWosPanel", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders AI-WOS summary data and detail content", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify(manifestPayload), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
      )
    );

    render(<AiWosPanel />);

    expect(
      await screen.findByRole("heading", {
        name: "AI Website Operating System",
      })
    ).toBeInTheDocument();
    const routerButton = screen.getByRole("button", {
      name: /AI Command Router/i,
    });
    expect(routerButton).toBeInTheDocument();
    fireEvent.click(routerButton);
    expect(
      screen.getAllByText("Routes AI commands through /api/execute.").length
    ).toBeGreaterThan(0);
    await waitFor(() => {
      expect(screen.getByText("functions/execute.js")).toBeInTheDocument();
    });
  });

  it("filters by section and status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify(manifestPayload), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
      )
    );

    render(<AiWosPanel />);

    expect(await screen.findByText("AI Command Router")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Theme Packs/i }));

    await waitFor(() => {
      expect(screen.getAllByText("Neon").length).toBeGreaterThan(0);
    });

    fireEvent.change(screen.getByDisplayValue("All statuses"), {
      target: { value: "planned" },
    });

    await waitFor(() => {
      expect(screen.getAllByText("Future theme pack.").length).toBeGreaterThan(
        0
      );
    });
    expect(screen.queryByText("AI Command Router")).not.toBeInTheDocument();
  });
});
