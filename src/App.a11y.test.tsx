import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import App from "./App";

// Mock dependencies
vi.mock("./services/audioEngine", () => ({
  audioEngine: {
    enable: vi.fn(),
    playGlassTing: vi.fn(),
    playMusic: vi.fn(),
    stopMusic: vi.fn(),
    setVolume: vi.fn(),
    playImpact: vi.fn(),
    playSwoosh: vi.fn(),
    playWarp: vi.fn(),
    playSpark: vi.fn(),
    playHum: vi.fn(),
  },
}));

vi.mock("./components/WarpTunnel", () => ({
  default: () => <div data-testid="warp-tunnel" />,
}));

describe("App Accessibility - Use Cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock localStorage to skip intro
    vi.spyOn(Storage.prototype, "getItem").mockImplementation((key) => {
      if (key === "vtw-v2-seen") return "1";
      return null;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should have accessible tabs for Use Cases", () => {
    render(<App />);

    // Find the tablist
    const tablist = screen.getByRole("tablist", { name: /use cases/i });
    expect(tablist).toBeInTheDocument();

    // Find tabs
    const tabs = screen.getAllByRole("tab");
    expect(tabs.length).toBeGreaterThan(0);

    // Check for aria-controls on the first tab (this should fail initially)
    const firstTab = tabs[0];
    expect(firstTab).toHaveAttribute("aria-controls", "use-cases-panel");

    // Find the panel (this should fail initially as role="tabpanel" is missing)
    const panel = screen.getByRole("tabpanel");
    expect(panel).toBeInTheDocument();

    // Check panel attributes
    expect(panel).toHaveAttribute("id", "use-cases-panel");
    expect(panel).toHaveAttribute("tabIndex", "0");

    // Check connection
    const activeTab = tabs.find((t) => t.getAttribute("aria-selected") === "true");
    expect(activeTab).toBeDefined();
    if (activeTab) {
      const tabId = activeTab.getAttribute("id");
      expect(tabId).toBeTruthy();
      expect(panel).toHaveAttribute("aria-labelledby", tabId);
    }
  });
});
