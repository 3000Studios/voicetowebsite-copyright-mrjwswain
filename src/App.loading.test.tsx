import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

describe("App Loading State", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Storage.prototype, "getItem").mockImplementation((key) => {
      if (key === "vtw-v2-seen") return "1"; // Skip intro
      return null;
    });

    // Mock fetch for generate API
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url === "/api/generate") {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: async () => ({ siteId: "test-site-id", previewUrl: "http://test.url" }),
            } as Response);
          }, 100);
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) } as Response);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should show loading state on the 'Run instant demo' button", async () => {
    render(<App />);

    const runButton = screen.getByRole("button", { name: /run instant demo/i });
    fireEvent.click(runButton);

    await waitFor(() => {
      expect(runButton).toBeDisabled();
      expect(runButton).toHaveTextContent(/generating.../i);
    });

    await waitFor(() => {
      expect(runButton).not.toBeDisabled();
      expect(runButton).toHaveTextContent(/run instant demo/i);
    });
  });

  it("should show loading state on the 'Instant build' button", async () => {
    render(<App />);

    const buildButton = screen.getByRole("button", { name: /instant build/i });
    fireEvent.click(buildButton);

    await waitFor(() => {
      expect(buildButton).toBeDisabled();
      expect(buildButton).toHaveTextContent(/generating.../i);
    });

    await waitFor(() => {
      expect(buildButton).not.toBeDisabled();
      expect(buildButton).toHaveTextContent(/instant build/i);
    });
  });
});
