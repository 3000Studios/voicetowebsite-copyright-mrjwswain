import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ContentInventoryPanel from "./ContentInventoryPanel";

const inventoryPayload = {
  generatedAt: "2026-03-10T12:00:00.000Z",
  summary: {
    totalItems: 4,
    totalLivePages: 1,
    totalHiddenOrOrphaned: 1,
    totalMissingReferences: 1,
    totalProtected: 1,
    recommendations: [
      "Resolve navigation entries that point to routes without a live runtime source.",
    ],
  },
  sections: [
    {
      id: "live-public-routes",
      title: "Live Public Routes",
      itemCount: 2,
      warningCount: 1,
    },
    {
      id: "runtime-config",
      title: "Runtime Config",
      itemCount: 1,
      warningCount: 0,
    },
    {
      id: "admin-routes",
      title: "Admin Routes",
      itemCount: 1,
      warningCount: 0,
    },
  ],
  items: [
    {
      id: "home",
      title: "Home",
      route: "/",
      status: "live",
      section: "live-public-routes",
      sourceType: "react-route",
      sourcePath: "src/App.tsx",
      authority: "live-runtime",
      editable: false,
      warnings: [],
      details: ["Authority: live-runtime"],
    },
    {
      id: "nav-missing",
      title: "Broken Nav",
      route: "/broken",
      status: "missing",
      section: "live-public-routes",
      sourceType: "react-route",
      sourcePath: "src/constants/navigation.ts",
      authority: "navigation-only",
      editable: false,
      warnings: [
        {
          code: "nav-missing-live-route",
          message:
            "/broken is in shared navigation but has no live runtime source.",
          route: "/broken",
        },
      ],
      details: ["Navigation entry without a matching runtime source."],
    },
    {
      id: "config-home",
      title: "Home runtime content",
      route: "/config/home.json",
      status: "live",
      section: "runtime-config",
      sourceType: "json-config",
      sourcePath: "public/config/home.json",
      authority: "/",
      editable: true,
      warnings: [],
      details: ["Used by: /"],
    },
    {
      id: "admin-route",
      title: "Admin Route",
      route: "/admin/mission",
      status: "protected",
      section: "admin-routes",
      sourceType: "admin-page",
      sourcePath: "admin/integrated-dashboard.html",
      authority: "admin-auth",
      editable: false,
      warnings: [],
      details: ["Protected by admin access."],
    },
  ],
  warnings: [
    {
      code: "nav-missing-live-route",
      message:
        "/broken is in shared navigation but has no live runtime source.",
      route: "/broken",
    },
  ],
  editableSources: [
    {
      path: "/config/home.json",
      title: "Home runtime content",
      sourcePath: "public/config/home.json",
    },
  ],
};

const sourcePayload = {
  path: "/config/home.json",
  title: "Home runtime content",
  sourcePath: "public/config/home.json",
  editable: true,
  overridden: false,
  content: { hero: { headline: "Editable headline" } },
};

describe("ContentInventoryPanel", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders inventory data, filters by section, and exposes editable JSON sources", async () => {
    const fetchMock = vi.fn(async (input: string | RequestInfo) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.includes("/api/admin/content-inventory/source")) {
        return new Response(JSON.stringify(sourcePayload), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify(inventoryPayload), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<ContentInventoryPanel />);

    expect(
      await screen.findByText("See what is live, hidden, missing, and editable")
    ).toBeInTheDocument();
    expect(screen.getByText("Broken Nav")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Runtime Config/i }));

    await waitFor(() => {
      expect(
        screen.getAllByText("Home runtime content").length
      ).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getAllByText("Home runtime content")[0]);

    await waitFor(() => {
      expect(screen.getByDisplayValue(/Editable headline/)).toBeInTheDocument();
    });

    expect(screen.getByText(/JSON-backed runtime source/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Editing this source creates a runtime override/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Save Override/i })
    ).toBeInTheDocument();
  });

  it("marks non-editable sources as read-only", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify(inventoryPayload), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<ContentInventoryPanel />);

    expect(await screen.findByText("Broken Nav")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Broken Nav"));

    await waitFor(() => {
      expect(screen.getByText(/Read-only source/i)).toBeInTheDocument();
    });
    expect(
      screen.getByText(/This source is read-only in the inventory view/i)
    ).toBeInTheDocument();
  });
});
