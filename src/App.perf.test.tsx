import { render, fireEvent, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
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

// Mock WarpTunnel to track renders (should not re-render on mousemove)
let warpRenderCount = 0;
vi.mock("./components/WarpTunnel", () => ({
  default: () => {
    warpRenderCount++;
    return <div data-testid="warp-tunnel" />;
  },
}));

describe("App Performance", () => {
  beforeEach(() => {
    warpRenderCount = 0;
    vi.clearAllMocks();
  });

  it("should demonstrate re-render behavior on mousemove", () => {
    render(<App />);

    // Initial render
    const initialCount = warpRenderCount;
    expect(initialCount).toBeGreaterThan(0);

    // Simulate mouse movement
    act(() => {
      fireEvent.mouseMove(window, { clientX: 100, clientY: 100 });
    });

    // After optimization, App should NOT re-render on mousemove.
    expect(warpRenderCount).toBe(initialCount);

    act(() => {
      fireEvent.mouseMove(window, { clientX: 200, clientY: 200 });
    });
    expect(warpRenderCount).toBe(initialCount);
  });
});
