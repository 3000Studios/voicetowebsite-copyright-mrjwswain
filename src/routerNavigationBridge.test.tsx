import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

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
    unmuteMusicIfNeeded: vi.fn(),
  },
}));

vi.mock("./components/WarpTunnel", () => ({
  default: () => <div data-testid="warp-tunnel" />,
}));

describe("router navigation bridge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, "", "/");
    Object.defineProperty(window, "scrollTo", {
      configurable: true,
      writable: true,
      value: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("registers a global navigation hook for injected nav.js", async () => {
    render(<App />);

    await waitFor(() => {
      expect(window.__VTW_REACT_NAVIGATE__).toEqual(expect.any(Function));
    });
  });

  it("navigates content routes without requiring a full refresh", async () => {
    render(<App />);

    await waitFor(() => {
      expect(window.__VTW_REACT_NAVIGATE__).toEqual(expect.any(Function));
    });

    act(() => {
      window.__VTW_REACT_NAVIGATE__?.("/features");
    });

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Features" })
      ).toBeInTheDocument();
    });
    expect(window.location.pathname).toBe("/features");
  });
});
