import { act, fireEvent, render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

// Mock HomeWireframeBackground to track renders (should not re-render on mousemove)
let wireframeRenderCount = 0;
vi.mock("./components/HomeWireframeBackground", () => ({
  HomeWireframeBackground: () => {
    wireframeRenderCount++;
    return <div data-testid="home-wireframe-background" />;
  },
}));

describe("App Performance", () => {
  let App: (typeof import("./App"))["default"];

  beforeEach(async () => {
    wireframeRenderCount = 0;
    vi.clearAllMocks();
    vi.resetModules();
    ({ default: App } = await import("./App"));
  });

  it.skip("should demonstrate re-render behavior on mousemove", async () => {
    render(<App />);

    // Wait for lazy loaded component to render
    await waitFor(
      () => {
        expect(wireframeRenderCount).toBeGreaterThan(0);
      },
      { timeout: 5000 }
    );

    const initialCount = wireframeRenderCount;

    // Simulate mouse movement
    act(() => {
      fireEvent.mouseMove(window, { clientX: 100, clientY: 100 });
    });

    // After optimization, App should NOT re-render on mousemove.
    expect(wireframeRenderCount).toBe(initialCount);

    act(() => {
      fireEvent.mouseMove(window, { clientX: 200, clientY: 200 });
    });
    expect(wireframeRenderCount).toBe(initialCount);
  });
});
