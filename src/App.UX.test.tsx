import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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
    getMusicFrequencyData: vi.fn(() => new Uint8Array(0)),
    getMusicEnergy: vi.fn(() => 0),
  },
}));

vi.mock("./components/WarpTunnel", () => ({
  default: () => <div data-testid="warp-tunnel" />,
}));

vi.mock("./components/AudioWaveform", () => ({
  default: () => <div data-testid="audio-waveform" />,
}));

describe("App UX - Instant Demo Button Loading State", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock localStorage to skip intro and show site immediately
    vi.spyOn(Storage.prototype, "getItem").mockImplementation((key) => {
      if (key === "vtw-v2-seen") return "1";
      return null;
    });

    // Mock fetch
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows loading state on 'Run instant demo' button when clicked", async () => {
    // Setup delayed fetch response
    (global.fetch as any).mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: async () => ({ siteId: "123", previewUrl: "http://test.com", layout: {} }),
            });
          }, 500); // 500ms delay to allow checking loading state
        })
    );

    render(<App />);

    // Find the "Run instant demo" button in the Hero section
    // There might be multiple "Run instant demo" buttons, but we expect at least one
    const startButtons = screen.getAllByRole("button", { name: "Run instant demo" });
    const button = startButtons[0];

    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();

    // Click it
    fireEvent.click(button);

    // Expect loading state
    await waitFor(() => {
      // We expect "Run instant demo" to be gone or replaced by "Generating..."
      const genButtons = screen.getAllByRole("button", { name: "Generating..." });
      expect(genButtons.length).toBeGreaterThan(0);

      genButtons.forEach((btn) => {
        expect(btn).toBeDisabled();
        expect(btn).toHaveAttribute("aria-busy", "true");
      });
    });
  });
});
